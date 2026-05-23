import https from 'https';
import { promisify } from 'util';
import fs from 'fs';

const httpsGet = promisify((url, callback) => {
  https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => callback(null, data));
  }).on('error', callback);
});

// Map parts of speech to our enum values
const mapPOS = (jishoPOS) => {
  if (!jishoPOS || jishoPOS.length === 0) return 'noun';
  const pos = jishoPOS[0].toLowerCase();
  if (pos.includes('verb')) return 'verb';
  if (pos.includes('adjective')) return 'adjective';
  if (pos.includes('adverb')) return 'adverb';
  return 'noun';
};

// Normalize JLPT level
const normalizeLevel = (jlptArray) => {
  if (!jlptArray || jlptArray.length === 0) return 'n5';
  const level = jlptArray[0].replace('jlpt-', '').toLowerCase();
  return ['n5', 'n4', 'n3', 'n2', 'n1'].includes(level) ? level : 'n5';
};

// Simple hiragana to romaji converter
const hiraganaToRomaji = (hiragana) => {
  const map = {
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
  let result = '';
  for (const char of hiragana) {
    result += map[char] || char;
  }
  return result;
};

async function fetchJishoWords(jlptLevel, page = 1) {
  const url = `https://jisho.org/api/v1/search/words?keyword=%23${jlptLevel}&page=${page}`;
  console.error(`Fetching ${jlptLevel} page ${page}...`);
  const data = await httpsGet(url);
  return JSON.parse(data);
}

async function generateSQL() {
  const levels = ['jlpt-n5', 'jlpt-n4', 'jlpt-n3'];
  const sqlStatements = [];
  let totalWords = 0;

  for (const level of levels) {
    let page = 1;
    let hasMore = true;
    let pageCount = 0;

    while (hasMore && pageCount < 5) { // Limit to 5 pages per level for now
      const result = await fetchJishoWords(level, page);
      if (!result.data || result.data.length === 0) {
        hasMore = false;
        break;
      }

      for (const entry of result.data) {
        try {
          const japanese = entry.japanese?.[0] || {};
          const kanji = japanese.word || '';
          const hiragana = japanese.reading || '';
          const sense = entry.senses?.[0] || {};
          const meaning = sense.english_definitions?.[0] || '';
          const pos = mapPOS(sense.parts_of_speech);
          const jlptLevel = normalizeLevel(entry.jlpt);
          const romaji = hiraganaToRomaji(hiragana);

          if (!kanji || !meaning) continue;

          // Escape single quotes for SQL
          const escapedKanji = kanji.replace(/'/g, "''");
          const escapedHiragana = hiragana.replace(/'/g, "''");
          const escapedRomaji = romaji.replace(/'/g, "''");
          const escapedMeaning = meaning.replace(/'/g, "''");

          // Check if word already exists (we'll do this via UPDATE or INSERT)
          sqlStatements.push(
            `INSERT INTO words (language, japanese, hiragana, romaji, meaning, pos, jlptLevel, exampleEnglish) ` +
            `VALUES ('japanese', '${escapedKanji}', '${escapedHiragana}', '${escapedRomaji}', '${escapedMeaning}', '${pos}', '${jlptLevel}', '') ` +
            `ON DUPLICATE KEY UPDATE hiragana = VALUES(hiragana), romaji = VALUES(romaji), pos = VALUES(pos), jlptLevel = VALUES(jlptLevel);`
          );
          totalWords++;
        } catch (err) {
          console.error(`Error processing entry: ${err.message}`);
        }
      }

      page++;
      pageCount++;
      // Rate limit
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // Write SQL to file
  const sqlFile = '/tmp/jisho-import.sql';
  fs.writeFileSync(sqlFile, sqlStatements.join('\n'));
  console.error(`\n✅ Generated ${totalWords} SQL statements`);
  console.error(`   Saved to: ${sqlFile}`);
  console.error(`   File size: ${fs.statSync(sqlFile).size} bytes`);
}

generateSQL().catch(console.error);
