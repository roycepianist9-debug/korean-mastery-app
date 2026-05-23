import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const BUILT_IN_FORGE_API_KEY = process.env.BUILT_IN_FORGE_API_KEY;
const BUILT_IN_FORGE_API_URL = process.env.BUILT_IN_FORGE_API_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

if (!BUILT_IN_FORGE_API_KEY || !BUILT_IN_FORGE_API_URL) {
  console.error('BUILT_IN_FORGE_API_KEY or BUILT_IN_FORGE_API_URL not set');
  process.exit(1);
}

/**
 * Call Manus built-in LLM API for translation
 */
async function invokeLLM(messages) {
  const response = await fetch(`${BUILT_IN_FORGE_API_URL.replace(/\/$/, '')}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${BUILT_IN_FORGE_API_KEY}`,
    },
    body: JSON.stringify({
      messages,
      model: 'gpt-4-turbo',
    }),
  });

  if (!response.ok) {
    throw new Error(`LLM API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Batch generate English translations for Korean examples using LLM
 */
async function generateEnglishTranslations() {
  console.log('🚀 Starting English translation generation...\n');

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

  // Get all Korean words with empty exampleEnglish
  const [emptyEnglishWords] = await connection.execute(`
    SELECT id, korean, koreanExample
    FROM words
    WHERE language = 'korean' 
      AND (exampleEnglish IS NULL OR exampleEnglish = '')
      AND koreanExample IS NOT NULL
      AND koreanExample != ''
    ORDER BY id
    LIMIT 100
  `);

  console.log(`Found ${emptyEnglishWords.length} Korean words needing English translations\n`);

  if (emptyEnglishWords.length === 0) {
    console.log('✅ All words already have English translations!');
    await connection.end();
    return;
  }

  // Process in batches of 5 (smaller batches for better accuracy)
  const BATCH_SIZE = 5;
  let processed = 0;
  let successful = 0;
  let failed = 0;

  for (let i = 0; i < emptyEnglishWords.length; i += BATCH_SIZE) {
    const batch = emptyEnglishWords.slice(i, i + BATCH_SIZE);

    // Create prompt for batch translation
    const examples = batch
      .map((w) => `Korean: ${w.korean}\nExample: ${w.koreanExample || '(no example)'}`)
      .join('\n\n');

    const prompt = `Translate these Korean example sentences to English. Return ONLY the translations, one per line, in the same order as the input. Be natural and concise.

${examples}`;

    try {
      console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(emptyEnglishWords.length / BATCH_SIZE)}...`);

      const response = await invokeLLM({
        messages: [
          {
            role: 'system',
            content:
              'You are a Korean-English translator. Translate Korean example sentences to natural English. Be concise and accurate. Return only the translations, one per line.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const translationsText =
        typeof response.choices?.[0]?.message?.content === 'string'
          ? response.choices[0].message.content
          : '';

      const translations = translationsText
        .split('\n')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      console.log(`   LLM returned ${translations.length} translations for ${batch.length} words`);

      // Update database with translations (match by position)
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
          console.log(`   ⚠️ No translation for word ${j + 1}: ${word.korean}`);
          failed++;
        }
      }

      processed += batch.length;
      console.log(`   ✅ Batch complete: ${successful} successful, ${failed} failed\n`);

      // Rate limit: wait 2 seconds between batches
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`❌ Batch error at index ${i}:`, error.message);
      failed += batch.length;
      processed += batch.length;
    }
  }

  // Export snapshot after completion
  const [afterSnapshot] = await connection.execute(`
    SELECT 
      COUNT(*) as total_words,
      SUM(CASE WHEN language = 'korean' AND (exampleEnglish IS NULL OR exampleEnglish = '') THEN 1 ELSE 0 END) as korean_missing_english,
      SUM(CASE WHEN language = 'korean' AND exampleEnglish IS NOT NULL AND exampleEnglish != '' THEN 1 ELSE 0 END) as korean_with_english,
      SUM(CASE WHEN language = 'korean' AND exampleFrench IS NOT NULL AND exampleFrench != '' THEN 1 ELSE 0 END) as korean_with_french
    FROM words
  `);

  console.log('\n📊 Database state AFTER translation:');
  console.log(`   Total words: ${afterSnapshot[0].total_words}`);
  console.log(`   Korean missing English: ${afterSnapshot[0].korean_missing_english}`);
  console.log(`   Korean with English: ${afterSnapshot[0].korean_with_english}`);
  console.log(`   Korean with French: ${afterSnapshot[0].korean_with_french}\n`);

  console.log('✅ Translation generation complete!');
  console.log(`Total processed: ${processed}`);
  console.log(`Successful: ${successful}`);
  console.log(`Failed: ${failed}`);

  await connection.end();
}

generateEnglishTranslations().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
