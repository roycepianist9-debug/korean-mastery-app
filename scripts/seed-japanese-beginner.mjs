#!/usr/bin/env node
import mysql from 'mysql2/promise';
import { URL } from 'url';

const dbUrl = process.env.DATABASE_URL;
const url = new URL(dbUrl);
const config = {
  host: url.hostname,
  port: parseInt(url.port) || 3306,
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  ssl: url.searchParams.get('ssl') ? JSON.parse(url.searchParams.get('ssl')) : true,
};

// First 100 Japanese beginner words (JLPT N5)
const JAPANESE_BEGINNER = [
  { japanese: '私', hiragana: 'わたし', romaji: 'watashi', meaning: 'I' },
  { japanese: '你', hiragana: 'あなた', romaji: 'anata', meaning: 'you' },
  { japanese: '彼', hiragana: 'かれ', romaji: 'kare', meaning: 'he' },
  { japanese: '彼女', hiragana: 'かのじょ', romaji: 'kanojo', meaning: 'she' },
  { japanese: '私たち', hiragana: 'わたしたち', romaji: 'watashitachi', meaning: 'we' },
  { japanese: '誰', hiragana: 'だれ', romaji: 'dare', meaning: 'who' },
  { japanese: '何', hiragana: 'なに', romaji: 'nani', meaning: 'what' },
  { japanese: 'どこ', hiragana: 'どこ', romaji: 'doko', meaning: 'where' },
  { japanese: 'いつ', hiragana: 'いつ', romaji: 'itsu', meaning: 'when' },
  { japanese: 'なぜ', hiragana: 'なぜ', romaji: 'naze', meaning: 'why' },
  { japanese: 'どう', hiragana: 'どう', romaji: 'dou', meaning: 'how' },
  { japanese: '水', hiragana: 'みず', romaji: 'mizu', meaning: 'water' },
  { japanese: '火', hiragana: 'ひ', romaji: 'hi', meaning: 'fire' },
  { japanese: '木', hiragana: 'き', romaji: 'ki', meaning: 'tree' },
  { japanese: '金', hiragana: 'きん', romaji: 'kin', meaning: 'gold' },
  { japanese: '土', hiragana: 'つち', romaji: 'tsuchi', meaning: 'earth' },
  { japanese: '日', hiragana: 'ひ', romaji: 'hi', meaning: 'day' },
  { japanese: '月', hiragana: 'つき', romaji: 'tsuki', meaning: 'moon' },
  { japanese: '星', hiragana: 'ほし', romaji: 'hoshi', meaning: 'star' },
  { japanese: '空', hiragana: 'そら', romaji: 'sora', meaning: 'sky' },
  { japanese: '雲', hiragana: 'くも', romaji: 'kumo', meaning: 'cloud' },
  { japanese: '雨', hiragana: 'あめ', romaji: 'ame', meaning: 'rain' },
  { japanese: '雪', hiragana: 'ゆき', romaji: 'yuki', meaning: 'snow' },
  { japanese: '風', hiragana: 'かぜ', romaji: 'kaze', meaning: 'wind' },
  { japanese: '山', hiragana: 'やま', romaji: 'yama', meaning: 'mountain' },
  { japanese: '川', hiragana: 'かわ', romaji: 'kawa', meaning: 'river' },
  { japanese: '海', hiragana: 'うみ', romaji: 'umi', meaning: 'sea' },
  { japanese: '島', hiragana: 'しま', romaji: 'shima', meaning: 'island' },
  { japanese: '浜', hiragana: 'はま', romaji: 'hama', meaning: 'beach' },
  { japanese: '石', hiragana: 'いし', romaji: 'ishi', meaning: 'stone' },
  { japanese: '砂', hiragana: 'すな', romaji: 'suna', meaning: 'sand' },
  { japanese: '土', hiragana: 'つち', romaji: 'tsuchi', meaning: 'soil' },
  { japanese: '草', hiragana: 'くさ', romaji: 'kusa', meaning: 'grass' },
  { japanese: '花', hiragana: 'はな', romaji: 'hana', meaning: 'flower' },
  { japanese: '実', hiragana: 'み', romaji: 'mi', meaning: 'fruit' },
  { japanese: '根', hiragana: 'ね', romaji: 'ne', meaning: 'root' },
  { japanese: '茎', hiragana: 'くき', romaji: 'kuki', meaning: 'stem' },
  { japanese: '葉', hiragana: 'は', romaji: 'ha', meaning: 'leaf' },
  { japanese: '犬', hiragana: 'いぬ', romaji: 'inu', meaning: 'dog' },
  { japanese: '猫', hiragana: 'ねこ', romaji: 'neko', meaning: 'cat' },
  { japanese: '鳥', hiragana: 'とり', romaji: 'tori', meaning: 'bird' },
  { japanese: '魚', hiragana: 'さかな', romaji: 'sakana', meaning: 'fish' },
  { japanese: '馬', hiragana: 'うま', romaji: 'uma', meaning: 'horse' },
  { japanese: '牛', hiragana: 'うし', romaji: 'ushi', meaning: 'cow' },
  { japanese: '豚', hiragana: 'ぶた', romaji: 'buta', meaning: 'pig' },
  { japanese: '羊', hiragana: 'ひつじ', romaji: 'hitsuji', meaning: 'sheep' },
  { japanese: '鶏', hiragana: 'にわとり', romaji: 'niwatori', meaning: 'chicken' },
  { japanese: '熊', hiragana: 'くま', romaji: 'kuma', meaning: 'bear' },
  { japanese: '獅子', hiragana: 'しし', romaji: 'shishi', meaning: 'lion' },
  { japanese: '象', hiragana: 'ぞう', romaji: 'zou', meaning: 'elephant' },
  { japanese: '猿', hiragana: 'さる', romaji: 'saru', meaning: 'monkey' },
  { japanese: '蛇', hiragana: 'へび', romaji: 'hebi', meaning: 'snake' },
  { japanese: '家', hiragana: 'いえ', romaji: 'ie', meaning: 'house' },
  { japanese: '戸', hiragana: 'と', romaji: 'to', meaning: 'door' },
  { japanese: '窓', hiragana: 'まど', romaji: 'mado', meaning: 'window' },
  { japanese: '床', hiragana: 'ゆか', romaji: 'yuka', meaning: 'floor' },
  { japanese: '天井', hiragana: 'てんじょう', romaji: 'tenjou', meaning: 'ceiling' },
  { japanese: '壁', hiragana: 'かべ', romaji: 'kabe', meaning: 'wall' },
  { japanese: '机', hiragana: 'つくえ', romaji: 'tsukue', meaning: 'desk' },
  { japanese: '椅子', hiragana: 'いす', romaji: 'isu', meaning: 'chair' },
  { japanese: 'ベッド', hiragana: 'べっど', romaji: 'beddo', meaning: 'bed' },
  { japanese: '本', hiragana: 'ほん', romaji: 'hon', meaning: 'book' },
  { japanese: 'ペン', hiragana: 'ぺん', romaji: 'pen', meaning: 'pen' },
  { japanese: '紙', hiragana: 'かみ', romaji: 'kami', meaning: 'paper' },
  { japanese: '鉛筆', hiragana: 'えんぴつ', romaji: 'enpitsu', meaning: 'pencil' },
  { japanese: '消しゴム', hiragana: 'けしごむ', romaji: 'keshigomu', meaning: 'eraser' },
  { japanese: '車', hiragana: 'くるま', romaji: 'kuruma', meaning: 'car' },
  { japanese: 'バス', hiragana: 'ばす', romaji: 'basu', meaning: 'bus' },
  { japanese: '電車', hiragana: 'でんしゃ', romaji: 'densha', meaning: 'train' },
  { japanese: '飛行機', hiragana: 'ひこうき', romaji: 'hikouki', meaning: 'airplane' },
  { japanese: '船', hiragana: 'ふね', romaji: 'fune', meaning: 'ship' },
  { japanese: '自転車', hiragana: 'じてんしゃ', romaji: 'jitensha', meaning: 'bicycle' },
  { japanese: '赤', hiragana: 'あか', romaji: 'aka', meaning: 'red' },
  { japanese: '青', hiragana: 'あお', romaji: 'ao', meaning: 'blue' },
  { japanese: '緑', hiragana: 'みどり', romaji: 'midori', meaning: 'green' },
  { japanese: '黄色', hiragana: 'きいろ', romaji: 'kiiro', meaning: 'yellow' },
  { japanese: '黒', hiragana: 'くろ', romaji: 'kuro', meaning: 'black' },
  { japanese: '白', hiragana: 'しろ', romaji: 'shiro', meaning: 'white' },
  { japanese: '大きい', hiragana: 'おおきい', romaji: 'ookii', meaning: 'big' },
  { japanese: '小さい', hiragana: 'ちいさい', romaji: 'chiisai', meaning: 'small' },
  { japanese: '熱い', hiragana: 'あつい', romaji: 'atsui', meaning: 'hot' },
  { japanese: '冷たい', hiragana: 'つめたい', romaji: 'tsumetai', meaning: 'cold' },
  { japanese: '速い', hiragana: 'はやい', romaji: 'hayai', meaning: 'fast' },
  { japanese: '遅い', hiragana: 'おそい', romaji: 'osoi', meaning: 'slow' },
  { japanese: '新しい', hiragana: 'あたらしい', romaji: 'atarashii', meaning: 'new' },
  { japanese: '古い', hiragana: 'ふるい', romaji: 'furui', meaning: 'old' },
  { japanese: '良い', hiragana: 'よい', romaji: 'yoi', meaning: 'good' },
  { japanese: '悪い', hiragana: 'わるい', romaji: 'warui', meaning: 'bad' },
  { japanese: '高い', hiragana: 'たかい', romaji: 'takai', meaning: 'high' },
  { japanese: '低い', hiragana: 'ひくい', romaji: 'hikui', meaning: 'low' },
  { japanese: '長い', hiragana: 'ながい', romaji: 'nagai', meaning: 'long' },
  { japanese: '短い', hiragana: 'みじかい', romaji: 'mijikai', meaning: 'short' },
  { japanese: '太い', hiragana: 'ふとい', romaji: 'futoi', meaning: 'thick' },
  { japanese: '細い', hiragana: 'ほそい', romaji: 'hosoi', meaning: 'thin' },
];

