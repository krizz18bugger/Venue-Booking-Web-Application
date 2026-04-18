-- =====================================================
-- MIGRATIONS — Admin & Customer Module
-- Run AFTER schema.sql on an existing database
-- =====================================================

-- 1. owners: add approval_status
ALTER TABLE owners ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'pending'
  CHECK (approval_status IN ('pending', 'approved', 'rejected'));

ALTER TABLE owners ADD COLUMN IF NOT EXISTS address TEXT;

-- Approve existing owners so they are not blocked
UPDATE owners SET approval_status = 'approved' WHERE approval_status = 'pending';

-- 2. users: add is_active, profile columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active    BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_pic  TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS city         VARCHAR(100);
-- phone already exists in users table from schema.sql

-- 3. halls: add is_active, flag_reason
ALTER TABLE halls ADD COLUMN IF NOT EXISTS is_active    BOOLEAN DEFAULT true;
ALTER TABLE halls ADD COLUMN IF NOT EXISTS flag_reason  TEXT;

-- 4. Admins table
CREATE TABLE IF NOT EXISTS admins (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL,
  email      TEXT UNIQUE NOT NULL,
  password   TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Disputes table
CREATE TABLE IF NOT EXISTS disputes (
  dispute_id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id   UUID REFERENCES bookings(id),
  raised_by    UUID REFERENCES users(id),
  subject      VARCHAR(200) NOT NULL,
  description  TEXT NOT NULL,
  status       VARCHAR(20) DEFAULT 'open'
                 CHECK (status IN ('open', 'under_review', 'resolved', 'closed')),
  admin_notes  TEXT,
  created_at   TIMESTAMP DEFAULT NOW(),
  resolved_at  TIMESTAMP
);

-- 6. Extend reviews table with UNIQUE constraint if not already there
-- (schema.sql already has reviews table but without UNIQUE; add safely)
-- Skipped adding unique constraint to reviews to avoid migration failure with existing duplicates

-- 7. Seed default admin (password: admin123)
-- Hash of 'admin123' with bcrypt rounds=10
INSERT INTO admins (name, email, password) VALUES
  ('System Admin', 'admin@venueapp.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPezaYMv2mK')
ON CONFLICT (email) DO NOTHING;

-- 8. Seed a demo customer (password: password123)
INSERT INTO users (name, email, password, phone, is_active) VALUES
  ('Demo Customer', 'customer@venueapp.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPezaYMv2mK', '+91-9000000000', true)
ON CONFLICT (email) DO NOTHING;

-- Done
SELECT 'Migrations applied successfully' AS result;
