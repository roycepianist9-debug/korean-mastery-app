/**
 * Check example sentence stats across all languages
 */
import { createConnection } from 'mysql2/promise';

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

const conn = await createConnection(dbConfig);

const [korean] = await conn.execute(`
  SELECT COUNT(*) as total, 
  SUM(CASE WHEN koreanExample IS NULL OR koreanExample = '' THEN 1 ELSE 0 END) as missing_example,
  SUM(CASE WHEN exampleFrench IS NULL OR exampleFrench = '' THEN 1 ELSE 0 END) as missing_fr,
  SUM(CASE WHEN exampleEnglish IS NULL OR exampleEnglish = '' THEN 1 ELSE 0 END) as missing_en
  FROM words WHERE korean IS NOT NULL AND korean != ''
`);

const [japanese] = await conn.execute(`
  SELECT COUNT(*) as total, 
  SUM(CASE WHEN japaneseExample IS NULL OR japaneseExample = '' THEN 1 ELSE 0 END) as missing_example,
  SUM(CASE WHEN exampleJapaneseFrench IS NULL OR exampleJapaneseFrench = '' THEN 1 ELSE 0 END) as missing_fr,
  SUM(CASE WHEN exampleJapaneseEnglish IS NULL OR exampleJapaneseEnglish = '' THEN 1 ELSE 0 END) as missing_en
  FROM words WHERE japanese IS NOT NULL AND japanese != ''
`);

const [chinese] = await conn.execute(`
  SELECT COUNT(*) as total, 
  SUM(CASE WHEN chineseExample IS NULL OR chineseExample = '' THEN 1 ELSE 0 END) as missing_example,
  SUM(CASE WHEN examplePinyin IS NULL OR examplePinyin = '' THEN 1 ELSE 0 END) as missing_pinyin,
  SUM(CASE WHEN exampleFrench IS NULL OR exampleFrench = '' THEN 1 ELSE 0 END) as missing_fr
  FROM words WHERE chinese IS NOT NULL AND chinese != ''
`);

console.log('\n=== EXAMPLE SENTENCE STATS ===\n');
console.log('KOREAN:');
console.log(`  Total words: ${korean[0].total}`);
console.log(`  Missing koreanExample: ${korean[0].missing_example}`);
console.log(`  Missing exampleFrench: ${korean[0].missing_fr}`);
console.log(`  Missing exampleEnglish: ${korean[0].missing_en}`);

console.log('\nJAPANESE:');
console.log(`  Total words: ${japanese[0].total}`);
console.log(`  Missing japaneseExample: ${japanese[0].missing_example}`);
console.log(`  Missing exampleJapaneseFrench: ${japanese[0].missing_fr}`);
console.log(`  Missing exampleJapaneseEnglish: ${japanese[0].missing_en}`);

console.log('\nCHINESE:');
console.log(`  Total words: ${chinese[0].total}`);
console.log(`  Missing chineseExample: ${chinese[0].missing_example}`);
console.log(`  Missing examplePinyin: ${chinese[0].missing_pinyin}`);
console.log(`  Missing exampleFrench: ${chinese[0].missing_fr}`);

await conn.end();
