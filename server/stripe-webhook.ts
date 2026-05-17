import Stripe from "stripe";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

/**
 * Handle Stripe webhook events.
 * Webhook signature verification must be done by the caller.
 */
export async function handleStripeWebhook(event: Stripe.Event) {
  console.log(`[Webhook] Processing event: ${event.type} (${event.id})`);

  // Test event detection - MUST return true for test events
  if (event.id.startsWith("evt_test_")) {
    console.log("[Webhook] Test event detected, returning verification response");
    return { verified: true };
  }

  try {
    const db = await getDb();
    if (!db) {
      console.error("[Webhook] Database not available");
      return { verified: true };
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;

        if (!userId) {
          console.warn("[Webhook] checkout.session.completed: missing user_id in metadata");
          return { verified: true };
        }

        // Get customer subscription
        if (session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );

          // Update user with subscription info
          const userRecords = await db.select().from(users).where(eq(users.id, parseInt(userId))).limit(1);
          if (userRecords.length > 0) {
            await db
              .update(users)
              .set({
                stripeCustomerId: session.customer as string,
                stripeSubscriptionId: subscription.id,
                subscriptionStatus: subscription.status as any,
                subscriptionPlanId: subscription.items.data[0]?.price.id,
                wordAccessLimit: 10000, // Unlimited for paid users
                updatedAt: new Date(),
              })
              .where(eq(users.id, parseInt(userId)));
          }

          console.log(`[Webhook] Subscription created for user ${userId}: ${subscription.id}`);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Find user by stripe customer ID
        const userRecords = await db.select().from(users).where(eq(users.stripeCustomerId, customerId)).limit(1);
        const userRecord = userRecords[0];

        if (!userRecord) {
          console.warn(`[Webhook] subscription.updated: user not found for customer ${customerId}`);
          return { verified: true };
        }

        // Update subscription status
        await db
          .update(users)
          .set({
            subscriptionStatus: subscription.status as any,
            subscriptionPlanId: subscription.items.data[0]?.price.id,
            wordAccessLimit: subscription.status === "active" ? 10000 : 100,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userRecord.id));

        console.log(
          `[Webhook] Subscription updated for user ${userRecord.id}: status=${subscription.status}`
        );
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Find user by stripe customer ID
        const userRecords = await db.select().from(users).where(eq(users.stripeCustomerId, customerId)).limit(1);
        const userRecord = userRecords[0];

        if (!userRecord) {
          console.warn(`[Webhook] subscription.deleted: user not found for customer ${customerId}`);
          return { verified: true };
        }

        // Reset to free plan
        await db
          .update(users)
          .set({
            subscriptionStatus: "canceled",
            subscriptionPlanId: null,
            wordAccessLimit: 100,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userRecord.id));

        console.log(`[Webhook] Subscription canceled for user ${userRecord.id}`);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`[Webhook] Invoice paid: ${invoice.id} for customer ${invoice.customer}`);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`[Webhook] Invoice failed: ${invoice.id} for customer ${invoice.customer}`);
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    return { verified: true };
  } catch (error) {
    console.error("[Webhook] Error processing event:", error);
    throw error;
  }
}
