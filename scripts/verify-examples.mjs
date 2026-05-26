import mysql from 'mysql2/promise';
import { URL } from 'url';

const dbUrl = process.env.DATABASE_URL;
const url = new URL(dbUrl);
const config = {
  host: url.hostname,
  port: parseInt(url.port) || 4000,
  user: url.username,
  password: decodeURIComponent(url.password),
  database: url.pathname.slice(1),
  ssl: {}
};

(async () => {
  try {
    const conn = await mysql.createConnection(config);
    
    const [rows] = await conn.execute(
      'SELECT chinese, chineseExample, examplePinyin, exampleEnglish, exampleChineseFrench FROM words WHERE chineseExample IS NOT NULL LIMIT 5'
    );
    
    console.log('\n=== ACTUAL DATA IN DATABASE ===\n');
    rows.forEach((row, idx) => {
      console.log(`Row ${idx + 1}:`);
      console.log(`  chinese: "${row.chinese}"`);
      console.log(`  chineseExample: "${row.chineseExample}"`);
      console.log(`  examplePinyin: "${row.examplePinyin}"`);
      console.log(`  exampleEnglish: "${row.exampleEnglish}"`);
      console.log(`  exampleChineseFrench: "${row.exampleChineseFrench}"`);
      console.log('');
    });
    
    await conn.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
