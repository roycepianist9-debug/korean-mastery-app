import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { words } from './drizzle/schema.ts';
import { invokeLLM } from './server/_core/llm.ts';

// HSK Level 1-3 vocabulary from Mandarin Bean (simplified list)
const chineseVocabulary = [
  // HSK Level 1 (300 words) - sample
  { chinese: '爱', pinyin: 'ài', pos: 'verb', meaning: 'to love', hskLevel: '1' },
  { chinese: '八', pinyin: 'bā', pos: 'number', meaning: 'eight', hskLevel: '1' },
  { chinese: '爸爸', pinyin: 'bàba', pos: 'noun', meaning: 'dad', hskLevel: '1' },
  { chinese: '白天', pinyin: 'báitiān', pos: 'noun', meaning: 'daytime', hskLevel: '1' },
  { chinese: '百', pinyin: 'bǎi', pos: 'number', meaning: 'hundred', hskLevel: '1' },
  { chinese: '半', pinyin: 'bàn', pos: 'number', meaning: 'half', hskLevel: '1' },
  { chinese: '包子', pinyin: 'bāozi', pos: 'noun', meaning: 'steamed bun', hskLevel: '1' },
  { chinese: '杯子', pinyin: 'bēizi', pos: 'noun', meaning: 'cup', hskLevel: '1' },
  { chinese: '本', pinyin: 'běn', pos: 'classifier', meaning: 'measure word for books', hskLevel: '1' },
  { chinese: '边', pinyin: 'biān', pos: 'noun', meaning: 'side', hskLevel: '1' },
  { chinese: '病', pinyin: 'bìng', pos: 'noun', meaning: 'illness', hskLevel: '1' },
  { chinese: '不', pinyin: 'bù', pos: 'adverb', meaning: 'not', hskLevel: '1' },
  { chinese: '菜', pinyin: 'cài', pos: 'noun', meaning: 'vegetable', hskLevel: '1' },
  { chinese: '茶', pinyin: 'chá', pos: 'noun', meaning: 'tea', hskLevel: '1' },
  { chinese: '唱', pinyin: 'chàng', pos: 'verb', meaning: 'to sing', hskLevel: '1' },
  { chinese: '车', pinyin: 'chē', pos: 'noun', meaning: 'car', hskLevel: '1' },
  { chinese: '吃', pinyin: 'chī', pos: 'verb', meaning: 'to eat', hskLevel: '1' },
  { chinese: '穿', pinyin: 'chuān', pos: 'verb', meaning: 'to wear', hskLevel: '1' },
  { chinese: '大', pinyin: 'dà', pos: 'adjective', meaning: 'big', hskLevel: '1' },
  { chinese: '大家', pinyin: 'dàjiā', pos: 'pronoun', meaning: 'everyone', hskLevel: '1' },
];

async function generateChineseExample(chinese, meaning, pos) {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: 'You are a Chinese language teacher. Generate a simple, natural Chinese example sentence using the given word. Return ONLY the sentence in Chinese, no pinyin or translation.',
        },
        {
          role: 'user',
          content: `Generate a simple example sentence using the word "${chinese}" (meaning: ${meaning}, POS: ${pos}). The sentence should be appropriate for HSK Level 1-3 learners.`,
        },
      ],
    });

    const sentence = response.choices[0].message.content.trim();
    
    // Generate pinyin for the example
    const pinyinResponse = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: 'You are a Chinese language expert. Convert the given Chinese sentence to pinyin with tone marks. Return ONLY the pinyin, no Chinese characters.',
        },
        {
          role: 'user',
          content: `Convert this Chinese sentence to pinyin: ${sentence}`,
        },
      ],
    });

    const examplePinyin = pinyinResponse.choices[0].message.content.trim();
    return { chineseExample: sentence, examplePinyin };
  } catch (error) {
    console.error(`Error generating example for ${chinese}:`, error);
    return { chineseExample: '', examplePinyin: '' };
  }
}

async function seedChinese() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'korean_mastery',
  });

  const db = drizzle(connection);

  console.log(`Seeding ${chineseVocabulary.length} Chinese words...`);
  let count = 0;

  for (const word of chineseVocabulary) {
    try {
      // Generate example sentence and pinyin
      const { chineseExample, examplePinyin } = await generateChineseExample(
        word.chinese,
        word.meaning,
        word.pos
      );

      // Insert into database
      await db.insert(words).values({
        language: 'chinese',
        chinese: word.chinese,
        pinyin: word.pinyin,
        pos: word.pos,
        meaning: word.meaning,
        hskLevel: word.hskLevel,
        chineseExample,
        examplePinyin,
      });

      count++;
      console.log(`✓ Seeded ${count}/${chineseVocabulary.length}: ${word.chinese}`);

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`✗ Failed to seed ${word.chinese}:`, error.message);
    }
  }

  console.log(`\nSeeding complete! Added ${count} Chinese words.`);
  await connection.end();
}

seedChinese().catch(console.error);
