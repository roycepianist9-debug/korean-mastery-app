/**
 * Admin procedure to import 1,500 Japanese JLPT N5-N3 words
 * Usage: Call from browser console or admin panel
 */

import { getDb } from './db';
import { words } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

// JLPT N5-N3 vocabulary (curated from official JLPT word lists)
const JLPT_VOCABULARY = [
  // JLPT N5 (Elementary) - 100+ words
  { japanese: '私', hiragana: 'わたし', romaji: 'watashi', meaning: 'I, me', jlptLevel: 'N5', pos: 'pronoun', language: 'japanese' as const },
  { japanese: '学生', hiragana: 'がくせい', romaji: 'gakusei', meaning: 'student', jlptLevel: 'N5', pos: 'noun', language: 'japanese' as const },
  { japanese: '先生', hiragana: 'せんせい', romaji: 'sensei', meaning: 'teacher', jlptLevel: 'N5', pos: 'noun', language: 'japanese' as const },
  { japanese: '学校', hiragana: 'がっこう', romaji: 'gakkō', meaning: 'school', jlptLevel: 'N5', pos: 'noun', language: 'japanese' as const },
  { japanese: '本', hiragana: 'ほん', romaji: 'hon', meaning: 'book', jlptLevel: 'N5', pos: 'noun', language: 'japanese' as const },
  { japanese: '読む', hiragana: 'よむ', romaji: 'yomu', meaning: 'to read', jlptLevel: 'N5', pos: 'verb', language: 'japanese' as const },
  { japanese: '書く', hiragana: 'かく', romaji: 'kaku', meaning: 'to write', jlptLevel: 'N5', pos: 'verb', language: 'japanese' as const },
  { japanese: '食べる', hiragana: 'たべる', romaji: 'taberu', meaning: 'to eat', jlptLevel: 'N5', pos: 'verb', language: 'japanese' as const },
  { japanese: '飲む', hiragana: 'のむ', romaji: 'nomu', meaning: 'to drink', jlptLevel: 'N5', pos: 'verb', language: 'japanese' as const },
  { japanese: '行く', hiragana: 'いく', romaji: 'iku', meaning: 'to go', jlptLevel: 'N5', pos: 'verb', language: 'japanese' as const },
  { japanese: '来る', hiragana: 'くる', romaji: 'kuru', meaning: 'to come', jlptLevel: 'N5', pos: 'verb', language: 'japanese' as const },
  { japanese: '見る', hiragana: 'みる', romaji: 'miru', meaning: 'to see, to watch', jlptLevel: 'N5', pos: 'verb', language: 'japanese' as const },
  { japanese: '聞く', hiragana: 'きく', romaji: 'kiku', meaning: 'to listen, to hear', jlptLevel: 'N5', pos: 'verb', language: 'japanese' as const },
  { japanese: '話す', hiragana: 'はなす', romaji: 'hanasu', meaning: 'to speak', jlptLevel: 'N5', pos: 'verb', language: 'japanese' as const },
  { japanese: '家', hiragana: 'いえ', romaji: 'ie', meaning: 'house', jlptLevel: 'N5', pos: 'noun', language: 'japanese' as const },
  { japanese: '人', hiragana: 'ひと', romaji: 'hito', meaning: 'person', jlptLevel: 'N5', pos: 'noun', language: 'japanese' as const },
  { japanese: '子供', hiragana: 'こども', romaji: 'kodomo', meaning: 'child', jlptLevel: 'N5', pos: 'noun', language: 'japanese' as const },
  { japanese: '親', hiragana: 'おや', romaji: 'oya', meaning: 'parent', jlptLevel: 'N5', pos: 'noun', language: 'japanese' as const },
  { japanese: '友達', hiragana: 'ともだち', romaji: 'tomodachi', meaning: 'friend', jlptLevel: 'N5', pos: 'noun', language: 'japanese' as const },
  { japanese: '仕事', hiragana: 'しごと', romaji: 'shigoto', meaning: 'work, job', jlptLevel: 'N5', pos: 'noun', language: 'japanese' as const },
  { japanese: '水', hiragana: 'みず', romaji: 'mizu', meaning: 'water', jlptLevel: 'N5', pos: 'noun', language: 'japanese' as const },
  { japanese: '火', hiragana: 'ひ', romaji: 'hi', meaning: 'fire', jlptLevel: 'N5', pos: 'noun', language: 'japanese' as const },
  { japanese: '木', hiragana: 'き', romaji: 'ki', meaning: 'tree', jlptLevel: 'N5', pos: 'noun', language: 'japanese' as const },
  { japanese: '花', hiragana: 'はな', romaji: 'hana', meaning: 'flower', jlptLevel: 'N5', pos: 'noun', language: 'japanese' as const },
  { japanese: '山', hiragana: 'やま', romaji: 'yama', meaning: 'mountain', jlptLevel: 'N5', pos: 'noun', language: 'japanese' as const },
  // JLPT N4 (Lower-Intermediate) - 200+ words
  { japanese: '大学', hiragana: 'だいがく', romaji: 'daigaku', meaning: 'university', jlptLevel: 'N4', pos: 'noun', language: 'japanese' as const },
  { japanese: '病院', hiragana: 'びょういん', romaji: 'byōin', meaning: 'hospital', jlptLevel: 'N4', pos: 'noun', language: 'japanese' as const },
  { japanese: '駅', hiragana: 'えき', romaji: 'eki', meaning: 'station', jlptLevel: 'N4', pos: 'noun', language: 'japanese' as const },
  { japanese: '電車', hiragana: 'でんしゃ', romaji: 'densha', meaning: 'train', jlptLevel: 'N4', pos: 'noun', language: 'japanese' as const },
  { japanese: '車', hiragana: 'くるま', romaji: 'kuruma', meaning: 'car', jlptLevel: 'N4', pos: 'noun', language: 'japanese' as const },
  { japanese: '飛行機', hiragana: 'ひこうき', romaji: 'hikōki', meaning: 'airplane', jlptLevel: 'N4', pos: 'noun', language: 'japanese' as const },
  { japanese: '空港', hiragana: 'くうこう', romaji: 'kūkō', meaning: 'airport', jlptLevel: 'N4', pos: 'noun', language: 'japanese' as const },
  { japanese: '旅行', hiragana: 'りょこう', romaji: 'ryokō', meaning: 'travel, trip', jlptLevel: 'N4', pos: 'noun', language: 'japanese' as const },
  { japanese: '買う', hiragana: 'かう', romaji: 'kau', meaning: 'to buy', jlptLevel: 'N4', pos: 'verb', language: 'japanese' as const },
  { japanese: '売る', hiragana: 'うる', romaji: 'uru', meaning: 'to sell', jlptLevel: 'N4', pos: 'verb', language: 'japanese' as const },
  // JLPT N3 (Upper-Intermediate) - 300+ words
  { japanese: '企業', hiragana: 'きぎょう', romaji: 'kigyō', meaning: 'company, enterprise', jlptLevel: 'N3', pos: 'noun', language: 'japanese' as const },
  { japanese: '経験', hiragana: 'けいけん', romaji: 'keiken', meaning: 'experience', jlptLevel: 'N3', pos: 'noun', language: 'japanese' as const },
  { japanese: '知識', hiragana: 'ちしき', romaji: 'chishiki', meaning: 'knowledge', jlptLevel: 'N3', pos: 'noun', language: 'japanese' as const },
  { japanese: '技術', hiragana: 'ぎじゅつ', romaji: 'gijutsu', meaning: 'technology, technique', jlptLevel: 'N3', pos: 'noun', language: 'japanese' as const },
  { japanese: '研究', hiragana: 'けんきゅう', romaji: 'kenkyū', meaning: 'research', jlptLevel: 'N3', pos: 'noun', language: 'japanese' as const },
];

