import { getDb } from './server/db.ts';

/**
 * Curated JLPT N5-N3 Japanese words (5K subset)
 * Format: { japanese, hiragana, romaji, meaning, meaningFr, jlptLevel }
 * This is a representative sample; full dataset would come from JMdict
 */
const JAPANESE_WORDS = [
  // JLPT N5 (Beginner) - 500 most common words
  { japanese: '水', hiragana: 'みず', romaji: 'mizu', meaning: 'water', meaningFr: 'eau', jlptLevel: 'n5' },
  { japanese: '火', hiragana: 'ひ', romaji: 'hi', meaning: 'fire', meaningFr: 'feu', jlptLevel: 'n5' },
  { japanese: '木', hiragana: 'き', romaji: 'ki', meaning: 'tree', meaningFr: 'arbre', jlptLevel: 'n5' },
  { japanese: '金', hiragana: 'かね', romaji: 'kane', meaning: 'money', meaningFr: 'argent', jlptLevel: 'n5' },
  { japanese: '土', hiragana: 'つち', romaji: 'tsuchi', meaning: 'earth', meaningFr: 'terre', jlptLevel: 'n5' },
  { japanese: '日', hiragana: 'ひ', romaji: 'hi', meaning: 'day; sun', meaningFr: 'jour; soleil', jlptLevel: 'n5' },
  { japanese: '月', hiragana: 'つき', romaji: 'tsuki', meaning: 'moon', meaningFr: 'lune', jlptLevel: 'n5' },
  { japanese: '年', hiragana: 'ねん', romaji: 'nen', meaning: 'year', meaningFr: 'année', jlptLevel: 'n5' },
  { japanese: '時', hiragana: 'とき', romaji: 'toki', meaning: 'time', meaningFr: 'temps', jlptLevel: 'n5' },
  { japanese: '人', hiragana: 'ひと', romaji: 'hito', meaning: 'person', meaningFr: 'personne', jlptLevel: 'n5' },
  // Add 490 more N5 words...
  
  // JLPT N4 (Elementary) - 1,500 words
  { japanese: '学校', hiragana: 'がっこう', romaji: 'gakkō', meaning: 'school', meaningFr: 'école', jlptLevel: 'n4' },
  { japanese: '先生', hiragana: 'せんせい', romaji: 'sensei', meaning: 'teacher', meaningFr: 'professeur', jlptLevel: 'n4' },
  { japanese: '友達', hiragana: 'ともだち', romaji: 'tomodachi', meaning: 'friend', meaningFr: 'ami', jlptLevel: 'n4' },
  // Add 1,497 more N4 words...
  
  // JLPT N3 (Intermediate) - 2,000 words
  { japanese: '経験', hiragana: 'けいけん', romaji: 'keiken', meaning: 'experience', meaningFr: 'expérience', jlptLevel: 'n3' },
  { japanese: '社会', hiragana: 'しゃかい', romaji: 'shakai', meaning: 'society', meaningFr: 'société', jlptLevel: 'n3' },
  { japanese: '文化', hiragana: 'ぶんか', romaji: 'bunka', meaning: 'culture', meaningFr: 'culture', jlptLevel: 'n3' },
  // Add 1,997 more N3 words...
];

async function importJapaneseWords() {
  const db = await getDb();
  if (!db) {
    console.error('❌ Database not available');
    process.exit(1);
  }

  try {
    console.log(`📚 Importing ${JAPANESE_WORDS.length} Japanese words...`);
    
    let imported = 0;
    for (const word of JAPANESE_WORDS) {
      try {
        await db.insert(words).values({
          language: 'japanese',
          japanese: word.japanese,
          hiragana: word.hiragana,
          romaji: word.romaji,
          meaning: word.meaning,
          meaningFr: word.meaningFr,
          jlptLevel: word.jlptLevel,
          pos: 'noun', // Default POS; can be refined per word
        });
        imported++;
      } catch (err) {
        // Skip duplicates
        if (err.code !== 'ER_DUP_ENTRY') {
          console.error(`Error importing word ${word.japanese}:`, err.message);
        }
      }
    }
    
    console.log(`✅ Successfully imported ${imported} Japanese words`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
}

importJapaneseWords();
