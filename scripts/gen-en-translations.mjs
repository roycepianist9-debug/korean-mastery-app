/**
 * Generate ENGLISH translations for Japanese and Chinese example sentences.
 * Usage:
 *   node scripts/gen-en-translations.mjs --lang japanese
 *   node scripts/gen-en-translations.mjs --lang chinese
 */
import { createConnection } from 'mysql2/promise';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
if (!OPENROUTER_API_KEY) { console.error('No OPENROUTER_API_KEY'); process.exit(1); }
const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) { console.error('No DATABASE_URL'); process.exit(1); }

const urlObj = new URL(DB_URL);
const dbConfig = { host: urlObj.hostname, port: parseInt(urlObj.port||'4000'), user: urlObj.username, password: urlObj.password, database: urlObj.pathname.replace('/','').split('?')[0], ssl:{rejectUnauthorized:false} };

const args = process.argv.slice(2);
const langIdx = args.indexOf('--lang');
const LANG = langIdx >= 0 ? args[langIdx+1] : 'japanese';
const BATCH_SIZE = 50;
const MODEL = 'google/gemini-2.5-flash-lite';
const PROGRESS_FILE = `/tmp/gen-en-${LANG}.json`;

const configs = {
  japanese: {
    exampleCol: 'japaneseExample',
    englishCol: 'exampleJapaneseEnglish',
    where: "language='japanese' AND japaneseExample IS NOT NULL AND japaneseExample!='' AND (exampleJapaneseEnglish IS NULL OR exampleJapaneseEnglish='')",
    langName: 'Japanese',
  },
  chinese: {
    exampleCol: 'chineseExample',
    englishCol: 'exampleChineseEnglish',
    where: "language='chinese' AND chineseExample IS NOT NULL AND chineseExample!='' AND (exampleChineseEnglish IS NULL OR exampleChineseEnglish='')",
    langName: 'Chinese (Mandarin)',
  },
};

const cfg = configs[LANG];
if (!cfg) { console.error('Use --lang japanese or chinese'); process.exit(1); }

console.log(`\n=== Generating ${cfg.langName} ENGLISH translations ===`);

let progress = { processed: 0, errors: 0 };
if (existsSync(PROGRESS_FILE)) {
  try { progress = JSON.parse(readFileSync(PROGRESS_FILE, 'utf8')); } catch(e) {}
}

async function getConn() { return createConnection(dbConfig); }

async function callOpenRouter(words) {
  const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${OPENROUTER_API_KEY}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://swipefluent.co' },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: `Translate ${cfg.langName} sentences to English. Return ONLY a JSON array: [{"id":<number>,"en":"<translation>"},...]. No extra text.` },
        { role: 'user', content: words.map(w=>`{"id":${w.id},"sentence":"${w.example.replace(/"/g,"'")}"}`).join('\n') },
      ],
      temperature: 0.1,
      max_tokens: 4000,
    }),
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${(await resp.text()).slice(0,200)}`);
  const data = await resp.json();
  return data.choices?.[0]?.message?.content || '';
}

let conn = await getConn();
const [[{cnt: total}]] = await conn.execute(`SELECT COUNT(*) cnt FROM words WHERE ${cfg.where}`);
console.log(`Remaining: ${total}`);
if (total === 0) { console.log('Already done!'); await conn.end(); process.exit(0); }

let batchNum = 0;
while (true) {
  try { await conn.end(); } catch(e) {}
  conn = await getConn();
  const [rows] = await conn.execute(`SELECT id, ${cfg.exampleCol} as example FROM words WHERE ${cfg.where} ORDER BY id LIMIT ${BATCH_SIZE}`);
  if (rows.length === 0) { console.log('\nAll done!'); break; }
  batchNum++;
  console.log(`Batch ${batchNum}: ${rows.length} words`);
  try {
    const content = await callOpenRouter(rows);
    const match = content.match(/\[[\s\S]*\]/);
    if (!match) throw new Error('No JSON array');
    const parsed = JSON.parse(match[0]);
    const map = new Map(parsed.map(x => [x.id, x.en]));
    let saved = 0;
    for (const row of rows) {
      const en = map.get(row.id);
      if (en && en.trim()) {
        await conn.execute(`UPDATE words SET ${cfg.englishCol}=? WHERE id=?`, [en.trim(), row.id]);
        saved++;
      }
    }
    progress.processed += saved;
    writeFileSync(PROGRESS_FILE, JSON.stringify(progress));
    console.log(`  Saved ${saved}. Total: ${progress.processed}`);
  } catch(err) {
    progress.errors++;
    console.error(`  Error: ${err.message}`);
    writeFileSync(PROGRESS_FILE, JSON.stringify(progress));
    await new Promise(r=>setTimeout(r,2000));
  }
  await new Promise(r=>setTimeout(r,400));
}

try { await conn.end(); } catch(e) {}
console.log(`\nDone. Processed: ${progress.processed}, Errors: ${progress.errors}`);
