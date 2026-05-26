/**
 * Re-import 8,385 Japanese JLPT words from /tmp/jlpt-words.json
 */
import fs from 'fs';
import { drizzle } from 'drizzle-orm/mysql2';
import { sql } from 'drizzle-orm';

const db = drizzle(process.env.DATABASE_URL);

function escSql(str) {
  if (!str) return '';
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

async function reimport() {
  console.log('=== Japanese JLPT Re-import ===\n');

  // Load JLPT data
  const data = JSON.parse(fs.readFileSync('/tmp/jlpt-words.json', 'utf-8'));
  console.log(`Loaded ${data.length} Japanese words`);

  // Delete existing Japanese words
  console.log('Deleting existing Japanese words...');
  await db.execute(sql`DELETE FROM words WHERE language = 'japanese'`);
  console.log('Done.\n');

  // Insert in batches
  const BATCH_SIZE = 200;
  let inserted = 0;

  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    const batch = data.slice(i, i + BATCH_SIZE);
    
    const values = batch.map(w => {
      const japanese = escSql(w.word || '');
      const hiragana = escSql(w.furigana || '');
      const romaji = escSql(w.romaji || '');
      const meaning = escSql(w.meaning || '');
      const jlptLevel = `n${w.level}`;
      
      return `('${japanese}', '${hiragana}', '${romaji}', '${meaning}', '${jlptLevel}', 'japanese')`;
    }).join(',\n');

    const insertSql = `INSERT INTO words (japanese, hiragana, romaji, meaning, jlptLevel, language) VALUES ${values}`;
    
    try {
      await db.execute(sql.raw(insertSql));
      inserted += batch.length;
    } catch (error) {
      // Try one by one
      for (const w of batch) {
        try {
          const japanese = escSql(w.word || '');
          const hiragana = escSql(w.furigana || '');
          const romaji = escSql(w.romaji || '');
          const meaning = escSql(w.meaning || '');
          const jlptLevel = `n${w.level}`;
          
          const singleSql = `INSERT INTO words (japanese, hiragana, romaji, meaning, jlptLevel, language) VALUES ('${japanese}', '${hiragana}', '${romaji}', '${meaning}', '${jlptLevel}', 'japanese')`;
          await db.execute(sql.raw(singleSql));
          inserted++;
        } catch (e2) {
          console.error(`  Skipped: ${w.word} - ${e2.message.slice(0, 80)}`);
        }
      }
    }
    
    if (inserted % 1000 === 0 || i + BATCH_SIZE >= data.length) {
      console.log(`  Inserted ${inserted}/${data.length}...`);
    }
  }

  // Verify
  const counts = await db.execute(sql`SELECT jlptLevel, COUNT(*) as cnt FROM words WHERE language = 'japanese' GROUP BY jlptLevel ORDER BY jlptLevel`);
  console.log('\nFinal Japanese word distribution:');
  console.log(counts[0]);
  console.log(`\n✅ Successfully imported ${inserted} Japanese words`);
  process.exit(0);
}

reimport().catch(err => {
  console.error('Import failed:', err.message);
  process.exit(1);
});
