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

// HSK 1-3 Chinese words with English meanings
const HSK_WORDS = [
  // HSK 1
  { chinese: '爱', pinyin: 'ài', meaning: 'love', level: 1, language: 'chinese' },
  { chinese: '八', pinyin: 'bā', meaning: 'eight', level: 1, language: 'chinese' },
  { chinese: '白', pinyin: 'bái', meaning: 'white', level: 1, language: 'chinese' },
  { chinese: '班', pinyin: 'bān', meaning: 'class', level: 1, language: 'chinese' },
  { chinese: '半', pinyin: 'bàn', meaning: 'half', level: 1, language: 'chinese' },
  { chinese: '北', pinyin: 'běi', meaning: 'north', level: 1, language: 'chinese' },
  { chinese: '被', pinyin: 'bèi', meaning: 'by (passive voice)', level: 1, language: 'chinese' },
  { chinese: '本', pinyin: 'běn', meaning: 'this', level: 1, language: 'chinese' },
  { chinese: '比', pinyin: 'bǐ', meaning: 'compare', level: 1, language: 'chinese' },
  { chinese: '别', pinyin: 'bié', meaning: 'other', level: 1, language: 'chinese' },
  { chinese: '病', pinyin: 'bìng', meaning: 'illness', level: 1, language: 'chinese' },
  { chinese: '不', pinyin: 'bù', meaning: 'not', level: 1, language: 'chinese' },
  { chinese: '布', pinyin: 'bù', meaning: 'cloth', level: 1, language: 'chinese' },
  { chinese: '部', pinyin: 'bù', meaning: 'part', level: 1, language: 'chinese' },
  { chinese: '才', pinyin: 'cái', meaning: 'talent', level: 1, language: 'chinese' },
  { chinese: '菜', pinyin: 'cài', meaning: 'vegetable', level: 1, language: 'chinese' },
  { chinese: '茶', pinyin: 'chá', meaning: 'tea', level: 1, language: 'chinese' },
  { chinese: '长', pinyin: 'cháng', meaning: 'long', level: 1, language: 'chinese' },
  { chinese: '常', pinyin: 'cháng', meaning: 'often', level: 1, language: 'chinese' },
  { chinese: '车', pinyin: 'chē', meaning: 'car', level: 1, language: 'chinese' },
  { chinese: '成', pinyin: 'chéng', meaning: 'become', level: 1, language: 'chinese' },
  { chinese: '吃', pinyin: 'chī', meaning: 'eat', level: 1, language: 'chinese' },
  { chinese: '出', pinyin: 'chū', meaning: 'go out', level: 1, language: 'chinese' },
  { chinese: '初', pinyin: 'chū', meaning: 'beginning', level: 1, language: 'chinese' },
  { chinese: '除', pinyin: 'chú', meaning: 'remove', level: 1, language: 'chinese' },
  { chinese: '处', pinyin: 'chù', meaning: 'place', level: 1, language: 'chinese' },
  { chinese: '春', pinyin: 'chūn', meaning: 'spring', level: 1, language: 'chinese' },
  { chinese: '次', pinyin: 'cì', meaning: 'time (occurrence)', level: 1, language: 'chinese' },
  { chinese: '错', pinyin: 'cuò', meaning: 'wrong', level: 1, language: 'chinese' },
  { chinese: '打', pinyin: 'dǎ', meaning: 'hit', level: 1, language: 'chinese' },
  { chinese: '大', pinyin: 'dà', meaning: 'big', level: 1, language: 'chinese' },
  { chinese: '代', pinyin: 'dài', meaning: 'generation', level: 1, language: 'chinese' },
  { chinese: '带', pinyin: 'dài', meaning: 'bring', level: 1, language: 'chinese' },
  { chinese: '待', pinyin: 'dài', meaning: 'wait', level: 1, language: 'chinese' },
  { chinese: '单', pinyin: 'dān', meaning: 'single', level: 1, language: 'chinese' },
  { chinese: '当', pinyin: 'dāng', meaning: 'when', level: 1, language: 'chinese' },
  { chinese: '到', pinyin: 'dào', meaning: 'arrive', level: 1, language: 'chinese' },
  { chinese: '道', pinyin: 'dào', meaning: 'way', level: 1, language: 'chinese' },
  { chinese: '的', pinyin: 'de', meaning: 'particle', level: 1, language: 'chinese' },
  { chinese: '得', pinyin: 'dé', meaning: 'get', level: 1, language: 'chinese' },
  { chinese: '地', pinyin: 'dì', meaning: 'ground', level: 1, language: 'chinese' },
  { chinese: '第', pinyin: 'dì', meaning: 'ordinal number', level: 1, language: 'chinese' },
  { chinese: '弟', pinyin: 'dì', meaning: 'younger brother', level: 1, language: 'chinese' },
  { chinese: '点', pinyin: 'diǎn', meaning: 'o\'clock', level: 1, language: 'chinese' },
  { chinese: '电', pinyin: 'diàn', meaning: 'electricity', level: 1, language: 'chinese' },
  { chinese: '店', pinyin: 'diàn', meaning: 'shop', level: 1, language: 'chinese' },
  { chinese: '掉', pinyin: 'diào', meaning: 'fall', level: 1, language: 'chinese' },
  { chinese: '丁', pinyin: 'dīng', meaning: 'ding', level: 1, language: 'chinese' },
  { chinese: '定', pinyin: 'dìng', meaning: 'fix', level: 1, language: 'chinese' },
  { chinese: '动', pinyin: 'dòng', meaning: 'move', level: 1, language: 'chinese' },
  { chinese: '都', pinyin: 'dōu', meaning: 'all', level: 1, language: 'chinese' },
  { chinese: '读', pinyin: 'dú', meaning: 'read', level: 1, language: 'chinese' },
  { chinese: '度', pinyin: 'dù', meaning: 'degree', level: 1, language: 'chinese' },
  { chinese: '对', pinyin: 'duì', meaning: 'correct', level: 1, language: 'chinese' },
  { chinese: '多', pinyin: 'duō', meaning: 'many', level: 1, language: 'chinese' },
  { chinese: '朵', pinyin: 'duǒ', meaning: 'measure word', level: 1, language: 'chinese' },
  { chinese: '儿', pinyin: 'ér', meaning: 'child', level: 1, language: 'chinese' },
  { chinese: '二', pinyin: 'èr', meaning: 'two', level: 1, language: 'chinese' },
  { chinese: '法', pinyin: 'fǎ', meaning: 'law', level: 1, language: 'chinese' },
  { chinese: '反', pinyin: 'fǎn', meaning: 'opposite', level: 1, language: 'chinese' },
  { chinese: '饭', pinyin: 'fàn', meaning: 'rice', level: 1, language: 'chinese' },
  { chinese: '方', pinyin: 'fāng', meaning: 'direction', level: 1, language: 'chinese' },
  { chinese: '放', pinyin: 'fàng', meaning: 'put', level: 1, language: 'chinese' },
  { chinese: '非', pinyin: 'fēi', meaning: 'not', level: 1, language: 'chinese' },
  { chinese: '费', pinyin: 'fèi', meaning: 'cost', level: 1, language: 'chinese' },
  { chinese: '分', pinyin: 'fēn', meaning: 'divide', level: 1, language: 'chinese' },
  { chinese: '风', pinyin: 'fēng', meaning: 'wind', level: 1, language: 'chinese' },
  { chinese: '服', pinyin: 'fú', meaning: 'clothes', level: 1, language: 'chinese' },
  { chinese: '父', pinyin: 'fù', meaning: 'father', level: 1, language: 'chinese' },
  { chinese: '副', pinyin: 'fù', meaning: 'vice', level: 1, language: 'chinese' },
  { chinese: '复', pinyin: 'fù', meaning: 'repeat', level: 1, language: 'chinese' },
  { chinese: '富', pinyin: 'fù', meaning: 'rich', level: 1, language: 'chinese' },
];

async function seedWords() {
  let connection;
  try {
    connection = await mysql.createConnection(config);
    console.log('✅ Connected to database\n');
    
    console.log(`🌱 Seeding ${HSK_WORDS.length} HSK 1-3 Chinese words...`);
    
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
        
        // Insert new word
        await connection.execute(
          'INSERT INTO words (chinese, pinyin, meaning, level, language) VALUES (?, ?, ?, ?, ?)',
          [word.chinese, word.pinyin, word.meaning, word.level, word.language]
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
