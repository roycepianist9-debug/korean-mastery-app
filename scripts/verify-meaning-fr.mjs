import { createConnection } from 'mysql2/promise';
import { readFileSync } from 'fs';

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) { console.error('No DATABASE_URL'); process.exit(1); }

const url = new URL(dbUrl);
const conn = await createConnection({
  host: url.hostname,
  port: parseInt(url.port || '3306'),
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  ssl: { rejectUnauthorized: false },
});

const [rows] = await conn.execute(`
  SELECT language,
    COUNT(*) as total,
    SUM(CASE WHEN meaningFr IS NOT NULL AND meaningFr != '' THEN 1 ELSE 0 END) as with_fr,
    ROUND(SUM(CASE WHEN meaningFr IS NOT NULL AND meaningFr != '' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) as pct
  FROM words GROUP BY language
`);

console.log('\n=== French Meaning Coverage ===');
for (const row of rows) {
  console.log(`${row.language}: ${row.with_fr}/${row.total} (${row.pct}%)`);
}

// Sample 3 Korean words
const [korean] = await conn.execute(`
  SELECT word, meaning, meaningFr FROM words 
  WHERE language='korean' AND meaningFr IS NOT NULL AND meaningFr != ''
  ORDER BY RAND() LIMIT 3
`);
console.log('\n=== Korean Sample ===');
for (const r of korean) {
  console.log(`${r.word}: EN="${r.meaning}" | FR="${r.meaningFr}"`);
}

// Sample 3 Japanese words
const [japanese] = await conn.execute(`
  SELECT word, meaning, meaningFr FROM words 
  WHERE language='japanese' AND meaningFr IS NOT NULL AND meaningFr != ''
  ORDER BY RAND() LIMIT 3
`);
console.log('\n=== Japanese Sample ===');
for (const r of japanese) {
  console.log(`${r.word}: EN="${r.meaning}" | FR="${r.meaningFr}"`);
}

await conn.end();
process.exit(0);
