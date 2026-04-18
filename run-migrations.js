import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: './backend/.env' });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { Client } = pg;
const dbName = process.env.DB_NAME || 'venue_booking';

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: dbName,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password123',
});

async function runMigrations() {
  try {
    await client.connect();
    console.log('✅ Connected to target PostgreSQL database');

    const migrations = fs.readFileSync(path.join(__dirname, 'backend/db/migrations.sql'), 'utf8');
    console.log('📋 Running migrations.sql...');
    await client.query(migrations);
    console.log('✅ Migrations applied successfully');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await client.end();
  }
}

runMigrations();
