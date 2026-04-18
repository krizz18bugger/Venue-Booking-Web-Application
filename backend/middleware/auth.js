import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

// ─── Protect: any authenticated user ─────────────────────────
export const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Invalid token' });
  }
};

// ─── Role Guards ──────────────────────────────────────────────
export const ownerOnly = (req, res, next) => {
  if (req.user?.role !== 'owner') {
    return res.status(403).json({ success: false, message: 'Forbidden: Owner access only' });
  }
  next();
};

export const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Forbidden: Admin access only' });
  }
  next();
};

export const customerOnly = (req, res, next) => {
  if (req.user?.role !== 'customer') {
    return res.status(403).json({ success: false, message: 'Forbidden: Customer access only' });
  }
  next();
};

// ─── Authenticated (any role) ─────────────────────────────────
export const authenticated = (req, res, next) => {
  // Already handled by protect; this is an alias for clarity
  next();
};
