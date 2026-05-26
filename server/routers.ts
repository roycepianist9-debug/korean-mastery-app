import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { invokeLLM } from "./_core/llm";
import Stripe from "stripe";
import { STRIPE_PRODUCTS, FREE_PLAN, FREE_WORD_LIMIT } from "./stripe-products";
import { getDb } from "./db";
import { users, words, appConfig } from "../drizzle/schema";
import { eq, sql } from "drizzle-orm";
import { startBatchTranslationJob, getJobStatus } from "./backgroundJobs";
import { JAPANESE_VOCAB_300 } from "./japanese-vocab-300";
import { adminProcedure } from "./_core/trpc";
import { storagePut } from "./storage";
import { englishSynonymsRouter } from "./englishSynonymsRouter";
import { basicsRouter } from "./basicsRouter";
import { customListsRouter } from "./customListsRouter";
import {
  searchWords,
  getWordById,
  getRandomWords,
  getWordStats,
  getUserProgress,
  upsertWordProgress,
  getUserProgressStats,
  getProgressByLevel,
  getProgressByPos,
  getOrCreateUserStats,
  updateUserStatsAfterSwipe,
  tokenizeAndLookup,
  getDailyLearnedHistory,
  getTodayLearnedCount,
  getAppConfig,
  setAppConfig,
  addSavedWord,
  removeSavedWord,
  getSavedWords,
  isSavedWord,
  getEnglishSynonyms,
  getEnglishSynonymsByLevel,
  getAllEnglishSynonyms,
  upsertEnglishSynonym,
  deleteEnglishSynonym,
  createCustomList,
  getCustomListsByUser,
  getCustomList,
  updateCustomList,
  deleteCustomList,
  addWordToList,
  removeWordFromList,
  getListWords,
} from "./db";

