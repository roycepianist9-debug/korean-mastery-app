#!/usr/bin/env node
/**
 * Fix 5 remaining words with missing pinyin and translations
 */

import mysql from 'mysql2/promise';

const DB_URL = process.env.DATABASE_URL;
const API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = 'google/gemini-2.5-flash-lite';
const LOG_FILE = '/tmp/fix-5-words.log';

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

async function generateForWord(word) {
  const prompt = `Generate pinyin and translations for this Chinese word and example sentence. Return ONLY valid JSON with no markdown, no extra text.

Word: "${word.chinese}"
Example: "${word.chineseExample}"

Return JSON like:
{
  "chinese": "${word.chinese}",
  "pinyin": "mǔ yǔ",
  "examplePinyin": "wǒ de mǔ yǔ shì hàn yǔ",
  "exampleEnglish": "My native language is Chinese",
  "exampleFrench": "Ma langue maternelle est le chinois"
}

Rules:
- pinyin: romanization with tone marks (ā á ǎ à)
- examplePinyin: full romanization of the example sentence with tone marks
- exampleEnglish: natural English translation
- exampleFrench: natural French translation`;

  try {
    const response = await callOpenRouter(prompt);
    
    // Extract JSON from response
    let jsonStr = response;
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }
    
    const result = JSON.parse(jsonStr);
    return result;
  } catch (error) {
    log(`⚠️ Failed to generate for ${word.chinese}: ${error.message}`);
    return null;
  }
}

async function main() {
  const connection = await mysql.createConnection(DB_URL);
  
  try {
    log('🚀 Fixing 5 remaining words...');

    // Get the 5 words
    const [words] = await connection.query(`
      SELECT id, chinese, chineseExample 
      FROM words 
      WHERE language = 'chinese' 
        AND hskLevel IS NULL
        AND (pinyin = '' OR examplePinyin IS NULL OR exampleChineseEnglish IS NULL)
      LIMIT 5
    `);

    log(`📊 Found ${words.length} words to fix`);

    let fixedCount = 0;

    for (const word of words) {
      log(`Processing: ${word.chinese}...`);
      
      const result = await generateForWord(word);
      
      if (!result) {
        log(`⚠️ Failed to generate for ${word.chinese}`);
        continue;
      }

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
        fixedCount++;
        log(`✓ Fixed: ${word.chinese}`);
      } catch (error) {
        log(`⚠️ Failed to update ${word.chinese}: ${error.message}`);
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    log(`\n✅ Complete: ${fixedCount}/${words.length} words fixed`);

  } catch (error) {
    log(`❌ Error: ${error.message}`);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

main().catch(console.error);
