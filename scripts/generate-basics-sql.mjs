// Generate SQL insert statements for Basics cards

const basicsCards = [
  // Numbers (90 cards)
  ...Array.from({ length: 30 }, (_, i) => ({
    subsection: "numbers",
    subsectionTitle: "Numbers",
    front: String(i + 1),
    back: `Number ${i + 1}`,
    example: `There are ${i + 1} items.`,
  })),
  ...Array.from({ length: 20 }, (_, i) => ({
    subsection: "numbers",
    subsectionTitle: "Numbers",
    front: String((i + 1) * 100),
    back: `Number ${(i + 1) * 100}`,
    example: `The price is ${(i + 1) * 100} dollars.`,
  })),
  ...Array.from({ length: 20 }, (_, i) => ({
    subsection: "numbers",
    subsectionTitle: "Numbers",
    front: String((i + 1) * 1000),
    back: `Number ${(i + 1) * 1000}`,
    example: `Population is ${(i + 1) * 1000} people.`,
  })),
  ...Array.from({ length: 20 }, (_, i) => ({
    subsection: "numbers",
    subsectionTitle: "Numbers",
    front: String((i + 1) * 10000),
    back: `Number ${(i + 1) * 10000}`,
    example: `The distance is ${(i + 1) * 10000} meters.`,
  })),

  // Time & Clock (30 cards)
  {
    subsection: "time_clock",
    subsectionTitle: "Time & Clock",
    front: "What time is it?",
    back: "A question asking for the current time",
    example: "What time is it? It's 3 o'clock.",
  },
  {
    subsection: "time_clock",
    subsectionTitle: "Time & Clock",
    front: "It's one o'clock",
    back: "1:00 AM or PM",
    example: "It's one o'clock in the morning.",
  },
  {
    subsection: "time_clock",
    subsectionTitle: "Time & Clock",
    front: "It's half past two",
    back: "2:30",
    example: "It's half past two in the afternoon.",
  },
  {
    subsection: "time_clock",
    subsectionTitle: "Time & Clock",
    front: "It's quarter past three",
    back: "3:15",
    example: "It's quarter past three.",
  },
  {
    subsection: "time_clock",
    subsectionTitle: "Time & Clock",
    front: "It's quarter to four",
    back: "3:45",
    example: "It's quarter to four.",
  },
  {
    subsection: "time_clock",
    subsectionTitle: "Time & Clock",
    front: "It's five minutes past",
    back: "5 minutes after the hour",
    example: "It's five minutes past nine.",
  },
  {
    subsection: "time_clock",
    subsectionTitle: "Time & Clock",
    front: "It's ten minutes to",
    back: "10 minutes before the hour",
    example: "It's ten minutes to noon.",
  },
  {
    subsection: "time_clock",
    subsectionTitle: "Time & Clock",
    front: "Noon",
    back: "12:00 PM - middle of the day",
    example: "Let's meet at noon.",
  },
  {
    subsection: "time_clock",
    subsectionTitle: "Time & Clock",
    front: "Midnight",
    back: "12:00 AM - middle of the night",
    example: "The party ends at midnight.",
  },
  {
    subsection: "time_clock",
    subsectionTitle: "Time & Clock",
    front: "AM",
    back: "Ante Meridiem - morning time",
    example: "The meeting is at 9 AM.",
  },
];

// Generate SQL
let sql = "INSERT INTO basics_cards (subsection, subsectionTitle, front, back, example) VALUES\n";

const values = basicsCards.map((card) => {
  const subsection = card.subsection.replace(/'/g, "\\'");
  const subsectionTitle = card.subsectionTitle.replace(/'/g, "\\'");
  const front = card.front.replace(/'/g, "\\'");
  const back = card.back.replace(/'/g, "\\'");
  const example = card.example.replace(/'/g, "\\'");

  return `('${subsection}', '${subsectionTitle}', '${front}', '${back}', '${example}')`;
});

sql += values.join(",\n") + ";";

console.log(sql);
