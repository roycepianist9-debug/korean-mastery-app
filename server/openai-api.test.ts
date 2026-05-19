import { describe, it, expect } from "vitest";
import OpenAI from "openai";

describe("OpenAI API Key Validation", () => {
  it("should successfully authenticate with OpenAI API", async () => {
    const apiKey = process.env.OPENAI_API_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey).toBeTruthy();

    const client = new OpenAI({ apiKey });

    // Test with a simple translation request
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: 'Translate "water" to French. Return only the translation.',
        },
      ],
      max_tokens: 10,
    });

    expect(response).toBeDefined();
    expect(response.choices).toBeDefined();
    expect(response.choices.length).toBeGreaterThan(0);
    const content = response.choices[0].message.content;
    expect(content).toBeTruthy();
    expect(content?.toLowerCase()).toContain("eau");
  });
});
