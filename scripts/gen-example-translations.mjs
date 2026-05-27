/**
 * Generate translations for example sentences via OpenRouter
 * 
 * Usage:
 *   node scripts/gen-example-translations.mjs --lang korean
 *   node scripts/gen-example-translations.mjs --lang japanese
 *   node scripts/gen-example-translations.mjs --lang chinese
 * 
 * For Korean: translates koreanExample → exampleFrench + exampleEnglish
 * For Japanese: translates japaneseExample → exampleJapaneseFrench + exampleRomaji (romaji via kuroshiro)
 * For Chinese: translates chineseExample → exampleChineseFrench (exampleFrench already used for Korean)
 * 
 * Features:
 * - Batches of 50 words per API call
 * - Per-batch DB reconnection (TiDB timeout prevention)
 * - Resume from last offset
 * - Validates response by word ID
 */

import { createConnection } from 'mysql2/promise';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
if (!OPENROUTER_API_KEY) { console.error('No OPENROUTER_API_KEY'); process.exit(1); }
const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) { console.error('No DATABASE_URL'); process.exit(1); }

const urlObj = new URL(DB_URL);
const dbConfig = {
  host: urlObj.hostname,
  port: parseInt(urlObj.port || '4000'),
  user: urlObj.username,
  password: urlObj.password,
  database: urlObj.pathname.replace('/', '').split('?')[0],
  ssl: { rejectUnauthorized: false },
};

const args = process.argv.slice(2);
const langIdx = args.indexOf('--lang');
const LANG = langIdx >= 0 ? args[langIdx + 1] : 'korean';
const BATCH_SIZE = 50;
const PROGRESS_FILE = `/tmp/gen-translations-${LANG}.json`;
const MODEL = 'google/gemini-2.5-flash-lite';

console.log(`\n=== Generating ${LANG.toUpperCase()} example translations ===`);
console.log(`Model: ${MODEL}, Batch size: ${BATCH_SIZE}`);

const langConfig = {
  korean: {
    exampleCol: 'koreanExample',
    frenchCol: 'exampleFrench',
    englishCol: 'exampleEnglish',
    levelCol: 'topikLevel',
    levelOrder: "CASE WHEN topikLevel = 'beginner' THEN 1 WHEN topikLevel = 'intermediate' THEN 2 ELSE 3 END",
    whereClause: "korean IS NOT NULL AND korean != '' AND koreanExample IS NOT NULL AND koreanExample != '' AND (exampleFrench IS NULL OR exampleFrench = '' OR exampleEnglish IS NULL OR exampleEnglish = '')",
    systemPrompt: `You are a professional translator. Translate Korean sentences to both French and English.
Rules:
- Provide natural, fluent translations
- Return ONLY a JSON array with objects: {"id": <word_id>, "fr": "<French translation>", "en": "<English translation>"}
- No explanations, just the JSON array
- Maintain the EXACT same order as input`,
    userPromptFn: (words) => `Translate these Korean sentences to French and English. Return JSON array only.\n\n${words.map(w => `{"id": ${w.id}, "sentence": "${w.example}"}`).join('\n')}`,
  },
  japanese: {
    exampleCol: 'japaneseExample',
    frenchCol: 'exampleJapaneseFrench',
    englishCol: null, // No separate English column for Japanese
    levelCol: 'jlptLevel',
    levelOrder: "CASE WHEN jlptLevel = 'N5' THEN 1 WHEN jlptLevel = 'N4' THEN 2 WHEN jlptLevel = 'N3' THEN 3 WHEN jlptLevel = 'N2' THEN 4 ELSE 5 END",
    whereClause: "japanese IS NOT NULL AND japanese != '' AND japaneseExample IS NOT NULL AND japaneseExample != '' AND (exampleJapaneseFrench IS NULL OR exampleJapaneseFrench = '')",
    systemPrompt: `You are a professional translator. Translate Japanese sentences to both French and English.
Rules:
- Provide natural, fluent translations
- Return ONLY a JSON array with objects: {"id": <word_id>, "fr": "<French translation>", "en": "<English translation>"}
- No explanations, just the JSON array
- Maintain the EXACT same order as input`,
    userPromptFn: (words) => `Translate these Japanese sentences to French and English. Return JSON array only.\n\n${words.map(w => `{"id": ${w.id}, "sentence": "${w.example}"}`).join('\n')}`,
  },
  chinese: {
    exampleCol: 'chineseExample',
    frenchCol: 'exampleChineseFrench',
    englishCol: null,
    levelCol: 'hskLevel',
    levelOrder: "CASE WHEN hskLevel = 'HSK1' THEN 1 WHEN hskLevel = 'HSK2' THEN 2 WHEN hskLevel = 'HSK3' THEN 3 WHEN hskLevel = 'HSK4' THEN 4 WHEN hskLevel = 'HSK5' THEN 5 ELSE 6 END",
    whereClause: "chinese IS NOT NULL AND chinese != '' AND chineseExample IS NOT NULL AND chineseExample != '' AND (exampleChineseFrench IS NULL OR exampleChineseFrench = '')",
    systemPrompt: `You are a professional translator. Translate Chinese (Mandarin) sentences to both French and English.
Rules:
- Provide natural, fluent translations
- Return ONLY a JSON array with objects: {"id": <word_id>, "fr": "<French translation>", "en": "<English translation>"}
- No explanations, just the JSON array
- Maintain the EXACT same order as input`,
    userPromptFn: (words) => `Translate these Chinese sentences to French and English. Return JSON array only.\n\n${words.map(w => `{"id": ${w.id}, "sentence": "${w.example}"}`).join('\n')}`,
  },
};

