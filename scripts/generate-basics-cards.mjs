import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const subsections = {
  numbers: {
    title: "Numbers",
    description: "Count from 1-30, then 20 cards each for ranges",
    count: 90,
  },
  time_clock: {
    title: "Time & Clock",
    description: "10 canonical ways to tell time + 20 training cards",
    count: 30,
  },
  dates: {
    title: "Dates",
    description: "Months, days, years, centuries, full examples",
    count: 40,
  },
  countries: {
    title: "Countries",
    description: "50 main countries",
    count: 50,
  },
  directions: {
    title: "Directions",
    description: "Turn left, keep walking, etc. - 40 instruction cards",
    count: 40,
  },
  room_objects: {
    title: "Room Objects",
    description: "Things in a room - furniture, items",
    count: 30,
  },
  clothing: {
    title: "Clothing",
    description: "Bonnet, pants, socks, etc.",
    count: 25,
  },
  emotions: {
    title: "Emotions",
    description: "Happy, sad, angry, confused, excited, etc.",
    count: 20,
  },
  colors: {
    title: "Colors",
    description: "Basic colors and nuanced shades",
    count: 12,
  },
  proverbs: {
    title: "Proverbs & Quotes",
    description: "Common sayings and wisdom",
    count: 20,
  },
  at_work: {
    title: "At Work",
    description: "Office, meeting, computer, colleague, deadline",
    count: 30,
  },
  at_school: {
    title: "At School",
    description: "Classroom, teacher, exam, homework",
    count: 25,
  },
  street_vocab: {
    title: "Street Vocabulary",
    description: "Building, tree, shop, street, corner",
    count: 35,
  },
  slang: {
    title: "Slang",
    description: "Informal language not in books",
    count: 40,
  },
  subway: {
    title: "Subway",
    description: "Platform, ticket, train, seat",
    count: 20,
  },
  local_dishes: {
    title: "Local Dishes",
    description: "Food and cuisine vocabulary",
    count: 20,
  },
  simple_sentences: {
    title: "Simple Sentences",
    description: "3-4 word sentences - I eat, you run, he sleeps",
    count: 100,
  },
  prepositions: {
    title: "Prepositions & Conjunctions",
    description: "But, and, on, however, because, if, when",
    count: 50,
  },
  complex_sentences: {
    title: "Complex Sentences",
    description: "Multi-clause sentences with connectors",
    count: 60,
  },
  adverbs: {
    title: "Adverbs",
    description: "Quickly, slowly, yesterday, tomorrow, very",
    count: 40,
  },
  adjectives: {
    title: "Adjectives",
    description: "Big, tall, beautiful, ugly, smart, etc.",
    count: 150,
  },
  refinement: {
    title: "Refinement Words",
    description: "Beautiful, elegant, native-level vocabulary",
    count: 50,
  },
};

async function generateCardsForSubsection(subsectionKey, subsectionData) {
  console.log(
    `\n📝 Generating ${subsectionData.count} cards for ${subsectionData.title}...`
  );

  const prompt = `Generate exactly ${subsectionData.count} vocabulary/phrase cards for language learning in JSON format.

Subsection: ${subsectionData.title}
Description: ${subsectionData.description}

Requirements:
1. Each card should have: { "front": "word/phrase", "back": "definition/translation", "example": "example sentence" }
2. Cards should be practical and commonly used
3. Front should be the word/phrase to learn
4. Back should be a clear, concise definition or translation
5. Example should show the word in context
6. Return ONLY valid JSON array, no markdown, no explanation

Return exactly this format:
[
  { "front": "word", "back": "definition", "example": "sentence" },
  ...
]`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Extract JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error(`❌ No JSON found for ${subsectionData.title}`);
      return [];
    }

    const cards = JSON.parse(jsonMatch[0]);

    if (!Array.isArray(cards)) {
      console.error(`❌ Invalid format for ${subsectionData.title}`);
      return [];
    }

    console.log(`✅ Generated ${cards.length} cards for ${subsectionData.title}`);
    return cards.map((card) => ({
      subsection: subsectionKey,
      subsectionTitle: subsectionData.title,
      front: card.front || "",
      back: card.back || "",
      example: card.example || "",
    }));
  } catch (error) {
    console.error(
      `❌ Error generating cards for ${subsectionData.title}:`,
      error.message
    );
    return [];
  }
}

async function generateAllCards() {
  console.log("🚀 Starting Basics cards generation...\n");

  const allCards = [];
  let totalCount = 0;

  for (const [key, data] of Object.entries(subsections)) {
    const cards = await generateCardsForSubsection(key, data);
    allCards.push(...cards);
    totalCount += cards.length;
  }

  console.log(`\n📊 Total cards generated: ${totalCount}`);
  console.log(JSON.stringify(allCards, null, 2));

  return allCards;
}

generateAllCards().catch(console.error);
