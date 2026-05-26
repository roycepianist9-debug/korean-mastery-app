#!/usr/bin/env node
import mysql from 'mysql2/promise';
import { URL } from 'url';

// Parse DATABASE_URL
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('❌ DATABASE_URL not set');
  process.exit(1);
}

const url = new URL(dbUrl);
const config = {
  host: url.hostname,
  port: parseInt(url.port) || 3306,
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  ssl: url.searchParams.get('ssl') ? JSON.parse(url.searchParams.get('ssl')) : true,
};

console.log(`📡 Connecting to: ${config.host}:${config.port}/${config.database}`);

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
];

async function seedBasicsCards() {
  let connection;
  try {
    connection = await mysql.createConnection(config);
    console.log('✅ Connected to database');
    
    // Check if table exists
    const [tables] = await connection.execute(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'basics_cards'",
      [config.database]
    );
    
    if (tables.length === 0) {
      console.log('⚠️  basics_cards table does not exist. Creating...');
      await connection.execute(`
        CREATE TABLE basics_cards (
          id INT AUTO_INCREMENT PRIMARY KEY,
          subsection VARCHAR(255),
          subsectionTitle VARCHAR(255),
          front TEXT,
          back TEXT,
          example TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Table created');
    }
    
    // Check current count
    const [countResult] = await connection.execute('SELECT COUNT(*) as count FROM basics_cards');
    const currentCount = countResult[0].count;
    console.log(`📊 Current basics_cards count: ${currentCount}`);
    
    if (currentCount > 0) {
      console.log('⚠️  Table already has data. Skipping seed.');
      return;
    }
    
    console.log(`🌱 Seeding ${basicsCards.length} Basics cards...`);
    
    // Insert cards
    for (const card of basicsCards) {
      await connection.execute(
        'INSERT INTO basics_cards (subsection, subsectionTitle, front, back, example) VALUES (?, ?, ?, ?, ?)',
        [card.subsection, card.subsectionTitle, card.front, card.back, card.example]
      );
    }
    
    console.log(`✅ Successfully seeded ${basicsCards.length} Basics cards!`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

seedBasicsCards();