async function seedJapanese() {
  let connection;
  try {
    connection = await mysql.createConnection(config);
    console.log('✅ Connected to database\n');
    
    console.log(`🌱 Seeding ${JAPANESE_BEGINNER.length} Japanese beginner words...`);
    
    let inserted = 0;
    let skipped = 0;
    
    for (const word of JAPANESE_BEGINNER) {
      try {
        // Check if word already exists
        const [existing] = await connection.execute(
          'SELECT id FROM words WHERE japanese = ? AND language = ?',
          [word.japanese, 'japanese']
        );
        
        if (existing.length > 0) {
          skipped++;
          continue;
        }
        
        // Insert new word with correct columns
        await connection.execute(
          'INSERT INTO words (japanese, hiragana, romaji, meaning, jlptLevel, language, pos) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [word.japanese, word.hiragana, word.romaji, word.meaning, 'n5', 'japanese', 'noun']
        );
        inserted++;
        
        if (inserted % 20 === 0) {
          console.log(`   ✓ Inserted ${inserted} words...`);
        }
      } catch (err) {
        console.error(`❌ Error with word ${word.japanese}:`, err.message);
      }
    }
    
    console.log(`\n✅ Seeding complete!`);
    console.log(`   ✓ Inserted: ${inserted} words`);
    console.log(`   ⊘ Skipped (already exist): ${skipped} words`);
    
    // Show new total
    const [[{ total }]] = await connection.execute('SELECT COUNT(*) as total FROM words');
    const [[{ japanese }]] = await connection.execute('SELECT COUNT(*) as japanese FROM words WHERE language = "japanese"');
    console.log(`   📊 Total words now: ${total}`);
    console.log(`   📊 Total Japanese words: ${japanese}`);
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

seedJapanese();
