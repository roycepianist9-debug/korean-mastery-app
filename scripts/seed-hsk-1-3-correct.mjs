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

// HSK 1-3 Chinese words with correct column names
const HSK_WORDS = [
  // HSK 1
  { chinese: '爱', pinyin: 'ài', meaning: 'love', hskLevel: '1', language: 'chinese' },
  { chinese: '八', pinyin: 'bā', meaning: 'eight', hskLevel: '1', language: 'chinese' },
  { chinese: '白', pinyin: 'bái', meaning: 'white', hskLevel: '1', language: 'chinese' },
  { chinese: '班', pinyin: 'bān', meaning: 'class', hskLevel: '1', language: 'chinese' },
  { chinese: '半', pinyin: 'bàn', meaning: 'half', hskLevel: '1', language: 'chinese' },
  { chinese: '北', pinyin: 'běi', meaning: 'north', hskLevel: '1', language: 'chinese' },
  { chinese: '被', pinyin: 'bèi', meaning: 'by (passive voice)', hskLevel: '1', language: 'chinese' },
  { chinese: '本', pinyin: 'běn', meaning: 'this', hskLevel: '1', language: 'chinese' },
  { chinese: '比', pinyin: 'bǐ', meaning: 'compare', hskLevel: '1', language: 'chinese' },
  { chinese: '别', pinyin: 'bié', meaning: 'other', hskLevel: '1', language: 'chinese' },
  { chinese: '病', pinyin: 'bìng', meaning: 'illness', hskLevel: '1', language: 'chinese' },
  { chinese: '不', pinyin: 'bù', meaning: 'not', hskLevel: '1', language: 'chinese' },
  { chinese: '布', pinyin: 'bù', meaning: 'cloth', hskLevel: '1', language: 'chinese' },
  { chinese: '部', pinyin: 'bù', meaning: 'part', hskLevel: '1', language: 'chinese' },
  { chinese: '才', pinyin: 'cái', meaning: 'talent', hskLevel: '1', language: 'chinese' },
  { chinese: '菜', pinyin: 'cài', meaning: 'vegetable', hskLevel: '1', language: 'chinese' },
  { chinese: '茶', pinyin: 'chá', meaning: 'tea', hskLevel: '1', language: 'chinese' },
  { chinese: '长', pinyin: 'cháng', meaning: 'long', hskLevel: '1', language: 'chinese' },
  { chinese: '常', pinyin: 'cháng', meaning: 'often', hskLevel: '1', language: 'chinese' },
  { chinese: '车', pinyin: 'chē', meaning: 'car', hskLevel: '1', language: 'chinese' },
  { chinese: '成', pinyin: 'chéng', meaning: 'become', hskLevel: '1', language: 'chinese' },
  { chinese: '吃', pinyin: 'chī', meaning: 'eat', hskLevel: '1', language: 'chinese' },
  { chinese: '出', pinyin: 'chū', meaning: 'go out', hskLevel: '1', language: 'chinese' },
  { chinese: '初', pinyin: 'chū', meaning: 'beginning', hskLevel: '1', language: 'chinese' },
  { chinese: '除', pinyin: 'chú', meaning: 'remove', hskLevel: '1', language: 'chinese' },
  { chinese: '处', pinyin: 'chù', meaning: 'place', hskLevel: '1', language: 'chinese' },
  { chinese: '春', pinyin: 'chūn', meaning: 'spring', hskLevel: '1', language: 'chinese' },
  { chinese: '次', pinyin: 'cì', meaning: 'time (occurrence)', hskLevel: '1', language: 'chinese' },
  { chinese: '错', pinyin: 'cuò', meaning: 'wrong', hskLevel: '1', language: 'chinese' },
  { chinese: '打', pinyin: 'dǎ', meaning: 'hit', hskLevel: '1', language: 'chinese' },
  { chinese: '大', pinyin: 'dà', meaning: 'big', hskLevel: '1', language: 'chinese' },
  { chinese: '代', pinyin: 'dài', meaning: 'generation', hskLevel: '1', language: 'chinese' },
  { chinese: '带', pinyin: 'dài', meaning: 'bring', hskLevel: '1', language: 'chinese' },
  { chinese: '待', pinyin: 'dài', meaning: 'wait', hskLevel: '1', language: 'chinese' },
  { chinese: '单', pinyin: 'dān', meaning: 'single', hskLevel: '1', language: 'chinese' },
  { chinese: '当', pinyin: 'dāng', meaning: 'when', hskLevel: '1', language: 'chinese' },
  { chinese: '到', pinyin: 'dào', meaning: 'arrive', hskLevel: '1', language: 'chinese' },
  { chinese: '道', pinyin: 'dào', meaning: 'way', hskLevel: '1', language: 'chinese' },
  { chinese: '的', pinyin: 'de', meaning: 'particle', hskLevel: '1', language: 'chinese' },
  { chinese: '得', pinyin: 'dé', meaning: 'get', hskLevel: '1', language: 'chinese' },
  { chinese: '地', pinyin: 'dì', meaning: 'ground', hskLevel: '1', language: 'chinese' },
  { chinese: '第', pinyin: 'dì', meaning: 'ordinal number', hskLevel: '1', language: 'chinese' },
  { chinese: '弟', pinyin: 'dì', meaning: 'younger brother', hskLevel: '1', language: 'chinese' },
  { chinese: '点', pinyin: 'diǎn', meaning: 'o\'clock', hskLevel: '1', language: 'chinese' },
  { chinese: '电', pinyin: 'diàn', meaning: 'electricity', hskLevel: '1', language: 'chinese' },
  { chinese: '店', pinyin: 'diàn', meaning: 'shop', hskLevel: '1', language: 'chinese' },
  { chinese: '掉', pinyin: 'diào', meaning: 'fall', hskLevel: '1', language: 'chinese' },
  { chinese: '丁', pinyin: 'dīng', meaning: 'ding', hskLevel: '1', language: 'chinese' },
  { chinese: '定', pinyin: 'dìng', meaning: 'fix', hskLevel: '1', language: 'chinese' },
  { chinese: '动', pinyin: 'dòng', meaning: 'move', hskLevel: '1', language: 'chinese' },
  { chinese: '都', pinyin: 'dōu', meaning: 'all', hskLevel: '1', language: 'chinese' },
  { chinese: '读', pinyin: 'dú', meaning: 'read', hskLevel: '1', language: 'chinese' },
  { chinese: '度', pinyin: 'dù', meaning: 'degree', hskLevel: '1', language: 'chinese' },
  { chinese: '对', pinyin: 'duì', meaning: 'correct', hskLevel: '1', language: 'chinese' },
  { chinese: '多', pinyin: 'duō', meaning: 'many', hskLevel: '1', language: 'chinese' },
  { chinese: '朵', pinyin: 'duǒ', meaning: 'measure word', hskLevel: '1', language: 'chinese' },
  { chinese: '儿', pinyin: 'ér', meaning: 'child', hskLevel: '1', language: 'chinese' },
  { chinese: '二', pinyin: 'èr', meaning: 'two', hskLevel: '1', language: 'chinese' },
  { chinese: '法', pinyin: 'fǎ', meaning: 'law', hskLevel: '1', language: 'chinese' },
  { chinese: '反', pinyin: 'fǎn', meaning: 'opposite', hskLevel: '1', language: 'chinese' },
  { chinese: '饭', pinyin: 'fàn', meaning: 'rice', hskLevel: '1', language: 'chinese' },
  { chinese: '方', pinyin: 'fāng', meaning: 'direction', hskLevel: '1', language: 'chinese' },
  { chinese: '放', pinyin: 'fàng', meaning: 'put', hskLevel: '1', language: 'chinese' },
  { chinese: '非', pinyin: 'fēi', meaning: 'not', hskLevel: '1', language: 'chinese' },
  { chinese: '费', pinyin: 'fèi', meaning: 'cost', hskLevel: '1', language: 'chinese' },
  { chinese: '分', pinyin: 'fēn', meaning: 'divide', hskLevel: '1', language: 'chinese' },
  { chinese: '风', pinyin: 'fēng', meaning: 'wind', hskLevel: '1', language: 'chinese' },
  { chinese: '服', pinyin: 'fú', meaning: 'clothes', hskLevel: '1', language: 'chinese' },
  { chinese: '父', pinyin: 'fù', meaning: 'father', hskLevel: '1', language: 'chinese' },
  { chinese: '副', pinyin: 'fù', meaning: 'vice', hskLevel: '1', language: 'chinese' },
  { chinese: '复', pinyin: 'fù', meaning: 'repeat', hskLevel: '1', language: 'chinese' },
  { chinese: '富', pinyin: 'fù', meaning: 'rich', hskLevel: '1', language: 'chinese' },
];

