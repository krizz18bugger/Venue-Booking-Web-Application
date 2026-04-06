/**
 * Database Setup Script
 * Run: node backend/db/setup.js
 * Reads schema.sql and seed.sql and executes them against PostgreSQL
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: './backend/.env' });

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const { Client } = pg;

const dbName = process.env.DB_NAME || 'venue_booking';

const initialClient = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: 'postgres',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password123',
});

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: dbName,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password123',
});

async function setup() {
  console.log('\n🔧 Setting up database...\n');
  
  try {
    console.log('🔄 Creating database if it does not exist...');
    await initialClient.connect();
    
    try {
      await initialClient.query(`CREATE DATABASE "${dbName}"`);
      console.log(`✅ Database "${dbName}" created successfully.`);
    } catch (createErr) {
      if (createErr.code === '42P04') {
        console.log(`ℹ️ Database "${dbName}" already exists. Skipping creation.`);
      } else {
        throw createErr;
      }
    }
    await initialClient.end();

    await client.connect();
    console.log('✅ Connected to target PostgreSQL database\n');

    // Run schema
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    console.log('📋 Running schema.sql...');
    await client.query(schema);
    console.log('✅ Schema created\n');

    // Run seed
    const seed = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');
    console.log('🌱 Running seed.sql...');
    await client.query(seed);
    console.log('✅ Seed data inserted\n');

    console.log('🎉 Database setup complete!\n');
    console.log('📝 Test credentials:');
    console.log('   Email:    owner@venueapp.com');
    console.log('   Password: password123\n');
  } catch (err) {
    console.error('❌ Setup failed:', err.message);
    console.error('\n💡 Make sure PostgreSQL is running and your password in backend/.env is correct.\n');
    process.exit(1);
  } finally {
    await client.end();
    process.exit(0);
  }
}

setup();
