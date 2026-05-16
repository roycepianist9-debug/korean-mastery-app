import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, index } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Korean dictionary words from KRDICT.
 */
export const words = mysqlTable("words", {
  id: int("id").autoincrement().primaryKey(),
  korean: varchar("korean", { length: 255 }).notNull(),
  romanization: varchar("romanization", { length: 255 }).notNull().default(""),
  pos: varchar("pos", { length: 64 }).notNull().default(""),
  meaning: text("meaning").notNull(),
  koreanExample: text("koreanExample"),
  exampleEnglish: text("exampleEnglish"),
  topikLevel: mysqlEnum("topikLevel", ["beginner", "intermediate", "advanced"]).notNull().default("advanced"),
  chineseTerm: varchar("chineseTerm", { length: 255 }).notNull().default(""),
  pinyin: varchar("pinyin", { length: 255 }).notNull().default(""),
  chineseExample: text("chineseExample"),
  examplePinyin: text("examplePinyin"),
}, (table) => [
  index("idx_words_korean").on(table.korean),
  index("idx_words_pos").on(table.pos),
  index("idx_words_topik").on(table.topikLevel),
  index("idx_words_romanization").on(table.romanization),
]);

export type Word = typeof words.$inferSelect;
export type InsertWord = typeof words.$inferInsert;

/**
 * User progress tracking per word.
 */
export const userProgress = mysqlTable("user_progress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  wordId: int("wordId").notNull(),
  status: mysqlEnum("status", ["new", "reviewing", "learned"]).notNull().default("new"),
  timesReviewed: int("timesReviewed").notNull().default(0),
  timesCorrect: int("timesCorrect").notNull().default(0),
  lastReviewedAt: timestamp("lastReviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("idx_progress_user").on(table.userId),
  index("idx_progress_word").on(table.wordId),
  index("idx_progress_user_word").on(table.userId, table.wordId),
  index("idx_progress_status").on(table.userId, table.status),
]);

export type UserProgress = typeof userProgress.$inferSelect;
export type InsertUserProgress = typeof userProgress.$inferInsert;

/**
 * User stats for gamification (XP, streaks, level).
 */
export const userStats = mysqlTable("user_stats", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  xp: int("xp").notNull().default(0),
  currentStreak: int("currentStreak").notNull().default(0),
  longestStreak: int("longestStreak").notNull().default(0),
  lastStudyDate: varchar("lastStudyDate", { length: 10 }),
  totalWordsLearned: int("totalWordsLearned").notNull().default(0),
  totalReviews: int("totalReviews").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("idx_stats_user").on(table.userId),
]);

export type UserStats = typeof userStats.$inferSelect;
export type InsertUserStats = typeof userStats.$inferInsert;
