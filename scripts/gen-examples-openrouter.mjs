/**
 * Generate example sentences for Korean, Japanese, and Chinese words via OpenRouter
 * 
 * Usage:
 *   node scripts/gen-examples-openrouter.mjs --lang korean
 *   node scripts/gen-examples-openrouter.mjs --lang japanese
 *   node scripts/gen-examples-openrouter.mjs --lang chinese
 * 
 * Features:
 * - Batches of 50 words per API call
 * - Per-batch DB reconnection (TiDB timeout prevention)
 * - Resume from last offset (saved in /tmp/gen-examples-{lang}.json)
 * - Validates response order by word ID
 * - Starts with beginner/easiest words first
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

// Parse CLI args
const args = process.argv.slice(2);
const langIdx = args.indexOf('--lang');
const LANG = langIdx >= 0 ? args[langIdx + 1] : 'korean';
const BATCH_SIZE = 50;
const PROGRESS_FILE = `/tmp/gen-examples-${LANG}.json`;
const MODEL = 'google/gemini-2.5-flash-lite';

console.log(`\n=== Generating ${LANG.toUpperCase()} example sentences ===`);
console.log(`Model: ${MODEL}, Batch size: ${BATCH_SIZE}`);

// Language config
const langConfig = {
  korean: {
    wordCol: 'korean',
    exampleCol: 'koreanExample',
    meaningCol: 'meaning',
    levelCol: 'topikLevel',
    levelOrder: "CASE WHEN topikLevel = 'beginner' THEN 1 WHEN topikLevel = 'intermediate' THEN 2 ELSE 3 END",
    systemPrompt: `You are a Korean language teacher. Generate ONE natural, simple Korean example sentence for each word provided. 
Rules:
- Use natural, everyday Korean (not overly formal)
- Sentence length: 5-12 words
- Use the word exactly as given (same form)
- Return ONLY a JSON array with objects: {"id": <word_id>, "example": "<Korean sentence>"}
- No explanations, no romanization, just the JSON array
- Maintain the EXACT same order as input`,
    userPromptFn: (words) => `Generate one Korean example sentence for each word below. Return JSON array only.\n\n${words.map(w => `{"id": ${w.id}, "word": "${w.word}", "meaning": "${w.meaning}"}`).join('\n')}`,
  },
  japanese: {
    wordCol: 'japanese',
    exampleCol: 'japaneseExample',
    meaningCol: 'meaning',
    levelCol: 'jlptLevel',
    levelOrder: "CASE WHEN jlptLevel = 'N5' THEN 1 WHEN jlptLevel = 'N4' THEN 2 WHEN jlptLevel = 'N3' THEN 3 WHEN jlptLevel = 'N2' THEN 4 ELSE 5 END",
    systemPrompt: `You are a Japanese language teacher. Generate ONE natural, simple Japanese example sentence for each word provided.
Rules:
- Use natural, everyday Japanese (not overly formal)
- Sentence length: 5-15 characters
- Use the word exactly as given (same form)
- Return ONLY a JSON array with objects: {"id": <word_id>, "example": "<Japanese sentence>"}
- No explanations, no romanization, just the JSON array
- Maintain the EXACT same order as input`,
    userPromptFn: (words) => `Generate one Japanese example sentence for each word below. Return JSON array only.\n\n${words.map(w => `{"id": ${w.id}, "word": "${w.word}", "meaning": "${w.meaning}"}`).join('\n')}`,
  },
  chinese: {
    wordCol: 'chinese',
    exampleCol: 'chineseExample',
    meaningCol: 'meaning',
    levelCol: 'hskLevel',
    levelOrder: "CASE WHEN hskLevel = 'HSK1' THEN 1 WHEN hskLevel = 'HSK2' THEN 2 WHEN hskLevel = 'HSK3' THEN 3 WHEN hskLevel = 'HSK4' THEN 4 WHEN hskLevel = 'HSK5' THEN 5 ELSE 6 END",
    systemPrompt: `You are a Chinese language teacher. Generate ONE natural, simple Chinese (Mandarin) example sentence for each word provided.
Rules:
- Use natural, everyday Mandarin Chinese
- Sentence length: 5-15 characters
- Use the word exactly as given (same form)
- Return ONLY a JSON array with objects: {"id": <word_id>, "example": "<Chinese sentence>"}
- No explanations, no pinyin, just the JSON array with Chinese characters
- Maintain the EXACT same order as input`,
    userPromptFn: (words) => `Generate one Chinese example sentence for each word below. Return JSON array only.\n\n${words.map(w => `{"id": ${w.id}, "word": "${w.word}", "meaning": "${w.meaning}"}`).join('\n')}`,
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
      temperature: 0.3,
      max_tokens: 4000,
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
  // Extract JSON array from response
  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error(`No JSON array found in response: ${content.slice(0, 200)}`);
  }
  
  const parsed = JSON.parse(jsonMatch[0]);
  
  if (!Array.isArray(parsed)) {
    throw new Error('Response is not an array');
  }
  
  // Validate and match by ID
  const resultMap = new Map();
  for (const item of parsed) {
    if (item.id && item.example) {
      resultMap.set(item.id, item.example);
    }
  }
  
  // Return results in input order, skip if missing
  const results = [];
  let matched = 0;
  for (const word of inputWords) {
    const example = resultMap.get(word.id);
    if (example && example.trim()) {
      results.push({ id: word.id, example: example.trim() });
      matched++;
    }
  }
  
  console.log(`  Matched ${matched}/${inputWords.length} words`);
  return results;
}

async function processBatch(words) {
  const content = await callOpenRouter(words);
  return parseResponse(content, words);
}

// Main loop
let conn = await getConn();
let totalProcessed = progress.processed;
let totalErrors = progress.errors;

// Count total remaining
const [countRows] = await conn.execute(
  `SELECT COUNT(*) as cnt FROM words WHERE ${config.wordCol} IS NOT NULL AND ${config.wordCol} != '' AND (${config.exampleCol} IS NULL OR ${config.exampleCol} = '')`
);
const totalRemaining = countRows[0].cnt;
console.log(`Words remaining: ${totalRemaining}`);

if (totalRemaining === 0) {
  console.log('All done! No words need examples.');
  await conn.end();
  process.exit(0);
}

let offset = progress.offset;
let batchNum = 0;

while (true) {
  // Reconnect per batch to avoid TiDB timeout
  try { await conn.end(); } catch (e) {}
  conn = await getConn();

  // Fetch batch
  const [rows] = await conn.execute(
    `SELECT id, ${config.wordCol} as word, ${config.meaningCol} as meaning 
     FROM words 
     WHERE ${config.wordCol} IS NOT NULL AND ${config.wordCol} != '' 
       AND (${config.exampleCol} IS NULL OR ${config.exampleCol} = '')
     ORDER BY ${config.levelOrder}, id
     LIMIT ${BATCH_SIZE}`
  );

  if (rows.length === 0) {
    console.log('\nAll words processed!');
    break;
  }

  batchNum++;
  console.log(`\nBatch ${batchNum}: Processing ${rows.length} words (offset ${offset})`);

  try {
    const results = await processBatch(rows);
    
    // Write results to DB
    let saved = 0;
    for (const { id, example } of results) {
      await conn.execute(
        `UPDATE words SET ${config.exampleCol} = ? WHERE id = ?`,
        [example, id]
      );
      saved++;
    }
    
    totalProcessed += saved;
    offset += rows.length;
    console.log(`  Saved ${saved} examples. Total: ${totalProcessed}`);
    
    // Save progress
    progress = { offset, processed: totalProcessed, errors: totalErrors };
    writeFileSync(PROGRESS_FILE, JSON.stringify(progress));
    
  } catch (err) {
    totalErrors++;
    console.error(`  Batch error: ${err.message}`);
    console.error('  Skipping batch and continuing...');
    
    // Mark these words as having a placeholder to skip them next time
    // Actually, just skip and they'll be retried next run
    offset += rows.length;
    progress = { offset, processed: totalProcessed, errors: totalErrors };
    writeFileSync(PROGRESS_FILE, JSON.stringify(progress));
    
    // Wait a bit before retrying
    await new Promise(r => setTimeout(r, 2000));
  }

  // Small delay between batches
  await new Promise(r => setTimeout(r, 500));
}

try { await conn.end(); } catch (e) {}

console.log(`\n=== DONE ===`);
console.log(`Total processed: ${totalProcessed}`);
console.log(`Total errors: ${totalErrors}`);
