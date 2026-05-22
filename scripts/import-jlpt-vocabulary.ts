import * as fs from 'fs';
import { getDb } from '../server/db';
import { words } from '../drizzle/schema';
import { invokeLLM } from '../server/_core/llm';

interface JLPTWord {
  kanji: string;
  readings: Array<{ reading: string; level: number }>;
}

interface WordToImport {
  japanese: string;
  hiragana: string;
  romaji: string;
  jlptLevel: 'n5' | 'n4' | 'n3' | 'n2' | 'n1';
  meaning: string;
  meaningFr: string;
  pos: string;
  japaneseExample: string;
  exampleRomaji: string;
  exampleJapaneseFrench: string;
}

async function parseJLPTVocabulary(): Promise<WordToImport[]> {
  const jlptData = JSON.parse(fs.readFileSync('/tmp/jlpt_vocab.json', 'utf-8'));
  
  const levelMap: Record<number, 'n5' | 'n4' | 'n3' | 'n2' | 'n1'> = {
    5: 'n5',
    4: 'n4',
    3: 'n3',
    2: 'n2',
    1: 'n1',
  };

  const words: WordToImport[] = [];
  const seen = new Set<string>();

  // Process each kanji/word entry
  for (const [kanji, readingData] of Object.entries(jlptData)) {
    const readings = readingData as Array<{ reading: string; level: number }>;
    
    for (const { reading, level } of readings) {
      // Only import N5, N4, N3 for now
      if (![5, 4, 3].includes(level)) continue;
      
      const jlptLevel = levelMap[level];
      const key = `${kanji}-${reading}-${jlptLevel}`;
      
      if (seen.has(key)) continue;
      seen.add(key);

      // Convert hiragana reading to romaji (basic conversion)
      const romaji = hiraganaToRomaji(reading);
      
      // Get English meaning (use kanji as placeholder, will be enhanced)
      const meaning = `${kanji} (${reading})`;
      const meaningFr = `${kanji} (${reading})`;

      words.push({
        japanese: kanji,
        hiragana: reading,
        romaji,
        jlptLevel,
        meaning,
        meaningFr,
        pos: 'noun', // Default, can be refined
        japaneseExample: `${kanji}は重要です。`,
        exampleRomaji: `${romaji} wa jūyō desu.`,
        exampleJapaneseFrench: `${kanji} est important.`,
      });

      // Limit to 300 words for now
      if (words.length >= 300) break;
    }
    if (words.length >= 300) break;
  }

  return words;
}

function hiraganaToRomaji(hiragana: string): string {
  const hiraganaToRomajiMap: Record<string, string> = {
    'あ': 'a', 'い': 'i', 'う': 'u', 'え': 'e', 'お': 'o',
    'か': 'ka', 'き': 'ki', 'く': 'ku', 'け': 'ke', 'こ': 'ko',
    'が': 'ga', 'ぎ': 'gi', 'ぐ': 'gu', 'げ': 'ge', 'ご': 'go',
    'さ': 'sa', 'し': 'shi', 'す': 'su', 'せ': 'se', 'そ': 'so',
    'ざ': 'za', 'じ': 'ji', 'ず': 'zu', 'ぜ': 'ze', 'ぞ': 'zo',
    'た': 'ta', 'ち': 'chi', 'つ': 'tsu', 'て': 'te', 'と': 'to',
    'だ': 'da', 'ぢ': 'di', 'づ': 'du', 'で': 'de', 'ど': 'do',
    'な': 'na', 'に': 'ni', 'ぬ': 'nu', 'ね': 'ne', 'の': 'no',
    'は': 'ha', 'ひ': 'hi', 'ふ': 'fu', 'へ': 'he', 'ほ': 'ho',
    'ば': 'ba', 'び': 'bi', 'ぶ': 'bu', 'べ': 'be', 'ぼ': 'bo',
    'ぱ': 'pa', 'ぴ': 'pi', 'ぷ': 'pu', 'ぺ': 'pe', 'ぽ': 'po',
    'ま': 'ma', 'み': 'mi', 'む': 'mu', 'め': 'me', 'も': 'mo',
    'や': 'ya', 'ゆ': 'yu', 'よ': 'yo',
    'ら': 'ra', 'り': 'ri', 'る': 'ru', 'れ': 're', 'ろ': 'ro',
    'わ': 'wa', 'ゐ': 'wi', 'ゑ': 'we', 'を': 'wo', 'ん': 'n',
  };

  let romaji = '';
  for (const char of hiragana) {
    romaji += hiraganaToRomajiMap[char] || char;
  }
  return romaji;
}

async function importWords(wordsToImport: WordToImport[]): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  console.log(`Importing ${wordsToImport.length} Japanese words...`);

  let imported = 0;
  for (const word of wordsToImport) {
    try {
      await db.insert(words).values({
        language: 'japanese',
        japanese: word.japanese,
        hiragana: word.hiragana,
        romaji: word.romaji,
        jlptLevel: word.jlptLevel,
        meaning: word.meaning,
        meaningFr: word.meaningFr,
        pos: word.pos,
        japaneseExample: word.japaneseExample,
        exampleRomaji: word.exampleRomaji,
        exampleJapaneseFrench: word.exampleJapaneseFrench,
      });
      imported++;
      if (imported % 50 === 0) {
        console.log(`  Imported ${imported}/${wordsToImport.length} words...`);
      }
    } catch (error: any) {
      if (!error.message.includes('Duplicate entry')) {
        console.error(`Failed to import word: ${word.japanese}`, error.message);
      }
    }
  }

  console.log(`✅ Successfully imported ${imported} Japanese words`);
}

async function main() {
  try {
    console.log('Parsing JLPT vocabulary...');
    const wordsToImport = await parseJLPTVocabulary();
    console.log(`Parsed ${wordsToImport.length} words from JLPT data`);
    
    await importWords(wordsToImport);
    
    console.log('✅ Import complete!');
    process.exit(0);
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  }
}

main();
