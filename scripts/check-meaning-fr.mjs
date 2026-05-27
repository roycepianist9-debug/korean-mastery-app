import { createConnection } from 'mysql2/promise';

const url = process.env.DATABASE_URL;
if (!url) { console.error('No DATABASE_URL'); process.exit(1); }

// Parse mysql://user:pass@host:port/db
const match = url.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
if (!match) { console.error('Cannot parse DATABASE_URL'); process.exit(1); }
const [, user, password, host, port, database] = match;

const conn = await createConnection({
  host, port: parseInt(port), user, password, database,
  ssl: { rejectUnauthorized: false }
});

const [krFr] = await conn.execute("SELECT COUNT(*) as cnt FROM words WHERE language='korean' AND meaning_fr IS NOT NULL AND meaning_fr != ''");
const [krTotal] = await conn.execute("SELECT COUNT(*) as cnt FROM words WHERE language='korean'");
const [jaFr] = await conn.execute("SELECT COUNT(*) as cnt FROM words WHERE language='japanese' AND meaning_fr IS NOT NULL AND meaning_fr != ''");
const [jaTotal] = await conn.execute("SELECT COUNT(*) as cnt FROM words WHERE language='japanese'");
const [sample] = await conn.execute("SELECT korean, meaning, meaning_fr FROM words WHERE language='korean' LIMIT 3");

console.log('Korean with meaningFr:', krFr[0].cnt, '/', krTotal[0].cnt);
console.log('Japanese with meaningFr:', jaFr[0].cnt, '/', jaTotal[0].cnt);
console.log('Sample Korean rows:', JSON.stringify(sample, null, 2));

await conn.end();
