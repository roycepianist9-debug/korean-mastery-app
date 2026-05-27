/**
 * Regenerate meaningFr for Korean and Japanese words using OpenRouter API
 * - Batches 100 words per API call (translate meaning only, not examples)
 * - Uses gpt-4o-mini via OpenRouter for cost efficiency
 * - Resumes from last processed ID (saves progress to /tmp/regen-progress.json)
 * - Writes directly to DB via mysql2
 */

import { createConnection } from 'mysql2/promise';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
if (!OPENROUTER_API_KEY) { console.error('No OPENROUTER_API_KEY'); process.exit(1); }

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) { console.error('No DATABASE_URL'); process.exit(1); }

// Parse DATABASE_URL — strip SSL param from path
const urlObj = new URL(DB_URL);
const dbConfig = {
  host: urlObj.hostname,
  port: parseInt(urlObj.port || '4000'),
  user: urlObj.username,
  password: urlObj.password,
  database: urlObj.pathname.replace('/', '').split('?')[0],
  ssl: { rejectUnauthorized: false },
};

async function getConn() {
  return createConnection(dbConfig);
}

const LANGUAGE = process.argv[2] || 'korean'; // 'korean' or 'japanese'
const BATCH_SIZE = 100;
const PROGRESS_FILE = `/tmp/regen-fr-${LANGUAGE}.json`;

console.log(`\n=== Regenerating French meanings for ${LANGUAGE} words ===\n`);

// Load progress
let progress = { lastId: 0, done: 0, errors: 0 };
if (existsSync(PROGRESS_FILE)) {
  progress = JSON.parse(readFileSync(PROGRESS_FILE, 'utf8'));
  console.log(`Resuming from ID ${progress.lastId}, already done: ${progress.done}`);
}

// Get total count
const conn0 = await getConn();
const [[{ total }]] = await conn0.execute(
  `SELECT COUNT(*) as total FROM words WHERE language=? AND (meaningFr IS NULL OR meaningFr='') AND id > ?`,
  [LANGUAGE, progress.lastId]
);
await conn0.end();
console.log(`Words remaining: ${total}`);

if (total === 0) {
  console.log('All done!');
  process.exit(0);
}

// Translate batch via OpenRouter
async function translateBatch(words) {
  const wordList = words.map((w, i) => `${i + 1}. ${w.meaning}`).join('\n');
  
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://swipefluent.co',
      'X-Title': 'SwipeFluent',
    },
    body: JSON.stringify({
      model: 'openai/gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a professional translator. Translate English word meanings to French. Return ONLY a JSON array of strings, one French translation per line, in the same order as input. Keep translations concise (1-5 words). No explanations.'
        },
        {
          role: 'user',
          content: `Translate these ${words.length} English meanings to French:\n${wordList}\n\nReturn JSON array: ["fr1","fr2",...]`
        }
      ],
      temperature: 0.1,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenRouter error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content.trim();
  
  // Extract JSON array from response
  const match = content.match(/\[[\s\S]*\]/);
  if (!match) throw new Error(`No JSON array in response: ${content}`);
  
  const translations = JSON.parse(match[0]);
  if (!Array.isArray(translations) || translations.length === 0) {
    throw new Error(`Empty translations array`);
  }
  // Pad or trim to match word count
  while (translations.length < words.length) translations.push('');
  if (translations.length > words.length) translations.splice(words.length);
  
  return translations;
}

// Process in batches
let offset = 0;
const startTime = Date.now();

while (true) {
  const conn = await getConn();
  const [rows] = await conn.execute(
    `SELECT id, meaning FROM words WHERE language=? AND (meaningFr IS NULL OR meaningFr='') AND id > ? ORDER BY id LIMIT ${BATCH_SIZE}`,
    [LANGUAGE, progress.lastId]
  );

  if (rows.length === 0) { await conn.end(); break; }

  try {
    const translations = await translateBatch(rows);
    
    // Update DB
    for (let i = 0; i < rows.length; i++) {
      const fr = translations[i];
      if (fr && fr.trim()) {
        await conn.execute(
          `UPDATE words SET meaningFr=? WHERE id=?`,
          [fr.trim(), rows[i].id]
        );
      }
    }
    await conn.end();

    progress.lastId = rows[rows.length - 1].id;
    progress.done += rows.length;
    writeFileSync(PROGRESS_FILE, JSON.stringify(progress));

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
    const rate = (progress.done / elapsed * 60).toFixed(0);
    console.log(`✓ ${progress.done} done | last ID: ${progress.lastId} | ${rate} words/min | errors: ${progress.errors}`);

  } catch (err) {
    progress.errors++;
    console.error(`✗ Batch error (lastId=${progress.lastId}): ${err.message}`);
    // Skip this batch by advancing lastId
    progress.lastId = rows[rows.length - 1].id;
    writeFileSync(PROGRESS_FILE, JSON.stringify(progress));
    try { await conn.end(); } catch (_) {}
    // Small delay before retry
    await new Promise(r => setTimeout(r, 2000));
  }

  // Small delay to avoid rate limits
  await new Promise(r => setTimeout(r, 200));
}

console.log(`\n=== Complete! ${progress.done} words translated, ${progress.errors} errors ===`);
await conn.end();
