import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

function createAuthContext(userId = 1): TrpcContext {
  return {
    user: {
      id: userId,
      openId: `test-tokenize-user-${userId}`,
      email: `test${userId}@example.com`,
      name: `Test User ${userId}`,
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

describe("words.tokenize", () => {
  it("tokenizes a Korean sentence into segments", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.words.tokenize({ sentence: "나는 학생입니다" });
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    for (const token of result) {
      expect(token).toHaveProperty("text");
      expect(token).toHaveProperty("isWord");
      expect(token).toHaveProperty("wordId");
      expect(token).toHaveProperty("meaning");
    }
  });

  it("returns empty array for empty sentence", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.words.tokenize({ sentence: "" });
    expect(result).toEqual([]);
  });

  it("identifies word-like tokens vs non-word tokens", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.words.tokenize({ sentence: "한국어를 공부합니다." });
    expect(result.length).toBeGreaterThan(0);
    const wordTokens = result.filter((t: any) => t.isWord);
    expect(wordTokens.length).toBeGreaterThan(0);
  });
});

describe("progress.markWord", () => {
  it("marks a word as learned", async () => {
    const caller = appRouter.createCaller(createAuthContext(888));
    const words = await caller.words.search({ page: 1, pageSize: 1 });
    expect(words.words.length).toBeGreaterThan(0);
    const wordId = words.words[0].id;

    const result = await caller.progress.markWord({ wordId, status: "learned" });
    expect(result.status).toBe("learned");
  });

  it("marks a word as reviewing", async () => {
    const caller = appRouter.createCaller(createAuthContext(889));
    const words = await caller.words.search({ page: 1, pageSize: 1 });
    const wordId = words.words[0].id;

    const result = await caller.progress.markWord({ wordId, status: "reviewing" });
    expect(result.status).toBe("reviewing");
  });

  it("rejects unauthenticated markWord calls", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.progress.markWord({ wordId: 1, status: "learned" })).rejects.toThrow();
  });
});

describe("words.search with status filter", () => {
  it("accepts statuses parameter without error", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.words.search({
      page: 1,
      pageSize: 10,
      statuses: ["learned"],
    });
    expect(result).toHaveProperty("words");
    expect(result).toHaveProperty("total");
  });

  it("returns results when no statuses filter is applied", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.words.search({
      page: 1,
      pageSize: 10,
    });
    expect(result.words.length).toBeGreaterThan(0);
    expect(result.total).toBeGreaterThan(0);
  });
});
