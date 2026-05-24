import { drizzle } from "drizzle-orm/mysql2";
import { words } from "../drizzle/schema.ts";
import fs from "fs";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const db = drizzle(DATABASE_URL);
const jlptData = JSON.parse(fs.readFileSync("/tmp/jlpt-words.json", "utf-8"));

console.log(`Inserting ${jlptData.length} Japanese words...`);

let inserted = 0;
const batchSize = 100;

for (let i = 0; i < jlptData.length; i += batchSize) {
  const batch = jlptData.slice(i, i + batchSize);
  
  try {
    await db.insert(words).values(
      batch.map(word => ({
        japanese: word.word,
        hiragana: word.furigana,
        romaji: word.romaji,
        meaning: word.meaning,
        language: "japanese",
        level: `n${word.level}`,
      }))
    );
    
    inserted += batch.length;
    console.log(`Inserted ${inserted}/${jlptData.length} words`);
  } catch (err) {
    console.error(`Error in batch ${Math.floor(i / batchSize)}:`, err.message);
  }
}

console.log(`\nCompleted! Inserted ${inserted} Japanese words`);
process.exit(0);
