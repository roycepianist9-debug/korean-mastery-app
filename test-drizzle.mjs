import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

async function test() {
  console.log('Creating connection...');
  const poolConnection = await mysql.createConnection(process.env.DATABASE_URL);
  console.log('Connection created:', poolConnection ? 'yes' : 'no');
  
  console.log('Creating drizzle instance...');
  const db = drizzle(poolConnection);
  console.log('Drizzle instance:', db ? 'yes' : 'no');
  console.log('db.query:', db.query ? 'yes' : 'no');
  console.log('db.query.words:', db.query?.words ? 'yes' : 'no');
  
  await poolConnection.end();
}

test().catch(console.error);
