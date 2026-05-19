import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { words } from './drizzle/schema.ts';
import { eq, isNotNull, and } from 'drizzle-orm';
import fs from 'fs';

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
}

async function seedChineseFrench() {
  console.log('[Chinese-French Seed] Starting...');
  
  // Create connection pool
  const poolConnection = await mysql.createConnection(process.env.DATABASE_URL);
  const db = drizzle(poolConnection);
  
  // Read cfdict_french.csv
  const csvPath = '/home/ubuntu/upload/cfdict_french.csv';
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n');
  
  const frenchMap = new Map();
  
  // Skip header, parse each line
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const fields = parseCSVLine(line);
    if (fields.length >= 4) {
      const simplified = fields[0]?.trim();
      const traditional = fields[1]?.trim();
      const french = fields[3]?.trim();
      
      if (simplified && french) {
        frenchMap.set(simplified, french);
      }
      if (traditional && french) {
        frenchMap.set(traditional, french);
      }
    }
  }
  
  console.log(`[Chinese-French Seed] Loaded ${frenchMap.size} French definitions from cfdict_french.csv`);
  
  // Get all Chinese words from database
  const allWords = await db.query.words.findMany({
    where: (w, { eq }) => eq(w.type, 'chinese'),
  });
  
  console.log(`[Chinese-French Seed] Found ${allWords.length} Chinese words in database`);
  
  let updated = 0;
  let matched = 0;
  
  // Match and update
  for (const word of allWords) {
    const frenchDef = frenchMap.get(word.chinese);
    
    if (frenchDef) {
      matched++;
      
      // Update database
      await db.update(words)
        .set({ meaningFr: frenchDef })
        .where(eq(words.id, word.id));
      
      updated++;
      
      if (updated % 500 === 0) {
        console.log(`[Chinese-French Seed] Updated ${updated}/${allWords.length} words...`);
      }
    }
  }
  
  console.log(`[Chinese-French Seed] Complete!`);
  console.log(`[Chinese-French Seed] Matched: ${matched}/${allWords.length}`);
  console.log(`[Chinese-French Seed] Updated: ${updated} rows`);
  
  // Verify
  const verifyResult = await db.query.words.findMany({
    where: (w, { and, eq, isNotNull }) => and(
      eq(w.type, 'chinese'),
      isNotNull(w.meaningFr)
    ),
  });
  
  console.log(`[Chinese-French Seed] Verification: ${verifyResult.length} Chinese words now have French meanings`);
  
  await poolConnection.end();
  process.exit(0);
}

seedChineseFrench().catch(err => {
  console.error('[Chinese-French Seed] Error:', err);
  process.exit(1);
});
