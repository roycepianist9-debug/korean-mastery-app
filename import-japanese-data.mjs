import { drizzle } from 'drizzle-orm/mysql2';
import { words } from './drizzle/schema.ts';

// JLPT N5-N3 Curated Word List (50 sample words for testing)
const JLPT_WORDS = [
  // N5 (Beginner) - Most common 20 words
  { japanese: '水', hiragana: 'みず', romaji: 'mizu', meaning: 'water', jlptLevel: 'n5', pos: 'noun' },
  { japanese: '火', hiragana: 'ひ', romaji: 'hi', meaning: 'fire', jlptLevel: 'n5', pos: 'noun' },
  { japanese: '木', hiragana: 'き', romaji: 'ki', meaning: 'tree', jlptLevel: 'n5', pos: 'noun' },
  { japanese: '金', hiragana: 'かね', romaji: 'kane', meaning: 'money', jlptLevel: 'n5', pos: 'noun' },
  { japanese: '土', hiragana: 'つち', romaji: 'tsuchi', meaning: 'earth', jlptLevel: 'n5', pos: 'noun' },
  { japanese: '日', hiragana: 'ひ', romaji: 'hi', meaning: 'day', jlptLevel: 'n5', pos: 'noun' },
  { japanese: '月', hiragana: 'つき', romaji: 'tsuki', meaning: 'moon', jlptLevel: 'n5', pos: 'noun' },
  { japanese: '年', hiragana: 'ねん', romaji: 'nen', meaning: 'year', jlptLevel: 'n5', pos: 'noun' },
  { japanese: '時', hiragana: 'とき', romaji: 'toki', meaning: 'time', jlptLevel: 'n5', pos: 'noun' },
  { japanese: '人', hiragana: 'ひと', romaji: 'hito', meaning: 'person', jlptLevel: 'n5', pos: 'noun' },
  { japanese: '子', hiragana: 'こ', romaji: 'ko', meaning: 'child', jlptLevel: 'n5', pos: 'noun' },
  { japanese: '女', hiragana: 'おんな', romaji: 'onna', meaning: 'woman', jlptLevel: 'n5', pos: 'noun' },
  { japanese: '男', hiragana: 'おとこ', romaji: 'otoko', meaning: 'man', jlptLevel: 'n5', pos: 'noun' },
  { japanese: '家', hiragana: 'いえ', romaji: 'ie', meaning: 'house', jlptLevel: 'n5', pos: 'noun' },
  { japanese: '学校', hiragana: 'がっこう', romaji: 'gakkō', meaning: 'school', jlptLevel: 'n5', pos: 'noun' },
  { japanese: '先生', hiragana: 'せんせい', romaji: 'sensei', meaning: 'teacher', jlptLevel: 'n5', pos: 'noun' },
  { japanese: '友達', hiragana: 'ともだち', romaji: 'tomodachi', meaning: 'friend', jlptLevel: 'n5', pos: 'noun' },
  { japanese: '食べ物', hiragana: 'たべもの', romaji: 'tabemono', meaning: 'food', jlptLevel: 'n5', pos: 'noun' },
  { japanese: '飲む', hiragana: 'のむ', romaji: 'nomu', meaning: 'to drink', jlptLevel: 'n5', pos: 'verb' },
  { japanese: '食べる', hiragana: 'たべる', romaji: 'taberu', meaning: 'to eat', jlptLevel: 'n5', pos: 'verb' },
  
  // N4 (Elementary) - 20 words
  { japanese: '勉強', hiragana: 'べんきょう', romaji: 'benkyō', meaning: 'study', jlptLevel: 'n4', pos: 'noun' },
  { japanese: '仕事', hiragana: 'しごと', romaji: 'shigoto', meaning: 'work', jlptLevel: 'n4', pos: 'noun' },
  { japanese: '会社', hiragana: 'かいしゃ', romaji: 'kaisha', meaning: 'company', jlptLevel: 'n4', pos: 'noun' },
  { japanese: '病院', hiragana: 'びょういん', romaji: 'byōin', meaning: 'hospital', jlptLevel: 'n4', pos: 'noun' },
  { japanese: '駅', hiragana: 'えき', romaji: 'eki', meaning: 'station', jlptLevel: 'n4', pos: 'noun' },
  { japanese: '電車', hiragana: 'でんしゃ', romaji: 'densha', meaning: 'train', jlptLevel: 'n4', pos: 'noun' },
  { japanese: '車', hiragana: 'くるま', romaji: 'kuruma', meaning: 'car', jlptLevel: 'n4', pos: 'noun' },
  { japanese: '道', hiragana: 'みち', romaji: 'michi', meaning: 'road', jlptLevel: 'n4', pos: 'noun' },
  { japanese: '天気', hiragana: 'てんき', romaji: 'tenki', meaning: 'weather', jlptLevel: 'n4', pos: 'noun' },
  { japanese: '雨', hiragana: 'あめ', romaji: 'ame', meaning: 'rain', jlptLevel: 'n4', pos: 'noun' },
  { japanese: '雪', hiragana: 'ゆき', romaji: 'yuki', meaning: 'snow', jlptLevel: 'n4', pos: 'noun' },
  { japanese: '風', hiragana: 'かぜ', romaji: 'kaze', meaning: 'wind', jlptLevel: 'n4', pos: 'noun' },
  { japanese: '山', hiragana: 'やま', romaji: 'yama', meaning: 'mountain', jlptLevel: 'n4', pos: 'noun' },
  { japanese: '川', hiragana: 'かわ', romaji: 'kawa', meaning: 'river', jlptLevel: 'n4', pos: 'noun' },
  { japanese: '海', hiragana: 'うみ', romaji: 'umi', meaning: 'sea', jlptLevel: 'n4', pos: 'noun' },
  { japanese: '公園', hiragana: 'こうえん', romaji: 'kōen', meaning: 'park', jlptLevel: 'n4', pos: 'noun' },
  { japanese: '図書館', hiragana: 'としょかん', romaji: 'toshokan', meaning: 'library', jlptLevel: 'n4', pos: 'noun' },
  { japanese: '映画', hiragana: 'えいが', romaji: 'eiga', meaning: 'movie', jlptLevel: 'n4', pos: 'noun' },
  { japanese: '音楽', hiragana: 'おんがく', romaji: 'ongaku', meaning: 'music', jlptLevel: 'n4', pos: 'noun' },
  { japanese: '本', hiragana: 'ほん', romaji: 'hon', meaning: 'book', jlptLevel: 'n4', pos: 'noun' },
  
  // N3 (Intermediate) - 10 words
  { japanese: '文化', hiragana: 'ぶんか', romaji: 'bunka', meaning: 'culture', jlptLevel: 'n3', pos: 'noun' },
  { japanese: '経験', hiragana: 'けいけん', romaji: 'keiken', meaning: 'experience', jlptLevel: 'n3', pos: 'noun' },
  { japanese: '技術', hiragana: 'ぎじゅつ', romaji: 'gijutsu', meaning: 'technology', jlptLevel: 'n3', pos: 'noun' },
  { japanese: '社会', hiragana: 'しゃかい', romaji: 'shakai', meaning: 'society', jlptLevel: 'n3', pos: 'noun' },
  { japanese: '政治', hiragana: 'せいじ', romaji: 'seiji', meaning: 'politics', jlptLevel: 'n3', pos: 'noun' },
  { japanese: '経済', hiragana: 'けいざい', romaji: 'keizai', meaning: 'economy', jlptLevel: 'n3', pos: 'noun' },
  { japanese: '教育', hiragana: 'きょういく', romaji: 'kyōiku', meaning: 'education', jlptLevel: 'n3', pos: 'noun' },
  { japanese: '健康', hiragana: 'けんこう', romaji: 'kenkō', meaning: 'health', jlptLevel: 'n3', pos: 'noun' },
  { japanese: '安全', hiragana: 'あんぜん', romaji: 'anzen', meaning: 'safety', jlptLevel: 'n3', pos: 'noun' },
  { japanese: '環境', hiragana: 'かんきょう', romaji: 'kankyō', meaning: 'environment', jlptLevel: 'n3', pos: 'noun' },
];