async function seedWords() {
  let connection;
  try {
    connection = await mysql.createConnection(config);
    console.log('✅ Connected to database\n');
    
    console.log(`🌱 Seeding ${HSK_WORDS.length} HSK 1 Chinese words...`);
    
    let inserted = 0;
    let skipped = 0;
    
    for (const word of HSK_WORDS) {
      try {
        // Check if word already exists
        const [existing] = await connection.execute(
          'SELECT id FROM words WHERE chinese = ? AND language = ?',
          [word.chinese, word.language]
        );
        
        if (existing.length > 0) {
          skipped++;
          continue;
        }
        
        // Insert new word with correct columns
        await connection.execute(
          'INSERT INTO words (chinese, pinyin, meaning, hskLevel, language, chineseTerm) VALUES (?, ?, ?, ?, ?, ?)',
          [word.chinese, word.pinyin, word.meaning, word.hskLevel, word.language, word.chinese]
        );
        inserted++;
        
        if (inserted % 20 === 0) {
          console.log(`   ✓ Inserted ${inserted} words...`);
        }
      } catch (err) {
        console.error(`❌ Error with word ${word.chinese}:`, err.message);
      }
    }
    
    console.log(`\n✅ Seeding complete!`);
    console.log(`   ✓ Inserted: ${inserted} words`);
    console.log(`   ⊘ Skipped (already exist): ${skipped} words`);
    
    // Show new total
    const [[{ count }]] = await connection.execute('SELECT COUNT(*) as count FROM words WHERE language = "chinese"');
    console.log(`   📊 Total Chinese words now: ${count}`);
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

seedWords();
