import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { invokeLLM } from "./_core/llm";
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
      }))
      .query(async ({ input }) => {
        return getRandomWords({
          pos: input.pos,
          topikLevel: input.topikLevel,
          hskLevel: input.hskLevel,
          limit: input.limit,
          excludeIds: input.excludeIds,
          language: input.language,
        });
      }),

    stats: publicProcedure.query(async () => {
      return getWordStats();
    }),
  }),

  progress: router({
    getStats: protectedProcedure.query(async ({ ctx }) => {
      return getUserProgressStats(ctx.user.id);
    }),

    getByLevel: protectedProcedure.query(async ({ ctx }) => {
      return getProgressByLevel(ctx.user.id);
    }),

    getByPos: protectedProcedure.query(async ({ ctx }) => {
      return getProgressByPos(ctx.user.id);
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
      }))
      .mutation(async ({ ctx, input }) => {
        const correct = input.status === 'learned';
        await upsertWordProgress(ctx.user.id, input.wordId, input.status, correct);
        if (input.status !== 'new') {
          const xpGained = input.status === 'learned' ? 10 : 3;
          const wordsLearned = input.status === 'learned' ? 1 : 0;
          await updateUserStatsAfterSwipe(ctx.user.id, xpGained, wordsLearned);
        }
        return { status: input.status };
      }),

    swipe: protectedProcedure
      .input(z.object({
        wordId: z.number(),
        known: z.boolean(),
      }))
      .mutation(async ({ ctx, input }) => {
        const status = input.known ? 'learned' as const : 'reviewing' as const;
        await upsertWordProgress(ctx.user.id, input.wordId, status, input.known);

        // XP: 10 for learned, 3 for reviewing
        const xpGained = input.known ? 10 : 3;
        const wordsLearned = input.known ? 1 : 0;
        await updateUserStatsAfterSwipe(ctx.user.id, xpGained, wordsLearned);

        return { status, xpGained };
      }),

    batchSwipe: protectedProcedure
      .input(z.object({
        results: z.array(z.object({
          wordId: z.number(),
          known: z.boolean(),
        })),
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

        await updateUserStatsAfterSwipe(ctx.user.id, totalXp, totalLearned);

        return { totalXp, totalLearned, totalReviewed: input.results.length };
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
      }))
      .mutation(async ({ input }) => {
        try {
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `You are a Korean-English translator. Translate the given Korean sentence to natural English. Return ONLY a JSON object with a single key "translation" containing the English translation. Be accurate and natural.`
              },
              {
                role: "user",
                content: `Translate this Korean sentence to English: ${input.koreanSentence}`
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
});

export type AppRouter = typeof appRouter;
