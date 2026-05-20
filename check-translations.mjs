import { drizzle } from 'drizzle-orm/mysql2';
import { words } from './drizzle/schema.ts';
import { eq, sql } from 'drizzle-orm';

const db = drizzle(process.env.DATABASE_URL);

// Check Chinese translations
const chineseStats = await db.select({
  total: sql`COUNT(*)`,
  translated: sql`SUM(CASE WHEN exampleChineseFrench IS NOT NULL AND exampleChineseFrench != '' THEN 1 ELSE 0 END)`,
  pending: sql`SUM(CASE WHEN exampleChineseFrench IS NULL OR exampleChineseFrench = '' THEN 1 ELSE 0 END)`
}).from(words).where(eq(words.language, 'chinese'));

// Check Korean translations
const koreanStats = await db.select({
  total: sql`COUNT(*)`,
  translated: sql`SUM(CASE WHEN exampleKoreanFrench IS NOT NULL AND exampleKoreanFrench != '' THEN 1 ELSE 0 END)`,
  pending: sql`SUM(CASE WHEN exampleKoreanFrench IS NULL OR exampleKoreanFrench = '' THEN 1 ELSE 0 END)`
}).from(words).where(eq(words.language, 'korean'));

console.log('📊 TRANSLATION STATUS:');
console.log('\n🇨🇳 Chinese:');
console.log(`  Total words: ${chineseStats[0].total}`);
console.log(`  Translated: ${chineseStats[0].translated}`);
console.log(`  Pending: ${chineseStats[0].pending}`);

console.log('\n🇰🇷 Korean:');
console.log(`  Total words: ${koreanStats[0].total}`);
console.log(`  Translated: ${koreanStats[0].translated}`);
console.log(`  Pending: ${koreanStats[0].pending}`);

process.exit(0);
