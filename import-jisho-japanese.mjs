import mysql from 'mysql2/promise';
import https from 'https';
import { promisify } from 'util';

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: 'Amazon RDS',
};

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

// Normalize JLPT level (e.g., 'jlpt-n5' -> 'n5')
const normalizeLevel = (jlptArray) => {
  if (!jlptArray || jlptArray.length === 0) return 'n5';
  const level = jlptArray[0].replace('jlpt-', '').toLowerCase();
  return ['n5', 'n4', 'n3', 'n2', 'n1'].includes(level) ? level : 'n5';
};

async function fetchJishoWords(jlptLevel, page = 1) {
  const url = `https://jisho.org/api/v1/search/words?keyword=%23${jlptLevel}&page=${page}`;
  console.log(`Fetching ${jlptLevel} page ${page}...`);
  const data = await httpsGet(url);
  return JSON.parse(data);
}

async function importJapaneseWords() {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    const levels = ['jlpt-n5', 'jlpt-n4', 'jlpt-n3'];
    let totalInserted = 0;
    let totalUpdated = 0;

    for (const level of levels) {
      let page = 1;
      let hasMore = true;

      while (hasMore) {
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

            if (!kanji || !meaning) continue;

            // Create romaji from hiragana (simplified)
            const romaji = hiragana
              .replace(/あ/g, 'a').replace(/い/g, 'i').replace(/う/g, 'u').replace(/え/g, 'e').replace(/お/g, 'o')
              .replace(/か/g, 'ka').replace(/き/g, 'ki').replace(/く/g, 'ku').replace(/け/g, 'ke').replace(/こ/g, 'ko')
              .replace(/が/g, 'ga').replace(/ぎ/g, 'gi').replace(/ぐ/g, 'gu').replace(/げ/g, 'ge').replace(/ご/g, 'go')
              .replace(/さ/g, 'sa').replace(/し/g, 'shi').replace(/す/g, 'su').replace(/せ/g, 'se').replace(/そ/g, 'so')
              .replace(/ざ/g, 'za').replace(/じ/g, 'ji').replace(/ず/g, 'zu').replace(/ぜ/g, 'ze').replace(/ぞ/g, 'zo')
              .replace(/た/g, 'ta').replace(/ち/g, 'chi').replace(/つ/g, 'tsu').replace(/て/g, 'te').replace(/と/g, 'to')
              .replace(/だ/g, 'da').replace(/ぢ/g, 'di').replace(/づ/g, 'du').replace(/で/g, 'de').replace(/ど/g, 'do')
              .replace(/な/g, 'na').replace(/に/g, 'ni').replace(/ぬ/g, 'nu').replace(/ね/g, 'ne').replace(/の/g, 'no')
              .replace(/は/g, 'ha').replace(/ひ/g, 'hi').replace(/ふ/g, 'fu').replace(/へ/g, 'he').replace(/ほ/g, 'ho')
              .replace(/ば/g, 'ba').replace(/び/g, 'bi').replace(/ぶ/g, 'bu').replace(/べ/g, 'be').replace(/ぼ/g, 'bo')
              .replace(/ぱ/g, 'pa').replace(/ぴ/g, 'pi').replace(/ぷ/g, 'pu').replace(/ぺ/g, 'pe').replace(/ぽ/g, 'po')
              .replace(/ま/g, 'ma').replace(/み/g, 'mi').replace(/む/g, 'mu').replace(/め/g, 'me').replace(/も/g, 'mo')
              .replace(/や/g, 'ya').replace(/ゆ/g, 'yu').replace(/よ/g, 'yo')
              .replace(/ら/g, 'ra').replace(/り/g, 'ri').replace(/る/g, 'ru').replace(/れ/g, 're').replace(/ろ/g, 'ro')
              .replace(/わ/g, 'wa').replace(/ゐ/g, 'wi').replace(/ゑ/g, 'we').replace(/を/g, 'wo').replace(/ん/g, 'n');

            // Check if word exists
            const [existing] = await connection.query(
              'SELECT id FROM words WHERE language = ? AND japanese = ?',
              ['japanese', kanji]
            );

            if (existing.length > 0) {
              // Update existing word with missing fields
              await connection.query(
                'UPDATE words SET hiragana = ?, romaji = ?, pos = ?, jlptLevel = ? WHERE id = ?',
                [hiragana, romaji, pos, jlptLevel, existing[0].id]
              );
              totalUpdated++;
            } else {
              // Insert new word
              await connection.query(
                `INSERT INTO words (language, japanese, hiragana, romaji, meaning, pos, jlptLevel, exampleEnglish)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                ['japanese', kanji, hiragana, romaji, meaning, pos, jlptLevel, '']
              );
              totalInserted++;
            }
          } catch (err) {
            console.error(`Error processing entry: ${err.message}`);
          }
        }

        page++;
        // Rate limit: wait 1 second between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`\n✅ Import complete!`);
    console.log(`   Inserted: ${totalInserted} new words`);
    console.log(`   Updated: ${totalUpdated} existing words`);

  } finally {
    await connection.end();
  }
}

importJapaneseWords().catch(console.error);
