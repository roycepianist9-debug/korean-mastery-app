import { words } from '../drizzle/schema';
import { eq, and, isNotNull, ne, isNull, or } from 'drizzle-orm';
import { invokeLLM } from './_core/llm';
import { getDb } from './db';

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
): Promise<{ jobId: string; message: string; successCount: number; failureCount: number }> {
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
    console.error(`[Background Job] ${jobId} CRASHED:`, error instanceof Error ? error.stack : String(error));
    const job = activeJobs.get(jobId);
    if (job) {
      job.status = 'failed';
      job.lastError = error instanceof Error ? error.message : String(error);
    }
  });

  return {
    jobId,
    message: `Batch ${language} translation started in background. Job ID: ${jobId}`,
    successCount: 0,
    failureCount: 0,
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
  console.log(`[Background Job ${jobId}] INIT: Starting batch translation for ${language}`);
  
  // Verify environment variables
  console.log(`[Background Job ${jobId}] ENV CHECK: BUILT_IN_FORGE_API_KEY exists: ${!!process.env.BUILT_IN_FORGE_API_KEY}`);
  console.log(`[Background Job ${jobId}] ENV CHECK: BUILT_IN_FORGE_API_URL: ${process.env.BUILT_IN_FORGE_API_URL}`);
  console.log(`[Background Job ${jobId}] ENV CHECK: DATABASE_URL exists: ${!!process.env.DATABASE_URL}`);
  
  let db;
  try {
    db = await getDb();
    if (!db) {
      throw new Error('Database connection failed: getDb() returned null');
    }
    console.log(`[Background Job ${jobId}] DB: Database connection established`);
  } catch (error) {
    console.error(`[Background Job ${jobId}] DB ERROR:`, error instanceof Error ? error.stack : String(error));
    throw error;
  }

  const job = activeJobs.get(jobId);
  if (!job) {
    throw new Error(`Job ${jobId} not found in activeJobs map`);
  }

  try {
    // Query words needing EXAMPLE SENTENCE translation using Drizzle ORM
    console.log(`[Background Job ${jobId}] QUERY: Fetching ${language} words needing French translations...`);
    
    let wordsToTranslate: any[] = [];
    
    if (language === 'chinese') {
      wordsToTranslate = await db.select({
        id: words.id,
        word: words.chinese,
        example: words.chineseExample,
        level: words.hskLevel,
      })
      .from(words)
      .where(
        and(
          eq(words.language, 'chinese'),
          isNotNull(words.chineseExample),
          ne(words.chineseExample, ''),
          // Only select rows where exampleChineseFrench is NULL or empty (needs translation)
          or(
            isNull(words.exampleChineseFrench),
            eq(words.exampleChineseFrench, '')
          )
        )
      )
      .limit(1000);
    } else {
      wordsToTranslate = await db.select({
        id: words.id,
        word: words.korean,
        example: words.koreanExample,
        level: words.topikLevel,
      })
      .from(words)
      .where(
        and(
          eq(words.language, 'korean'),
          isNotNull(words.koreanExample),
          ne(words.koreanExample, ''),
          // Only select rows where exampleFrench is NULL or empty (needs translation)
          or(
            isNull(words.exampleFrench),
            eq(words.exampleFrench, '')
          )
        )
      )
      .limit(1000);
    }

    console.log(`[Background Job ${jobId}] QUERY RESULT: Found ${wordsToTranslate.length} ${language} words needing French translations`);

    if (wordsToTranslate.length === 0) {
      job.status = 'completed';
      job.totalChunks = 0;
      console.log(`[Background Job ${jobId}] COMPLETE: No words to translate`);
      return;
    }

    // TEST: Log first 3 rows to verify data structure
    console.log(`[Background Job ${jobId}] TEST: First 3 words to translate:`);
    for (let i = 0; i < Math.min(3, wordsToTranslate.length); i++) {
      const w = wordsToTranslate[i];
      console.log(`  ${i + 1}. ID=${w.id}, word="${w.word}", example="${w.example?.substring(0, 50) || 'NULL'}...", level=${w.level}`);
    }

    // Break into chunks
    const CHUNK_SIZE = 20;
    const chunks: any[][] = [];
    for (let i = 0; i < wordsToTranslate.length; i += CHUNK_SIZE) {
      chunks.push(wordsToTranslate.slice(i, i + CHUNK_SIZE));
    }

    job.totalChunks = chunks.length;
    console.log(`[Background Job ${jobId}] CHUNKS: Processing ${chunks.length} chunks of ${CHUNK_SIZE} words each`);

    // Process each chunk with mandatory delay
    for (let chunkIdx = 0; chunkIdx < chunks.length; chunkIdx++) {
      const chunk = chunks[chunkIdx];
      job.currentChunk = chunkIdx + 1;

      console.log(`[Background Job ${jobId}] CHUNK START: Processing chunk ${chunkIdx + 1}/${chunks.length} (${chunk.length} words)`);

      // Process words in this chunk SEQUENTIALLY using for...of
      for (const wordData of chunk) {
        try {
          if (!wordData.example) {
            job.failureCount++;
            console.log(`[Background Job ${jobId}] SKIP: ${wordData.word} - No example sentence found`);
            continue;
          }

          const langLabel = language === 'chinese' ? 'Chinese' : 'Korean';
          const prompt = `Translate this ${langLabel} example sentence to French. Return ONLY the French translation, nothing else.\n\nContext: This is a vocabulary learning example for the word "${wordData.word}".\n${langLabel} sentence: ${wordData.example}\n\nRespond with only the French translation:`;

          console.log(`[Background Job ${jobId}] API CALL: Translating "${wordData.word}" (${langLabel})`);
          
          let result;
          try {
            result = await invokeLLM({
              messages: [
                { role: 'system', content: `You are a professional translator. Translate ${langLabel} to French.` },
                { role: 'user', content: prompt },
              ],
            });
            console.log(`[Background Job ${jobId}] API SUCCESS: Got response for "${wordData.word}"`);
          } catch (apiError) {
            console.error(`[Background Job ${jobId}] API ERROR: Failed to call invokeLLM for "${wordData.word}":`, apiError instanceof Error ? apiError.stack : String(apiError));
            job.failureCount++;
            continue;
          }

          const contentRaw = result?.choices?.[0]?.message?.content;
          console.log(`[Background Job ${jobId}] API RESPONSE: Raw content type: ${typeof contentRaw}, length: ${typeof contentRaw === 'string' ? contentRaw.length : 'N/A'}`);
          console.log(`[Background Job ${jobId}] API RESPONSE FULL: ${JSON.stringify(result, null, 2).substring(0, 500)}`);
          const frenchTranslation = typeof contentRaw === 'string' ? contentRaw.trim().slice(0, 500) : null;
          console.log(`[Background Job ${jobId}] TRANSLATION EXTRACTED: ${frenchTranslation ? 'YES (' + frenchTranslation.length + ' chars)' : 'NO - contentRaw was: ' + JSON.stringify(contentRaw)}`);


          if (frenchTranslation) {
            console.log(`[Background Job ${jobId}] API RESULT: Got translation for "${wordData.word}": "${frenchTranslation.substring(0, 50)}..."`);
            
            // Use Drizzle ORM update
            if (language === 'chinese') {
              console.log(`[Background Job ${jobId}] DB UPDATE: Saving to exampleChineseFrench for ID ${wordData.id}`);
              await db.update(words)
                .set({ exampleChineseFrench: frenchTranslation })
                .where(eq(words.id, wordData.id));
            } else {
              console.log(`[Background Job ${jobId}] DB UPDATE: Saving to exampleFrench for ID ${wordData.id}`);
              await db.update(words)
                .set({ exampleFrench: frenchTranslation })
                .where(eq(words.id, wordData.id));
            }

            job.successCount++;
            console.log(`[Background Job ${jobId}] SUCCESS: ${wordData.word} (Level ${wordData.level}) - Total: ${job.successCount}/${wordsToTranslate.length}`);
          } else {
            job.failureCount++;
            console.log(`[Background Job ${jobId}] FAIL: ${wordData.word} - No translation returned from API`);
          }

          // MANDATORY 2.5 second delay after EACH translation to avoid 429 rate limit
          console.log(`[Background Job ${jobId}] THROTTLE: Waiting 2.5 seconds before next API call...`);
          await new Promise(resolve => setTimeout(resolve, 2500));

        } catch (error) {
          job.failureCount++;
          console.error(`[Background Job ${jobId}] WORD ERROR: Failed to translate "${wordData.word}":`, error instanceof Error ? error.stack : String(error));
        }
      }

      // Update chunk progress
      job.processedChunks = chunkIdx + 1;
      console.log(`[Background Job ${jobId}] CHUNK COMPLETE: Processed chunk ${chunkIdx + 1}/${chunks.length}. Success: ${job.successCount}, Failed: ${job.failureCount}`);
      
      // Delay between chunks (already have per-word delay, but this ensures safety)
      if (chunkIdx < chunks.length - 1) {
        console.log(`[Background Job ${jobId}] CHUNK DELAY: Waiting 1 second before next chunk...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    job.status = 'completed';
    console.log(`[Background Job ${jobId}] COMPLETED: ${job.successCount} successful, ${job.failureCount} failed out of ${wordsToTranslate.length} total`);
  } catch (error) {
    job.status = 'failed';
    job.lastError = error instanceof Error ? error.message : String(error);
    console.error(`[Background Job ${jobId}] FATAL ERROR:`, error instanceof Error ? error.stack : String(error));
    throw error;
  }
}