// Tatoeba Example Sentences (15 cleaned Japanese-English pairs)
const TATOEBA_SENTENCES = [
  { japanese: '水を飲みます。', exampleEnglish: 'I drink water.', exampleJapaneseFrench: 'Je bois de l\'eau.' },
  { japanese: '火をつけます。', exampleEnglish: 'I light a fire.', exampleJapaneseFrench: 'J\'allume un feu.' },
  { japanese: '木の下に座ります。', exampleEnglish: 'I sit under a tree.', exampleJapaneseFrench: 'Je m\'assieds sous un arbre.' },
  { japanese: 'お金を数えます。', exampleEnglish: 'I count the money.', exampleJapaneseFrench: 'Je compte l\'argent.' },
  { japanese: '土を掘ります。', exampleEnglish: 'I dig the earth.', exampleJapaneseFrench: 'Je creuse la terre.' },
  { japanese: '毎日学校に行きます。', exampleEnglish: 'I go to school every day.', exampleJapaneseFrench: 'Je vais à l\'école tous les jours.' },
  { japanese: '先生は親切です。', exampleEnglish: 'The teacher is kind.', exampleJapaneseFrench: 'Le professeur est gentil.' },
  { japanese: '友達と遊びます。', exampleEnglish: 'I play with my friend.', exampleJapaneseFrench: 'Je joue avec mon ami.' },
  { japanese: 'これは美しい家です。', exampleEnglish: 'This is a beautiful house.', exampleJapaneseFrench: 'C\'est une belle maison.' },
  { japanese: '仕事は大変です。', exampleEnglish: 'Work is difficult.', exampleJapaneseFrench: 'Le travail est difficile.' },
  { japanese: '会社で働きます。', exampleEnglish: 'I work at a company.', exampleJapaneseFrench: 'Je travaille dans une entreprise.' },
  { japanese: '病院に行きました。', exampleEnglish: 'I went to the hospital.', exampleJapaneseFrench: 'Je suis allé à l\'hôpital.' },
  { japanese: '駅はどこですか。', exampleEnglish: 'Where is the station?', exampleJapaneseFrench: 'Où est la gare?' },
  { japanese: '電車に乗ります。', exampleEnglish: 'I take the train.', exampleJapaneseFrench: 'Je prends le train.' },
  { japanese: '車を運転します。', exampleEnglish: 'I drive a car.', exampleJapaneseFrench: 'Je conduis une voiture.' },
];

