import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { words } from './drizzle/schema.ts';

// HSK Level 1-3 vocabulary with pre-matched example sentences
// Format: { chinese, pinyin, pos, meaning, hskLevel, chineseExample, examplePinyin }
const chineseVocabulary = [
  // HSK Level 1 (300 words) - sample with matched examples
  { chinese: '爱', pinyin: 'ài', pos: 'verb', meaning: 'to love', hskLevel: '1', chineseExample: '我爱你。', examplePinyin: 'Wǒ ài nǐ.' },
  { chinese: '八', pinyin: 'bā', pos: 'number', meaning: 'eight', hskLevel: '1', chineseExample: '我有八个苹果。', examplePinyin: 'Wǒ yǒu bā ge píngguǒ.' },
  { chinese: '爸爸', pinyin: 'bàba', pos: 'noun', meaning: 'dad', hskLevel: '1', chineseExample: '我的爸爸很高。', examplePinyin: 'Wǒ de bàba hěn gāo.' },
  { chinese: '白天', pinyin: 'báitiān', pos: 'noun', meaning: 'daytime', hskLevel: '1', chineseExample: '白天很热。', examplePinyin: 'Báitiān hěn rè.' },
  { chinese: '百', pinyin: 'bǎi', pos: 'number', meaning: 'hundred', hskLevel: '1', chineseExample: '这件衣服一百块钱。', examplePinyin: 'Zhè jiàn yīfu yībǎi kuài qián.' },
  { chinese: '半', pinyin: 'bàn', pos: 'number', meaning: 'half', hskLevel: '1', chineseExample: '现在是两点半。', examplePinyin: 'Xiànzài shì liǎng diǎn bàn.' },
  { chinese: '包子', pinyin: 'bāozi', pos: 'noun', meaning: 'steamed bun', hskLevel: '1', chineseExample: '我喜欢吃包子。', examplePinyin: 'Wǒ xǐhuān chī bāozi.' },
  { chinese: '杯子', pinyin: 'bēizi', pos: 'noun', meaning: 'cup', hskLevel: '1', chineseExample: '请给我一个杯子。', examplePinyin: 'Qǐng gěi wǒ yī ge bēizi.' },
  { chinese: '本', pinyin: 'běn', pos: 'classifier', meaning: 'measure word for books', hskLevel: '1', chineseExample: '我有三本书。', examplePinyin: 'Wǒ yǒu sān běn shū.' },
  { chinese: '边', pinyin: 'biān', pos: 'noun', meaning: 'side', hskLevel: '1', chineseExample: '房子在街的左边。', examplePinyin: 'Fángzi zài jiē de zuǒ biān.' },
  { chinese: '病', pinyin: 'bìng', pos: 'noun', meaning: 'illness', hskLevel: '1', chineseExample: '他生病了。', examplePinyin: 'Tā shēngbìng le.' },
  { chinese: '不', pinyin: 'bù', pos: 'adverb', meaning: 'not', hskLevel: '1', chineseExample: '我不喜欢这个。', examplePinyin: 'Wǒ búxǐhuān zhège.' },
  { chinese: '菜', pinyin: 'cài', pos: 'noun', meaning: 'vegetable', hskLevel: '1', chineseExample: '这个菜很好吃。', examplePinyin: 'Zhège cài hěn hǎochī.' },
  { chinese: '茶', pinyin: 'chá', pos: 'noun', meaning: 'tea', hskLevel: '1', chineseExample: '我想喝茶。', examplePinyin: 'Wǒ xiǎng hē chá.' },
  { chinese: '唱', pinyin: 'chàng', pos: 'verb', meaning: 'to sing', hskLevel: '1', chineseExample: '她喜欢唱歌。', examplePinyin: 'Tā xǐhuān chànggē.' },
  { chinese: '车', pinyin: 'chē', pos: 'noun', meaning: 'car', hskLevel: '1', chineseExample: '我的车是红色的。', examplePinyin: 'Wǒ de chē shì hóngsè de.' },
  { chinese: '吃', pinyin: 'chī', pos: 'verb', meaning: 'to eat', hskLevel: '1', chineseExample: '我们一起吃饭。', examplePinyin: 'Wǒmen yīqǐ chīfàn.' },
  { chinese: '穿', pinyin: 'chuān', pos: 'verb', meaning: 'to wear', hskLevel: '1', chineseExample: '今天穿什么衣服？', examplePinyin: 'Jīntiān chuān shénme yīfu?' },
  { chinese: '大', pinyin: 'dà', pos: 'adjective', meaning: 'big', hskLevel: '1', chineseExample: '这个房间很大。', examplePinyin: 'Zhège fángjiān hěn dà.' },
  { chinese: '大家', pinyin: 'dàjiā', pos: 'pronoun', meaning: 'everyone', hskLevel: '1', chineseExample: '大家好！', examplePinyin: 'Dàjiā hǎo!' },
];

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
      await db.insert(words).values({
        language: 'chinese',
        chinese: word.chinese,
        pinyin: word.pinyin,
        pos: word.pos,
        meaning: word.meaning,
        hskLevel: word.hskLevel,
        chineseExample: word.chineseExample,
        examplePinyin: word.examplePinyin,
      });

      count++;
      console.log(`✓ Seeded ${count}/${chineseVocabulary.length}: ${word.chinese} (${word.meaning})`);
    } catch (error) {
      console.error(`✗ Failed to seed ${word.chinese}:`, error.message);
    }
  }

  console.log(`\nSeeding complete! Added ${count} Chinese words.`);
  await connection.end();
}

seedChinese().catch(console.error);