const config = langConfig[LANG];
if (!config) {
  console.error(`Unknown language: ${LANG}. Use: korean, japanese, chinese`);
  process.exit(1);
}

// Load progress
let progress = { offset: 0, processed: 0, errors: 0 };
if (existsSync(PROGRESS_FILE)) {
  try {
    progress = JSON.parse(readFileSync(PROGRESS_FILE, 'utf8'));
    console.log(`Resuming from offset ${progress.offset} (${progress.processed} already processed)`);
  } catch (e) {
    console.log('Starting fresh');
  }
}

async function getConn() {
  return createConnection(dbConfig);
}

async function callOpenRouter(words) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://swipefluent.co',
      'X-Title': 'SwipeFluent',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: config.systemPrompt },
        { role: 'user', content: config.userPromptFn(words) },
      ],
      temperature: 0.2,
      max_tokens: 6000,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenRouter error ${response.status}: ${text.slice(0, 200)}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty response from OpenRouter');
  return content;
}

function parseResponse(content, inputWords) {
  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error(`No JSON array found in response: ${content.slice(0, 200)}`);
  }
  
  const parsed = JSON.parse(jsonMatch[0]);
  if (!Array.isArray(parsed)) throw new Error('Response is not an array');
  
  const resultMap = new Map();
  for (const item of parsed) {
    if (item.id && (item.fr || item.en)) {
      resultMap.set(item.id, { fr: item.fr || '', en: item.en || '' });
    }
  }
  
  const results = [];
  let matched = 0;
  for (const word of inputWords) {
    const trans = resultMap.get(word.id);
    if (trans) {
      results.push({ id: word.id, fr: trans.fr, en: trans.en });
      matched++;
    }
  }
  
  console.log(`  Matched ${matched}/${inputWords.length} words`);
  return results;
}

// Main loop
let conn = await getConn();

const [countRows] = await conn.execute(
  `SELECT COUNT(*) as cnt FROM words WHERE ${config.whereClause}`
);
const totalRemaining = countRows[0].cnt;
console.log(`Words remaining: ${totalRemaining}`);

if (totalRemaining === 0) {
  console.log('All done! No words need translations.');
  await conn.end();
  process.exit(0);
}

let offset = progress.offset;
let totalProcessed = progress.processed;
let totalErrors = progress.errors;
let batchNum = 0;

while (true) {
  try { await conn.end(); } catch (e) {}
  conn = await getConn();

  const [rows] = await conn.execute(
    `SELECT id, ${config.exampleCol} as example 
     FROM words 
     WHERE ${config.whereClause}
     ORDER BY ${config.levelOrder}, id
     LIMIT ${BATCH_SIZE}`
  );

  if (rows.length === 0) {
    console.log('\nAll translations done!');
    break;
  }

  batchNum++;
  console.log(`\nBatch ${batchNum}: Translating ${rows.length} examples`);

  try {
    const results = await callOpenRouter(rows);
    const parsed = parseResponse(results, rows);
    
    let saved = 0;
    for (const { id, fr, en } of parsed) {
      // Build dynamic SET clause
      const sets = [];
      const vals = [];
      if (fr && config.frenchCol) { sets.push(`${config.frenchCol} = ?`); vals.push(fr); }
      if (en && config.englishCol) { sets.push(`${config.englishCol} = ?`); vals.push(en); }
      
      if (sets.length > 0) {
        vals.push(id);
        await conn.execute(`UPDATE words SET ${sets.join(', ')} WHERE id = ?`, vals);
        saved++;
      }
    }
    
    totalProcessed += saved;
    offset += rows.length;
    console.log(`  Saved ${saved} translations. Total: ${totalProcessed}`);
    
    progress = { offset, processed: totalProcessed, errors: totalErrors };
    writeFileSync(PROGRESS_FILE, JSON.stringify(progress));
    
  } catch (err) {
    totalErrors++;
    console.error(`  Batch error: ${err.message}`);
    offset += rows.length;
    progress = { offset, processed: totalProcessed, errors: totalErrors };
    writeFileSync(PROGRESS_FILE, JSON.stringify(progress));
    await new Promise(r => setTimeout(r, 2000));
  }

  await new Promise(r => setTimeout(r, 500));
}

try { await conn.end(); } catch (e) {}

console.log(`\n=== DONE ===`);
console.log(`Total processed: ${totalProcessed}`);
console.log(`Total errors: ${totalErrors}`);
