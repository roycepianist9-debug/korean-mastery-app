import { getDb } from '../server/db.ts';
import { words } from '../drizzle/schema.ts';
import { eq, and, isNull, or, ne } from 'drizzle-orm';
import { invokeLLM } from '../server/_core/llm.ts';

const BATCH_SIZE = 50;
const DELAY_MS = 500; // Delay between batches to avoid rate limiting

async function generateEnglishTranslations() {
  const db = await getDb();
  if (!db) {
    console.error('❌ DB connection failed');
    process.exit(1);
  }

  console.log('🔍 Finding Korean/Chinese words needing English translations...');

  // Get all words with examples but no English translation
  const wordsNeedingEnglish = await db
    .select()
    .from(words)
    .where(
      and(
        or(
          and(eq(words.language, 'korean'), ne(words.koreanExample, null)),
          and(eq(words.language, 'chinese'), ne(words.chineseExample, null))
        ),
        or(isNull(words.exampleEnglish), eq(words.exampleEnglish, ''))
      )
    );

  console.log(`📊 Found ${wordsNeedingEnglish.length} words needing English translations`);

  let successCount = 0;
  let failureCount = 0;
  let skippedCount = 0;

  // Process in batches
  for (let i = 0; i < wordsNeedingEnglish.length; i += BATCH_SIZE) {
    const batch = wordsNeedingEnglish.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(wordsNeedingEnglish.length / BATCH_SIZE);

    console.log(`\n📦 Batch ${batchNum}/${totalBatches} (${batch.length} words)`);

    for (const word of batch) {
      try {
        const exampleText =
          word.language === 'korean' ? (word.koreanExample || '') : (word.chineseExample || '');

        if (!exampleText) {
          skippedCount++;
          continue;
        }

        // Generate English translation using LLM
        const response = await invokeLLM({
          messages: [
            {
              role: 'system',
              content: `You are a professional translator. Translate the following example sentence to English. 
              Provide ONLY the English translation, nothing else.
              Keep the translation natural and idiomatic.`,
            },
            {
              role: 'user',
              content: `Translate this ${word.language === 'korean' ? 'Korean' : 'Chinese'} example sentence to English:\n\n"${exampleText}"`,
            },
          ],
        });

        const englishTranslation =
          response.choices?.[0]?.message?.content?.trim() || '';

        if (englishTranslation && englishTranslation.length > 0) {
          // Update the database
          await db
            .update(words)
            .set({ exampleEnglish: englishTranslation })
            .where(eq(words.id, word.id));

          successCount++;
          console.log(`  ✅ ${word.id}: "${exampleText.substring(0, 40)}..." → "${englishTranslation.substring(0, 40)}..."`);
        } else {
          failureCount++;
          console.log(`  ❌ ${word.id}: Empty translation received`);
        }
      } catch (error) {
        failureCount++;
        console.error(`  ❌ ${word.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Wait before next batch to avoid rate limiting
    if (i + BATCH_SIZE < wordsNeedingEnglish.length) {
      console.log(`⏳ Waiting ${DELAY_MS}ms before next batch...`);
      await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
    }
  }

  console.log('\n📈 Translation Complete:');
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Failures: ${failureCount}`);
  console.log(`⏭️  Skipped: ${skippedCount}`);
  console.log(`📊 Total: ${successCount + failureCount + skippedCount}`);

  // Final verification
  console.log('\n🔍 Final verification:');
  const [koreanStats] = await db.execute(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN exampleEnglish IS NOT NULL AND exampleEnglish != '' THEN 1 ELSE 0 END) as with_english
    FROM words 
    WHERE language = 'korean' AND koreanExample IS NOT NULL AND koreanExample != ''
  `);
  console.log('Korean:', koreanStats);

  const [chineseStats] = await db.execute(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN exampleEnglish IS NOT NULL AND exampleEnglish != '' THEN 1 ELSE 0 END) as with_english
    FROM words 
    WHERE language = 'chinese' AND chineseExample IS NOT NULL AND chineseExample != ''
  `);
  console.log('Chinese:', chineseStats);
}

generateEnglishTranslations().catch(console.error);
