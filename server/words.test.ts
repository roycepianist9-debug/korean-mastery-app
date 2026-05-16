import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createAuthContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user-123",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("words.search", () => {
  it("returns paginated results with default parameters", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.words.search({ page: 1, pageSize: 10 });

    expect(result).toHaveProperty("words");
    expect(result).toHaveProperty("total");
    expect(Array.isArray(result.words)).toBe(true);
    expect(result.words.length).toBeLessThanOrEqual(10);
    expect(result.total).toBeGreaterThan(0);
  });

  it("filters by TOPIK level", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.words.search({
      topikLevel: "beginner",
      page: 1,
      pageSize: 5,
    });

    expect(result.words.length).toBeGreaterThan(0);
    for (const word of result.words) {
      expect(word.topikLevel).toBe("beginner");
    }
  });

  it("filters by part of speech", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.words.search({
      pos: "verb",
      page: 1,
      pageSize: 5,
    });

    expect(result.words.length).toBeGreaterThan(0);
    for (const word of result.words) {
      expect(word.pos).toBe("verb");
    }
  });

  it("searches by Korean text", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.words.search({
      query: "가족",
      page: 1,
      pageSize: 10,
    });

    expect(result.words.length).toBeGreaterThan(0);
    const found = result.words.some((w: any) => w.korean.includes("가족"));
    expect(found).toBe(true);
  });

  it("searches by English meaning", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.words.search({
      query: "family",
      page: 1,
      pageSize: 10,
    });

    expect(result.words.length).toBeGreaterThan(0);
  });

  it("returns empty results for nonsense query", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.words.search({
      query: "zzzzxyznonexistent12345",
      page: 1,
      pageSize: 10,
    });

    expect(result.words).toHaveLength(0);
    expect(result.total).toBe(0);
  });
});

describe("words.getById", () => {
  it("returns a word by ID", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const word = await caller.words.getById({ id: 1 });

    expect(word).not.toBeNull();
    expect(word).toHaveProperty("korean");
    expect(word).toHaveProperty("romanization");
    expect(word).toHaveProperty("meaning");
    expect(word).toHaveProperty("pos");
    expect(word).toHaveProperty("topikLevel");
  });

  it("returns null for non-existent ID", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const word = await caller.words.getById({ id: 999999999 });
    expect(word).toBeNull();
  });
});

describe("words.random", () => {
  it("returns random words", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const words = await caller.words.random({ limit: 5 });

    expect(Array.isArray(words)).toBe(true);
    expect(words.length).toBe(5);
  });

  it("filters random words by level", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const words = await caller.words.random({
      topikLevel: "beginner",
      limit: 5,
    });

    expect(words.length).toBe(5);
    for (const word of words) {
      expect(word.topikLevel).toBe("beginner");
    }
  });
});

describe("words.stats", () => {
  it("returns total count and breakdowns", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const stats = await caller.words.stats();

    expect(stats.total).toBeGreaterThan(50000);
    expect(Array.isArray(stats.byLevel)).toBe(true);
    expect(Array.isArray(stats.byPos)).toBe(true);
    expect(stats.byLevel.length).toBeGreaterThan(0);
    expect(stats.byPos.length).toBeGreaterThan(0);
  });
});

describe("progress.getStats (protected)", () => {
  it("rejects unauthenticated calls", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.progress.getStats()).rejects.toThrow();
  });

  it("returns stats for authenticated user", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const stats = await caller.progress.getStats();

    expect(stats).toHaveProperty("learned");
    expect(stats).toHaveProperty("reviewing");
    expect(stats).toHaveProperty("total");
    expect(typeof stats.learned).toBe("number");
    expect(typeof stats.reviewing).toBe("number");
  });
});

describe("gamification.getStats (protected)", () => {
  it("rejects unauthenticated calls", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.gamification.getStats()).rejects.toThrow();
  });

  it("returns gamification stats for authenticated user", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const stats = await caller.gamification.getStats();

    expect(stats).toHaveProperty("xp");
    expect(stats).toHaveProperty("currentStreak");
    expect(stats).toHaveProperty("level");
    expect(stats).toHaveProperty("levelTitle");
    expect(typeof stats.xp).toBe("number");
    expect(typeof stats.level).toBe("number");
    expect(stats.level).toBeGreaterThanOrEqual(1);
  });
});
