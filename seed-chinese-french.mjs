/**
 * Seed Chinese French meanings from cfdict_french.csv
 * Matches on the `chinese` column (simplified), updates meaningFr
 * CSV columns: simplified, traditional, pinyin, french
 */
import { drizzle } from "drizzle-orm/mysql2";
import { words } from "./drizzle/schema.ts";
import { eq, and, isNull } from "drizzle-orm";
import { createReadStream } from "fs";
import { createInterface } from "readline";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error("DATABASE_URL not set"); process.exit(1); }

const db = drizzle(DATABASE_URL);

// Parse CSV (handles quoted fields with commas inside)
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i+1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

// Load CSV into map: simplified -> french
// Keep only first entry per character
console.log("[Chinese] Loading cfdict_french.csv...");
const csvMap = new Map();

const rl = createInterface({
  input: createReadStream('/home/ubuntu/upload/cfdict_french.csv'),
  crlfDelay: Infinity
});

let lineNum = 0;
for await (const line of rl) {
  lineNum++;
  if (lineNum === 1) continue; // skip header: simplified,traditional,pinyin,french
  const parts = parseCSVLine(line);
  if (parts.length < 4) continue;
  
  const simplified = parts[0]?.trim();
  const french = parts[3]?.trim();
  
  if (!simplified || !french) continue;
  
  // Decode HTML entities
  const decodedFrench = french
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
  
  // Only store first entry per character
  if (!csvMap.has(simplified)) {
    csvMap.set(simplified, decodedFrench);
  }
}

console.log(`[Chinese] Loaded ${csvMap.size} unique Chinese characters from CSV`);

// Get all Chinese words from DB that don't have meaningFr yet
console.log("[Chinese] Fetching Chinese words from DB...");
const dbWords = await db
  .select({ id: words.id, chinese: words.chinese })
  .from(words)
  .where(and(eq(words.language, 'chinese'), isNull(words.meaningFr)));

console.log(`[Chinese] Found ${dbWords.length} Chinese words without French meanings`);

// Match and update
let updated = 0;
let notFound = 0;
const batchSize = 100;

for (let i = 0; i < dbWords.length; i += batchSize) {
  const batch = dbWords.slice(i, i + batchSize);
  
  for (const word of batch) {
    if (!word.chinese) { notFound++; continue; }
    const match = csvMap.get(word.chinese);
    if (match) {
      await db.update(words)
        .set({ meaningFr: match })
        .where(eq(words.id, word.id));
      updated++;
    } else {
      notFound++;
    }
  }
  
  if ((i + batchSize) % 500 === 0 || i + batchSize >= dbWords.length) {
    console.log(`[Chinese] Progress: ${Math.min(i + batchSize, dbWords.length)}/${dbWords.length} processed, ${updated} updated`);
  }
}

console.log(`\n[Chinese] DONE:`);
console.log(`  Updated: ${updated}`);
console.log(`  Not found in CSV: ${notFound}`);

process.exit(0);
