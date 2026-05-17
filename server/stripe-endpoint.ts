import { Request, Response } from "express";
import Stripe from "stripe";
import { handleStripeWebhook } from "./stripe-webhook";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

/**
 * Express middleware to handle Stripe webhook events.
 * This must be registered BEFORE express.json() middleware.
 */
export function stripeWebhookHandler(req: Request, res: Response) {
  const sig = req.headers["stripe-signature"] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("[Webhook] STRIPE_WEBHOOK_SECRET not configured");
    return res.status(500).json({ error: "Webhook secret not configured" });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body, // This must be raw body, not parsed JSON
      sig,
      webhookSecret
    );
  } catch (error) {
    console.error("[Webhook] Signature verification failed:", error);
    return res.status(400).json({ error: "Signature verification failed" });
  }

  // Process the event
  handleStripeWebhook(event)
    .then((result) => {
      res.json(result);
    })
    .catch((error) => {
      console.error("[Webhook] Error processing event:", error);
      res.status(500).json({ error: "Internal server error" });
    });
}
