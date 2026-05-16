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
  statuses?: string[];
  userId?: number;
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

  // Status filter: filter by user progress status
  if (params.statuses && params.statuses.length > 0 && params.userId) {
    if (params.statuses.includes('new')) {
      // "new" means no progress record exists OR status='new'
      const hasProgressStatuses = params.statuses.filter(s => s !== 'new');
      if (hasProgressStatuses.length > 0) {
        // Include words with matching progress status OR no progress at all
        conditions.push(
          sql`(${words.id} IN (SELECT wordId FROM user_progress WHERE userId = ${params.userId} AND status IN (${sql.join(hasProgressStatuses.map(s => sql`${s}`), sql`, `)})) OR ${words.id} NOT IN (SELECT wordId FROM user_progress WHERE userId = ${params.userId}))`
        );
      } else {
        // Only "new" selected - words with no progress record
        conditions.push(
          sql`${words.id} NOT IN (SELECT wordId FROM user_progress WHERE userId = ${params.userId})`
        );
      }
    } else {
      // Only non-new statuses
      conditions.push(
        sql`${words.id} IN (SELECT wordId FROM user_progress WHERE userId = ${params.userId} AND status IN (${sql.join(params.statuses.map(s => sql`${s}`), sql`, `)}))`
      );
    }
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

// ─── Korean Tokenization ────────────────────────────────────

const KOREAN_PARTICLES = [
  '은', '는', '이', '가', '을', '를', '에', '에서', '에게', '에게서',
  '으로', '로', '와', '과', '의', '도', '만', '까지', '부터', '마다',
  '처럼', '같이', '보다', '한테', '한테서', '께', '께서', '이나', '나',
  '이란', '란', '이라', '라', '이며', '며', '이고', '고', '이요', '요',
];

function stripParticles(word: string): string[] {
  const candidates = [word];
  for (const p of KOREAN_PARTICLES.sort((a, b) => b.length - a.length)) {
    if (word.endsWith(p) && word.length > p.length) {
      candidates.push(word.slice(0, -p.length));
    }
  }
  return Array.from(new Set(candidates));
}

export async function tokenizeAndLookup(sentence: string) {
  const db = await getDb();
  if (!db || !sentence) return [];

  const segmenter = new Intl.Segmenter('ko', { granularity: 'word' });
  const segments = Array.from(segmenter.segment(sentence));

  const tokens: { text: string; isWord: boolean; wordId: number | null; meaning: string | null }[] = [];

  // Collect all candidate forms for batch lookup
  const allCandidates: string[] = [];
  const tokenCandidateMap: { text: string; candidates: string[] }[] = [];

  for (const seg of segments) {
    if (seg.isWordLike) {
      const candidates = stripParticles(seg.segment);
      allCandidates.push(...candidates);
      tokenCandidateMap.push({ text: seg.segment, candidates });
    } else {
      tokenCandidateMap.push({ text: seg.segment, candidates: [] });
    }
  }

  // Batch lookup all candidates at once
  let lookupMap = new Map<string, { id: number; meaning: string }>();
  if (allCandidates.length > 0) {
    const uniqueCandidates = Array.from(new Set(allCandidates));
    // Query in chunks of 50 to avoid too-long IN clauses
    for (let i = 0; i < uniqueCandidates.length; i += 50) {
      const chunk = uniqueCandidates.slice(i, i + 50);
      const results = await db.select({ id: words.id, korean: words.korean, meaning: words.meaning })
        .from(words)
        .where(inArray(words.korean, chunk))
        .limit(chunk.length);
      for (const r of results) {
        lookupMap.set(r.korean, { id: r.id, meaning: r.meaning });
      }
    }
  }

  // Build token list with matches
  for (const item of tokenCandidateMap) {
    if (item.candidates.length > 0) {
      let match: { id: number; meaning: string } | undefined;
      for (const c of item.candidates) {
        match = lookupMap.get(c);
        if (match) break;
      }
      tokens.push({
        text: item.text,
        isWord: true,
        wordId: match?.id ?? null,
        meaning: match?.meaning ?? null,
      });
    } else {
      tokens.push({ text: item.text, isWord: false, wordId: null, meaning: null });
    }
  }

  return tokens;
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
