import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Batch subsections to reduce API calls
const batches = [
  {
    name: "Batch 1: Numbers & Time",
    subsections: [
      {
        key: "numbers",
        title: "Numbers",
        count: 90,
        description: "1-30, then 20 cards each for 100-999, 1000-9999, etc.",
      },
      {
        key: "time_clock",
        title: "Time & Clock",
        count: 30,
        description: "10 ways to tell time + 20 training cards",
      },
    ],
  },
  {
    name: "Batch 2: Dates & Geography",
    subsections: [
      {
        key: "dates",
        title: "Dates",
        count: 40,
        description: "Months, days, years, full examples",
      },
      {
        key: "countries",
        title: "Countries",
        count: 50,
        description: "50 main countries",
      },
    ],
  },
  {
    name: "Batch 3: Directions & Objects",
    subsections: [
      {
        key: "directions",
        title: "Directions",
        count: 40,
        description: "Turn left, keep walking, etc.",
      },
      {
        key: "room_objects",
        title: "Room Objects",
        count: 30,
        description: "Furniture and items in a room",
      },
    ],
  },
  {
    name: "Batch 4: Clothing & Emotions",
    subsections: [
      {
        key: "clothing",
        title: "Clothing",
        count: 25,
        description: "Bonnet, pants, socks, etc.",
      },
      {
        key: "emotions",
        title: "Emotions",
        count: 20,
        description: "Happy, sad, angry, confused, excited",
      },
    ],
  },
  {
    name: "Batch 5: Colors & Proverbs",
    subsections: [
      {
        key: "colors",
        title: "Colors",
        count: 12,
        description: "Basic colors and shades",
      },
      {
        key: "proverbs",
        title: "Proverbs & Quotes",
        count: 20,
        description: "Common sayings and wisdom",
      },
    ],
  },
  {
    name: "Batch 6: Work & School",
    subsections: [
      {
        key: "at_work",
        title: "At Work",
        count: 30,
        description: "Office, meeting, computer, colleague",
      },
      {
        key: "at_school",
        title: "At School",
        count: 25,
        description: "Classroom, teacher, exam, homework",
      },
    ],
  },
  {
    name: "Batch 7: Street & Food",
    subsections: [
      {
        key: "street_vocab",
        title: "Street Vocabulary",
        count: 35,
        description: "Building, tree, shop, street",
      },
      {
        key: "slang",
        title: "Slang",
        count: 40,
        description: "Informal language not in books",
      },
    ],
  },
  {
    name: "Batch 8: Transport & Dishes",
    subsections: [
      {
        key: "subway",
        title: "Subway",
        count: 20,
        description: "Platform, ticket, train, seat",
      },
      {
        key: "local_dishes",
        title: "Local Dishes",
        count: 20,
        description: "Food and cuisine vocabulary",
      },
    ],
  },
  {
    name: "Batch 9: Sentences",
    subsections: [
      {
        key: "simple_sentences",
        title: "Simple Sentences",
        count: 100,
        description: "3-4 word sentences: I eat, you run, he sleeps",
      },
    ],
  },
  {
    name: "Batch 10: Grammar & Words",
    subsections: [
      {
        key: "prepositions",
        title: "Prepositions & Conjunctions",
        count: 50,
        description: "But, and, on, however, because, if, when",
      },
      {
        key: "complex_sentences",
        title: "Complex Sentences",
        count: 60,
        description: "Multi-clause sentences with connectors",
      },
    ],
  },
  {
    name: "Batch 11: Adverbs & Adjectives",
    subsections: [
      {
        key: "adverbs",
        title: "Adverbs",
        count: 40,
        description: "Quickly, slowly, yesterday, tomorrow, very",
      },
      {
        key: "adjectives",
        title: "Adjectives",
        count: 150,
        description: "Big, tall, beautiful, ugly, smart",
      },
    ],
  },
  {
    name: "Batch 12: Refinement",
    subsections: [
      {
        key: "refinement",
        title: "Refinement Words",
        count: 50,
        description: "Beautiful, elegant, native-level vocabulary",
      },
    ],
  },
];

async function generateBatch(batch) {
  console.log(`\n🚀 ${batch.name}`);

  const subsectionPrompts = batch.subsections
    .map(
      (sub) =>
        `- ${sub.title} (${sub.count} cards): ${sub.description}`
    )
    .join("\n");

  const prompt = `Generate vocabulary/phrase cards for language learning in JSON format.

Generate cards for these subsections:
${subsectionPrompts}

Requirements:
1. Return a JSON object with subsection keys mapping to arrays of cards
2. Each card: { "front": "word/phrase", "back": "definition", "example": "sentence" }
3. Cards should be practical and commonly used
4. Return ONLY valid JSON, no markdown

Format:
{
  "subsection_key": [
    { "front": "word", "back": "definition", "example": "sentence" },
    ...
  ],
  ...
}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error(`❌ No JSON found in ${batch.name}`);
      return {};
    }

    const data = JSON.parse(jsonMatch[0]);
    console.log(`✅ ${batch.name} generated successfully`);

    // Flatten and add subsection metadata
    const allCards = [];
    for (const [subsectionKey, cards] of Object.entries(data)) {
      const subsectionData = batch.subsections.find((s) => s.key === subsectionKey);
      if (subsectionData && Array.isArray(cards)) {
        allCards.push(
          ...cards.map((card) => ({
            subsection: subsectionKey,
            subsectionTitle: subsectionData.title,
            front: card.front || "",
            back: card.back || "",
            example: card.example || "",
          }))
        );
      }
    }

    return allCards;
  } catch (error) {
    console.error(`❌ Error in ${batch.name}:`, error.message);
    return [];
  }
}

async function generateAllCards() {
  console.log("🎓 Starting Basics cards generation (optimized batching)...");

  const allCards = [];
  let totalCount = 0;

  for (const batch of batches) {
    const cards = await generateBatch(batch);
    allCards.push(...cards);
    totalCount += cards.length;
    console.log(`   Cards so far: ${totalCount}`);

    // Wait between batches to avoid rate limiting
    if (batch !== batches[batches.length - 1]) {
      console.log("   ⏳ Waiting 60 seconds before next batch...");
      await new Promise((resolve) => setTimeout(resolve, 60000));
    }
  }

  console.log(`\n📊 Total cards generated: ${totalCount}`);
  console.log(JSON.stringify(allCards, null, 2));

  return allCards;
}

generateAllCards().catch(console.error);
