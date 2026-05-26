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

// First 100 Korean beginner words with English meanings
const KOREAN_BEGINNER = [
  { korean: '가', romanization: 'ga', meaning: 'go', topikLevel: 'beginner' },
  { korean: '가능', romanization: 'ganeung', meaning: 'possible', topikLevel: 'beginner' },
  { korean: '가방', romanization: 'gabang', meaning: 'bag', topikLevel: 'beginner' },
  { korean: '가족', romanization: 'gajok', meaning: 'family', topikLevel: 'beginner' },
  { korean: '가장', romanization: 'gajang', meaning: 'most', topikLevel: 'beginner' },
  { korean: '가지', romanization: 'gaji', meaning: 'branch', topikLevel: 'beginner' },
  { korean: '각', romanization: 'gak', meaning: 'each', topikLevel: 'beginner' },
  { korean: '간', romanization: 'gan', meaning: 'liver', topikLevel: 'beginner' },
  { korean: '간단', romanization: 'gandan', meaning: 'simple', topikLevel: 'beginner' },
  { korean: '갈', romanization: 'gal', meaning: 'go', topikLevel: 'beginner' },
  { korean: '감', romanization: 'gam', meaning: 'persimmon', topikLevel: 'beginner' },
  { korean: '감사', romanization: 'gamsa', meaning: 'thank you', topikLevel: 'beginner' },
  { korean: '같', romanization: 'gat', meaning: 'same', topikLevel: 'beginner' },
  { korean: '갈색', romanization: 'galsaek', meaning: 'brown', topikLevel: 'beginner' },
  { korean: '강', romanization: 'gang', meaning: 'river', topikLevel: 'beginner' },
  { korean: '강하', romanization: 'ganghada', meaning: 'strong', topikLevel: 'beginner' },
  { korean: '같이', romanization: 'gachi', meaning: 'together', topikLevel: 'beginner' },
  { korean: '갓', romanization: 'gat', meaning: 'hat', topikLevel: 'beginner' },
  { korean: '개', romanization: 'gae', meaning: 'dog', topikLevel: 'beginner' },
  { korean: '개수', romanization: 'gaesu', meaning: 'number', topikLevel: 'beginner' },
  { korean: '객실', romanization: 'gaekshil', meaning: 'room', topikLevel: 'beginner' },
  { korean: '거', romanization: 'geo', meaning: 'this', topikLevel: 'beginner' },
  { korean: '거기', romanization: 'geogi', meaning: 'there', topikLevel: 'beginner' },
  { korean: '거리', romanization: 'geori', meaning: 'street', topikLevel: 'beginner' },
  { korean: '거울', romanization: 'geoul', meaning: 'mirror', topikLevel: 'beginner' },
  { korean: '거짓', romanization: 'geojit', meaning: 'lie', topikLevel: 'beginner' },
  { korean: '건강', romanization: 'geongang', meaning: 'health', topikLevel: 'beginner' },
  { korean: '건물', romanization: 'geonmul', meaning: 'building', topikLevel: 'beginner' },
  { korean: '건설', romanization: 'geonseol', meaning: 'construction', topikLevel: 'beginner' },
  { korean: '걸', romanization: 'geol', meaning: 'walk', topikLevel: 'beginner' },
  { korean: '걸음', romanization: 'geoleum', meaning: 'step', topikLevel: 'beginner' },
  { korean: '검', romanization: 'geom', meaning: 'sword', topikLevel: 'beginner' },
  { korean: '검사', romanization: 'geomsa', meaning: 'inspection', topikLevel: 'beginner' },
  { korean: '겨울', romanization: 'gyeoul', meaning: 'winter', topikLevel: 'beginner' },
  { korean: '결과', romanization: 'gyeolkwa', meaning: 'result', topikLevel: 'beginner' },
  { korean: '결론', romanization: 'gyeollon', meaning: 'conclusion', topikLevel: 'beginner' },
  { korean: '결혼', romanization: 'gyeolhon', meaning: 'marriage', topikLevel: 'beginner' },
  { korean: '경', romanization: 'gyeong', meaning: 'experience', topikLevel: 'beginner' },
  { korean: '경기', romanization: 'gyeonggi', meaning: 'match', topikLevel: 'beginner' },
  { korean: '경우', romanization: 'gyeongwu', meaning: 'case', topikLevel: 'beginner' },
  { korean: '경찰', romanization: 'gyeongchal', meaning: 'police', topikLevel: 'beginner' },
  { korean: '경험', romanization: 'gyeongheom', meaning: 'experience', topikLevel: 'beginner' },
  { korean: '계', romanization: 'gye', meaning: 'account', topikLevel: 'beginner' },
  { korean: '계획', romanization: 'gyehoek', meaning: 'plan', topikLevel: 'beginner' },
  { korean: '고', romanization: 'go', meaning: 'old', topikLevel: 'beginner' },
  { korean: '고개', romanization: 'gogae', meaning: 'pass', topikLevel: 'beginner' },
  { korean: '고기', romanization: 'gogi', meaning: 'meat', topikLevel: 'beginner' },
  { korean: '고급', romanization: 'gogup', meaning: 'high grade', topikLevel: 'beginner' },
  { korean: '고등', romanization: 'godeung', meaning: 'high', topikLevel: 'beginner' },
  { korean: '고민', romanization: 'gomin', meaning: 'worry', topikLevel: 'beginner' },
  { korean: '고모', romanization: 'gomo', meaning: 'aunt', topikLevel: 'beginner' },
  { korean: '고속', romanization: 'gosok', meaning: 'fast', topikLevel: 'beginner' },
  { korean: '고양이', romanization: 'goyangi', meaning: 'cat', topikLevel: 'beginner' },
  { korean: '고장', romanization: 'gojang', meaning: 'breakdown', topikLevel: 'beginner' },
  { korean: '고추', romanization: 'gochu', meaning: 'pepper', topikLevel: 'beginner' },
  { korean: '고통', romanization: 'gotong', meaning: 'pain', topikLevel: 'beginner' },
  { korean: '곡', romanization: 'gok', meaning: 'song', topikLevel: 'beginner' },
  { korean: '곡식', romanization: 'goksik', meaning: 'grain', topikLevel: 'beginner' },
  { korean: '곡조', romanization: 'gokjo', meaning: 'melody', topikLevel: 'beginner' },
  { korean: '곡물', romanization: 'gokmul', meaning: 'grain', topikLevel: 'beginner' },
  { korean: '골', romanization: 'gol', meaning: 'valley', topikLevel: 'beginner' },
  { korean: '골목', romanization: 'golmok', meaning: 'alley', topikLevel: 'beginner' },
  { korean: '골프', romanization: 'golpeu', meaning: 'golf', topikLevel: 'beginner' },
  { korean: '곰', romanization: 'gom', meaning: 'bear', topikLevel: 'beginner' },
  { korean: '곱', romanization: 'gop', meaning: 'product', topikLevel: 'beginner' },
  { korean: '곱하', romanization: 'gophada', meaning: 'multiply', topikLevel: 'beginner' },
  { korean: '곱슬', romanization: 'gopseul', meaning: 'curly', topikLevel: 'beginner' },
  { korean: '곱창', romanization: 'gopchang', meaning: 'tripe', topikLevel: 'beginner' },
  { korean: '과', romanization: 'gwa', meaning: 'and', topikLevel: 'beginner' },
  { korean: '과거', romanization: 'gwageo', meaning: 'past', topikLevel: 'beginner' },
  { korean: '과정', romanization: 'gwajung', meaning: 'process', topikLevel: 'beginner' },
  { korean: '과학', romanization: 'gwahak', meaning: 'science', topikLevel: 'beginner' },
  { korean: '과자', romanization: 'gwaja', meaning: 'snack', topikLevel: 'beginner' },
  { korean: '과제', romanization: 'gwaje', meaning: 'task', topikLevel: 'beginner' },
  { korean: '관', romanization: 'gwan', meaning: 'official', topikLevel: 'beginner' },
  { korean: '관계', romanization: 'gwangye', meaning: 'relationship', topikLevel: 'beginner' },
  { korean: '관광', romanization: 'gwangwang', meaning: 'tourism', topikLevel: 'beginner' },
  { korean: '관심', romanization: 'gwansim', meaning: 'interest', topikLevel: 'beginner' },
  { korean: '관찰', romanization: 'gwanchal', meaning: 'observation', topikLevel: 'beginner' },
  { korean: '관행', romanization: 'gwanhaeng', meaning: 'custom', topikLevel: 'beginner' },
  { korean: '관형', romanization: 'gwanhyung', meaning: 'form', topikLevel: 'beginner' },
  { korean: '관형사', romanization: 'gwanhyungsa', meaning: 'adjective', topikLevel: 'beginner' },
  { korean: '괄호', romanization: 'gwalhho', meaning: 'parenthesis', topikLevel: 'beginner' },
  { korean: '괌', romanization: 'gwam', meaning: 'Guam', topikLevel: 'beginner' },
  { korean: '괜찮', romanization: 'gwaenchanh', meaning: 'okay', topikLevel: 'beginner' },
  { korean: '괜찮다', romanization: 'gwaenchanhda', meaning: 'be okay', topikLevel: 'beginner' },
  { korean: '괭이', romanization: 'gwengi', meaning: 'pickaxe', topikLevel: 'beginner' },
  { korean: '괴', romanization: 'gwae', meaning: 'monster', topikLevel: 'beginner' },
  { korean: '괴로', romanization: 'gwaero', meaning: 'suffering', topikLevel: 'beginner' },
  { korean: '괴로움', romanization: 'gwaerowum', meaning: 'suffering', topikLevel: 'beginner' },
  { korean: '괴롭', romanization: 'gwaerop', meaning: 'painful', topikLevel: 'beginner' },
  { korean: '괴롭다', romanization: 'gwaeropda', meaning: 'be painful', topikLevel: 'beginner' },
  { korean: '괴롭히', romanization: 'gwaerophi', meaning: 'torment', topikLevel: 'beginner' },
  { korean: '괴롭히다', romanization: 'gwaerophida', meaning: 'torment', topikLevel: 'beginner' },
  { korean: '괴물', romanization: 'gwaemul', meaning: 'monster', topikLevel: 'beginner' },
  { korean: '괴변', romanization: 'gwaebyeon', meaning: 'strange change', topikLevel: 'beginner' },
  { korean: '괴상', romanization: 'gwaesang', meaning: 'strange', topikLevel: 'beginner' },
  { korean: '괴상하', romanization: 'gwaesanghada', meaning: 'be strange', topikLevel: 'beginner' },
  { korean: '괴상하다', romanization: 'gwaesanghada', meaning: 'be strange', topikLevel: 'beginner' },
];

