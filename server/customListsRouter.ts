import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  createCustomList,
  getCustomListsByUser,
  getCustomList,
  updateCustomList,
  deleteCustomList,
  addWordToList,
  removeWordFromList,
  getListWords,
} from "./db";

export const customListsRouter = router({
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(255),
      description: z.string().max(1000).optional(),
      language: z.enum(['korean', 'chinese', 'japanese', 'english']),
      color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const listId = await createCustomList({
        userId: ctx.user.id,
        ...input,
      });
      return { success: true, listId };
    }),

  list: protectedProcedure
    .query(async ({ ctx }) => {
      return getCustomListsByUser(ctx.user.id);
    }),

  get: protectedProcedure
    .input(z.object({ listId: z.number() }))
    .query(async ({ ctx, input }) => {
      const list = await getCustomList(input.listId);
      if (!list || list.userId !== ctx.user.id) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      return list;
    }),

  update: protectedProcedure
    .input(z.object({
      listId: z.number(),
      name: z.string().min(1).max(255).optional(),
      description: z.string().max(1000).optional(),
      color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const list = await getCustomList(input.listId);
      if (!list || list.userId !== ctx.user.id) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      const { listId, ...updateData } = input;
      await updateCustomList(listId, updateData);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ listId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const list = await getCustomList(input.listId);
      if (!list || list.userId !== ctx.user.id) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      await deleteCustomList(input.listId);
      return { success: true };
    }),

  addWord: protectedProcedure
    .input(z.object({ listId: z.number(), wordId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const list = await getCustomList(input.listId);
      if (!list || list.userId !== ctx.user.id) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      await addWordToList(input.listId, input.wordId);
      return { success: true };
    }),

  removeWord: protectedProcedure
    .input(z.object({ listId: z.number(), wordId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const list = await getCustomList(input.listId);
      if (!list || list.userId !== ctx.user.id) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      await removeWordFromList(input.listId, input.wordId);
      return { success: true };
    }),

  getWords: protectedProcedure
    .input(z.object({
      listId: z.number(),
      page: z.number().min(1).default(1),
      pageSize: z.number().min(1).max(100).default(50),
    }))
    .query(async ({ ctx, input }) => {
      const list = await getCustomList(input.listId);
      if (!list || list.userId !== ctx.user.id) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      return getListWords(input.listId, input.page, input.pageSize);
    }),
});
