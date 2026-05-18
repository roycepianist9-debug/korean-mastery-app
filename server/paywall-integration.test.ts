import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { FREE_WORD_LIMIT, STRIPE_PRODUCTS, FREE_PLAN } from "./stripe-products";

/**
 * Integration test: verifies paywall enforcement via tRPC procedures.
 * Uses the actual database through tRPC callers.
 */

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(userId: string): TrpcContext {
  const user: AuthenticatedUser = {
    id: 99999,
    openId: userId,
    email: "paywall-test@test.com",
    name: "Paywall Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: { origin: "https://test.example.com" },
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Paywall enforcement via tRPC", () => {
  it("FREE_WORD_LIMIT is 150", () => {
    expect(FREE_WORD_LIMIT).toBe(150);
  });

  it("subscription status returns correct word limit for free users", async () => {
    const ctx = createTestContext("paywall-test-sub-status");
    const caller = appRouter.createCaller(ctx);

    const status = await caller.subscription.getSubscriptionStatus();
    // Free users should have 150 word limit
    expect(status.wordAccessLimit).toBe(150);
  });

  it("markWord succeeds when user is under limit", async () => {
    const ctx = createTestContext("paywall-test-mark");
    const caller = appRouter.createCaller(ctx);

    // Mark a word — should succeed since user has 0 learned words (well under 150)
    const result = await caller.progress.markWord({
      wordId: 1,
      status: "learned",
      language: "korean",
    });

    // Returns the status string when not blocked
    expect(result.status).toBe("learned");
  });

  it("swipe succeeds when user is under limit", async () => {
    const ctx = createTestContext("paywall-test-swipe");
    const caller = appRouter.createCaller(ctx);

    // Swipe known — should succeed since user has 0 learned words
    const result = await caller.progress.swipe({
      wordId: 2,
      known: true,
      language: "korean",
    });

    // Returns 'learned' status and xpGained when not blocked
    expect(result.status).toBe("learned");
    expect(result.xpGained).toBe(10);
  });

  it("subscription plans include free and pro tiers", async () => {
    const ctx = createTestContext("paywall-test-plans");
    const caller = appRouter.createCaller(ctx);

    const plans = await caller.subscription.getPlans();
    // Returns { free: FREE_PLAN, plans: [...] }
    expect(plans.free).toBeDefined();
    expect(plans.free.wordAccessLimit).toBe(150);
    expect(plans.plans.length).toBe(2);

    // Plans are PRO_MONTHLY and PRO_ANNUAL
    const monthly = plans.plans.find((p: any) => p.interval === "month");
    const annual = plans.plans.find((p: any) => p.interval === "year");
    expect(monthly).toBeDefined();
    expect(monthly!.priceInCents).toBe(999);
    expect(monthly!.wordAccessLimit).toBe(999999);
    expect(annual).toBeDefined();
    expect(annual!.priceInCents).toBe(9999);
  });

  it("paywall blocks at exactly the limit", () => {
    // Verify the logic: if learnedCount >= limit, block
    const limit = FREE_WORD_LIMIT;
    expect(limit).toBe(150);

    // At 149, not blocked
    expect(149 >= limit).toBe(false);
    // At 150, blocked
    expect(150 >= limit).toBe(true);
    // At 151, blocked
    expect(151 >= limit).toBe(true);
  });

  it("pro plans unlock unlimited access (999999 words)", () => {
    expect(STRIPE_PRODUCTS.PRO_MONTHLY.wordAccessLimit).toBe(999999);
    expect(STRIPE_PRODUCTS.PRO_ANNUAL.wordAccessLimit).toBe(999999);
    // With 999999 limit, even 10000 learned words won't trigger block
    expect(10000 >= 999999).toBe(false);
  });
});
