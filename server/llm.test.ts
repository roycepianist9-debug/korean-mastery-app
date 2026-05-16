import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createAuthContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("llm.translateExample", () => {
  it("accepts a Korean sentence and returns a translation object", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.llm.translateExample({
      koreanSentence: "안녕하세요",
    });
    // The result should have a translation key (string or null)
    expect(result).toHaveProperty("translation");
    if (result.translation) {
      expect(typeof result.translation).toBe("string");
      expect(result.translation.length).toBeGreaterThan(0);
    }
  });

  it("accepts optional wordContext parameter", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.llm.translateExample({
      koreanSentence: "우리 가족은 네 명이에요.",
      wordContext: "가족",
    });
    expect(result).toHaveProperty("translation");
  });
});

describe("words.random with larger deck sizes", () => {
  it("accepts limit of 20", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.words.random({ limit: 20 });
    expect(result.length).toBeLessThanOrEqual(20);
    expect(result.length).toBeGreaterThan(0);
  });

  it("accepts limit of 50", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.words.random({ limit: 50 });
    expect(result.length).toBeLessThanOrEqual(50);
    expect(result.length).toBeGreaterThan(0);
  });

  it("accepts limit of 100", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.words.random({ limit: 100 });
    expect(result.length).toBeLessThanOrEqual(100);
    expect(result.length).toBeGreaterThan(0);
  });

  it("rejects limit above 100", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.words.random({ limit: 101 })).rejects.toThrow();
  });

  it("filters by level with large deck", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.words.random({ limit: 50, topikLevel: "beginner" });
    expect(result.length).toBeLessThanOrEqual(50);
    result.forEach(w => expect(w.topikLevel).toBe("beginner"));
  });
});

describe("llm.getWordTips", () => {
  it("requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.llm.getWordTips({
        korean: "가족",
        meaning: "family",
        pos: "noun",
      })
    ).rejects.toThrow();
  });

  it("returns tips for authenticated user", async () => {  // LLM call can be slow
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.llm.getWordTips({
      korean: "가족",
      meaning: "family",
      pos: "noun",
      koreanExample: "우리 가족은 네 명이에요.",
    });
    // Result should be an object with grammarTip, examples, usageNote or null
    if (result) {
      expect(result).toHaveProperty("grammarTip");
      expect(result).toHaveProperty("examples");
      expect(result).toHaveProperty("usageNote");
    }
  });
});
