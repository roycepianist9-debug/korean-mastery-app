import { getDb } from './db';
import { words } from '../drizzle/schema';
import { eq, sql } from 'drizzle-orm';
import { invokeLLM } from './_core/llm';

/**
 * Background job state tracker
 * Stores active batch translation jobs to prevent concurrent execution
 */
const activeJobs = new Map<string, {
  status: 'running' | 'completed' | 'failed';
  startedAt: number;
  totalChunks: number;
  processedChunks: number;
  successCount: number;
  failureCount: number;
  currentChunk: number;
  lastError?: string;
}>();

export type JobStatus = typeof activeJobs extends Map<string, infer T> ? T : never;

/**
 * Start async batch translation job
 * Returns immediately with job ID; processing happens in background
 */
export async function startBatchTranslationJob(
  language: 'chinese' | 'korean'
): Promise<{ jobId: string; message: string }> {
  const jobId = `batch-${language}-${Date.now()}`;
  
  // Initialize job tracking
  activeJobs.set(jobId, {
    status: 'running',
    startedAt: Date.now(),
    totalChunks: 0,
    processedChunks: 0,
    successCount: 0,
    failureCount: 0,
    currentChunk: 0,
  });

  // Start background job (fire and forget)
  processBatchTranslation(language, jobId).catch(error => {
    console.error(`[Background Job] ${jobId} failed:`, error);
    const job = activeJobs.get(jobId);
    if (job) {
      job.status = 'failed';
      job.lastError = error.message;
    }
  });

  return {
    jobId,
    message: `Batch ${language} translation started in background. Job ID: ${jobId}`,
  };
}

/**
 * Get job status
 */
export function getJobStatus(jobId: string): JobStatus | null {
  return activeJobs.get(jobId) ?? null;
}

/**
 * Process batch translation with chunking and throttling
 */
async function processBatchTranslation(
  language: 'chinese' | 'korean',
  jobId: string
): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  const job = activeJobs.get(jobId);
  if (!job) return;

  try {
    // Query words needing translation
    const whereClause = language === 'chinese'
      ? sql`language = 'chinese' AND chineseExample IS NOT NULL AND chineseExample != '' AND (exampleChineseFrench IS NULL OR exampleChineseFrench = '')`
      : sql`language = 'korean' AND koreanExample IS NOT NULL AND koreanExample != '' AND (exampleKoreanFrench IS NULL OR exampleKoreanFrench = '')`;

    const wordsToTranslate = await db.execute(`
      SELECT id, 
             ${language === 'chinese' ? 'chinese as word, chineseExample as example, hskLevel as level' : 'korean as word, koreanExample as example, topikLevel as level'}
      FROM words
      WHERE language = '${language}' 
        AND ${language === 'chinese' ? 'chineseExample' : 'koreanExample'} IS NOT NULL 
        AND ${language === 'chinese' ? 'chineseExample' : 'koreanExample'} != '' 
        AND (${language === 'chinese' ? 'exampleChineseFrench' : 'exampleKoreanFrench'} IS NULL OR ${language === 'chinese' ? 'exampleChineseFrench' : 'exampleKoreanFrench'} = '')
    `) as any;

    console.log(`[Background Job ${jobId}] Found ${wordsToTranslate.length} ${language} words needing French translations`);

    if (wordsToTranslate.length === 0) {
      job.status = 'completed';
      job.totalChunks = 0;
      console.log(`[Background Job ${jobId}] No words to translate`);
      return;
    }

    // Break into chunks
    const CHUNK_SIZE = 20;
    const chunks = [];
    for (let i = 0; i < wordsToTranslate.length; i += CHUNK_SIZE) {
      chunks.push(wordsToTranslate.slice(i, i + CHUNK_SIZE));
    }

    job.totalChunks = chunks.length;
    console.log(`[Background Job ${jobId}] Processing ${chunks.length} chunks of ${CHUNK_SIZE} words each`);

    // Process each chunk with mandatory delay
    for (let chunkIdx = 0; chunkIdx < chunks.length; chunkIdx++) {
      const chunk = chunks[chunkIdx];
      job.currentChunk = chunkIdx + 1;

      console.log(`[Background Job ${jobId}] Starting chunk ${chunkIdx + 1}/${chunks.length}`);

      // Process words in this chunk sequentially to avoid overwhelming API
      for (const wordData of chunk) {
        try {
          const langLabel = language === 'chinese' ? 'Chinese' : 'Korean';
          const prompt = `Translate this ${langLabel} example sentence to French. Return ONLY the French translation, nothing else.\n\nContext: This is a vocabulary learning example for the word "${wordData.word}".\n${langLabel} sentence: ${wordData.example}\n\nRespond with only the French translation:`;

          const result = await invokeLLM({
            messages: [
              { role: 'system', content: `You are a professional translator. Translate ${langLabel} to French.` },
              { role: 'user', content: prompt },
            ],
          });

          const contentRaw = result.choices?.[0]?.message?.content;
          const frenchTranslation = typeof contentRaw === 'string' ? contentRaw.trim().slice(0, 500) : null;

          if (frenchTranslation) {
            const updateData: any = {};
            if (language === 'chinese') {
              updateData.exampleChineseFrench = frenchTranslation;
            } else {
              updateData.exampleKoreanFrench = frenchTranslation;
            }
            const escapedTranslation = frenchTranslation.replace(/'/g, "\\'");
            await db.execute(`
              UPDATE words 
              SET ${language === 'chinese' ? 'exampleChineseFrench' : 'exampleKoreanFrench'} = '${escapedTranslation}'  
              WHERE id = ${wordData.id}
            `) as any;

            job.successCount++;
            console.log(`[Background Job ${jobId}] ✓ ${wordData.word} (Level ${wordData.level})`);
          } else {
            job.failureCount++;
            console.log(`[Background Job ${jobId}] ✗ Failed to translate ${wordData.word}`);
          }
        } catch (error) {
          job.failureCount++;
          console.error(`[Background Job ${jobId}] Error processing word ${wordData.id}:`, error);
        }

        // Mandatory 2.5s delay between API calls to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2500));
      }

      job.processedChunks = chunkIdx + 1;
      console.log(`[Background Job ${jobId}] Completed chunk ${chunkIdx + 1}/${chunks.length}. Success: ${job.successCount}, Failed: ${job.failureCount}`);

      // Mandatory 2.5s delay between chunks
      if (chunkIdx < chunks.length - 1) {
        console.log(`[Background Job ${jobId}] Waiting before next chunk...`);
        await new Promise(resolve => setTimeout(resolve, 2500));
      }
    }

    job.status = 'completed';
    console.log(`[Background Job ${jobId}] ✅ Batch translation complete. Processed ${job.successCount + job.failureCount} words. Success: ${job.successCount}, Failed: ${job.failureCount}`);
  } catch (error) {
    job.status = 'failed';
    job.lastError = error instanceof Error ? error.message : String(error);
    console.error(`[Background Job ${jobId}] Fatal error:`, error);
    throw error;
  }
}
