import { describe, it, expect } from "vitest";
import { FREE_WORD_LIMIT, STRIPE_PRODUCTS, FREE_PLAN } from "./stripe-products";

describe("Paywall configuration", () => {
  it("free word limit is 150", () => {
    expect(FREE_WORD_LIMIT).toBe(150);
  });

  it("free plan has correct word access limit", () => {
    expect(FREE_PLAN.wordAccessLimit).toBe(150);
  });

  it("free plan description mentions 150 words", () => {
    expect(FREE_PLAN.description).toContain("150");
  });

  it("pro monthly plan has unlimited access (999999)", () => {
    expect(STRIPE_PRODUCTS.PRO_MONTHLY.wordAccessLimit).toBe(999999);
  });

  it("pro annual plan has unlimited access (999999)", () => {
    expect(STRIPE_PRODUCTS.PRO_ANNUAL.wordAccessLimit).toBe(999999);
  });

  it("pro monthly price is $9.99", () => {
    expect(STRIPE_PRODUCTS.PRO_MONTHLY.priceInCents).toBe(999);
  });

  it("pro annual price is $99.99", () => {
    expect(STRIPE_PRODUCTS.PRO_ANNUAL.priceInCents).toBe(9999);
  });

  it("both plans have stripe price IDs", () => {
    expect(STRIPE_PRODUCTS.PRO_MONTHLY.stripePriceId).toBeTruthy();
    expect(STRIPE_PRODUCTS.PRO_ANNUAL.stripePriceId).toBeTruthy();
  });
});
