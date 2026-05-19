import { describe, it, expect } from "vitest";
import { GoogleGenerativeAI } from "@google/generative-ai";

describe("Gemini API Key Validation", () => {
  it("should successfully authenticate with Gemini API", async () => {
    const apiKey = process.env.GEMINI_API_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey).toBeTruthy();

    const genAI = new GoogleGenerativeAI(apiKey!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Test with a simple translation request
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: 'Translate "water" to French. Return only the translation.',
            },
          ],
        },
      ],
    });

    const response = result.response;
    expect(response).toBeDefined();
    expect(response.text()).toBeTruthy();
    expect(response.text().toLowerCase()).toContain("eau");
  });
});
