import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { randomUUID } from "crypto";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  guestId: number; // Always present - numeric user ID (real or guest)
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  // If authenticated, use the user's ID
  if (user) {
    return {
      req: opts.req,
      res: opts.res,
      user,
      guestId: user.id,
    };
  }

  // For guests: retrieve or create a guest user record
  let guestUserId: number | null = null;
  const guestCookie = opts.req.cookies?.['guest-session-id'];
  
  if (guestCookie) {
    // Try to find existing guest user by session ID
    const db = await getDb();
    if (db) {
      const existing = await db.select()
        .from(users)
        .where(eq(users.guestSessionId, guestCookie))
        .limit(1);
      if (existing.length > 0) {
        guestUserId = existing[0].id;
      }
    }
  }

  // If no existing guest user, create one
  if (!guestUserId) {
    const newGuestSessionId = guestCookie || `guest_${randomUUID()}`;
    const db = await getDb();
    if (db) {
      const result = await db.insert(users).values({
        email: `guest_${randomUUID()}@guest.local`,
        name: 'Guest User',
        role: 'user',
        guestSessionId: newGuestSessionId,
        wordAccessLimit: 150, // Free tier limit
      });
      // Get the inserted ID
      const inserted = await db.select()
        .from(users)
        .where(eq(users.guestSessionId, newGuestSessionId))
        .limit(1);
      if (inserted.length > 0) {
        guestUserId = inserted[0].id;
      }
    }
    // Set or update the cookie
    opts.res.cookie('guest-session-id', newGuestSessionId, {
      maxAge: 365 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
  }

  // Fallback: if database is unavailable, use a placeholder ID (should not happen)
  if (!guestUserId) {
    guestUserId = -1;
  }

  return {
    req: opts.req,
    res: opts.res,
    user: null,
    guestId: guestUserId,
  };
}
