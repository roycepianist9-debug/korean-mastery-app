import { getDb } from '../server/db';
import { words } from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import { invokeLLM } from '../server/_core/llm';

async function generateFrenchTranslations() {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  console.log('Generating French translations for Korean examples...');

  // Get all Korean words with duplicate examples
  const allWords = await db.select().from(words).where(eq(words.language, 'korean'));

  let translatedCount = 0;
  let skippedCount = 0;
  const batchSize = 10;
  let batch: typeof allWords = [];

  for (const word of allWords) {
    if (!word.koreanExample) {
      skippedCount++;
      continue;
    }

    // Check if exampleFrench is a duplicate of koreanExample
    if (word.exampleFrench === word.koreanExample) {
      batch.push(word);

      // Process batch when it reaches batchSize
      if (batch.length >= batchSize) {
        await processBatch(db, batch);
        translatedCount += batch.length;
        batch = [];
        console.log(`  Processed ${translatedCount} words...`);
      }
    }
  }

  // Process remaining batch
  if (batch.length > 0) {
    await processBatch(db, batch);
    translatedCount += batch.length;
  }

  console.log(`\n✅ Complete!`);
  console.log(`   Translated: ${translatedCount}`);
  console.log(`   Skipped: ${skippedCount}`);
}

async function processBatch(db: any, batch: any[]) {
  for (const word of batch) {
    try {
      // Generate French translation using LLM
      const response = await invokeLLM({
        messages: [
          {
            role: 'system',
            content: 'You are a professional Korean-to-French translator. Translate the given Korean sentence to French. Respond with ONLY the French translation, nothing else.',
          },
          {
            role: 'user',
            content: word.koreanExample,
          },
        ],
      });

      const frenchTranslation = response.choices[0]?.message?.content?.trim();

      if (frenchTranslation && frenchTranslation !== word.koreanExample) {
        // Update the database
        await db.update(words)
          .set({ exampleFrench: frenchTranslation })
          .where(eq(words.id, word.id));

        console.log(`   ✅ ${word.korean}: "${frenchTranslation}"`);
      } else {
        console.log(`   ⚠️  ${word.korean}: Translation failed or identical`);
      }
    } catch (error: any) {
      console.error(`   ❌ ${word.korean}: ${error.message}`);
    }
  }
}

generateFrenchTranslations().catch(console.error).finally(() => process.exit(0));
