/**
 * Tag Chinese words in the DB that appear in the 95% vocabulary list
 * Strategy: extract all Chinese character sequences from the PDF text,
 * then match against existing DB words. Only words already in DB get tagged.
 */

import { readFileSync } from 'fs';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

const DB_URL = process.env.DATABASE_URL;

// Parse DATABASE_URL: mysql://user:pass@host:port/dbname?ssl=...
function parseDbUrl(url) {
  const u = new URL(url);
  return {
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    host: u.hostname,
    port: parseInt(u.port) || 4000,
    database: u.pathname.replace(/^\//, ''),
    ssl: { rejectUnauthorized: false }
  };
}

// Read the extracted text and get all Chinese character sequences
const vocabText = readFileSync('/tmp/vocab95_nolayout.txt', 'utf-8');

// Extract all unique Chinese character sequences (1+ chars)
const chineseRe = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]+/g;
const allMatches = [...vocabText.matchAll(chineseRe)].map(m => m[0]);
const vocabSet = new Set(allMatches);

// Also add concatenated versions of adjacent Chinese sequences
// (to handle split words like 一个 + 月 = 一个月)
const lines = vocabText.split('\n').map(l => l.trim()).filter(Boolean);
const chineseLineRe = /^[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]+$/;

// Collect consecutive Chinese lines and add their concatenations
let consecutiveChinese = [];
for (const line of lines) {
  if (chineseLineRe.test(line)) {
    consecutiveChinese.push(line);
    // Add all possible concatenations of consecutive parts
    if (consecutiveChinese.length >= 2) {
      for (let start = 0; start < consecutiveChinese.length; start++) {
        let concat = '';
        for (let end = start; end < consecutiveChinese.length; end++) {
          concat += consecutiveChinese[end];
          vocabSet.add(concat);
        }
      }
    }
  } else {
    consecutiveChinese = [];
  }
}

console.log(`Total Chinese sequences in vocab list: ${vocabSet.size}`);

// Connect to DB
const dbConfig = parseDbUrl(DB_URL);
const conn = await mysql.createConnection(dbConfig);

try {
  // First check if column exists, add if not
  const [cols] = await conn.execute(`
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'words' AND COLUMN_NAME = 'is95Percent'
  `, [dbConfig.database]);
  
  if (cols.length === 0) {
    console.log('Adding is95Percent column...');
    await conn.execute(`ALTER TABLE words ADD COLUMN is95Percent TINYINT(1) NOT NULL DEFAULT 0`);
    await conn.execute(`ALTER TABLE words ADD INDEX idx_is95Percent (is95Percent)`);
    console.log('Column added.');
  } else {
    console.log('Column already exists.');
  }

  // Get all Chinese words from DB
  const [dbWords] = await conn.execute(
    `SELECT id, chinese FROM words WHERE language = 'chinese' AND chinese IS NOT NULL AND chinese != ''`
  );
  
  console.log(`Total Chinese words in DB: ${dbWords.length}`);
  
  // Match and tag
  let matchCount = 0;
  let noMatchCount = 0;
  const toTag = [];
  
  for (const row of dbWords) {
    const word = row.chinese.trim();
    if (vocabSet.has(word)) {
      toTag.push(row.id);
      matchCount++;
    } else {
      noMatchCount++;
    }
  }
  
  console.log(`Matched: ${matchCount}, Not matched: ${noMatchCount}`);
  
  if (toTag.length > 0) {
    // Reset all first
    await conn.execute(`UPDATE words SET is95Percent = 0 WHERE language = 'chinese'`);
    
    // Tag in batches of 1000
    const batchSize = 1000;
    for (let i = 0; i < toTag.length; i += batchSize) {
      const batch = toTag.slice(i, i + batchSize);
      const placeholders = batch.map(() => '?').join(',');
      await conn.execute(`UPDATE words SET is95Percent = 1 WHERE id IN (${placeholders})`, batch);
      console.log(`Tagged batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(toTag.length/batchSize)}`);
    }
    
    console.log(`\n✅ Done! Tagged ${matchCount} Chinese words as 95% vocabulary.`);
  }

} finally {
  await conn.end();
}
