import { drizzle } from 'drizzle-orm/mysql2';
import { words } from '../drizzle/schema.ts';
import { eq } from 'drizzle-orm';

const db = drizzle(process.env.DATABASE_URL);

async function verify() {
  try {
    // Count total Chinese words
    const allChinese = await db.select().from(words).where(eq(words.language, 'chinese'));
    console.log('Total Chinese words:', allChinese.length);

    // Count Chinese words with examples
    const withExamples = allChinese.filter(r => r.chineseExample);
    console.log('Chinese words with examples:', withExamples.length);

    // Count Chinese words with pinyin
    const withPinyin = allChinese.filter(r => r.examplePinyin);
    console.log('Chinese words with pinyin:', withPinyin.length);

    // Show a few without examples
    const withoutExamples = allChinese.filter(r => !r.chineseExample).slice(0, 5);
    console.log('\nFirst 5 Chinese words without examples:');
    withoutExamples.forEach(w => console.log('  -', w.meaning));

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

verify();
