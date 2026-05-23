import { getDb } from '../server/db.ts';
import { words } from '../drizzle/schema.ts';
import { invokeLLM } from '../server/_core/llm.ts';
import { eq, and, isNull, or } from 'drizzle-orm';

const BATCH_SIZE = 30;
const DELAY_BETWEEN_BATCHES = 800; // 800ms between batches

async function generateTranslations() {
  const db = await getDb();
  if (!db) {
    console.error('❌ Database connection failed');
    process.exit(1);
  }

  console.log('🔍 Finding Korean/Chinese words needing translations...\n');

  // Find all words with examples but missing translations
  const wordsToTranslate = await db
    .select({
      id: words.id,
      language: words.language,
      korean: words.korean,
      koreanExample: words.koreanExample,
      chinese: words.chinese,
      chineseExample: words.chineseExample,
      exampleEnglish: words.exampleEnglish,
      exampleFrench: words.exampleFrench,
      exampleChineseFrench: words.exampleChineseFrench,
    })
    .from(words)
    .where(
      or(
        and(
          eq(words.language, 'korean'),
          or(
            isNull(words.koreanExample),
            eq(words.koreanExample, '')
          )
        ),
        and(
          eq(words.language, 'chinese'),
          or(
            isNull(words.chineseExample),
            eq(words.chineseExample, '')
          )
        )
      )
    )
    .limit(100000);

  // Filter to only words that have examples
  const wordsWithExamples = wordsToTranslate.filter(w => {
    if (w.language === 'korean') return w.koreanExample && w.koreanExample.trim();
    if (w.language === 'chinese') return w.chineseExample && w.chineseExample.trim();
    return false;
  });

  console.log(`📊 Found ${wordsWithExamples.length} words with examples\n`);

  let successCount = 0;
  let failureCount = 0;
  let skippedCount = 0;

  // Process in batches
  for (let i = 0; i < wordsWithExamples.length; i += BATCH_SIZE) {
    const batch = wordsWithExamples.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(wordsWithExamples.length / BATCH_SIZE);

    console.log(`📦 Batch ${batchNum}/${totalBatches} (${batch.length} words)`);

    for (const word of batch) {
      try {
        const exampleText = word.language === 'korean' ? word.koreanExample : word.chineseExample;
        const isKorean = word.language === 'korean';

        if (!exampleText || !exampleText.trim()) {
          skippedCount++;
          continue;
        }

        // Generate English translation
        let englishTranslation = '';
        if (!word.exampleEnglish || word.exampleEnglish.trim() === '') {
          const enResponse = await invokeLLM({
            messages: [
              {
                role: 'user',
                content: `Translate this ${isKorean ? 'Korean' : 'Chinese'} example sentence to English. Provide ONLY the English translation:\n\n${exampleText}`,
              },
            ],
          });
          englishTranslation = enResponse.choices[0]?.message?.content?.trim() || '';
        } else {
          englishTranslation = word.exampleEnglish;
        }

        // Generate French translation
        let frenchTranslation = '';
        if (isKorean && (!word.exampleFrench || word.exampleFrench.trim() === '')) {
          const frResponse = await invokeLLM({
            messages: [
              {
                role: 'user',
                content: `Translate this Korean example sentence to French. Provide ONLY the French translation:\n\n${exampleText}`,
              },
            ],
          });
          frenchTranslation = frResponse.choices[0]?.message?.content?.trim() || '';
        } else if (isKorean) {
          frenchTranslation = word.exampleFrench || '';
        } else if (!isKorean && (!word.exampleChineseFrench || word.exampleChineseFrench.trim() === '')) {
          const frResponse = await invokeLLM({
            messages: [
              {
                role: 'user',
                content: `Translate this Chinese example sentence to French. Provide ONLY the French translation:\n\n${exampleText}`,
              },
            ],
          });
          frenchTranslation = frResponse.choices[0]?.message?.content?.trim() || '';
        } else if (!isKorean) {
          frenchTranslation = word.exampleChineseFrench || '';
        }

        // Save to database
        if (isKorean) {
          await db
            .update(words)
            .set({
              exampleEnglish: englishTranslation || null,
              exampleFrench: frenchTranslation || null,
            })
            .where(eq(words.id, word.id));
        } else {
          await db
            .update(words)
            .set({
              exampleEnglish: englishTranslation || null,
              exampleChineseFrench: frenchTranslation || null,
            })
            .where(eq(words.id, word.id));
        }

        console.log(`✅ ${word.korean || word.chinese}: EN="${englishTranslation.substring(0, 40)}..." FR="${frenchTranslation.substring(0, 40)}..."`);
        successCount++;
      } catch (error) {
        console.error(`❌ Error: ${(error as any).message}`);
        failureCount++;
      }
    }

    // Delay between batches
    if (i + BATCH_SIZE < wordsWithExamples.length) {
      console.log(`⏳ Waiting ${DELAY_BETWEEN_BATCHES}ms before next batch...\n`);
      await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
    }
  }

  console.log(`\n📈 Translation Complete:`);
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Failures: ${failureCount}`);
  console.log(`⏭️  Skipped: ${skippedCount}`);
  console.log(`📊 Total: ${successCount + failureCount + skippedCount}`);

  // Verify results
  const [result] = await db.execute(
    'SELECT COUNT(*) as total, SUM(CASE WHEN exampleEnglish IS NOT NULL AND exampleEnglish != "" THEN 1 ELSE 0 END) as with_english, SUM(CASE WHEN exampleFrench IS NOT NULL AND exampleFrench != "" THEN 1 ELSE 0 END) as with_french FROM words WHERE language = "korean"'
  );
  console.log(`\n🔍 Korean words verification:`, result);

  const [resultCN] = await db.execute(
    'SELECT COUNT(*) as total, SUM(CASE WHEN exampleEnglish IS NOT NULL AND exampleEnglish != "" THEN 1 ELSE 0 END) as with_english, SUM(CASE WHEN exampleChineseFrench IS NOT NULL AND exampleChineseFrench != "" THEN 1 ELSE 0 END) as with_french FROM words WHERE language = "chinese"'
  );
  console.log(`🔍 Chinese words verification:`, resultCN);
}

generateTranslations().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
