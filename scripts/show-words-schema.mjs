#!/usr/bin/env node
import mysql from 'mysql2/promise';
import { URL } from 'url';

const dbUrl = process.env.DATABASE_URL;
const url = new URL(dbUrl);
const config = {
  host: url.hostname,
  port: parseInt(url.port) || 3306,
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  ssl: url.searchParams.get('ssl') ? JSON.parse(url.searchParams.get('ssl')) : true,
};

async function showSchema() {
  let connection;
  try {
    connection = await mysql.createConnection(config);
    
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY, COLUMN_DEFAULT
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'words'
      ORDER BY ORDINAL_POSITION
    `, [config.database]);
    
    console.log('\n📋 Words table schema:\n');
    for (const col of columns) {
      console.log(`  ${col.COLUMN_NAME.padEnd(20)} ${col.COLUMN_TYPE.padEnd(30)} ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}`);
    }
    console.log('');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

showSchema();
