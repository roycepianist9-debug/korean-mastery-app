import { router, publicProcedure } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { basicsCards } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export const basicsRouter = router({
  // Get all subsections with card counts
  getSubsections: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const result = await db.execute(
      `SELECT DISTINCT subsection, subsectionTitle, COUNT(*) as cardCount 
       FROM basics_cards 
       GROUP BY subsection, subsectionTitle 
       ORDER BY FIELD(subsection, 'numbers', 'time_clock', 'dates', 'countries', 'directions')`
    );

    return (result[0] as any[]).map((row) => ({
      subsection: row.subsection,
      subsectionTitle: row.subsectionTitle,
      cardCount: row.cardCount,
    }));
  }),

  // Get cards by subsection
  getBySubsection: publicProcedure
    .input(z.object({ subsection: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const cards = await db
        .select()
        .from(basicsCards)
        .where(eq(basicsCards.subsection, input.subsection));

      return cards;
    }),

  // Get all cards (paginated)
  getAll: publicProcedure
    .input(
      z.object({
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const cards = await db
        .select()
        .from(basicsCards)
        .limit(input.limit)
        .offset(input.offset);

      return cards;
    }),

  // Get total card count
  getCount: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const result = await db.execute("SELECT COUNT(*) as count FROM basics_cards");
    return (result[0] as any[])[0].count;
  }),
});