async function seedKorean() {
  let connection;
  try {
    connection = await mysql.createConnection(config);
    console.log('✅ Connected to database\n');
    
    console.log(`🌱 Seeding ${KOREAN_BEGINNER.length} Korean beginner words...`);
    
    let inserted = 0;
    let skipped = 0;
    
    for (const word of KOREAN_BEGINNER) {
      try {
        // Check if word already exists
        const [existing] = await connection.execute(
          'SELECT id FROM words WHERE korean = ? AND language = ?',
          [word.korean, 'korean']
        );
        
        if (existing.length > 0) {
          skipped++;
          continue;
        }
        
        // Insert new word with correct columns
        await connection.execute(
          'INSERT INTO words (korean, romanization, meaning, topikLevel, language, pos) VALUES (?, ?, ?, ?, ?, ?)',
          [word.korean, word.romanization, word.meaning, word.topikLevel, 'korean', 'noun']
        );
        inserted++;
        
        if (inserted % 20 === 0) {
          console.log(`   ✓ Inserted ${inserted} words...`);
        }
      } catch (err) {
        console.error(`❌ Error with word ${word.korean}:`, err.message);
      }
    }
    
    console.log(`\n✅ Seeding complete!`);
    console.log(`   ✓ Inserted: ${inserted} words`);
    console.log(`   ⊘ Skipped (already exist): ${skipped} words`);
    
    // Show new total
    const [[{ total }]] = await connection.execute('SELECT COUNT(*) as total FROM words');
    const [[{ korean }]] = await connection.execute('SELECT COUNT(*) as korean FROM words WHERE language = "korean"');
    console.log(`   📊 Total words now: ${total}`);
    console.log(`   📊 Total Korean words: ${korean}`);
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

seedKorean();
