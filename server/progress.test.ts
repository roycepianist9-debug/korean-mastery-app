import { describe, expect, it } from "vitest";
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
      openId: `test-progress-user-${userId}`,
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

describe("progress.swipe", () => {
  it("rejects unauthenticated calls", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.progress.swipe({ wordId: 1, known: true })).rejects.toThrow();
  });

  it("marks a word as learned when swiped right", async () => {
    const caller = appRouter.createCaller(createAuthContext(999));
    const result = await caller.progress.swipe({ wordId: 1, known: true });

    expect(result).toHaveProperty("status", "learned");
    expect(result).toHaveProperty("xpGained", 10);
  });

  it("marks a word as reviewing when swiped left", async () => {
    const caller = appRouter.createCaller(createAuthContext(999));
    const result = await caller.progress.swipe({ wordId: 2, known: false });

    expect(result).toHaveProperty("status", "reviewing");
    expect(result).toHaveProperty("xpGained", 3);
  });
});

describe("progress.batchSwipe", () => {
  it("rejects unauthenticated calls", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.progress.batchSwipe({
        results: [{ wordId: 1, known: true }],
      })
    ).rejects.toThrow();
  });

  it("processes a batch of swipe results", async () => {
    const caller = appRouter.createCaller(createAuthContext(998));
    const result = await caller.progress.batchSwipe({
      results: [
        { wordId: 3, known: true },
        { wordId: 4, known: false },
        { wordId: 5, known: true },
      ],
    });

    expect(result).toHaveProperty("totalXp");
    expect(result.totalXp).toBe(10 + 3 + 10); // 23
    expect(result.totalLearned).toBe(2);
    expect(result.totalReviewed).toBe(3);
  });
});

describe("progress.getForWords", () => {
  it("rejects unauthenticated calls", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.progress.getForWords({ wordIds: [1, 2] })).rejects.toThrow();
  });

  it("returns progress for specific word IDs", async () => {
    const caller = appRouter.createCaller(createAuthContext(999));
    const result = await caller.progress.getForWords({ wordIds: [1, 2] });

    expect(Array.isArray(result)).toBe(true);
    // We swiped on words 1 and 2 above, so we should have progress
    expect(result.length).toBeGreaterThanOrEqual(1);
    for (const p of result) {
      expect(p).toHaveProperty("status");
      expect(["new", "reviewing", "learned"]).toContain(p.status);
    }
  });
});

describe("progress.getByLevel", () => {
  it("rejects unauthenticated calls", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.progress.getByLevel()).rejects.toThrow();
  });

  it("returns progress grouped by TOPIK level", async () => {
    const caller = appRouter.createCaller(createAuthContext(999));
    const result = await caller.progress.getByLevel();

    expect(Array.isArray(result)).toBe(true);
    for (const row of result) {
      expect(row).toHaveProperty("topikLevel");
      expect(row).toHaveProperty("status");
      expect(row).toHaveProperty("count");
      expect(["beginner", "intermediate", "advanced"]).toContain(row.topikLevel);
    }
  });
});

describe("progress.getByPos", () => {
  it("rejects unauthenticated calls", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.progress.getByPos()).rejects.toThrow();
  });

  it("returns progress grouped by part of speech", async () => {
    const caller = appRouter.createCaller(createAuthContext(999));
    const result = await caller.progress.getByPos();

    expect(Array.isArray(result)).toBe(true);
    for (const row of result) {
      expect(row).toHaveProperty("pos");
      expect(row).toHaveProperty("status");
      expect(row).toHaveProperty("count");
    }
  });
});
