import { int, mysqlEnum, mysqlTable, text, varchar, index } from "drizzle-orm/mysql-core";
import { timestamp } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  // Guest session tracking
  guestSessionId: varchar("guestSessionId", { length: 255 }).unique(),
  // Stripe subscription fields
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  subscriptionStatus: mysqlEnum("subscriptionStatus", ["active", "trialing", "past_due", "canceled", "unpaid", "none"]).default("none").notNull(),
  subscriptionPlanId: varchar("subscriptionPlanId", { length: 255 }),
  wordAccessLimit: int("wordAccessLimit").notNull().default(150),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Subscription plans (stored for reference, actual pricing managed in Stripe).
 */
export const subscriptionPlans = mysqlTable("subscription_plans", {
  id: int("id").autoincrement().primaryKey(),
  stripePriceId: varchar("stripePriceId", { length: 255 }).notNull().unique(),
  stripeProductId: varchar("stripeProductId", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  priceInCents: int("priceInCents").notNull(),
  currency: varchar("currency", { length: 3 }).default("usd").notNull(),
  interval: mysqlEnum("interval", ["month", "year"]).notNull(),
  wordAccessLimit: int("wordAccessLimit").notNull(),
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = typeof subscriptionPlans.$inferInsert;

/**
 * Dictionary words for both Korean and Chinese.
 */
export const words = mysqlTable("words", {
  id: int("id").autoincrement().primaryKey(),
  language: mysqlEnum("language", ["korean", "chinese", "japanese"]).notNull().default("korean"),
  // Korean fields
  korean: varchar("korean", { length: 255 }),
  romanization: varchar("romanization", { length: 255 }).notNull().default(""),
  pos: varchar("pos", { length: 64 }).notNull().default(""),
  meaning: text("meaning").notNull(),
  meaningFr: text("meaningFr"),
  koreanExample: text("koreanExample"),
  exampleEnglish: text("exampleEnglish"),
  exampleFrench: text("exampleFrench"),
  topikLevel: mysqlEnum("topikLevel", ["beginner", "intermediate", "advanced"]).default("advanced"),
  // Chinese fields
  chinese: varchar("chinese", { length: 255 }),
  pinyin: varchar("pinyin", { length: 255 }).notNull().default(""),
  hskLevel: mysqlEnum("hskLevel", ["1", "2", "3", "4", "5", "6", "7", "8", "9"]),
  chineseExample: text("chineseExample"),
  examplePinyin: text("examplePinyin"),
  exampleChineseFrench: text("exampleChineseFrench"),
  // Japanese fields
  japanese: varchar("japanese", { length: 255 }),
  hiragana: varchar("hiragana", { length: 255 }).notNull().default(""),
  romaji: varchar("romaji", { length: 255 }).notNull().default(""),
  jlptLevel: mysqlEnum("jlptLevel", ["n5", "n4", "n3", "n2", "n1"]),
  japaneseExample: text("japaneseExample"),
  exampleRomaji: text("exampleRomaji"),
  exampleJapaneseFrench: text("exampleJapaneseFrench"),
}, (table) => [
  index("idx_words_language").on(table.language),
  index("idx_words_korean").on(table.korean),
  index("idx_words_chinese").on(table.chinese),
  index("idx_words_pos").on(table.pos),
  index("idx_words_topik").on(table.topikLevel),
  index("idx_words_hsk").on(table.hskLevel),
  index("idx_words_romanization").on(table.romanization),
  index("idx_words_meaning_fr").on(table.meaningFr),
  index("idx_words_japanese").on(table.japanese),
  index("idx_words_jlpt").on(table.jlptLevel),
]);

// Note: French translations are cached from Claude API batch job
// meaningFr: French translation of meaning (e.g., "eau" for "water")
// exampleFrench: French translation of koreanExample
// exampleChineseFrench: French translation of chineseExample
// exampleJapaneseFrench: French translation of japaneseExample
export type Word = typeof words.$inferSelect;
export type InsertWord = typeof words.$inferInsert;

/**
 * User progress tracking per word (supports both Korean and Chinese).
 */
export const userProgress = mysqlTable("user_progress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  wordId: int("wordId").notNull(),
  language: mysqlEnum("language", ["korean", "chinese", "japanese"]).notNull().default("korean"),
  status: mysqlEnum("status", ["new", "reviewing", "learned"]).notNull().default("new"),
  timesReviewed: int("timesReviewed").notNull().default(0),
  timesCorrect: int("timesCorrect").notNull().default(0),
  lastReviewedAt: timestamp("lastReviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("idx_progress_user").on(table.userId),
  index("idx_progress_word").on(table.wordId),
  index("idx_progress_language").on(table.language),
  index("idx_progress_user_word").on(table.userId, table.wordId),
  index("idx_progress_user_lang").on(table.userId, table.language),
  index("idx_progress_status").on(table.userId, table.status),
]);

export type UserProgress = typeof userProgress.$inferSelect;
export type InsertUserProgress = typeof userProgress.$inferInsert;

/**
 * User stats for gamification (XP, streaks, level) - per language.
 */
export const userStats = mysqlTable("user_stats", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  language: mysqlEnum("language", ["korean", "chinese", "japanese"]).notNull().default("korean"),
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
  index("idx_stats_user_lang").on(table.userId, table.language),
]);

export type UserStats = typeof userStats.$inferSelect;
export type InsertUserStats = typeof userStats.$inferInsert;

/**
 * App configuration (admin-settable prices, etc.)
 */
export const appConfig = mysqlTable("app_config", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 255 }).notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AppConfig = typeof appConfig.$inferSelect;
export type InsertAppConfig = typeof appConfig.$inferInsert;
