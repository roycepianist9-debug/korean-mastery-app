import { publicProcedure, router, adminProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  getEnglishSynonyms,
  getEnglishSynonymsByLevel,
  getAllEnglishSynonyms,
  upsertEnglishSynonym,
  deleteEnglishSynonym,
} from "./db";

export const englishSynonymsRouter = router({
  get: publicProcedure
    .input(z.object({ word: z.string().min(1) }))
    .query(async ({ input }) => {
      return getEnglishSynonyms(input.word);
    }),

  getByLevel: publicProcedure
    .input(z.object({ level: z.enum(['beginner', 'intermediate', 'advanced']) }))
    .query(async ({ input }) => {
      return getEnglishSynonymsByLevel(input.level);
    }),

  getAll: publicProcedure
    .input(z.object({ limit: z.number().default(300), offset: z.number().default(0) }).optional())
    .query(async ({ input }) => {
      return getAllEnglishSynonyms(input?.limit || 300, input?.offset || 0);
    }),

  upsert: adminProcedure
    .input(z.object({
      word: z.string().min(1),
      partOfSpeech: z.string(),
      synonyms: z.array(z.string()),
      level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { ENV } = await import('./_core/env');
      if (ctx.user.openId !== ENV.ownerOpenId && ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access only' });
      }
      await upsertEnglishSynonym(input);
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ word: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const { ENV } = await import('./_core/env');
      if (ctx.user.openId !== ENV.ownerOpenId && ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access only' });
      }
      await deleteEnglishSynonym(input.word);
      return { success: true };
    }),
});
