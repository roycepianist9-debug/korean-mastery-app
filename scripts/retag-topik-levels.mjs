/**
 * Retag Korean words in the database using TOPIK frequency list.
 * 
 * Mapping:
 *   Rank 1-2000   → 'beginner'     (TOPIK 1-2)
 *   Rank 2001-4000 → 'intermediate' (TOPIK 3-4)
 *   Rank 4001-6000 → 'advanced'     (TOPIK 5-6)
 *   Not in list   → 'native-like'
 * 
 * Only updates existing Korean words — does NOT add new words.
 * Matches on exact Korean word form.
 */
import { createConnection } from 'mysql2/promise';
import { readFileSync } from 'fs';

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) { console.error('No DATABASE_URL'); process.exit(1); }

const urlObj = new URL(DB_URL);
const dbConfig = {
  host: urlObj.hostname,
  port: parseInt(urlObj.port || '4000'),
  user: urlObj.username,
  password: urlObj.password,
  database: urlObj.pathname.replace('/', '').split('?')[0],
  ssl: { rejectUnauthorized: false }
};

// Load TOPIK word→level mapping
const topikLevels = JSON.parse(readFileSync('/tmp/topik_word_levels.json', 'utf8'));
console.log(`Loaded ${Object.keys(topikLevels).length} TOPIK words`);

const conn = await createConnection(dbConfig);

// Get current stats
const [[stats]] = await conn.execute(`
  SELECT 
    COUNT(*) as total,
    SUM(CASE WHEN topikLevel='beginner' THEN 1 ELSE 0 END) as beginner,
    SUM(CASE WHEN topikLevel='intermediate' THEN 1 ELSE 0 END) as intermediate,
    SUM(CASE WHEN topikLevel='advanced' THEN 1 ELSE 0 END) as advanced,
    SUM(CASE WHEN topikLevel='native-like' THEN 1 ELSE 0 END) as native_like
  FROM words WHERE language='korean'
`);
console.log('\nCurrent DB stats:');
console.log(`  Total: ${stats.total}`);
console.log(`  Beginner: ${stats.beginner}`);
console.log(`  Intermediate: ${stats.intermediate}`);
console.log(`  Advanced: ${stats.advanced}`);
console.log(`  Native-like: ${stats.native_like}`);

// Process in batches
const BATCH_SIZE = 1000;
let offset = 0;
let updated = 0;
let matched = 0;
let notMatched = 0;

const levelCounts = { beginner: 0, intermediate: 0, advanced: 0, 'native-like': 0 };

console.log('\nStarting retagging...');

while (true) {
  const [rows] = await conn.execute(
    `SELECT id, korean FROM words WHERE language='korean' LIMIT ${BATCH_SIZE} OFFSET ${offset}`
  );
  
  if (rows.length === 0) break;
  
  // Build update batches by level
  const byLevel = { beginner: [], intermediate: [], advanced: [], 'native-like': [] };
  
  for (const row of rows) {
    const word = row.korean?.trim();
    if (!word) continue;
    
    const level = topikLevels[word] || 'native-like';
    byLevel[level].push(row.id);
    
    if (topikLevels[word]) matched++;
    else notMatched++;
  }
  
  // Execute batch updates
  for (const [level, ids] of Object.entries(byLevel)) {
    if (ids.length === 0) continue;
    // MySQL IN clause with placeholders
    const placeholders = ids.map(() => '?').join(',');
    await conn.execute(
      `UPDATE words SET topikLevel=? WHERE id IN (${placeholders})`,
      [level, ...ids]
    );
    updated += ids.length;
    levelCounts[level] += ids.length;
  }
  
  offset += rows.length;
  if (offset % 10000 === 0) {
    console.log(`  Processed ${offset} words... (matched: ${matched}, not matched: ${notMatched})`);
  }
}

await conn.end();

console.log('\n=== RETAGGING COMPLETE ===');
console.log(`Total processed: ${updated}`);
console.log(`Matched in TOPIK list: ${matched}`);
console.log(`Not matched (→ native-like): ${notMatched}`);
console.log('\nNew level distribution:');
console.log(`  Beginner: ${levelCounts.beginner}`);
console.log(`  Intermediate: ${levelCounts.intermediate}`);
console.log(`  Advanced: ${levelCounts.advanced}`);
console.log(`  Native-like: ${levelCounts['native-like']}`);
