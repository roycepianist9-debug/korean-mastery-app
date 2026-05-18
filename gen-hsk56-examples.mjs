/**
 * Generate LLM example sentences for HSK 5-6 Chinese words.
 * Processes in batches of 20 to avoid rate limits.
 * Run: node gen-hsk56-examples.mjs
 */
import mysql from 'mysql2/promise';
// Node 22 has native fetch built-in

const DB_URL = process.env.DATABASE_URL;
const LLM_URL = process.env.BUILT_IN_FORGE_API_URL + '/v1/chat/completions';
const LLM_KEY = process.env.BUILT_IN_FORGE_API_KEY;

const BATCH_SIZE = 10;
const DELAY_MS = 1200; // ~50 req/min

async function invokeLLM(messages) {
  const res = await fetch(LLM_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${LLM_KEY}`,
    },
    body: JSON.stringify({ messages, temperature: 0.4 }),
  });
  if (!res.ok) throw new Error(`LLM error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

async function generateForWord(word) {
  const prompt = `You are a Chinese language teacher. For the word "${word.chinese}" (pinyin: ${word.pinyin || ''}, meaning: ${word.meaning || ''}), generate ONE natural example sentence in Chinese.

Return ONLY valid JSON (no markdown, no explanation):
{
  "chineseExample": "Chinese sentence here",
  "examplePinyin": "pinyin for the sentence",
  "exampleEnglish": "English translation"
}`;

  try {
    const raw = await invokeLLM([
      { role: 'system', content: 'You are a Chinese language teacher. Always respond with valid JSON only.' },
      { role: 'user', content: prompt },
    ]);

    // Extract JSON from response
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in response');
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      chineseExample: parsed.chineseExample || null,
      examplePinyin: parsed.examplePinyin || null,
      exampleEnglish: parsed.exampleEnglish || null,
    };
  } catch (e) {
    console.error(`  Failed for "${word.chinese}": ${e.message}`);
    return null;
  }
}

async function main() {
  const conn = await mysql.createConnection(DB_URL);

  // Get all HSK 5-6 words without example sentences
  const [words] = await conn.query(
    `SELECT id, chinese, pinyin, meaning, hskLevel 
     FROM words 
     WHERE language='chinese' AND hskLevel IN ('5','6') 
     AND (chineseExample IS NULL OR chineseExample = '')
     ORDER BY hskLevel, id
     LIMIT 2200`
  );

  console.log(`Found ${words.length} HSK 5-6 words without examples`);

  let processed = 0;
  let succeeded = 0;
  let failed = 0;

  for (let i = 0; i < words.length; i += BATCH_SIZE) {
    const batch = words.slice(i, i + BATCH_SIZE);
    console.log(`\nBatch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(words.length / BATCH_SIZE)} (words ${i + 1}-${Math.min(i + BATCH_SIZE, words.length)})`);

    for (const word of batch) {
      const result = await generateForWord(word);
      if (result) {
        await conn.query(
          `UPDATE words SET chineseExample=?, examplePinyin=?, exampleEnglish=? WHERE id=?`,
          [result.chineseExample, result.examplePinyin, result.exampleEnglish, word.id]
        );
        succeeded++;
        process.stdout.write('.');
      } else {
        failed++;
        process.stdout.write('x');
      }
      processed++;

      // Small delay between individual requests
      await new Promise(r => setTimeout(r, DELAY_MS));
    }

    // Progress report every batch
    console.log(`\n  Progress: ${processed}/${words.length} | Success: ${succeeded} | Failed: ${failed}`);
  }

  console.log(`\n✅ Done! Processed: ${processed} | Success: ${succeeded} | Failed: ${failed}`);
  await conn.end();
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
