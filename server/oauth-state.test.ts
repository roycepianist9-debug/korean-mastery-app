import { describe, it, expect } from "vitest";

/**
 * Test the OAuth state decoding logic that was fixed to handle
 * both plain redirectUri strings and JSON payloads with returnPath.
 */
describe("OAuth state decoding", () => {
  // Replicate the decodeState logic from sdk.ts
  function decodeState(state: string): string {
    const decoded = atob(state);
    try {
      const parsed = JSON.parse(decoded);
      if (parsed && typeof parsed.redirectUri === "string") {
        return parsed.redirectUri;
      }
    } catch {
      // Not JSON — treat as plain redirectUri
    }
    return decoded;
  }

  it("decodes a plain redirectUri string", () => {
    const redirectUri = "https://swipefluent.co/api/oauth/callback";
    const state = btoa(redirectUri);
    expect(decodeState(state)).toBe(redirectUri);
  });

  it("decodes a JSON payload with redirectUri and returnPath", () => {
    const payload = JSON.stringify({
      redirectUri: "https://swipefluent.co/api/oauth/callback",
      returnPath: "/play",
    });
    const state = btoa(payload);
    expect(decodeState(state)).toBe("https://swipefluent.co/api/oauth/callback");
  });

  it("decodes a JSON payload with only redirectUri", () => {
    const payload = JSON.stringify({
      redirectUri: "https://koreanapp-agvnoytd.manus.space/api/oauth/callback",
    });
    const state = btoa(payload);
    expect(decodeState(state)).toBe("https://koreanapp-agvnoytd.manus.space/api/oauth/callback");
  });

  it("handles malformed JSON gracefully (falls back to raw string)", () => {
    const raw = "not-json-but-a-url";
    const state = btoa(raw);
    expect(decodeState(state)).toBe(raw);
  });

  it("handles JSON without redirectUri field (falls back to raw string)", () => {
    const payload = JSON.stringify({ foo: "bar" });
    const state = btoa(payload);
    expect(decodeState(state)).toBe(payload);
  });
});
