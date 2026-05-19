import { drizzle } from "drizzle-orm/mysql2";
import { words } from "./drizzle/schema.ts";
import { eq } from "drizzle-orm";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("ERROR: DATABASE_URL not set");
  process.exit(1);
}

console.log("[Diagnostic] Connecting to database...");
console.log("[Diagnostic] DATABASE_URL:", DATABASE_URL.substring(0, 50) + "...");

const db = drizzle(DATABASE_URL);

console.log("[Diagnostic] Querying for Korean word '가게'...");

const word = await db.select().from(words).where(eq(words.korean, '가게')).limit(1);

console.log("\n[Diagnostic] Result:");
console.log(JSON.stringify(word, null, 2));

if (word.length > 0) {
  console.log("\n[Diagnostic] Fields present:");
  console.log("- meaningFr:", word[0].meaningFr ? "✓ Present" : "✗ NULL/Missing");
  console.log("- exampleFrench:", word[0].exampleFrench ? "✓ Present" : "✗ NULL/Missing");
  console.log("- exampleChineseFrench:", word[0].exampleChineseFrench ? "✓ Present" : "✗ NULL/Missing");
} else {
  console.log("\n[Diagnostic] ERROR: Word '가게' not found in database");
}

process.exit(0);
