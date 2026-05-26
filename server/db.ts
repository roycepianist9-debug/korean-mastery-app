import { eq, and, like, or, sql, desc, asc, inArray, count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, words, userProgress, userStats, appConfig, savedWords, englishSynonyms } from "../drizzle/schema";
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
  hskLevel?: string;
  statuses?: string[];
  userId?: number;
  page: number;
  pageSize: number;
  language?: 'korean' | 'chinese' | 'japanese';
}) {
  const db = await getDb();
  if (!db) return { words: [], total: 0 };

  const conditions = [];

  // Language filter (default to korean)
  const language = params.language || 'korean';
  conditions.push(eq(words.language, language));

  if (params.query && params.query.trim()) {
    const q = `%${params.query.trim()}%`;
    if (language === 'japanese') {
      // For Japanese: search japanese characters, hiragana, romaji, and meaning
      conditions.push(
        or(
          like(words.japanese, q),
          like(words.hiragana, q),
          like(words.romaji, q),
          like(words.meaning, q)
        )
      );
    } else if (language === 'chinese') {
      // For Chinese: search chinese characters, pinyin, and meaning
      conditions.push(
        or(
          like(words.chinese, q),
          like(words.pinyin, q),
          like(words.meaning, q)
        )
      );
    } else {
      // For Korean: search korean, romanization, and meaning
      conditions.push(
        or(
          like(words.korean, q),
          like(words.romanization, q),
          like(words.meaning, q)
        )
      );
    }
  }

  if (params.pos && params.pos !== 'all') {
    conditions.push(eq(words.pos, params.pos));
  }

  if (params.topikLevel && params.topikLevel !== 'all') {
    conditions.push(eq(words.topikLevel, params.topikLevel as any));
  }

  if (params.hskLevel && params.hskLevel !== 'all') {
    conditions.push(eq(words.hskLevel, params.hskLevel as any));
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

export async function tokenizeAndLookup(sentence: string, language: 'korean' | 'chinese' = 'korean') {
  const db = await getDb();
  if (!db || !sentence) return [];

  const locale = language === 'chinese' ? 'zh' : 'ko';
  const segmenter = new Intl.Segmenter(locale, { granularity: 'word' });
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
      const results = await db.select({ id: words.id, korean: words.korean, chinese: words.chinese, meaning: words.meaning })
        .from(words)
        .where(language === 'chinese' ? inArray(words.chinese, chunk) : inArray(words.korean, chunk))
        .limit(chunk.length);
      for (const r of results) {
        const key = language === 'chinese' ? r.chinese : r.korean;
        if (key) {
          lookupMap.set(key, { id: r.id, meaning: r.meaning });
        }
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
  hskLevel?: string;
  jlptLevel?: string;
  limit: number;
  excludeIds?: number[];
  language?: 'korean' | 'chinese' | 'japanese';
  userId?: number;
  statuses?: string[];
}) {
  const db = await getDb();
  if (!db) return [];

  const language = params.language || 'korean';

  // If filtering by status, join with user_progress
  // 'new' means: no progress row at all OR status = 'new'
  if (params.statuses && params.statuses.length > 0 && params.userId) {
    const statusList = params.statuses;
    const hasNew = statusList.includes('new');
    const otherStatuses = statusList.filter(s => s !== 'new');
    const userId = params.userId;

    const baseConditions: any[] = [eq(words.language, language)];
    if (params.pos && params.pos !== 'all') baseConditions.push(eq(words.pos, params.pos));
    if (params.topikLevel && params.topikLevel !== 'all') baseConditions.push(eq(words.topikLevel, params.topikLevel as any));
    if (params.hskLevel && params.hskLevel !== 'all') baseConditions.push(eq(words.hskLevel, params.hskLevel as any));
    if (params.jlptLevel && params.jlptLevel !== 'all') baseConditions.push(eq(words.jlptLevel, params.jlptLevel as any));
    if (params.excludeIds && params.excludeIds.length > 0) {
      baseConditions.push(sql`${words.id} NOT IN (${sql.join(params.excludeIds.map(id => sql`${id}`), sql`, `)})`);
    }

    if (hasNew && otherStatuses.length === 0) {
      // Only 'new': words with no progress row for this user
      const rows = await db.select({ word: words })
        .from(words)
        .leftJoin(
          userProgress,
          and(eq(words.id, userProgress.wordId), eq(userProgress.userId, userId))
        )
        .where(and(...baseConditions, sql`${userProgress.id} IS NULL`))
        .orderBy(sql`RAND()`)
        .limit(params.limit);
      return rows.map(r => r.word);
    } else if (!hasNew && otherStatuses.length > 0) {
      // Only reviewing/learned: inner join
      const rows = await db.select({ word: words })
        .from(words)
        .innerJoin(
          userProgress,
          and(eq(words.id, userProgress.wordId), eq(userProgress.userId, userId))
        )
        .where(and(...baseConditions, inArray(userProgress.status, otherStatuses as any[])))
        .orderBy(sql`RAND()`)
        .limit(params.limit);
      return rows.map(r => r.word);
    } else {
      // Mix of new + others: left join, filter (no row OR status in list)
      const rows = await db.select({ word: words })
        .from(words)
        .leftJoin(
          userProgress,
          and(eq(words.id, userProgress.wordId), eq(userProgress.userId, userId))
        )
        .where(and(
          ...baseConditions,
          sql`(${userProgress.id} IS NULL OR ${userProgress.status} IN (${sql.join(otherStatuses.map(s => sql`${s}`), sql`, `)}))`,
        ))
        .orderBy(sql`RAND()`)
        .limit(params.limit);
      return rows.map(r => r.word);
    }
  }

  const conditions: any[] = [eq(words.language, language)];
  if (params.pos && params.pos !== 'all') conditions.push(eq(words.pos, params.pos));
  if (params.topikLevel && params.topikLevel !== 'all') conditions.push(eq(words.topikLevel, params.topikLevel as any));
  if (params.hskLevel && params.hskLevel !== 'all') conditions.push(eq(words.hskLevel, params.hskLevel as any));
  if (params.jlptLevel && params.jlptLevel !== 'all') conditions.push(eq(words.jlptLevel, params.jlptLevel as any));
  if (params.excludeIds && params.excludeIds.length > 0) {
    conditions.push(sql`${words.id} NOT IN (${sql.join(params.excludeIds.map(id => sql`${id}`), sql`, `)})`);
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  return db.select({
    id: words.id,
    korean: words.korean,
    romanization: words.romanization,
    pos: words.pos,
    meaning: words.meaning,
    meaningFr: words.meaningFr,
    koreanExample: words.koreanExample,
    exampleEnglish: words.exampleEnglish,
    exampleFrench: words.exampleFrench,
    topikLevel: words.topikLevel,
    chinese: words.chinese,
    pinyin: words.pinyin,
    chineseExample: words.chineseExample,
    examplePinyin: words.examplePinyin,
    exampleChineseFrench: words.exampleChineseFrench,
    language: words.language,
    hskLevel: words.hskLevel,
    japanese: words.japanese,
    hiragana: words.hiragana,
    romaji: words.romaji,
    jlptLevel: words.jlptLevel,
    japaneseExample: words.japaneseExample,
    exampleRomaji: words.exampleRomaji,
    exampleJapaneseFrench: words.exampleJapaneseFrench,
  })
    .from(words)
    .where(whereClause)
    .orderBy(sql`RAND()`)
    .limit(params.limit);
}

export async function getWordStats(language: 'korean' | 'chinese' | 'japanese' = 'korean') {
  const db = await getDb();
  if (!db) return { total: 0, byLevel: [], byPos: [] };

  const langCondition = eq(words.language, language);

  if (language === 'chinese') {
    const [totalResult, byLevel, byPos] = await Promise.all([
      db.select({ total: count() }).from(words).where(langCondition),
      db.select({ level: words.hskLevel, count: count() })
        .from(words)
        .where(langCondition)
        .groupBy(words.hskLevel),
      db.select({ pos: words.pos, count: count() })
        .from(words)
        .where(langCondition)
        .groupBy(words.pos)
        .orderBy(desc(count())),
    ]);
    return { total: totalResult[0]?.total ?? 0, byLevel, byPos };
  }

  if (language === 'japanese') {
    const [totalResult, byLevel, byPos] = await Promise.all([
      db.select({ total: count() }).from(words).where(langCondition),
      db.select({ level: words.jlptLevel, count: count() })
        .from(words)
        .where(langCondition)
        .groupBy(words.jlptLevel),
      db.select({ pos: words.pos, count: count() })
        .from(words)
        .where(langCondition)
        .groupBy(words.pos)
        .orderBy(desc(count())),
    ]);
    return { total: totalResult[0]?.total ?? 0, byLevel, byPos };
  }

  // Default to Korean
  const [totalResult, byLevel, byPos] = await Promise.all([
    db.select({ total: count() }).from(words).where(langCondition),
    db.select({ level: words.topikLevel, count: count() })
      .from(words)
      .where(langCondition)
      .groupBy(words.topikLevel),
    db.select({ pos: words.pos, count: count() })
      .from(words)
      .where(langCondition)
      .groupBy(words.pos)
      .orderBy(desc(count())),
  ]);

  return { total: totalResult[0]?.total ?? 0, byLevel, byPos };
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

export async function getUserProgressStats(userId: number, language: 'korean' | 'chinese' | 'japanese' = 'korean') {
  const db = await getDb();
  if (!db) return { new: 0, reviewing: 0, learned: 0, total: 0 };

  const result = await db.select({
    status: userProgress.status,
    count: count(),
  })
    .from(userProgress)
    .innerJoin(words, eq(userProgress.wordId, words.id))
    .where(and(eq(userProgress.userId, userId), eq(words.language, language)))
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

export async function getProgressByLevel(userId: number, language: 'korean' | 'chinese' | 'japanese' = 'korean') {
  const db = await getDb();
  if (!db) return [];

  if (language === 'chinese') {
    return db.select({
      hskLevel: words.hskLevel,
      status: userProgress.status,
      count: count(),
    })
      .from(userProgress)
      .innerJoin(words, eq(userProgress.wordId, words.id))
      .where(and(eq(userProgress.userId, userId), eq(words.language, 'chinese')))
      .groupBy(words.hskLevel, userProgress.status);
  }

  if (language === 'japanese') {
    return db.select({
      jlptLevel: words.jlptLevel,
      status: userProgress.status,
      count: count(),
    })
      .from(userProgress)
      .innerJoin(words, eq(userProgress.wordId, words.id))
      .where(and(eq(userProgress.userId, userId), eq(words.language, 'japanese')))
      .groupBy(words.jlptLevel, userProgress.status);
  }

  return db.select({
    topikLevel: words.topikLevel,
    status: userProgress.status,
    count: count(),
  })
    .from(userProgress)
    .innerJoin(words, eq(userProgress.wordId, words.id))
    .where(and(eq(userProgress.userId, userId), eq(words.language, 'korean')))
    .groupBy(words.topikLevel, userProgress.status);
}

export async function getProgressByPos(userId: number, language: 'korean' | 'chinese' | 'japanese' = 'korean') {
  const db = await getDb();
  if (!db) return [];

  return db.select({
    pos: words.pos,
    status: userProgress.status,
    count: count(),
  })
    .from(userProgress)
    .innerJoin(words, eq(userProgress.wordId, words.id))
    .where(and(eq(userProgress.userId, userId), eq(words.language, language)))
    .groupBy(words.pos, userProgress.status);
}

export async function getOrCreateUserStats(userId: number, language: 'korean' | 'chinese' | 'japanese' = 'korean') {
  const db = await getDb();
  if (!db) return null;

  const existing = await db.select()
    .from(userStats)
    .where(and(eq(userStats.userId, userId), eq(userStats.language, language)))
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  await db.insert(userStats).values({
    userId,
    language,
    xp: 0,
    currentStreak: 0,
    longestStreak: 0,
    totalWordsLearned: 0,
    totalReviews: 0,
  });

  const result = await db.select()
    .from(userStats)
    .where(and(eq(userStats.userId, userId), eq(userStats.language, language)))
    .limit(1);

  return result[0] ?? null;
}

export async function updateUserStatsAfterSwipe(userId: number, language: 'korean' | 'chinese' | 'japanese', learnedCount: number) {
  const db = await getDb();
  if (!db) return;

  const stats = await getOrCreateUserStats(userId, language);
  if (!stats) return;

  const today = new Date().toISOString().split('T')[0];
  const isNewDay = stats.lastStudyDate !== today;
  const newStreak = isNewDay ? stats.currentStreak + 1 : stats.currentStreak;
  const longestStreak = Math.max(newStreak, stats.longestStreak);

  await db.update(userStats)
    .set({
      xp: sql`${userStats.xp} + ${learnedCount * 10}`,
      currentStreak: newStreak,
      longestStreak,
      lastStudyDate: today,
      totalReviews: sql`${userStats.totalReviews} + 1`,
      totalWordsLearned: sql`${userStats.totalWordsLearned} + ${learnedCount}`,
      updatedAt: new Date(),
    })
    .where(and(eq(userStats.userId, userId), eq(userStats.language, language)));
}

/**
 * Returns the count of words first marked as 'learned' per calendar day
 * for the last N days, for a given user and language.
 * Uses updatedAt as the proxy for when a word was learned.
 */
export async function getDailyLearnedHistory(
  userId: number,
  language: 'korean' | 'chinese' | 'japanese' = 'korean',
  days: number = 30
) {
  const db = await getDb();
  if (!db) return [];

  // Build date range: today back N days
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - (days - 1));
  cutoff.setHours(0, 0, 0, 0);

  const rows = await db.select({
    day: sql<string>`DATE(${userProgress.updatedAt})`,
    count: count(),
  })
    .from(userProgress)
    .innerJoin(words, eq(userProgress.wordId, words.id))
    .where(and(
      eq(userProgress.userId, userId),
      eq(userProgress.status, 'learned'),
      eq(words.language, language),
      sql`${userProgress.updatedAt} >= ${cutoff}`
    ))
    .groupBy(sql`DATE(${userProgress.updatedAt})`)
    .orderBy(sql`DATE(${userProgress.updatedAt})`);

  // Fill in missing days with 0
  const map = new Map<string, number>();
  for (const row of rows) map.set(row.day, row.count);

  const result: { day: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    result.push({ day: key, count: map.get(key) ?? 0 });
  }
  return result;
}

/**
 * Returns the count of words learned today for a given user and language.
 */
export async function getTodayLearnedCount(
  userId: number,
  language: 'korean' | 'chinese' | 'japanese' | 'japanese' = 'korean'
) {
  const db = await getDb();
  if (!db) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const rows = await db.select({ count: count() })
    .from(userProgress)
    .innerJoin(words, eq(userProgress.wordId, words.id))
    .where(and(
      eq(userProgress.userId, userId),
      eq(userProgress.status, 'learned'),
      eq(words.language, language),
      sql`${userProgress.updatedAt} >= ${today}`
    ));

  return rows[0]?.count ?? 0;
}

// App config helpers
export async function getAppConfig(key: string): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(appConfig).where(eq(appConfig.key, key)).limit(1);
  return result[0]?.value ?? null;
}

export async function setAppConfig(key: string, value: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(appConfig).values({ key, value }).onDuplicateKeyUpdate({ set: { value } });
}

// ─── Saved Words Queries ────────────────────────────────────────────────────────────────────────

export async function addSavedWord(userId: number, wordId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  // Check if already saved
  const existing = await db.select()
    .from(savedWords)
    .where(and(eq(savedWords.userId, userId), eq(savedWords.wordId, wordId)))
    .limit(1);
  
  if (existing.length === 0) {
    await db.insert(savedWords).values({ userId, wordId });
  }
}

export async function removeSavedWord(userId: number, wordId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.delete(savedWords)
    .where(and(eq(savedWords.userId, userId), eq(savedWords.wordId, wordId)));
}

export async function getSavedWords(userId: number, language: 'korean' | 'chinese' | 'japanese' = 'korean') {
  const db = await getDb();
  if (!db) return [];
  
  return db.select()
    .from(savedWords)
    .innerJoin(words, eq(savedWords.wordId, words.id))
    .where(and(eq(savedWords.userId, userId), eq(words.language, language)))
    .orderBy(desc(savedWords.createdAt));
}

export async function isSavedWord(userId: number, wordId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  const result = await db.select()
    .from(savedWords)
    .where(and(eq(savedWords.userId, userId), eq(savedWords.wordId, wordId)))
    .limit(1);
  
  return result.length > 0;
}

// ─── English Synonyms Queries ───────────────────────────────────────────────────────────────────

export async function getEnglishSynonyms(word: string) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select()
    .from(englishSynonyms)
    .where(eq(englishSynonyms.word, word.toLowerCase()))
    .limit(1);
  
  const data = result[0];
  if (data && typeof data.synonyms === 'string') {
    data.synonyms = JSON.parse(data.synonyms);
  }
  return data ?? null;
}

export async function getEnglishSynonymsByLevel(level: 'beginner' | 'intermediate' | 'advanced') {
  const db = await getDb();
  if (!db) return [];
  
  const results = await db.select()
    .from(englishSynonyms)
    .where(eq(englishSynonyms.level, level))
    .orderBy(asc(englishSynonyms.word));
  
  return results.map(data => {
    if (typeof data.synonyms === 'string') {
      data.synonyms = JSON.parse(data.synonyms);
    }
    return data;
  });
}

export async function getAllEnglishSynonyms(limit: number = 300, offset: number = 0) {
  const db = await getDb();
  if (!db) return { synonyms: [], total: 0 };
  
  const [results, countResult] = await Promise.all([
    db.select()
      .from(englishSynonyms)
      .orderBy(asc(englishSynonyms.word))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(englishSynonyms),
  ]);
  
  const parsedResults = results.map(data => {
    if (typeof data.synonyms === 'string') {
      data.synonyms = JSON.parse(data.synonyms);
    }
    return data;
  });
  
  return {
    synonyms: parsedResults,
    total: countResult[0]?.total ?? 0,
  };
}

export async function upsertEnglishSynonym(data: {
  word: string;
  partOfSpeech: string;
  synonyms: string[];
  level?: 'beginner' | 'intermediate' | 'advanced';
}): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  const insertData = {
    word: data.word.toLowerCase(),
    partOfSpeech: data.partOfSpeech,
    synonyms: JSON.stringify(data.synonyms),
    level: data.level || 'intermediate',
  };
  
  await db.insert(englishSynonyms)
    .values(insertData as any)
    .onDuplicateKeyUpdate({ set: insertData as any });
}

export async function deleteEnglishSynonym(word: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.delete(englishSynonyms)
    .where(eq(englishSynonyms.word, word.toLowerCase()));
}


// Export the database instance getter
export { getDb as db };