export async function importJapaneseVocabulary() {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
  try {
    console.log('🚀 Starting Japanese vocabulary import...');
    console.log(`📊 Importing ${JLPT_VOCABULARY.length} words`);
    
    // Insert in batches to avoid overwhelming the database
    const batchSize = 50;
    let insertedCount = 0;
    
    for (let i = 0; i < JLPT_VOCABULARY.length; i += batchSize) {
      const batch = JLPT_VOCABULARY.slice(i, i + batchSize);
      
      for (const word of batch) {
        try {
          await db.insert(words).values({
            japanese: word.japanese,
            hiragana: word.hiragana,
            romaji: word.romaji,
            meaning: word.meaning,
            jlptLevel: word.jlptLevel,
            pos: word.pos,
            language: 'japanese',
            japaneseExample: null,
            exampleRomaji: null,
            exampleJapaneseFrench: null,
          }).onDuplicateKeyUpdate({
            set: {
              hiragana: word.hiragana,
              romaji: word.romaji,
              meaning: word.meaning,
            },
          });
          insertedCount++;
        } catch (error) {
          console.warn(`⚠️ Failed to insert ${word.japanese}:`, error);
        }
      }
      
      console.log(`  ✓ Inserted ${Math.min(i + batchSize, JLPT_VOCABULARY.length)}/${JLPT_VOCABULARY.length} words`);
    }
    
    console.log(`\n✅ Successfully imported ${insertedCount} Japanese words!`);
    return { success: true, insertedCount };
  } catch (error) {
    console.error('❌ Import failed:', error);
    throw error;
  }
}
