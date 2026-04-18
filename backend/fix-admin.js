import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

const { Client } = pg;
const dbName = process.env.DB_NAME || 'venue_booking';
const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: dbName,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password123',
});

async function fixAdmin() {
  await client.connect();
  const hash = await bcrypt.hash('admin123', 10);
  await client.query(`
    INSERT INTO admins (name, email, password)
    VALUES ('System Admin', 'admin@venueapp.com', $1)
    ON CONFLICT (email) DO UPDATE SET password = $1
  `, [hash]);
  
  const customerHash = await bcrypt.hash('password123', 10);
  await client.query(`
    INSERT INTO users (name, email, password, phone, is_active)
    VALUES ('Demo Customer', 'customer@venueapp.com', $1, '+91-9000000000', true)
    ON CONFLICT (email) DO UPDATE SET password = $1
  `, [customerHash]);

  console.log('✅ Admin and Customer demo credentials updated!');
  await client.end();
}

fixAdmin();