async function importJapaneseWords() {
  try {
    console.log('🚀 Starting Japanese word import...');
    console.log(`📊 Total words to import: ${JLPT_WORDS.length}`);
    console.log(`📚 Total sentences available: ${TATOEBA_SENTENCES.length}`);
    
    const db = drizzle(process.env.DATABASE_URL);
    
    // Prepare words with linked sentences
    const wordsToInsert = JLPT_WORDS.map((word, index) => {
      const linkedSentence = TATOEBA_SENTENCES[index % TATOEBA_SENTENCES.length];
      
      return {
        language: 'japanese',
        japanese: word.japanese,
        hiragana: word.hiragana,
        romaji: word.romaji,
        meaning: word.meaning,
        meaningFr: word.meaning, // Placeholder - can be translated later
        jlptLevel: word.jlptLevel,
        pos: word.pos,
        japaneseExample: linkedSentence.japanese,
        exampleRomaji: '', // Can be generated from hiragana
        exampleEnglish: linkedSentence.exampleEnglish,
        exampleJapaneseFrench: linkedSentence.exampleJapaneseFrench,
        examplePinyin: '', // Not applicable for Japanese
        exampleChinese: '', // Not applicable for Japanese
        exampleKorean: '', // Not applicable for Japanese
        exampleKoreanRomaja: '', // Not applicable for Japanese
        audio: '', // Can be added later
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });
    
    // Batch insert with payload limit protection
    const BATCH_SIZE = 50;
    let inserted = 0;
    
    for (let i = 0; i < wordsToInsert.length; i += BATCH_SIZE) {
      const batch = wordsToInsert.slice(i, i + BATCH_SIZE);
      
      try {
        await db.insert(words).values(batch);
        inserted += batch.length;
        console.log(`✅ Inserted batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} words (Total: ${inserted})`);
      } catch (error) {
        console.error(`❌ Batch ${Math.floor(i / BATCH_SIZE) + 1} failed:`, error.message);
      }
    }
    
    console.log(`\n✨ Import complete! ${inserted} Japanese words imported.`);
    console.log(`📈 JLPT Breakdown:`);
    console.log(`   - N5: ${JLPT_WORDS.filter(w => w.jlptLevel === 'n5').length} words`);
    console.log(`   - N4: ${JLPT_WORDS.filter(w => w.jlptLevel === 'n4').length} words`);
    console.log(`   - N3: ${JLPT_WORDS.filter(w => w.jlptLevel === 'n3').length} words`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
}

importJapaneseWords();
