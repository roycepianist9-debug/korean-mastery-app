import { drizzle } from "drizzle-orm/mysql2";
import { sql } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL);

const result = await db.execute(sql`
  SELECT 
    language,
    COUNT(*) as total_words,
    SUM(CASE WHEN meaningFr IS NOT NULL THEN 1 ELSE 0 END) as with_french,
    SUM(CASE WHEN meaningFr IS NULL THEN 1 ELSE 0 END) as without_french,
    ROUND(SUM(CASE WHEN meaningFr IS NOT NULL THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) as coverage_pct
  FROM words
  GROUP BY language
`);

console.log("\n=== French Translation Coverage ===");
for (const row of result[0]) {
  console.log(`${row.language}: ${row.with_french}/${row.total_words} (${row.coverage_pct}%)`);
}

// Sample a few Korean words
const sample = await db.execute(sql`
  SELECT korean, meaning, meaningFr, exampleFrench 
  FROM words 
  WHERE language='korean' AND meaningFr IS NOT NULL 
  ORDER BY RAND() LIMIT 3
`);
console.log("\n=== Sample Korean Words with French ===");
for (const row of sample[0]) {
  console.log(`${row.korean}: EN="${row.meaning}" | FR="${row.meaningFr}"`);
  if (row.exampleFrench) console.log(`  Example: ${row.exampleFrench}`);
}

// Sample a few Chinese words
const sampleCn = await db.execute(sql`
  SELECT chinese, pinyin, meaning, meaningFr 
  FROM words 
  WHERE language='chinese' AND meaningFr IS NOT NULL 
  ORDER BY RAND() LIMIT 3
`);
console.log("\n=== Sample Chinese Words with French ===");
for (const row of sampleCn[0]) {
  console.log(`${row.chinese} (${row.pinyin}): EN="${row.meaning}" | FR="${row.meaningFr}"`);
}

process.exit(0);
