import mysql from 'mysql2/promise';
import { URL } from 'url';
import { pinyin } from 'pinyin-pro';

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
    
    // Get all words with Chinese examples but no proper pinyin
    const [rows] = await conn.execute(
      'SELECT id, chineseExample FROM words WHERE chineseExample IS NOT NULL'
    );
    
    console.log(`Found ${rows.length} words with Chinese examples`);
    
    let updated = 0;
    for (const row of rows) {
      // Generate pinyin from the Chinese example
      const pinyinText = pinyin(row.chineseExample, { 
        type: 'normal',
        toneType: 'tone',
        v: true 
      });
      
      // Update the database
      await conn.execute(
        'UPDATE words SET examplePinyin = ? WHERE id = ?',
        [pinyinText, row.id]
      );
      
      updated++;
      if (updated % 5 === 0) {
        console.log(`  Updated ${updated}/${rows.length}...`);
      }
    }
    
    console.log(`\n✅ Successfully generated pinyin for ${updated} examples`);
    
    // Show a sample
    const [samples] = await conn.execute(
      'SELECT chineseExample, examplePinyin FROM words WHERE chineseExample IS NOT NULL LIMIT 3'
    );
    
    console.log('\nSample results:');
    samples.forEach(row => {
      console.log(`  Chinese: ${row.chineseExample}`);
      console.log(`  Pinyin:  ${row.examplePinyin}`);
    });
    
    await conn.end();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
