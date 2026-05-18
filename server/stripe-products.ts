/**
 * Stripe product and pricing configuration.
 * These are the plans available to users.
 * Product IDs and Price IDs should be created in Stripe Dashboard and updated here.
 */

export const FREE_WORD_LIMIT = 150; // Hard cap for free users per language

export const STRIPE_PRODUCTS = {
  PRO_MONTHLY: {
    name: "Pro Monthly",
    stripePriceId: process.env.STRIPE_PRICE_PRO_MONTHLY || "price_test_pro_monthly",
    stripeProductId: process.env.STRIPE_PRODUCT_PRO || "prod_test_pro",
    priceInCents: 999, // $9.99/month
    currency: "usd",
    interval: "month" as const,
    wordAccessLimit: 999999, // Unlimited access
    description: "Unlimited vocabulary access, AI translations, and progress tracking",
  },
  PRO_ANNUAL: {
    name: "Pro Annual",
    stripePriceId: process.env.STRIPE_PRICE_PRO_ANNUAL || "price_test_pro_annual",
    stripeProductId: process.env.STRIPE_PRODUCT_PRO || "prod_test_pro",
    priceInCents: 9999, // $99.99/year
    currency: "usd",
    interval: "year" as const,
    wordAccessLimit: 999999, // Unlimited access
    description: "Unlimited vocabulary access, AI translations, and progress tracking",
  },
};

export const FREE_PLAN = {
  name: "Free",
  wordAccessLimit: FREE_WORD_LIMIT,
  description: `Learn your first ${FREE_WORD_LIMIT} words free, then upgrade to Pro for unlimited access`,
};
