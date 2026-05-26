import { pinyin } from 'pinyin-pro';
import { drizzle } from 'drizzle-orm/mysql2';
import { words } from '../drizzle/schema.ts';
import { eq, and, isNotNull, ne } from 'drizzle-orm';

const db = drizzle(process.env.DATABASE_URL);

async function generatePinyinForAllChinese() {
  try {
    // Get all Chinese words with examples
    const rows = await db
      .select()
      .from(words)
      .where(
        and(
          eq(words.language, 'chinese'),
          isNotNull(words.chineseExample),
          ne(words.chineseExample, '')
        )
      );

    console.log(`Found ${rows.length} Chinese words with examples`);

    let updated = 0;
    for (let i = 0; i < rows.length; i++) {
      const word = rows[i];
      
      // Generate pinyin with tone marks
      const pinyinText = pinyin(word.chineseExample, {
        type: 'tone',
        toneType: 'symbol',
      });

      // Update database
      await db
        .update(words)
        .set({ examplePinyin: pinyinText })
        .where(eq(words.id, word.id));

      updated++;
      if (updated % 5 === 0) {
        console.log(`  Updated ${updated}/${rows.length}...`);
      }
    }

    console.log(`✅ Successfully generated pinyin for ${updated} Chinese examples`);

    // Show sample results
    const samples = await db
      .select({ chineseExample: words.chineseExample, examplePinyin: words.examplePinyin })
      .from(words)
      .where(and(eq(words.language, 'chinese'), isNotNull(words.examplePinyin)))
      .limit(3);

    console.log('\nSample results:');
    samples.forEach(({ chineseExample, examplePinyin }) => {
      console.log(`  Chinese: ${chineseExample}`);
      console.log(`  Pinyin:  ${examplePinyin}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

generatePinyinForAllChinese();
