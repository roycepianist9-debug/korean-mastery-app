import { drizzle } from 'drizzle-orm/mysql2/promise';
import mysql from 'mysql2/promise';
import { koreanWords, chineseWords } from './drizzle/schema.ts';
import { eq, isNull } from 'drizzle-orm';

const connection = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const db = drizzle(connection);

// Check Korean example translations
const koreanStats = await db.select({
  total: 'COUNT(*)',
  translated: 'SUM(CASE WHEN exampleFrench IS NOT NULL AND exampleFrench != "" THEN 1 ELSE 0 END)',
}).from(koreanWords);

// Check Chinese example translations
const chineseStats = await db.select({
  total: 'COUNT(*)',
  translated: 'SUM(CASE WHEN exampleChineseFrench IS NOT NULL AND exampleChineseFrench != "" THEN 1 ELSE 0 END)',
}).from(chineseWords);

console.log('Korean Example Translations:', koreanStats[0]);
console.log('Chinese Example Translations:', chineseStats[0]);

await connection.end();
