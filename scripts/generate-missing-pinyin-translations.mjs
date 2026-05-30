#!/usr/bin/env node
/**
 * Generate missing pinyin and translations for 1,272 Chinese words
 * Fills: pinyin, examplePinyin, exampleChineseEnglish, exampleChineseFrench
 */

import mysql from 'mysql2/promise';

const DB_URL = process.env.DATABASE_URL;
const API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = 'google/gemini-2.5-flash-lite';
const BATCH_SIZE = 50;
const LOG_FILE = '/tmp/generate-pinyin-translations.log';

function log(msg) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${msg}`);
}

async function callOpenRouter(prompt) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function generateForBatch(words) {
  const wordList = words
    .map((w, i) => `${i + 1}. "${w.chinese}" (example: "${w.chineseExample}")`)
    .join('\n');

  const prompt = `Generate pinyin and translations for these Chinese words and example sentences. Return ONLY valid JSON array with no markdown, no extra text.

${wordList}

Return JSON array like:
[
  {"chinese": "一下", "pinyin": "yī xià", "examplePinyin": "wǒ xiūxi yī xià", "exampleEnglish": "I'll rest for a moment", "exampleFrench": "Je vais me reposer un instant"},
  ...
]

Rules:
- pinyin: romanization with tone marks (ā á ǎ à)
- examplePinyin: full romanization of the example sentence with tone marks
- exampleEnglish: natural English translation
- exampleFrench: natural French translation`;

  try {
    const response = await callOpenRouter(prompt);
    
    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = response;
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }
    
    const results = JSON.parse(jsonStr);
    return results;
  } catch (error) {
    log(`⚠️ Batch generation failed: ${error.message}`);
    return null;
  }
}

async function main() {
  const connection = await mysql.createConnection(DB_URL);
  
  try {
    log('🚀 Starting pinyin and translation generation...');

    // Get all words missing pinyin or translations
    const [words] = await connection.query(`
      SELECT id, chinese, chineseExample 
      FROM words 
      WHERE language = 'chinese' 
        AND hskLevel IS NULL
        AND (pinyin = '' OR pinyin IS NULL OR examplePinyin IS NULL OR exampleChineseEnglish IS NULL)
      ORDER BY id
    `);

    log(`📊 Found ${words.length} words to process`);

    let processedCount = 0;
    let updatedCount = 0;

    for (let i = 0; i < words.length; i += BATCH_SIZE) {
      const batch = words.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(words.length / BATCH_SIZE);

      log(`[${batchNum}/${totalBatches}] Processing ${batch.length} words...`);

      const results = await generateForBatch(batch);
      
      if (!results) {
        log(`[${batchNum}/${totalBatches}] ⚠️ Batch failed, skipping...`);
        continue;
      }

      // Update database
      for (const result of results) {
        const word = batch.find(w => w.chinese === result.chinese);
        if (!word) continue;

        try {
          await connection.query(
            `UPDATE words SET 
              pinyin = ?, 
              examplePinyin = ?, 
              exampleChineseEnglish = ?, 
              exampleChineseFrench = ? 
            WHERE id = ?`,
            [
              result.pinyin || '',
              result.examplePinyin || '',
              result.exampleEnglish || '',
              result.exampleFrench || '',
              word.id,
            ]
          );
          updatedCount++;
        } catch (error) {
          log(`⚠️ Failed to update word ${word.chinese}: ${error.message}`);
        }
      }

      processedCount += batch.length;
      log(`[${batchNum}/${totalBatches}] ✓ ${batch.length}/${batch.length} updated (total: ${updatedCount})`);

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    log(`\n✅ Generation complete: ${updatedCount}/${words.length} words updated`);

  } catch (error) {
    log(`❌ Error: ${error.message}`);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

main().catch(console.error);
