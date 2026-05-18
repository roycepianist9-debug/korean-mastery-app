/**
 * Seed HSK 5 and HSK 6 Chinese words into the database.
 * Uses hsk_complete.json (new HSK 3.0 standard).
 * Run: node /home/ubuntu/seed-hsk56.mjs
 */
import fs from 'fs';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('/home/ubuntu/korean-mastery-app', '.env') });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

// POS mapping from HSK codes to our schema
function mapPos(posList) {
  if (!posList || posList.length === 0) return 'noun';
  const p = posList[0];
  if (p === 'n' || p === 'nr' || p === 'ns' || p === 'nz' || p === 'vn' || p === 'an') return 'noun';
  if (p === 'v' || p === 'vd' || p === 'vi') return 'verb';
  if (p === 'a' || p === 'ad') return 'adjective';
  if (p === 'd') return 'adverb';
  if (p === 'p') return 'particle';
  if (p === 'c') return 'conjunction';
  if (p === 'r') return 'pronoun';
  if (p === 'm' || p === 'q') return 'numeral';
  return 'noun';
}

async function main() {
  console.log('Loading HSK vocabulary data...');
  const raw = fs.readFileSync('/home/ubuntu/hsk_complete.json', 'utf-8');
  const allWords = JSON.parse(raw);

  // Filter HSK 5 and 6 (new standard)
  const hsk5 = allWords.filter(w => w.level && w.level.includes('new-5'));
  const hsk6 = allWords.filter(w => w.level && w.level.includes('new-6'));
  
  console.log(`HSK 5: ${hsk5.length} words`);
  console.log(`HSK 6: ${hsk6.length} words`);

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

  console.log('Connected to database');

  // Check existing Chinese words
  const [existing] = await connection.execute(
    "SELECT hskLevel, COUNT(*) as cnt FROM words WHERE language='chinese' GROUP BY hskLevel ORDER BY CAST(hskLevel AS UNSIGNED)"
  );
  console.log('Existing Chinese words by level:', existing);

  // Build word list for insertion
  const toInsert = [];
  
  for (const word of [...hsk5, ...hsk6]) {
    const simplified = word.simplified;
    if (!simplified) continue;
    
    const form = word.forms && word.forms[0];
    if (!form) continue;
    
    const pinyin = form.transcriptions?.pinyin || '';
    const meanings = form.meanings || [];
    const meaning = meanings.slice(0, 3).join('; ');
    if (!meaning) continue;
    
    const pos = mapPos(word.pos);
    const hskLevel = word.level.includes('new-5') ? '5' : '6';
    
    toInsert.push({
      chinese: simplified,
      pinyin,
      pos,
      meaning,
      hskLevel,
    });
  }

  console.log(`Prepared ${toInsert.length} words for insertion`);

  // Insert in batches
  const BATCH_SIZE = 200;
  let inserted = 0;

  for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
    const batch = toInsert.slice(i, i + BATCH_SIZE);
    
    const placeholders = batch.map(() => '(?, ?, ?, ?, ?, ?, ?)').join(',');
    const values = [];
    
    for (const w of batch) {
      values.push(
        'chinese',      // language
        w.chinese,      // chinese
        w.pinyin,       // pinyin
        w.pos,          // pos
        w.meaning,      // meaning
        w.hskLevel,     // hskLevel
        '',             // romanization (not used for Chinese)
      );
    }

    await connection.execute(
      `INSERT INTO words (language, chinese, pinyin, pos, meaning, hskLevel, romanization) VALUES ${placeholders}`,
      values
    );
    
    inserted += batch.length;
    console.log(`Inserted ${inserted}/${toInsert.length}`);
  }

  // Verify final counts
  const [finalCounts] = await connection.execute(
    "SELECT hskLevel, COUNT(*) as cnt FROM words WHERE language='chinese' GROUP BY hskLevel ORDER BY CAST(hskLevel AS UNSIGNED)"
  );
  console.log('Final Chinese word counts by level:', finalCounts);

  await connection.end();
  console.log('Done! HSK 5-6 seeding complete.');
}

main().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
