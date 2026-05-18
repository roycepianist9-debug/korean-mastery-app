import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { invokeLLM } from "./_core/llm";
import Stripe from "stripe";
import { STRIPE_PRODUCTS, FREE_PLAN, FREE_WORD_LIMIT } from "./stripe-products";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
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
} from "./db";

export const appRouter = router({
  system: systemRouter,

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
        language: z.enum(['korean', 'chinese']).optional(),
      }))
      .query(async ({ input, ctx }) => {
        return searchWords({
          ...input,
          userId: ctx.user?.id,
        });
      }),

    tokenize: publicProcedure
      .input(z.object({ sentence: z.string() }))
      .query(async ({ input }) => {
        return tokenizeAndLookup(input.sentence);
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
        limit: z.number().min(1).max(100).default(10),
        excludeIds: z.array(z.number()).optional(),
        language: z.enum(['korean', 'chinese']).optional(),
        statuses: z.array(z.string()).optional(),
      }))
      .query(async ({ input, ctx }) => {
        return getRandomWords({
          pos: input.pos,
          topikLevel: input.topikLevel,
          hskLevel: input.hskLevel,
          limit: input.limit,
          excludeIds: input.excludeIds,
          language: input.language,
          statuses: input.statuses,
          userId: ctx.user?.id,
        });
      }),

    stats: publicProcedure
      .input(z.object({ language: z.enum(['korean', 'chinese']).optional() }).optional())
      .query(async ({ input }) => {
        return getWordStats(input?.language || 'korean');
      }),
  }),

  progress: router({
    getStats: protectedProcedure
      .input(z.object({ language: z.enum(['korean', 'chinese']).optional() }).optional())
      .query(async ({ ctx, input }) => {
        return getUserProgressStats(ctx.user.id, input?.language || 'korean');
      }),

    getByLevel: protectedProcedure
      .input(z.object({ language: z.enum(['korean', 'chinese']).optional() }).optional())
      .query(async ({ ctx, input }) => {
        return getProgressByLevel(ctx.user.id, input?.language || 'korean');
      }),

    getByPos: protectedProcedure
      .input(z.object({ language: z.enum(['korean', 'chinese']).optional() }).optional())
      .query(async ({ ctx, input }) => {
        return getProgressByPos(ctx.user.id, input?.language || 'korean');
      }),

    getForWords: protectedProcedure
      .input(z.object({ wordIds: z.array(z.number()) }))
      .query(async ({ ctx, input }) => {
        return getUserProgress(ctx.user.id, input.wordIds);
      }),

    markWord: protectedProcedure
      .input(z.object({
        wordId: z.number(),
        status: z.enum(['learned', 'reviewing', 'new']),
        language: z.enum(['korean', 'chinese']).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Paywall check: count learned words for this language
        if (input.status === 'learned') {
          const stats = await getUserProgressStats(ctx.user.id, input.language || 'korean');
          const db = await getDb();
          const userRecord = db ? await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1) : [];
          const limit = userRecord[0]?.wordAccessLimit ?? FREE_WORD_LIMIT;
          if (stats.learned >= limit) {
            return { status: 'paywall_blocked' as const, learnedCount: stats.learned, limit };
          }
        }
        const correct = input.status === 'learned';
        await upsertWordProgress(ctx.user.id, input.wordId, input.status, correct);
        if (input.status !== 'new') {
          const xpGained = input.status === 'learned' ? 10 : 3;
          const wordsLearned = input.status === 'learned' ? 1 : 0;
          await updateUserStatsAfterSwipe(ctx.user.id, input.language || 'korean', wordsLearned);
        }
        return { status: input.status };
      }),

    swipe: protectedProcedure
      .input(z.object({
        wordId: z.number(),
        known: z.boolean(),
        language: z.enum(['korean', 'chinese']).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Paywall check for "learned" swipes
        if (input.known) {
          const stats = await getUserProgressStats(ctx.user.id, input.language || 'korean');
          const db = await getDb();
          const userRecord = db ? await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1) : [];
          const limit = userRecord[0]?.wordAccessLimit ?? FREE_WORD_LIMIT;
          if (stats.learned >= limit) {
            return { status: 'paywall_blocked' as const, xpGained: 0, learnedCount: stats.learned, limit };
          }
        }

        const status = input.known ? 'learned' as const : 'reviewing' as const;
        await upsertWordProgress(ctx.user.id, input.wordId, status, input.known);

        // XP: 10 for learned, 3 for reviewing
        const xpGained = input.known ? 10 : 3;
        const wordsLearned = input.known ? 1 : 0;
        await updateUserStatsAfterSwipe(ctx.user.id, input.language || 'korean', wordsLearned);

        return { status, xpGained };
      }),

    batchSwipe: protectedProcedure
      .input(z.object({
        results: z.array(z.object({
          wordId: z.number(),
          known: z.boolean(),
        })),
        language: z.enum(['korean', 'chinese']).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        let totalXp = 0;
        let totalLearned = 0;

        for (const result of input.results) {
          const status = result.known ? 'learned' as const : 'reviewing' as const;
          await upsertWordProgress(ctx.user.id, result.wordId, status, result.known);
          totalXp += result.known ? 10 : 3;
          if (result.known) totalLearned += 1;
        }

        await updateUserStatsAfterSwipe(ctx.user.id, input.language || 'korean', totalLearned);

        return { totalXp, totalLearned, totalReviewed: input.results.length };
      }),

    todayCount: protectedProcedure
      .input(z.object({ language: z.enum(['korean', 'chinese']).optional() }).optional())
      .query(async ({ ctx, input }) => {
        const count = await getTodayLearnedCount(ctx.user.id, input?.language || 'korean');
        return { count };
      }),

    dailyHistory: protectedProcedure
      .input(z.object({
        language: z.enum(['korean', 'chinese']).optional(),
        days: z.number().min(7).max(90).default(30),
      }).optional())
      .query(async ({ ctx, input }) => {
        return getDailyLearnedHistory(
          ctx.user.id,
          input?.language || 'korean',
          input?.days || 30
        );
      }),
  }),

  gamification: router({
    getStats: protectedProcedure.query(async ({ ctx }) => {
      const stats = await getOrCreateUserStats(ctx.user.id);
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
      }))
      .mutation(async ({ input, ctx }) => {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

        try {
          const session = await stripe.checkout.sessions.create({
            customer_email: ctx.user.email || undefined,
            client_reference_id: ctx.user.id.toString(),
            metadata: {
              user_id: ctx.user.id.toString(),
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
            success_url: `${ctx.req.headers.origin}/?upgraded=true`,
            cancel_url: `${ctx.req.headers.origin}/`,
            allow_promotion_codes: true,
          });

          return { checkoutUrl: session.url };
        } catch (error) {
          console.error("[Stripe] Checkout session creation failed:", error);
          throw new Error("Failed to create checkout session");
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
        const userRecords = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
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

        const userRecords = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
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

  llm: router({
    getWordTips: protectedProcedure
      .input(z.object({
        korean: z.string(),
        meaning: z.string(),
        pos: z.string(),
        koreanExample: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `You are a Korean language tutor. Given a Korean word, provide:
1. A brief grammar tip (1-2 sentences) about how this word is used
2. Two additional example sentences in Korean with English translations
3. A usage note about nuance, formality level, or common mistakes

Format your response as JSON with this exact structure:
{
  "grammarTip": "...",
  "examples": [
    { "korean": "...", "english": "..." },
    { "korean": "...", "english": "..." }
  ],
  "usageNote": "..."
}`
              },
              {
                role: "user",
                content: `Word: ${input.korean}
Meaning: ${input.meaning}
Part of speech: ${input.pos}
${input.koreanExample ? `Example: ${input.koreanExample}` : ''}`
              }
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "word_tips",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    grammarTip: { type: "string" },
                    examples: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          korean: { type: "string" },
                          english: { type: "string" },
                        },
                        required: ["korean", "english"],
                        additionalProperties: false,
                      },
                    },
                    usageNote: { type: "string" },
                  },
                  required: ["grammarTip", "examples", "usageNote"],
                  additionalProperties: false,
                },
              },
            },
          });

          const content = response.choices?.[0]?.message?.content;
          if (content && typeof content === 'string') {
            return JSON.parse(content);
          }
          return null;
        } catch (error) {
          console.error("[LLM] Failed to generate word tips:", error);
          return null;
        }
      }),
    translateExample: publicProcedure
      .input(z.object({
        koreanSentence: z.string(),
        wordContext: z.string().optional(),
        language: z.enum(['korean', 'chinese']).optional(),
      }))
      .mutation(async ({ input }) => {
        const isChinese = input.language === 'chinese';
        const langLabel = isChinese ? 'Chinese' : 'Korean';
        try {
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `You are a ${langLabel}-English translator. Translate the given ${langLabel} sentence to natural English. Return ONLY a JSON object with a single key "translation" containing the English translation. Be accurate and natural.`
              },
              {
                role: "user",
                content: `Translate this ${langLabel} sentence to English: ${input.koreanSentence}`
              }
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "translation",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    translation: { type: "string" },
                  },
                  required: ["translation"],
                  additionalProperties: false,
                },
              },
            },
          });

          const content = response.choices?.[0]?.message?.content;
          if (content && typeof content === 'string') {
            const parsed = JSON.parse(content);
            return { translation: parsed.translation };
          }
          return { translation: null };
        } catch (error) {
          console.error("[LLM] Failed to translate example:", error);
          return { translation: null };
        }
      }),
  }),

  admin: router({
    // Get current pricing config and admin status
    getConfig: protectedProcedure.query(async ({ ctx }) => {
      // Only the owner (OWNER_OPEN_ID) can access admin config
      const { ENV } = await import('./_core/env');
      if (ctx.user.openId !== ENV.ownerOpenId && ctx.user.role !== 'admin') {
        throw new Error('Unauthorized');
      }
      const db = await getDb();
      const userRecord = db
        ? (await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1))[0]
        : null;
      return {
        proMonthlyPriceCents: parseInt(process.env.ADMIN_PRO_MONTHLY_CENTS || '999'),
        proAnnualPriceCents: parseInt(process.env.ADMIN_PRO_ANNUAL_CENTS || '9999'),
        adminBypass: (userRecord?.wordAccessLimit ?? 0) >= 999999,
        wordAccessLimit: userRecord?.wordAccessLimit ?? 150,
        isOwner: true,
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
        await db.update(users).set({ wordAccessLimit: newLimit }).where(eq(users.id, ctx.user.id));
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
  }),
});

export type AppRouter = typeof appRouter;
