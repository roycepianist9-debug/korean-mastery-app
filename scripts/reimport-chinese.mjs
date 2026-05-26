/**
 * Re-import all Chinese HSK words (1-9) from available data sources:
 * - HSK 1-6: /home/ubuntu/hsk_complete.json (11,470 entries)
 * - HSK 7-9: /tmp/hsk79-complete.json (5,588 entries)
 * - French meanings: /home/ubuntu/upload/cfdict_french.csv
 */
import fs from 'fs';
import { drizzle } from 'drizzle-orm/mysql2';
import { sql } from 'drizzle-orm';
import { parse } from 'csv-parse/sync';

const db = drizzle(process.env.DATABASE_URL);

function mapPos(posList) {
  if (!posList || posList.length === 0) return 'noun';
  const p = posList[0];
  if (p === 'n' || p === 'nr' || p === 'ns' || p === 'nz' || p === 'vn' || p === 'an') return 'noun';
  if (p === 'v' || p === 'vd' || p === 'vi') return 'verb';
  if (p === 'a' || p === 'ad') return 'adjective';
  if (p === 'd') return 'adverb';
  if (p === 'p') return 'particle';
  if (p === 'c') return 'conjunction';
  if (p === 'r') return 'pronoun';
  if (p === 'm' || p === 'q') return 'numeral';
  return 'noun';
}

function escSql(str) {
  if (!str) return '';
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

async function reimport() {
  console.log('=== Chinese HSK Re-import ===\n');

  // Delete existing Chinese words
  console.log('Deleting existing Chinese words...');
  await db.execute(sql`DELETE FROM words WHERE language = 'chinese'`);
  console.log('Done.\n');

  // Load HSK 1-6 from hsk_complete.json
  console.log('Loading HSK 1-6 data...');
  const hskRaw = JSON.parse(fs.readFileSync('/home/ubuntu/hsk_complete.json', 'utf-8'));
  
  const hskWords = [];
  const levelMap = { 'new-1': '1', 'new-2': '2', 'new-3': '3', 'new-4': '4', 'new-5': '5', 'new-6': '6' };
  
  for (const word of hskRaw) {
    const levels = word.level || [];
    let hskLevel = null;
    for (const [key, val] of Object.entries(levelMap)) {
      if (levels.includes(key)) {
        hskLevel = val;
        break;
      }
    }
    if (!hskLevel) continue;
    
    const simplified = word.simplified;
    if (!simplified) continue;
    
    const form = word.forms && word.forms[0];
    if (!form) continue;
    
    const pinyin = form.transcriptions?.pinyin || '';
    const meanings = form.meanings || [];
    const meaning = meanings.slice(0, 3).join('; ');
    if (!meaning) continue;
    
    const pos = mapPos(form.pos);
    
    hskWords.push({
      chinese: simplified,
      pinyin,
      meaning,
      pos,
      hskLevel,
    });
  }
  console.log(`  HSK 1-6: ${hskWords.length} words`);

  // Load HSK 7-9 from /tmp/hsk79-complete.json
  console.log('Loading HSK 7-9 data...');
  const hsk79Raw = JSON.parse(fs.readFileSync('/tmp/hsk79-complete.json', 'utf-8'));
  
  const hsk79Words = hsk79Raw.map(w => ({
    chinese: w.chinese,
    pinyin: w.pinyin,
    meaning: w.meaning || '',
    pos: 'noun',
    hskLevel: '7-9',
    chineseExample: w.chineseExample || null,
    exampleEnglish: w.exampleEnglish || null,
  }));
  console.log(`  HSK 7-9: ${hsk79Words.length} words`);

  // Load French dictionary for matching
  console.log('Loading French dictionary...');
  let frenchMap = new Map();
  try {
    const csvContent = fs.readFileSync('/home/ubuntu/upload/cfdict_french.csv', 'utf-8');
    const records = parse(csvContent, { columns: true, skip_empty_lines: true });
    for (const rec of records) {
      if (rec.simplified) {
        frenchMap.set(rec.simplified, rec.french);
      }
    }
    console.log(`  French dictionary: ${frenchMap.size} entries`);
  } catch (e) {
    console.log(`  French dictionary load failed: ${e.message}`);
  }

  // Combine all words
  const allWords = [
    ...hskWords.map(w => ({ ...w, chineseExample: null, exampleEnglish: null })),
    ...hsk79Words,
  ];
  console.log(`\nTotal Chinese words to insert: ${allWords.length}`);

  // Insert in batches
  const BATCH_SIZE = 200;
  let inserted = 0;

  for (let i = 0; i < allWords.length; i += BATCH_SIZE) {
    const batch = allWords.slice(i, i + BATCH_SIZE);
    
    const values = batch.map(w => {
      const meaningFr = frenchMap.get(w.chinese) || null;
      const meaningFrSql = meaningFr ? `'${escSql(meaningFr)}'` : 'NULL';
      const chineseExampleSql = w.chineseExample ? `'${escSql(w.chineseExample)}'` : 'NULL';
      const exampleEnglishSql = w.exampleEnglish ? `'${escSql(w.exampleEnglish)}'` : 'NULL';
      
      return `('${escSql(w.chinese)}', '${escSql(w.pinyin)}', '${escSql(w.meaning)}', '${escSql(w.pos)}', '${w.hskLevel}', 'chinese', ${meaningFrSql}, ${chineseExampleSql}, ${exampleEnglishSql})`;
    }).join(',\n');

    const insertSql = `INSERT INTO words (chinese, pinyin, meaning, pos, hskLevel, language, meaningFr, chineseExample, exampleEnglish) VALUES ${values}`;
    
    try {
      await db.execute(sql.raw(insertSql));
      inserted += batch.length;
    } catch (error) {
      // Try one by one
      for (const w of batch) {
        try {
          const meaningFr = frenchMap.get(w.chinese) || null;
          const meaningFrSql = meaningFr ? `'${escSql(meaningFr)}'` : 'NULL';
          const chineseExampleSql = w.chineseExample ? `'${escSql(w.chineseExample)}'` : 'NULL';
          const exampleEnglishSql = w.exampleEnglish ? `'${escSql(w.exampleEnglish)}'` : 'NULL';
          
          const singleSql = `INSERT INTO words (chinese, pinyin, meaning, pos, hskLevel, language, meaningFr, chineseExample, exampleEnglish) VALUES ('${escSql(w.chinese)}', '${escSql(w.pinyin)}', '${escSql(w.meaning)}', '${escSql(w.pos)}', '${w.hskLevel}', 'chinese', ${meaningFrSql}, ${chineseExampleSql}, ${exampleEnglishSql})`;
          await db.execute(sql.raw(singleSql));
          inserted++;
        } catch (e2) {
          console.error(`  Skipped: ${w.chinese} - ${e2.message.slice(0, 80)}`);
        }
      }
    }
    
    if (inserted % 1000 === 0 || i + BATCH_SIZE >= allWords.length) {
      console.log(`  Inserted ${inserted}/${allWords.length}...`);
    }
  }

  // Verify
  const counts = await db.execute(sql`SELECT hskLevel, COUNT(*) as cnt FROM words WHERE language = 'chinese' GROUP BY hskLevel ORDER BY hskLevel`);
  console.log('\nFinal Chinese word distribution:');
  console.log(counts[0]);
  console.log(`\n✅ Successfully imported ${inserted} Chinese words`);
  process.exit(0);
}

reimport().catch(err => {
  console.error('Import failed:', err.message);
  process.exit(1);
});
