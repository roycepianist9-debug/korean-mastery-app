/**
 * Seed Korean French meanings from krdict_french.csv
 * Matches on the `korean` column, updates meaningFr and exampleFrench
 * For words with multiple entries in CSV, uses the first match (most common meaning)
 */
import { drizzle } from "drizzle-orm/mysql2";
import { words } from "./drizzle/schema.ts";
import { eq, sql, and, isNull } from "drizzle-orm";
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

// Load CSV into map: korean -> { french, examples }
// Keep only first entry per korean word (most common meaning)
console.log("[Korean] Loading krdict_french.csv...");
const csvMap = new Map();

const rl = createInterface({
  input: createReadStream('/home/ubuntu/upload/krdict_french.csv'),
  crlfDelay: Infinity
});

let lineNum = 0;
for await (const line of rl) {
  lineNum++;
  if (lineNum === 1) continue; // skip header
  const parts = parseCSVLine(line);
  if (parts.length < 2) continue;
  
  const korean = parts[0]?.trim();
  const french = parts[1]?.trim();
  const definition = parts[2]?.trim() || null;
  const examples = parts[3]?.trim() || null;
  
  if (!korean || !french) continue;
  
  // Decode HTML entities
  const decodedFrench = french
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
  
  // Use first example sentence (before first |)
  let exampleFr = null;
  if (examples) {
    const firstEx = examples.split('|')[0].trim();
    if (firstEx && firstEx.length > 5) exampleFr = firstEx;
  }
  
  // Only store first entry per korean word
  if (!csvMap.has(korean)) {
    csvMap.set(korean, { french: decodedFrench, example: exampleFr });
  }
}

console.log(`[Korean] Loaded ${csvMap.size} unique Korean words from CSV`);

// Get all Korean words from DB that don't have meaningFr yet
console.log("[Korean] Fetching Korean words from DB...");
const dbWords = await db
  .select({ id: words.id, korean: words.korean })
  .from(words)
  .where(and(eq(words.language, 'korean'), isNull(words.meaningFr)));

console.log(`[Korean] Found ${dbWords.length} Korean words without French meanings`);

// Match and update
let updated = 0;
let notFound = 0;
const batchSize = 100;

for (let i = 0; i < dbWords.length; i += batchSize) {
  const batch = dbWords.slice(i, i + batchSize);
  
  for (const word of batch) {
    const match = csvMap.get(word.korean);
    if (match) {
      await db.update(words)
        .set({ 
          meaningFr: match.french,
          exampleFrench: match.example
        })
        .where(eq(words.id, word.id));
      updated++;
    } else {
      notFound++;
    }
  }
  
  if ((i + batchSize) % 500 === 0 || i + batchSize >= dbWords.length) {
    console.log(`[Korean] Progress: ${Math.min(i + batchSize, dbWords.length)}/${dbWords.length} processed, ${updated} updated`);
  }
}

console.log(`\n[Korean] DONE:`);
console.log(`  Updated: ${updated}`);
console.log(`  Not found in CSV: ${notFound}`);

process.exit(0);
