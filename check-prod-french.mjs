import { drizzle } from "drizzle-orm/mysql2";
import { sql } from "drizzle-orm";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("ERROR: DATABASE_URL not set");
  process.exit(1);
}

console.log("[Production DB Check] Connecting to production database...");

const db = drizzle(DATABASE_URL);

try {
  const result = await db.execute(
    sql`SELECT COUNT(*) as count FROM words WHERE meaningFr IS NOT NULL`
  );
  
  const count = result[0][0].count;
  console.log(`[Production DB Check] French translations found: ${count}`);
  
  if (count === 0) {
    console.log("[Production DB Check] ❌ PROBLEM: Production DB has 0 French translations");
    console.log("[Production DB Check] The French data needs to be written to production");
  } else if (count >= 1931) {
    console.log("[Production DB Check] ✅ SUCCESS: Production DB has French translations");
  } else {
    console.log(`[Production DB Check] ⚠️  WARNING: Only ${count} French translations (expected ~1931)`);
  }
  
  process.exit(0);
} catch (error) {
  console.error("[Production DB Check] Error:", error.message);
  process.exit(1);
}
