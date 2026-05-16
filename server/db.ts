import { eq, and, like, or, sql, desc, asc, inArray, count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, words, userProgress, userStats } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Word Queries ───────────────────────────────────────────

export async function searchWords(params: {
  query?: string;
  pos?: string;
  topikLevel?: string;
  page: number;
  pageSize: number;
}) {
  const db = await getDb();
  if (!db) return { words: [], total: 0 };

  const conditions = [];

  if (params.query && params.query.trim()) {
    const q = `%${params.query.trim()}%`;
    conditions.push(
      or(
        like(words.korean, q),
        like(words.romanization, q),
        like(words.meaning, q)
      )
    );
  }

  if (params.pos && params.pos !== 'all') {
    conditions.push(eq(words.pos, params.pos));
  }

  if (params.topikLevel && params.topikLevel !== 'all') {
    conditions.push(eq(words.topikLevel, params.topikLevel as any));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [results, countResult] = await Promise.all([
    db.select()
      .from(words)
      .where(whereClause)
      .orderBy(asc(words.id))
      .limit(params.pageSize)
      .offset((params.page - 1) * params.pageSize),
    db.select({ total: count() })
      .from(words)
      .where(whereClause),
  ]);

  return {
    words: results,
    total: countResult[0]?.total ?? 0,
  };
}

export async function getWordById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(words).where(eq(words.id, id)).limit(1);
  return result[0] ?? null;
}

export async function getRandomWords(params: {
  pos?: string;
  topikLevel?: string;
  limit: number;
  excludeIds?: number[];
}) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  if (params.pos && params.pos !== 'all') {
    conditions.push(eq(words.pos, params.pos));
  }
  if (params.topikLevel && params.topikLevel !== 'all') {
    conditions.push(eq(words.topikLevel, params.topikLevel as any));
  }
  if (params.excludeIds && params.excludeIds.length > 0) {
    conditions.push(sql`${words.id} NOT IN (${sql.join(params.excludeIds.map(id => sql`${id}`), sql`, `)})`);
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  return db.select()
    .from(words)
    .where(whereClause)
    .orderBy(sql`RAND()`)
    .limit(params.limit);
}

export async function getWordStats() {
  const db = await getDb();
  if (!db) return { total: 0, byLevel: [], byPos: [] };

  const [totalResult, byLevel, byPos] = await Promise.all([
    db.select({ total: count() }).from(words),
    db.select({ level: words.topikLevel, count: count() })
      .from(words)
      .groupBy(words.topikLevel),
    db.select({ pos: words.pos, count: count() })
      .from(words)
      .groupBy(words.pos)
      .orderBy(desc(count())),
  ]);

  return {
    total: totalResult[0]?.total ?? 0,
    byLevel,
    byPos,
  };
}

// ─── Progress Queries ───────────────────────────────────────

export async function getUserProgress(userId: number, wordIds: number[]) {
  const db = await getDb();
  if (!db || wordIds.length === 0) return [];
  return db.select()
    .from(userProgress)
    .where(and(
      eq(userProgress.userId, userId),
      inArray(userProgress.wordId, wordIds)
    ));
}

export async function upsertWordProgress(userId: number, wordId: number, status: 'new' | 'reviewing' | 'learned', correct: boolean) {
  const db = await getDb();
  if (!db) return;

  const existing = await db.select()
    .from(userProgress)
    .where(and(eq(userProgress.userId, userId), eq(userProgress.wordId, wordId)))
    .limit(1);

  if (existing.length > 0) {
    await db.update(userProgress)
      .set({
        status,
        timesReviewed: sql`${userProgress.timesReviewed} + 1`,
        timesCorrect: correct ? sql`${userProgress.timesCorrect} + 1` : sql`${userProgress.timesCorrect}`,
        lastReviewedAt: new Date(),
      })
      .where(and(eq(userProgress.userId, userId), eq(userProgress.wordId, wordId)));
  } else {
    await db.insert(userProgress).values({
      userId,
      wordId,
      status,
      timesReviewed: 1,
      timesCorrect: correct ? 1 : 0,
      lastReviewedAt: new Date(),
    });
  }
}

export async function getUserProgressStats(userId: number) {
  const db = await getDb();
  if (!db) return { new: 0, reviewing: 0, learned: 0, total: 0 };

  const result = await db.select({
    status: userProgress.status,
    count: count(),
  })
    .from(userProgress)
    .where(eq(userProgress.userId, userId))
    .groupBy(userProgress.status);

  const stats = { new: 0, reviewing: 0, learned: 0, total: 0 };
  for (const row of result) {
    if (row.status === 'new') stats.new = row.count;
    if (row.status === 'reviewing') stats.reviewing = row.count;
    if (row.status === 'learned') stats.learned = row.count;
  }
  stats.total = stats.new + stats.reviewing + stats.learned;
  return stats;
}

export async function getProgressByLevel(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select({
    topikLevel: words.topikLevel,
    status: userProgress.status,
    count: count(),
  })
    .from(userProgress)
    .innerJoin(words, eq(userProgress.wordId, words.id))
    .where(eq(userProgress.userId, userId))
    .groupBy(words.topikLevel, userProgress.status);
}

export async function getProgressByPos(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select({
    pos: words.pos,
    status: userProgress.status,
    count: count(),
  })
    .from(userProgress)
    .innerJoin(words, eq(userProgress.wordId, words.id))
    .where(eq(userProgress.userId, userId))
    .groupBy(words.pos, userProgress.status);
}

// ─── User Stats (Gamification) ──────────────────────────────

export async function getOrCreateUserStats(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const existing = await db.select()
    .from(userStats)
    .where(eq(userStats.userId, userId))
    .limit(1);

  if (existing.length > 0) return existing[0];

  await db.insert(userStats).values({ userId });
  const created = await db.select()
    .from(userStats)
    .where(eq(userStats.userId, userId))
    .limit(1);
  return created[0] ?? null;
}

export async function updateUserStatsAfterSwipe(userId: number, xpGained: number, wordsLearned: number) {
  const db = await getDb();
  if (!db) return;

  const today = new Date().toISOString().slice(0, 10);
  const stats = await getOrCreateUserStats(userId);
  if (!stats) return;

  let newStreak = stats.currentStreak;
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  if (stats.lastStudyDate === today) {
    // Same day, don't increment streak
  } else if (stats.lastStudyDate === yesterday) {
    newStreak += 1;
  } else {
    newStreak = 1;
  }

  const longestStreak = Math.max(stats.longestStreak, newStreak);

  await db.update(userStats)
    .set({
      xp: sql`${userStats.xp} + ${xpGained}`,
      currentStreak: newStreak,
      longestStreak,
      lastStudyDate: today,
      totalWordsLearned: sql`${userStats.totalWordsLearned} + ${wordsLearned}`,
      totalReviews: sql`${userStats.totalReviews} + 1`,
    })
    .where(eq(userStats.userId, userId));
}
