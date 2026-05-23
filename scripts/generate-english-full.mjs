import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;
const BUILT_IN_FORGE_API_KEY = process.env.BUILT_IN_FORGE_API_KEY;
const BUILT_IN_FORGE_API_URL = process.env.BUILT_IN_FORGE_API_URL;

if (!DATABASE_URL || !BUILT_IN_FORGE_API_KEY || !BUILT_IN_FORGE_API_URL) {
  console.error('Missing required environment variables');
  process.exit(1);
}

/**
 * Batch generate English translations for 54,382 Korean words with examples
 * Skips 2,174 grammatical forms that have no examples
 */
async function generateEnglishTranslations() {
  console.log('🚀 Starting full English translation generation...\n');

  // Parse DATABASE_URL
  const url = new URL(DATABASE_URL);
  const connection = await mysql.createConnection({
    host: url.hostname,
    port: parseInt(url.port) || 3306,
    user: url.username,
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1),
    ssl: { rejectUnauthorized: true },
    connectTimeout: 30000,
  });

  console.log('✅ Connected to database\n');

  // Export snapshot before starting
  const [beforeSnapshot] = await connection.execute(`
    SELECT 
      COUNT(*) as total_words,
      SUM(CASE WHEN language = 'korean' AND (exampleEnglish IS NULL OR exampleEnglish = '') THEN 1 ELSE 0 END) as korean_missing_english,
      SUM(CASE WHEN language = 'korean' AND exampleEnglish IS NOT NULL AND exampleEnglish != '' THEN 1 ELSE 0 END) as korean_with_english,
      SUM(CASE WHEN language = 'korean' AND exampleFrench IS NOT NULL AND exampleFrench != '' THEN 1 ELSE 0 END) as korean_with_french
    FROM words
  `);

  console.log('📊 Database state BEFORE translation:');
  console.log(`   Total words: ${beforeSnapshot[0].total_words}`);
  console.log(`   Korean missing English: ${beforeSnapshot[0].korean_missing_english}`);
  console.log(`   Korean with English: ${beforeSnapshot[0].korean_with_english}`);
  console.log(`   Korean with French: ${beforeSnapshot[0].korean_with_french}\n`);

  // Get all Korean words with empty exampleEnglish AND non-empty koreanExample
  const [emptyEnglishWords] = await connection.execute(`
    SELECT id, korean, koreanExample
    FROM words
    WHERE language = 'korean' 
      AND (exampleEnglish IS NULL OR exampleEnglish = '')
      AND koreanExample IS NOT NULL
      AND koreanExample != ''
    ORDER BY id
  `);

  console.log(`Found ${emptyEnglishWords.length} Korean words needing English translations\n`);

  if (emptyEnglishWords.length === 0) {
    console.log('✅ All words already have English translations!');
    await connection.end();
    return;
  }

  // Process in batches of 100 (optimized for cost and speed)
  const BATCH_SIZE = 100;
  let processed = 0;
  let successful = 0;
  let failed = 0;
  const startTime = Date.now();

  for (let i = 0; i < emptyEnglishWords.length; i += BATCH_SIZE) {
    const batch = emptyEnglishWords.slice(i, i + BATCH_SIZE);

    // Create prompt for batch translation
    const examples = batch
      .map((w, idx) => `${idx + 1}. Korean: ${w.korean}\n   Example: ${w.koreanExample}`)
      .join('\n\n');

    const prompt = `Translate these Korean example sentences to English. Return ONLY the translations, one per line, in the same order.

${examples}`;

    try {
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(emptyEnglishWords.length / BATCH_SIZE);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      
      process.stdout.write(`\r[${batchNum}/${totalBatches}] ${processed}/${emptyEnglishWords.length} words | ${successful} ✓ ${failed} ✗ | ${elapsed}s`);

      const response = await fetch(`${BUILT_IN_FORGE_API_URL.replace(/\/$/, '')}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${BUILT_IN_FORGE_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gemini-2.5-flash',
          messages: [
            {
              role: 'system',
              content: 'You are a Korean-English translator. Translate Korean example sentences to natural, concise English. Return only the translations, one per line.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const translationsText = data.choices?.[0]?.message?.content || '';

      const translations = translationsText
        .split('\n')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      // Update database with translations
      for (let j = 0; j < batch.length; j++) {
        const word = batch[j];
        const translation = translations[j];

        if (translation && translation.length > 0) {
          await connection.execute(
            'UPDATE words SET exampleEnglish = ? WHERE id = ?',
            [translation, word.id]
          );
          successful++;
        } else {
          failed++;
        }
      }

      processed += batch.length;

      // Rate limit: wait 1 second between batches
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`\n❌ Batch error at index ${i}:`, error.message);
      failed += batch.length;
      processed += batch.length;
    }
  }

  console.log('\n');

  // Export snapshot after completion
  const [afterSnapshot] = await connection.execute(`
    SELECT 
      COUNT(*) as total_words,
      SUM(CASE WHEN language = 'korean' AND (exampleEnglish IS NULL OR exampleEnglish = '') THEN 1 ELSE 0 END) as korean_missing_english,
      SUM(CASE WHEN language = 'korean' AND exampleEnglish IS NOT NULL AND exampleEnglish != '' THEN 1 ELSE 0 END) as korean_with_english,
      SUM(CASE WHEN language = 'korean' AND exampleFrench IS NOT NULL AND exampleFrench != '' THEN 1 ELSE 0 END) as korean_with_french
    FROM words
  `);

  const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

  console.log('📊 Database state AFTER translation:');
  console.log(`   Total words: ${afterSnapshot[0].total_words}`);
  console.log(`   Korean missing English: ${afterSnapshot[0].korean_missing_english}`);
  console.log(`   Korean with English: ${afterSnapshot[0].korean_with_english}`);
  console.log(`   Korean with French: ${afterSnapshot[0].korean_with_french}\n`);

  console.log('✅ Translation generation complete!');
  console.log(`Total processed: ${processed}`);
  console.log(`Successful: ${successful}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total time: ${totalTime} minutes`);

  await connection.end();
}

generateEnglishTranslations().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
