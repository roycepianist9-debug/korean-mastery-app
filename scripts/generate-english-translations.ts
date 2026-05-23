import { getDb } from '../server/db';
import { words } from '../drizzle/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { invokeLLM } from '../server/_core/llm';

async function generateEnglishTranslations() {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  console.log('Generating English translations for all example sentences...');

  // Get Korean words without English translations
  const koreanWords = await db.select().from(words)
    .where(and(
      eq(words.language, 'korean'),
      isNull(words.exampleEnglish)
    ));

  // Get Chinese words without English translations
  const chineseWords = await db.select().from(words)
    .where(and(
      eq(words.language, 'chinese'),
      isNull(words.exampleEnglish)
    ));

  console.log(`Found ${koreanWords.length} Korean words without English translations`);
  console.log(`Found ${chineseWords.length} Chinese words without English translations`);

  let translatedCount = 0;
  const batchSize = 10;
  let batch: typeof koreanWords = [];

  // Process Korean words
  console.log('\n📝 Processing Korean words...');
  for (const word of koreanWords) {
    if (!word.koreanExample) continue;

    batch.push(word);
    if (batch.length >= batchSize) {
      await processBatch(db, batch, 'korean');
      translatedCount += batch.length;
      batch = [];
      console.log(`  Processed ${translatedCount} Korean words...`);
    }
  }

  if (batch.length > 0) {
    await processBatch(db, batch, 'korean');
    translatedCount += batch.length;
  }

  // Process Chinese words
  console.log('\n📝 Processing Chinese words...');
  batch = [];
  let chineseTranslatedCount = 0;

  for (const word of chineseWords) {
    if (!word.chineseExample) continue;

    batch.push(word);
    if (batch.length >= batchSize) {
      await processBatch(db, batch, 'chinese');
      chineseTranslatedCount += batch.length;
      batch = [];
      console.log(`  Processed ${chineseTranslatedCount} Chinese words...`);
    }
  }

  if (batch.length > 0) {
    await processBatch(db, batch, 'chinese');
    chineseTranslatedCount += batch.length;
  }

  console.log(`\n✅ Complete!`);
  console.log(`   Korean translations: ${translatedCount}`);
  console.log(`   Chinese translations: ${chineseTranslatedCount}`);
  console.log(`   Total: ${translatedCount + chineseTranslatedCount}`);
}

async function processBatch(db: any, batch: any[], language: 'korean' | 'chinese') {
  for (const word of batch) {
    try {
      const example = language === 'korean' ? word.koreanExample : word.chineseExample;
      const wordText = language === 'korean' ? word.korean : word.chinese;

      // Generate English translation using LLM
      const response = await invokeLLM({
        messages: [
          {
            role: 'system',
            content: `You are a professional ${language === 'korean' ? 'Korean-to-English' : 'Chinese-to-English'} translator. Translate the given ${language === 'korean' ? 'Korean' : 'Chinese'} sentence to English. Respond with ONLY the English translation, nothing else.`,
          },
          {
            role: 'user',
            content: example,
          },
        ],
      });

      const englishTranslation = response.choices[0]?.message?.content?.trim();

      if (englishTranslation && englishTranslation !== example) {
        // Update the database
        await db.update(words)
          .set({ exampleEnglish: englishTranslation })
          .where(eq(words.id, word.id));

        console.log(`   ✅ ${wordText}: "${englishTranslation}"`);
      } else {
        console.log(`   ⚠️  ${wordText}: Translation failed or identical`);
      }
    } catch (error: any) {
      console.error(`   ❌ Error: ${error.message}`);
    }
  }
}

generateEnglishTranslations().catch(console.error).finally(() => process.exit(0));
