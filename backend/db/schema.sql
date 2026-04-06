-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Owners table
CREATE TABLE IF NOT EXISTS owners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Halls table
CREATE TABLE IF NOT EXISTS halls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES owners(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  address TEXT,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Pending')),
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  rating NUMERIC(3,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Hall Details table
CREATE TABLE IF NOT EXISTS hall_details (
  hall_id UUID PRIMARY KEY REFERENCES halls(id) ON DELETE CASCADE,
  features JSONB DEFAULT '[]',
  capacity JSONB DEFAULT '{}',
  rules JSONB DEFAULT '[]',
  payment_rules JSONB DEFAULT '{}'
);

-- Hall Images table
CREATE TABLE IF NOT EXISTS hall_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hall_id UUID REFERENCES halls(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Availability table
CREATE TABLE IF NOT EXISTS availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hall_id UUID REFERENCES halls(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT DEFAULT 'Available' CHECK (status IN ('Available', 'Booked', 'Blocked')),
  UNIQUE(hall_id, date)
);

-- Users table (customers)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hall_id UUID REFERENCES halls(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Confirmed', 'Completed', 'Cancelled')),
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  event_type TEXT,
  guest_count INTEGER,
  special_requests TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  payment_method TEXT DEFAULT 'Online' CHECK (payment_method IN ('Online', 'Cash', 'Bank Transfer', 'UPI')),
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Success', 'Pending', 'Failed', 'Refunded')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hall_id UUID REFERENCES halls(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  type TEXT NOT NULL CHECK (type IN ('booking_request', 'cancellation', 'payment', 'general')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'New',
  read BOOLEAN DEFAULT false,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_halls_owner ON halls(owner_id);
CREATE INDEX IF NOT EXISTS idx_bookings_hall ON bookings(hall_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_booking ON transactions(booking_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_availability_hall_date ON availability(hall_id, date);
