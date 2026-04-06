import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Client } = pg;

const c = new Client({
  host: 'localhost',
  port: 5432,
  database: 'venue_booking',
  user: 'postgres',
  password: 'password123'
});

c.connect().then(async () => {
  const hash = await bcrypt.hash('password123', 10);
  await c.query('UPDATE owners SET password = $1 WHERE email = $2', [hash, 'owner@venueapp.com']);
  console.log('Password successfully fixed!');
  c.end();
}).catch(e => console.log('Error:', e.message));

