import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';
import dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET  = process.env.JWT_SECRET  || 'secret_key';
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || '7d';

const sign = (payload) => jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });

// ─────────────────────────────────────────────────────────────
// OWNER AUTH (existing)
// ─────────────────────────────────────────────────────────────

// POST /api/auth/login  (owner)
export const loginOwner = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ success: false, message: 'Email and password required' });
  try {
    const result = await query('SELECT * FROM owners WHERE email = $1', [email]);
    if (result.rows.length === 0)
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const owner = result.rows[0];
    const isMatch = await bcrypt.compare(password, owner.password);
    if (!isMatch)
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    // Check approval
    if (owner.approval_status && owner.approval_status !== 'approved') {
      return res.status(403).json({
        success: false,
        message: owner.approval_status === 'pending'
          ? 'Your account is pending admin approval.'
          : 'Your account has been rejected. Contact admin.',
      });
    }

    const token = sign({ id: owner.id, email: owner.email, role: 'owner', name: owner.name });
    res.json({
      success: true, token,
      user: { id: owner.id, name: owner.name, email: owner.email, role: 'owner' },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// POST /api/auth/register  (owner)
export const registerOwner = async (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ success: false, message: 'Name, email, password required' });
  try {
    const exists = await query('SELECT id FROM owners WHERE email = $1', [email]);
    if (exists.rows.length > 0)
      return res.status(409).json({ success: false, message: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await query(
      'INSERT INTO owners (name, email, password, phone, approval_status) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email',
      [name, email, hashedPassword, phone || null, 'pending']
    );
    const owner = result.rows[0];
    // Return token but the frontend should tell owner they're pending approval
    const token = sign({ id: owner.id, email: owner.email, role: 'owner', name: owner.name });
    res.status(201).json({
      success: true, token,
      user: { ...owner, role: 'owner', approval_status: 'pending' },
      message: 'Registration successful. Your account is pending admin approval.',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// ADMIN AUTH
// ─────────────────────────────────────────────────────────────

// POST /api/auth/admin/login
export const loginAdmin = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ success: false, message: 'Email and password required' });
  try {
    const result = await query('SELECT * FROM admins WHERE email = $1', [email]);
    if (result.rows.length === 0)
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const admin = result.rows[0];
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch)
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const token = sign({ id: admin.id, email: admin.email, role: 'admin', name: admin.name });
    res.json({
      success: true, token,
      user: { id: admin.id, name: admin.name, email: admin.email, role: 'admin' },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// CUSTOMER AUTH
// ─────────────────────────────────────────────────────────────

// POST /api/auth/customer/register
export const registerCustomer = async (req, res) => {
  const { name, email, password, phone, city } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ success: false, message: 'Name, email, password required' });
  try {
    const exists = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (exists.rows.length > 0)
      return res.status(409).json({ success: false, message: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);
    const result = await query(
      'INSERT INTO users (name, email, password, phone, city, is_active) VALUES ($1,$2,$3,$4,$5,true) RETURNING id, name, email',
      [name, email, hashed, phone || null, city || null]
    );
    const customer = result.rows[0];
    const token = sign({ id: customer.id, email: customer.email, role: 'customer', name: customer.name });
    res.status(201).json({
      success: true, token,
      user: { ...customer, role: 'customer' },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// POST /api/auth/customer/login
export const loginCustomer = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ success: false, message: 'Email and password required' });
  try {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0)
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    if (user.is_active === false)
      return res.status(403).json({
        success: false,
        message: 'Account suspended. Contact admin.',
      });

    const token = sign({ id: user.id, email: user.email, role: 'customer', name: user.name });
    res.json({
      success: true, token,
      user: { id: user.id, name: user.name, email: user.email, role: 'customer', phone: user.phone, city: user.city, profile_pic: user.profile_pic },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};
