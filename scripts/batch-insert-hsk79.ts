import fs from 'fs';
import { getDb } from '../server/db';
import { words } from '../drizzle/schema';

interface HSKWord {
  no: number;
  chinese: string;
  pinyin: string;
  meaning: string;
  chineseExample: string;
  exampleEnglish: string;
}

async function batchInsertHSK79() {
  console.log('Reading HSK 7-9 data...');
  const data = JSON.parse(fs.readFileSync('/tmp/hsk79-complete.json', 'utf-8')) as HSKWord[];
  console.log(`Found ${data.length} words\n`);

  const db = await getDb();
  if (!db) {
    console.error('Failed to connect to database');
    process.exit(1);
  }

  console.log('Batch inserting to database...');
  const BATCH_SIZE = 200;
  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    const batch = data.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(data.length / BATCH_SIZE);

    console.log(`[Batch ${batchNum}/${totalBatches}] Inserting ${batch.length} words...`);

    try {
      // Insert batch using raw SQL to avoid type issues
      const values = batch
        .map(w => {
          const chinese = w.chinese.replace(/'/g, "\\'");
          const pinyin = w.pinyin.replace(/'/g, "\\'");
          const meaning = w.meaning.replace(/'/g, "\\'");
          const example = w.chineseExample.replace(/'/g, "\\'");
          const exampleEn = w.exampleEnglish.replace(/'/g, "\\'");
          return `('chinese', '${chinese}', '${pinyin}', '${meaning}', '${example}', '${exampleEn}', '7-9', '')`;
        })
        .join(',');

      const query = `
        INSERT INTO words (language, chinese, pinyin, meaning, chineseExample, exampleEnglish, hskLevel, pos) 
        VALUES ${values}
        ON DUPLICATE KEY UPDATE pinyin=pinyin
      `;

      // Execute via db.execute (raw SQL)
      await db.execute(sql`${sql.raw(query)}`);

      inserted += batch.length;
      console.log(`✓ Batch ${batchNum} complete. Total inserted: ${inserted}/${data.length}\n`);
    } catch (error) {
      console.error(`✗ Error in batch ${batchNum}:`, (error as Error).message);
      skipped += batch.length;
    }
  }

  console.log(`\n✅ Batch insert complete!`);
  console.log(`  Inserted: ${inserted}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Total: ${inserted + skipped}/${data.length}`);

  process.exit(0);
}

// Import sql from drizzle-orm for raw query execution
import { sql } from 'drizzle-orm';

batchInsertHSK79().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
