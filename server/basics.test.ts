import { describe, it, expect, beforeAll } from "vitest";
import { getDb } from "./db";
import { basicsCards } from "../drizzle/schema";
import { eq } from "drizzle-orm";

let db: any;

describe("Basics Cards Feature", () => {
  beforeAll(async () => {
    db = await getDb();
    // Ensure test data exists
    const existing = await db.select().from(basicsCards).limit(1);
    if (existing.length === 0) {
      console.log("No test data found, skipping tests");
    }
  });

  it("should fetch cards by subsection", async () => {
    const cards = await db
      .select()
      .from(basicsCards)
      .where(eq(basicsCards.subsection, "numbers"))
      .limit(10);

    expect(cards.length).toBeGreaterThan(0);
    expect(cards[0].subsection).toBe("numbers");
  });

  it("should have all required fields", async () => {
    const card = await db.select().from(basicsCards).limit(1);
    
    if (card.length > 0) {
      expect(card[0]).toHaveProperty("subsection");
      expect(card[0]).toHaveProperty("subsectionTitle");
      expect(card[0]).toHaveProperty("front");
      expect(card[0]).toHaveProperty("back");
      expect(card[0]).toHaveProperty("example");
    }
  });

  it("should count total cards", async () => {
    const result = await db.execute("SELECT COUNT(*) as count FROM basics_cards");
    const count = (result[0] as any[])[0].count;
    expect(count).toBeGreaterThan(0);
  });

  it("should group by subsection", async () => {
    const result = await db.execute(
      `SELECT DISTINCT subsection, COUNT(*) as cardCount 
       FROM basics_cards 
       GROUP BY subsection`
    );
    
    const subsections = result[0] as any[];
    expect(subsections.length).toBeGreaterThan(0);
  });
});
