import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';
import dotenv from 'dotenv';
dotenv.config();

// POST /api/auth/login
export const loginOwner = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });
  try {
    const result = await query('SELECT * FROM owners WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const owner = result.rows[0];
    const isMatch = await bcrypt.compare(password, owner.password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: owner.id, email: owner.email, role: 'owner', name: owner.name },
      process.env.JWT_SECRET || 'secret_key',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    res.json({ success: true, token, user: { id: owner.id, name: owner.name, email: owner.email, role: 'owner' } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// POST /api/auth/register
export const registerOwner = async (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password) return res.status(400).json({ success: false, message: 'Name, email, password required' });
  try {
    const exists = await query('SELECT id FROM owners WHERE email = $1', [email]);
    if (exists.rows.length > 0) return res.status(409).json({ success: false, message: 'Email already registered' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await query(
      'INSERT INTO owners (name, email, password, phone) VALUES ($1, $2, $3, $4) RETURNING id, name, email',
      [name, email, hashedPassword, phone || null]
    );
    const owner = result.rows[0];
    const token = jwt.sign({ id: owner.id, email: owner.email, role: 'owner', name: owner.name }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '7d' });
    res.status(201).json({ success: true, token, user: { ...owner, role: 'owner' } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};
