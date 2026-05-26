/**
 * Re-import 56,556 Korean KRDICT words into the database.
 * Uses the existing all_entries.json file.
 */
import fs from 'fs';
import { drizzle } from 'drizzle-orm/mysql2';
import { sql } from 'drizzle-orm';

const db = drizzle(process.env.DATABASE_URL);
const JSON_PATH = '/home/ubuntu/krdict_json/output/all_entries.json';

async function reimport() {
  console.log('Loading KRDICT JSON...');
  const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));
  console.log(`Loaded ${data.length} entries`);

  // First, delete existing Korean words to avoid duplicates
  console.log('Deleting existing Korean words...');
  await db.execute(sql`DELETE FROM words WHERE language = 'korean'`);
  console.log('Deleted existing Korean words');

  // Insert in batches of 500
  const BATCH_SIZE = 500;
  let inserted = 0;

  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    const batch = data.slice(i, i + BATCH_SIZE);
    
    // Build VALUES clause
    const values = batch.map(entry => {
      const korean = (entry.korean || '').replace(/'/g, "''");
      const romanization = (entry.romanization || '').replace(/'/g, "''");
      const pos = (entry.pos || '').replace(/'/g, "''");
      const meaning = (entry.meaning || '').replace(/'/g, "''");
      const koreanExample = (entry.koreanExample || '').replace(/'/g, "''");
      const exampleEnglish = (entry.exampleEnglish || '').replace(/'/g, "''");
      const chineseTerm = (entry.chineseTerm || '').replace(/'/g, "''");
      const pinyin = (entry.pinyin || '').replace(/'/g, "''");
      const chineseExample = entry.chineseExample ? `'${entry.chineseExample.replace(/'/g, "''")}'` : 'NULL';
      const examplePinyin = entry.examplePinyin ? `'${entry.examplePinyin.replace(/'/g, "''")}'` : 'NULL';
      
      return `('${korean}', '${romanization}', '${pos}', '${meaning}', '${koreanExample}', '${exampleEnglish}', 'advanced', '${chineseTerm}', '${pinyin}', ${chineseExample}, ${examplePinyin}, 'korean')`;
    }).join(',\n');

    const insertSql = `INSERT INTO words (korean, romanization, pos, meaning, koreanExample, exampleEnglish, topikLevel, chineseTerm, pinyin, chineseExample, examplePinyin, language) VALUES ${values}`;
    
    try {
      await db.execute(sql.raw(insertSql));
      inserted += batch.length;
      if (inserted % 5000 === 0 || inserted >= data.length) {
        console.log(`  Inserted ${inserted}/${data.length}...`);
      }
    } catch (error) {
      console.error(`Error at batch starting at ${i}:`, error.message.slice(0, 200));
      // Try one by one for this batch
      for (const entry of batch) {
        try {
          const korean = (entry.korean || '').replace(/'/g, "''");
          const romanization = (entry.romanization || '').replace(/'/g, "''");
          const pos = (entry.pos || '').replace(/'/g, "''");
          const meaning = (entry.meaning || '').replace(/'/g, "''");
          const koreanExample = (entry.koreanExample || '').replace(/'/g, "''");
          const exampleEnglish = (entry.exampleEnglish || '').replace(/'/g, "''");
          const chineseTerm = (entry.chineseTerm || '').replace(/'/g, "''");
          const pinyinVal = (entry.pinyin || '').replace(/'/g, "''");
          const chineseExample = entry.chineseExample ? `'${entry.chineseExample.replace(/'/g, "''")}'` : 'NULL';
          const examplePinyin = entry.examplePinyin ? `'${entry.examplePinyin.replace(/'/g, "''")}'` : 'NULL';
          
          const singleSql = `INSERT INTO words (korean, romanization, pos, meaning, koreanExample, exampleEnglish, topikLevel, chineseTerm, pinyin, chineseExample, examplePinyin, language) VALUES ('${korean}', '${romanization}', '${pos}', '${meaning}', '${koreanExample}', '${exampleEnglish}', 'advanced', '${chineseTerm}', '${pinyinVal}', ${chineseExample}, ${examplePinyin}, 'korean')`;
          await db.execute(sql.raw(singleSql));
          inserted++;
        } catch (e2) {
          console.error(`  Skipped word: ${entry.korean} - ${e2.message.slice(0, 100)}`);
        }
      }
    }
  }

  // Set TOPIK levels
  console.log('\nSetting TOPIK levels...');
  
  // Mark intermediate words
  const intermediateResult = await db.execute(sql`
    UPDATE words 
    SET topikLevel = 'intermediate' 
    WHERE language = 'korean'
      AND topikLevel = 'advanced' 
      AND pos IN ('noun', 'verb', 'adjective', 'adverb')
      AND koreanExample IS NOT NULL 
      AND koreanExample != ''
      AND exampleEnglish IS NOT NULL
      AND exampleEnglish != ''
    LIMIT 15000
  `);
  console.log(`Marked intermediate words`);

  // Mark beginner words (first ~2500 common words)
  const beginnerResult = await db.execute(sql`
    UPDATE words 
    SET topikLevel = 'beginner' 
    WHERE language = 'korean'
      AND topikLevel = 'intermediate'
      AND pos IN ('noun', 'verb', 'adjective', 'adverb')
    LIMIT 2545
  `);
  console.log(`Marked beginner words`);

  // Final count
  const counts = await db.execute(sql`
    SELECT topikLevel, COUNT(*) as cnt 
    FROM words 
    WHERE language = 'korean'
    GROUP BY topikLevel
  `);
  console.log('\nFinal Korean word distribution:');
  console.log(counts[0]);

  console.log(`\n✅ Successfully imported ${inserted} Korean words from KRDICT`);
  process.exit(0);
}

reimport().catch(err => {
  console.error('Import failed:', err.message);
  process.exit(1);
});
