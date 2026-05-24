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

async function seedHSK79() {
  console.log('Reading HSK 7-9 data...');
  const data = JSON.parse(fs.readFileSync('/tmp/hsk79-complete.json', 'utf-8')) as HSKWord[];
  console.log(`Found ${data.length} words\n`);

  const db = await getDb();
  if (!db) {
    console.error('Failed to connect to database');
    process.exit(1);
  }

  console.log('Seeding to database...');
  let inserted = 0;
  let skipped = 0;

  for (const word of data) {
    try {
      // Check if word already exists
      const existing = await db.query.words.findFirst({
        where: (w, { and, eq }) =>
          and(eq(w.chinese, word.chinese), eq(w.language, 'chinese'))
      });

      if (existing) {
        skipped++;
        continue;
      }

      // Insert new word
      await db.insert(words).values({
        language: 'chinese',
        chinese: word.chinese,
        pinyin: word.pinyin,
        meaning: word.meaning,
        chineseExample: word.chineseExample,
        exampleEnglish: word.exampleEnglish,
        hskLevel: '7-9', // New level
        pos: '', // No POS info in HSK 7-9 list
      });

      inserted++;

      if (inserted % 500 === 0) {
        console.log(`  Inserted ${inserted}/${data.length}...`);
      }
    } catch (error) {
      console.error(`Error inserting word ${word.chinese}:`, (error as Error).message);
    }
  }

  console.log(`\n✅ Seeding complete!`);
  console.log(`  Inserted: ${inserted}`);
  console.log(`  Skipped (already exists): ${skipped}`);
  console.log(`  Total: ${inserted + skipped}/${data.length}`);

  process.exit(0);
}

seedHSK79().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
