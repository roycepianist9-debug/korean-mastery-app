import { getDb } from '../server/db.ts';
import { words } from '../drizzle/schema.ts';
import { eq } from 'drizzle-orm';

async function inspectData() {
  const db = await getDb();
  if (!db) {
    console.error('❌ DB connection failed');
    process.exit(1);
  }

  // Get a sample Korean word
  const [koreanWord] = await db
    .select()
    .from(words)
    .where(eq(words.language, 'korean'))
    .limit(1);

  console.log('\n📋 Sample Korean Word:');
  console.log(JSON.stringify(koreanWord, null, 2));

  // Get a sample Chinese word
  const [chineseWord] = await db
    .select()
    .from(words)
    .where(eq(words.language, 'chinese'))
    .limit(1);

  console.log('\n📋 Sample Chinese Word:');
  console.log(JSON.stringify(chineseWord, null, 2));

  // Check translation field values
  console.log('\n📊 Translation Field Statistics:');
  const [stats] = await db.execute(`
    SELECT 
      language,
      COUNT(*) as total,
      SUM(CASE WHEN exampleEnglish IS NOT NULL AND exampleEnglish != '' THEN 1 ELSE 0 END) as with_english,
      SUM(CASE WHEN exampleFrench IS NOT NULL AND exampleFrench != '' THEN 1 ELSE 0 END) as with_french,
      SUM(CASE WHEN exampleChineseFrench IS NOT NULL AND exampleChineseFrench != '' THEN 1 ELSE 0 END) as with_chinese_french
    FROM words
    GROUP BY language
  `);
  console.log(JSON.stringify(stats, null, 2));
}

inspectData().catch(console.error);
