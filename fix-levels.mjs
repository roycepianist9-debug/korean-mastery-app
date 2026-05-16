import 'dotenv/config';
import mysql from 'mysql2/promise';

/*
  KRDICT only explicitly marks ~2,545 entries as beginner (초급).
  Everything else was dumped into "advanced". We need a proper 3-tier split.

  Strategy:
  - Beginner (2,545): Keep as-is — these are the official 초급 entries.
  - Intermediate (~15,000): Common POS (noun, verb, adjective, adverb) that have
    Korean example sentences. These are everyday words with teaching material.
  - Advanced (remaining ~39,000): Everything else — specialized terms, grammar particles,
    affixes, words without examples, etc.

  We'll use word ID ordering within each POS as a rough frequency proxy
  (KRDICT orders entries by commonality within categories).
*/

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);

  console.log('Current distribution:');
  const [before] = await conn.execute('SELECT topikLevel, COUNT(*) as cnt FROM words GROUP BY topikLevel');
  console.table(before);

  // Step 1: Among current "advanced" words, promote those with common POS + examples to intermediate
  // We target roughly 15,000 intermediate words for a balanced distribution
  // Common POS types that learners encounter at intermediate level
  const commonPos = ['noun', 'verb', 'adjective', 'adverb', 'interjection', 'pronoun', 'numeral'];
  const posIn = commonPos.map(p => `'${p}'`).join(',');

  // First, count how many qualify
  const [qualifyCount] = await conn.execute(
    `SELECT COUNT(*) as cnt FROM words 
     WHERE topikLevel = 'advanced' 
     AND pos IN (${posIn})
     AND koreanExample IS NOT NULL AND koreanExample != ''`
  );
  console.log(`Words qualifying for intermediate (common POS + has example): ${qualifyCount[0].cnt}`);

  // We'll take roughly the first 15,000 by ID (lower IDs tend to be more common in KRDICT)
  // But let's be smarter: prioritize by POS importance and take proportionally
  const targetIntermediate = 15000;
  
  // Get counts per qualifying POS
  const [posCounts] = await conn.execute(
    `SELECT pos, COUNT(*) as cnt FROM words 
     WHERE topikLevel = 'advanced' 
     AND pos IN (${posIn})
     AND koreanExample IS NOT NULL AND koreanExample != ''
     GROUP BY pos ORDER BY cnt DESC`
  );
  console.log('Qualifying by POS:');
  console.table(posCounts);

  const totalQualifying = posCounts.reduce((sum, r) => sum + Number(r.cnt), 0);
  
  // If total qualifying is close to our target, just promote all of them
  if (totalQualifying <= targetIntermediate * 1.2) {
    console.log(`Promoting all ${totalQualifying} qualifying words to intermediate...`);
    const [result] = await conn.execute(
      `UPDATE words SET topikLevel = 'intermediate' 
       WHERE topikLevel = 'advanced' 
       AND pos IN (${posIn})
       AND koreanExample IS NOT NULL AND koreanExample != ''`
    );
    console.log(`Updated ${result.affectedRows} rows to intermediate`);
  } else {
    // Take proportionally from each POS, ordered by ID (lower = more common)
    for (const row of posCounts) {
      const proportion = Math.round((Number(row.cnt) / totalQualifying) * targetIntermediate);
      console.log(`Promoting ${proportion} of ${row.cnt} ${row.pos} words...`);
      const [result] = await conn.execute(
        `UPDATE words SET topikLevel = 'intermediate' 
         WHERE topikLevel = 'advanced' 
         AND pos = ?
         AND koreanExample IS NOT NULL AND koreanExample != ''
         ORDER BY id ASC
         LIMIT ${Number(proportion)}`,
        [row.pos]
      );
      console.log(`  Updated ${result.affectedRows} rows`);
    }
  }

  console.log('\nFinal distribution:');
  const [after] = await conn.execute('SELECT topikLevel, COUNT(*) as cnt FROM words GROUP BY topikLevel ORDER BY FIELD(topikLevel, "beginner", "intermediate", "advanced")');
  console.table(after);

  await conn.end();
  console.log('Done!');
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