export const appRouter = router({
  system: systemRouter,
  basics: basicsRouter,
  customLists: customListsRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  words: router({
    search: publicProcedure
      .input(z.object({
        query: z.string().optional(),
        pos: z.string().optional(),
        topikLevel: z.string().optional(),
        hskLevel: z.string().optional(),
        statuses: z.array(z.string()).optional(),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(30),
        language: z.enum(['korean', 'chinese', 'japanese']).optional(),
      }))
      .query(async ({ input, ctx }) => {
        return searchWords({
          ...input,
          userId: ctx.user?.id,
        });
      }),

    tokenize: publicProcedure
      .input(z.object({ sentence: z.string(), language: z.enum(['korean', 'chinese']).optional() }))
      .query(({ input }) => {
        return tokenizeAndLookup(input.sentence, input.language || 'korean');
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getWordById(input.id);
      }),

    random: publicProcedure
      .input(z.object({
        pos: z.string().optional(),
        topikLevel: z.string().optional(),
        hskLevel: z.string().optional(),
        jlptLevel: z.string().optional(),
        limit: z.number().min(1).max(100).default(10),
        excludeIds: z.array(z.number()).optional(),
        language: z.enum(['korean', 'chinese', 'japanese']).optional(),
        statuses: z.array(z.string()).optional(),
      }))
      .query(async ({ input, ctx }) => {
        if (input.language === 'japanese') {
          console.log('[DEBUG] words.random Japanese query:', { language: input.language, jlptLevel: input.jlptLevel, pos: input.pos, limit: input.limit });
        }
        return getRandomWords({
          pos: input.pos,
          topikLevel: input.topikLevel,
          hskLevel: input.hskLevel,
          jlptLevel: input.jlptLevel,
          limit: input.limit,
          excludeIds: input.excludeIds,
          language: input.language,
          statuses: input.statuses,
          userId: ctx.user?.id,
        });
      }),

    stats: publicProcedure
      .input(z.object({ language: z.enum(['korean', 'chinese', 'japanese']).optional() }).optional())
      .query(async ({ input }) => {
        return getWordStats(input?.language || 'korean');
      }),
  }),

  progress: router({
    getStats: publicProcedure
      .input(z.object({ language: z.enum(['korean', 'chinese', 'japanese']).optional() }).optional())
      .query(async ({ ctx, input }) => {
        return getUserProgressStats(ctx.guestId, input?.language || 'korean');
      }),

    getByLevel: publicProcedure
      .input(z.object({ language: z.enum(['korean', 'chinese', 'japanese']).optional() }).optional())
      .query(async ({ ctx, input }) => {
        return getProgressByLevel(ctx.guestId, input?.language || 'korean');
      }),

    getByPos: publicProcedure
      .input(z.object({ language: z.enum(['korean', 'chinese', 'japanese']).optional() }).optional())
      .query(async ({ ctx, input }) => {
        return getProgressByPos(ctx.guestId, input?.language || 'korean');
      }),

    getForWords: publicProcedure
      .input(z.object({ wordIds: z.array(z.number()) }))
      .query(async ({ ctx, input }) => {
        return getUserProgress(ctx.guestId, input.wordIds);
      }),

    markWord: publicProcedure
      .input(z.object({
        wordId: z.number(),
        status: z.enum(['learned', 'reviewing', 'new']),
        language: z.enum(['korean', 'chinese', 'japanese']).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Paywall check: count learned words for this language
        if (input.status === 'learned') {
          const stats = await getUserProgressStats(ctx.guestId, input.language || 'korean');
          const db = await getDb();
          const userRecord = db ? await db.select().from(users).where(eq(users.id, ctx.guestId)).limit(1) : [];
          const limit = userRecord[0]?.wordAccessLimit ?? FREE_WORD_LIMIT;
          if (stats.learned >= limit) {
            return { status: 'paywall_blocked' as const, learnedCount: stats.learned, limit };
          }
        }
        const correct = input.status === 'learned';
        await upsertWordProgress(ctx.guestId, input.wordId, input.status, correct);
        if (input.status !== 'new') {
          const xpGained = input.status === 'learned' ? 10 : 3;
          const wordsLearned = input.status === 'learned' ? 1 : 0;
          await updateUserStatsAfterSwipe(ctx.guestId, input.language || 'korean', wordsLearned);
        }
        return { status: input.status };
      }),

    swipe: publicProcedure
      .input(z.object({
        wordId: z.number(),
        known: z.boolean(),
        language: z.enum(['korean', 'chinese', 'japanese']).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Paywall check for "learned" swipes
        if (input.known) {
          const stats = await getUserProgressStats(ctx.guestId, input.language || 'korean');
          const db = await getDb();
          const userRecord = db ? await db.select().from(users).where(eq(users.id, ctx.guestId)).limit(1) : [];
          const limit = userRecord[0]?.wordAccessLimit ?? FREE_WORD_LIMIT;
          if (stats.learned >= limit) {
            return { status: 'paywall_blocked' as const, xpGained: 0, learnedCount: stats.learned, limit };
          }
        }

        const status = input.known ? 'learned' as const : 'reviewing' as const;
        await upsertWordProgress(ctx.guestId, input.wordId, status, input.known);

        // XP: 10 for learned, 3 for reviewing
        const xpGained = input.known ? 10 : 3;
        const wordsLearned = input.known ? 1 : 0;
        await updateUserStatsAfterSwipe(ctx.guestId, input.language || 'korean', wordsLearned);

        return { status, xpGained };
      }),

    batchSwipe: publicProcedure
      .input(z.object({
        results: z.array(z.object({
          wordId: z.number(),
          known: z.boolean(),
        })),
        language: z.enum(['korean', 'chinese', 'japanese']).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        let totalXp = 0;
        let totalLearned = 0;

        for (const result of input.results) {
          const status = result.known ? 'learned' as const : 'reviewing' as const;
          await upsertWordProgress(ctx.guestId, result.wordId, status, result.known);
          totalXp += result.known ? 10 : 3;
          if (result.known) totalLearned += 1;
        }

        await updateUserStatsAfterSwipe(ctx.guestId, input.language || 'korean', totalLearned);

        return { totalXp, totalLearned, totalReviewed: input.results.length };
      }),

    todayCount: publicProcedure
      .input(z.object({ language: z.enum(['korean', 'chinese', 'japanese']).optional() }).optional())
      .query(async ({ ctx, input }) => {
        const count = await getTodayLearnedCount(ctx.guestId, input?.language || 'korean');
        return { count };
      }),

    dailyHistory: publicProcedure
      .input(z.object({
        language: z.enum(['korean', 'chinese', 'japanese']).optional(),
        days: z.number().min(7).max(90).default(30),
      }).optional())
      .query(async ({ ctx, input }) => {
        return getDailyLearnedHistory(
          ctx.guestId,
          input?.language || 'korean',
          input?.days || 30
        );
      }),
  }),

  gamification: router({
    getStats: protectedProcedure.query(async ({ ctx }) => {
      const stats = await getOrCreateUserStats(ctx.guestId);
      if (!stats) return {
        xp: 0, currentStreak: 0, longestStreak: 0,
        totalWordsLearned: 0, totalReviews: 0, level: 1, levelTitle: 'Beginner',
      };

      // Calculate level from XP
      const level = Math.floor(stats.xp / 100) + 1;
      const levelTitles = [
        'Beginner', 'Novice', 'Apprentice', 'Student', 'Scholar',
        'Adept', 'Expert', 'Master', 'Grandmaster', 'Legend',
      ];
      const levelTitle = levelTitles[Math.min(level - 1, levelTitles.length - 1)] ?? 'Legend';

      return {
        xp: stats.xp,
        currentStreak: stats.currentStreak,
        longestStreak: stats.longestStreak,
        totalWordsLearned: stats.totalWordsLearned,
        totalReviews: stats.totalReviews,
        level,
        levelTitle,
      };
    }),
  }),

  subscription: router({
    getPlans: publicProcedure.query(async () => {
      return {
        free: FREE_PLAN,
        plans: Object.values(STRIPE_PRODUCTS),
      };
    }),

    createCheckoutSession: protectedProcedure
      .input(z.object({
        priceId: z.string(),
        origin: z.string().optional(),
        locale: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
        // Use origin from frontend input first, then request header, then production domain
        const origin = input.origin || ctx.req.headers.origin || "https://swipefluent.co";
        console.log("[Stripe] Creating checkout session:", { priceId: input.priceId, origin, email: ctx.user.email, locale: input.locale });
        console.log("[Stripe] Multi-Currency Presentment: Stripe will auto-detect user location and display EUR for Eurozone users");

        try {
          const session = await stripe.checkout.sessions.create({
            customer_email: ctx.user.email || undefined,
            client_reference_id: ctx.guestId.toString(),
            metadata: {
              user_id: ctx.guestId.toString(),
              customer_email: ctx.user.email || "",
              customer_name: ctx.user.name || "",
            },
            line_items: [
              {
                price: input.priceId,
                quantity: 1,
              },
            ],
            mode: "subscription",
            success_url: `${origin}/?upgraded=true`,
            cancel_url: `${origin}/`,
            allow_promotion_codes: true,
            // Enable Multi-Currency Presentment: Stripe auto-detects user location
            // Users from France/Eurozone see EUR pricing at parity ($9.99 = €9.99)
            locale: (input.locale || 'auto') as any,
            automatic_tax: {
              enabled: true,
            },
            billing_address_collection: 'required',
          });
          console.log("[Stripe] Session created:", { id: session.id, url: session.url, status: session.status, currency: session.currency });
          console.log("[Stripe] Multi-Currency Presentment ACTIVE: Stripe detected currency as", session.currency, "- EUR for Eurozone, USD for others");
          if (!session.url) {
            console.error("[Stripe] Session URL is null/undefined! Full session:", JSON.stringify(session, null, 2));
          }
          console.log("[Stripe] EUR/USD conversion: $9.99/mo → €9.99/mo at parity rate for Eurozone users");
          return { checkoutUrl: session.url, currency: session.currency || 'usd' };
        } catch (error: any) {
          const errorMsg = error?.message || JSON.stringify(error);
          const errorCode = error?.code || 'UNKNOWN';
          const errorType = error?.type || 'unknown';
          console.error("[Stripe] Checkout session creation FAILED");
          console.error("  Code:", errorCode);
          console.error("  Type:", errorType);
          console.error("  Message:", errorMsg);
          console.error("  Full error:", error);
          throw new Error(`Stripe API rejected session: ${errorCode} - ${errorMsg}`);
        }
      }),

    getSubscriptionStatus: protectedProcedure.query(async ({ ctx }) => {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

      try {
        const db = await getDb();
        if (!db) {
          return {
            status: "free",
            plan: FREE_PLAN,
            wordAccessLimit: FREE_WORD_LIMIT,
          };
        }

        // Get user from database to check subscription status
        const userRecords = await db.select().from(users).where(eq(users.id, ctx.guestId)).limit(1);
        const userRecord = userRecords[0];

        if (!userRecord?.stripeSubscriptionId) {
          return {
            status: "free",
            plan: FREE_PLAN,
            wordAccessLimit: FREE_WORD_LIMIT,
          };
        }

        // Fetch subscription from Stripe
        const subscription = await stripe.subscriptions.retrieve(
          userRecord.stripeSubscriptionId
        );

        const plan = Object.values(STRIPE_PRODUCTS).find(
          (p) => p.stripePriceId === subscription.items.data[0]?.price.id
        );

        const periodEnd = (subscription as any).current_period_end || 0;
        return {
          status: subscription.status as string,
          plan: plan || null,
          wordAccessLimit: userRecord.wordAccessLimit,
          subscriptionId: subscription.id,
          currentPeriodEnd: new Date(periodEnd * 1000),
        };
      } catch (error) {
        console.error("[Stripe] Failed to get subscription status:", error);
        return {
          status: "free",
          plan: FREE_PLAN,
          wordAccessLimit: FREE_WORD_LIMIT,
        };
      }
    }),

    openCustomerPortal: protectedProcedure.mutation(async ({ ctx }) => {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        const userRecords = await db.select().from(users).where(eq(users.id, ctx.guestId)).limit(1);
        const userRecord = userRecords[0];

        if (!userRecord?.stripeCustomerId) {
          throw new Error("No Stripe customer found");
        }

        const session = await stripe.billingPortal.sessions.create({
          customer: userRecord.stripeCustomerId,
          return_url: `${ctx.req.headers.origin}/dashboard`,
        });

        return { portalUrl: session.url };
      } catch (error) {
        console.error("[Stripe] Failed to create portal session:", error);
        throw new Error("Failed to open customer portal");
      }
    }),
  }),

  savedWords: router({
    add: protectedProcedure
      .input(z.object({ wordId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await addSavedWord(ctx.user.id, input.wordId);
        return { success: true };
      }),
    
    remove: protectedProcedure
      .input(z.object({ wordId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await removeSavedWord(ctx.user.id, input.wordId);
        return { success: true };
      }),
    
    list: protectedProcedure
      .input(z.object({ language: z.enum(['korean', 'chinese', 'japanese']).optional() }).optional())
      .query(async ({ ctx, input }) => {
        const result = await getSavedWords(ctx.user.id, input?.language || 'korean');
        return result.map(r => r.words);
      }),
    
    isSaved: protectedProcedure
      .input(z.object({ wordId: z.number() }))
      .query(async ({ ctx, input }) => {
        return isSavedWord(ctx.user.id, input.wordId);
      }),
  }),

  llm: router({}),

  englishSynonyms: englishSynonymsRouter,

  admin: router({
    // Get current pricing config and admin status
    getConfig: protectedProcedure
      .query(async ({ ctx }) => {
        const { ENV } = await import('./_core/env');
        if (ctx.user.openId !== ENV.ownerOpenId && ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access only' });
        }
        const db = await getDb();
        const userRecord = db
          ? (await db.select().from(users).where(eq(users.id, ctx.guestId)).limit(1))[0]
          : null;
        const freeWordCapStr = await getAppConfig('freeWordCap');
        const freeWordCap = freeWordCapStr ? parseInt(freeWordCapStr) : 150;
        const proMonthlyStr = await getAppConfig('proMonthlyPriceCents');
        const proAnnualStr = await getAppConfig('proAnnualPriceCents');
        return {
          proMonthlyPriceCents: proMonthlyStr ? parseInt(proMonthlyStr) : 999,
          proAnnualPriceCents: proAnnualStr ? parseInt(proAnnualStr) : 9999,
          adminBypass: (userRecord?.wordAccessLimit ?? 0) >= 999999,
          wordAccessLimit: userRecord?.wordAccessLimit ?? 150,
          freeWordCap,
          isOwner: ctx.user.openId === ENV.ownerOpenId,
        };
      }),

    extractAndAddExampleWords: protectedProcedure
      .mutation(async ({ ctx }) => {
        const { ENV } = await import('./_core/env');
        if (ctx.user.openId !== ENV.ownerOpenId && ctx.user.role !== 'admin') {
          throw new Error('Unauthorized');
        }

        const db = await getDb();
        if (!db) throw new Error('Database not available');

        // Get all Korean example sentences
        const examplesResult = await db.select({ koreanExample: words.koreanExample }).from(words).where(sql`${words.koreanExample} IS NOT NULL AND ${words.koreanExample} != ''`);
        console.log(`[Extract Words] Found ${examplesResult.length} unique example sentences`);

        const allWords = new Set<string>();
        const KOREAN_PARTICLES = [
          '은', '는', '이', '가', '을', '를', '에', '에서', '에게', '에게서',
          '으로', '로', '와', '과', '의', '도', '만', '까지', '부터', '마다',
          '처럼', '같이', '보다', '한테', '한테서', '께', '께서', '이나', '나',
          '이란', '란', '이라', '라', '이며', '며', '이고', '고', '이요', '요',
        ];

        // Extract words from all examples
        for (const row of examplesResult) {
          const sentence = row.koreanExample;
          if (!sentence) continue;

          // Simple tokenization: split by spaces and punctuation
          const tokens = sentence.split(/[\s.,!?;:\-—()[\]{}"'']/g).filter(t => t.length > 0);

          for (const token of tokens) {
            // Add the token itself
            allWords.add(token);

            // Add forms without particles
            for (const p of KOREAN_PARTICLES.sort((a, b) => b.length - a.length)) {
              if (token.endsWith(p) && token.length > p.length) {
                allWords.add(token.slice(0, -p.length));
              }
            }
          }
        }

        console.log(`[Extract Words] Extracted ${allWords.size} unique words`);

        // Check which words are already in the database
        const dbWordsResult = await db.select({ korean: words.korean }).from(words).where(sql`${words.korean} IS NOT NULL`);
        const existingWords = new Set(dbWordsResult.map(r => r.korean || ''));
        console.log(`[Extract Words] Database has ${existingWords.size} words`);

        // Find missing words
        const missingWords = Array.from(allWords).filter(w => !existingWords.has(w) && w.length > 0);
        console.log(`[Extract Words] Found ${missingWords.length} missing words`);

        if (missingWords.length === 0) {
          return {
            success: true,
            message: 'All words from examples are already in the database!',
            missingCount: 0,
            sampleMissing: [],
          };
        }

        // Show sample of missing words
        const sampleMissing = missingWords.slice(0, 30);

        return {
          success: true,
          message: `Found ${missingWords.length} missing words from example sentences`,
          missingCount: missingWords.length,
          sampleMissing,
          nextStep: 'Use batch translation to populate meanings for these words, or add them manually.',
        };
      }),

    getAppBranding: protectedProcedure
      .query(async ({ ctx }) => {
      const db = await getDb();
      const logoUrl = await getAppConfig('logoUrl');
      const taglineEn = await getAppConfig('taglineEn');
      const taglineFr = await getAppConfig('taglineFr');
      return {
        logoUrl: logoUrl || null,
        taglineEn: taglineEn || 'SwipeFluent — The fastest way to learn Korean & Chinese',
        taglineFr: taglineFr || 'SwipeFluent — La manière la plus rapide d\'apprendre le coréen et le chinois',
      };
    }),

    // Toggle unlimited access for the owner
    toggleAdminBypass: protectedProcedure
      .input(z.object({ enabled: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        const { ENV } = await import('./_core/env');
        if (ctx.user.openId !== ENV.ownerOpenId && ctx.user.role !== 'admin') {
          throw new Error('Unauthorized');
        }
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        const newLimit = input.enabled ? 999999 : 150;
        await db.update(users).set({ wordAccessLimit: newLimit }).where(eq(users.id, ctx.guestId));
        return { success: true, wordAccessLimit: newLimit };
      }),

    updatePricing: protectedProcedure
      .input(z.object({
        proMonthlyPriceCents: z.number().min(50),
        proAnnualPriceCents: z.number().min(500),
      }))
      .mutation(async ({ ctx, input }) => {
        const { ENV } = await import('./_core/env');
        if (ctx.user.openId !== ENV.ownerOpenId && ctx.user.role !== 'admin') {
          throw new Error('Unauthorized');
        }
        await setAppConfig('proMonthlyPriceCents', input.proMonthlyPriceCents.toString());
        await setAppConfig('proAnnualPriceCents', input.proAnnualPriceCents.toString());
        return { success: true, ...input };
      }),

    updateFreeWordCap: protectedProcedure
      .input(z.object({ wordCap: z.number().min(10).max(10000) }))
      .mutation(async ({ ctx, input }) => {
        const { ENV } = await import('./_core/env');
        if (ctx.user.openId !== ENV.ownerOpenId && ctx.user.role !== 'admin') {
          throw new Error('Unauthorized');
        }
        await setAppConfig('freeWordCap', input.wordCap.toString());
        return { success: true, wordCap: input.wordCap };
      }),

    editWordDefinition: protectedProcedure
      .input(z.object({
        wordId: z.number(),
        meaningFr: z.string().min(1).max(500),
      }))
      .mutation(async ({ ctx, input }) => {
        const { ENV } = await import('./_core/env');
        if (ctx.user.openId !== ENV.ownerOpenId && ctx.user.role !== 'admin') {
          throw new Error('Unauthorized');
        }
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        await db.update(words).set({ meaningFr: input.meaningFr }).where(eq(words.id, input.wordId));
        return { success: true, wordId: input.wordId, meaningFr: input.meaningFr };
      }),

    // Batch translate Chinese example sentences to French (async background job)
    batchTranslateChinese: protectedProcedure
      .mutation(async ({ ctx }) => {
        const { ENV } = await import('./_core/env');
        if (ctx.user.openId !== ENV.ownerOpenId && ctx.user.role !== 'admin') {
          throw new Error('Unauthorized');
        }
        
        // Start async job and return immediately
        const result = await startBatchTranslationJob('chinese');
        return {
          success: true,
          ...result,
        };
      }),

    // Batch translate Korean example sentences to French (async background job)
    batchTranslateKorean: protectedProcedure
      .mutation(async ({ ctx }) => {
        const { ENV } = await import('./_core/env');
        if (ctx.user.openId !== ENV.ownerOpenId && ctx.user.role !== 'admin') {
          throw new Error('Unauthorized');
        }
        
        // Start async job and return immediately
        const result = await startBatchTranslationJob('korean');
        return {
          success: true,
          ...result,
        };
      }),

    // Get batch translation job status
    getBatchJobStatus: protectedProcedure
      .input(z.object({ jobId: z.string() }))
      .query(async ({ ctx, input }) => {
        const { ENV } = await import('./_core/env');
        if (ctx.user.openId !== ENV.ownerOpenId && ctx.user.role !== 'admin') {
          throw new Error('Unauthorized');
        }
        
        const status = getJobStatus(input.jobId);
        return status || { error: 'Job not found' };
      }),

    // Update app tagline (English and French)
    updateTagline: protectedProcedure
      .input(z.object({
        taglineEn: z.string().min(1).max(500),
        taglineFr: z.string().min(1).max(500),
      }))
      .mutation(async ({ ctx, input }) => {
        const { ENV } = await import('./_core/env');
        if (ctx.user.openId !== ENV.ownerOpenId && ctx.user.role !== 'admin') {
          throw new Error('Unauthorized');
        }
        await setAppConfig('taglineEn', input.taglineEn);
        await setAppConfig('taglineFr', input.taglineFr);
        return { success: true, taglineEn: input.taglineEn, taglineFr: input.taglineFr };
      }),

    // Import 300 Japanese JLPT N5 words
    importJapanese300: adminProcedure
      .mutation(async ({ ctx }) => {
        try {
          const db = await getDb();
          if (!db) throw new Error('Database not available');
          
          let inserted = 0;
          for (const word of JAPANESE_VOCAB_300) {
            try {
              await db.insert(words).values({
                japanese: word.japanese,
                hiragana: word.hiragana,
                romaji: word.romaji,
                meaning: word.meaning,
                jlptLevel: word.jlptLevel,
                pos: word.pos,
                language: 'japanese',
                japaneseExample: word.japaneseExample,
                exampleRomaji: word.exampleRomaji,
                exampleJapaneseFrench: word.exampleJapaneseFrench,
              }).onDuplicateKeyUpdate({
                set: {
                  hiragana: word.hiragana,
                  meaning: word.meaning,
                },
              });
              inserted++;
            } catch (e) {
              console.warn(`Failed to insert ${word.japanese}:`, e);
            }
          }
          console.log(`[Admin] Imported ${inserted}/${JAPANESE_VOCAB_300.length} Japanese words`);
          return { success: true, inserted, total: JAPANESE_VOCAB_300.length };
        } catch (error) {
          console.error('[Admin] Japanese import failed:', error);
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Import failed' });
        }
      }),

    // Upload logo and save URL to appConfig
    uploadLogo: protectedProcedure
      .input(z.object({
        base64: z.string().min(1),
        mimeType: z.enum(['image/png', 'image/jpeg', 'image/webp']),
      }))
      .mutation(async ({ ctx, input }) => {
        const { ENV } = await import('./_core/env');
        if (ctx.user.openId !== ENV.ownerOpenId && ctx.user.role !== 'admin') {
          throw new Error('Unauthorized');
        }
        
        try {
          // Convert base64 to buffer
          const buffer = Buffer.from(input.base64, 'base64');
          
          // Determine file extension from mime type
          const ext = input.mimeType === 'image/png' ? 'png' : input.mimeType === 'image/jpeg' ? 'jpg' : 'webp';
          
          // Upload to storage
          const { url } = await storagePut(
            `app-logo.${ext}`,
            buffer,
            input.mimeType
          );
          
          // Save URL to appConfig
          await setAppConfig('logoUrl', url);
          
          console.log('[Admin] Logo uploaded successfully:', url);
          return { success: true, logoUrl: url };
        } catch (error) {
          console.error('[Admin] Logo upload failed:', error);
          throw new Error('Failed to upload logo');
        }
      }),


  }),
});

export type AppRouter = typeof appRouter;
