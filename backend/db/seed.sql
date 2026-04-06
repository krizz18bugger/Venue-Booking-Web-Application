-- Seed data for local testing
-- Run AFTER schema.sql

-- Insert test owner
INSERT INTO owners (id, name, email, password, phone) VALUES
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Ravi Kumar', 'owner@venueapp.com',
   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPezaYMv2mK', -- password: password123
   '+91-9876543210')
ON CONFLICT (email) DO NOTHING;

-- Insert test customer/user
INSERT INTO users (id, name, email, password, phone) VALUES
  ('b1b2c3d4-0000-0000-0000-000000000001', 'Rahul Sharma', 'rahul@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPezaYMv2mK', '+91-9123456789'),
  ('b1b2c3d4-0000-0000-0000-000000000002', 'Priya Singh', 'priya@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPezaYMv2mK', '+91-9234567890'),
  ('b1b2c3d4-0000-0000-0000-000000000003', 'Amit Kumar', 'amit@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPezaYMv2mK', '+91-9345678901'),
  ('b1b2c3d4-0000-0000-0000-000000000004', 'Meera Patel', 'meera@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPezaYMv2mK', '+91-9456789012'),
  ('b1b2c3d4-0000-0000-0000-000000000005', 'Sunil Shetty', 'sunil@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPezaYMv2mK', '+91-9567890123')
ON CONFLICT (email) DO NOTHING;

-- Insert halls
INSERT INTO halls (id, owner_id, name, location, address, status, price, rating) VALUES
  ('c1b2c3d4-0000-0000-0000-000000000001', 'a1b2c3d4-0000-0000-0000-000000000001', 'Grand Orchid Banquet', 'Downtown, Metro City', '12, MG Road, Downtown, Metro City - 560001', 'Active', 45000, 4.8),
  ('c1b2c3d4-0000-0000-0000-000000000002', 'a1b2c3d4-0000-0000-0000-000000000001', 'Silver Crown Hall', 'Westside, Metro City', '5, Park Street, Westside, Metro City - 560002', 'Active', 30000, 4.5),
  ('c1b2c3d4-0000-0000-0000-000000000003', 'a1b2c3d4-0000-0000-0000-000000000001', 'Heritage Open Grounds', 'Eastville, Metro City', '90, Heritage Road, Eastville, Metro City - 560003', 'Active', 80000, 4.2)
ON CONFLICT (id) DO NOTHING;

-- Insert hall details
INSERT INTO hall_details (hall_id, features, capacity, rules, payment_rules) VALUES
  ('c1b2c3d4-0000-0000-0000-000000000001',
   '["Air Conditioning", "Parking", "Catering", "Sound System", "Projector", "WiFi"]',
   '{"seating": 500, "dining": 300, "standing": 700}',
   '["No outside alcohol", "Noise curfew at 10 PM", "Decorations approved in advance"]',
   '{"advance": 30, "cancellation_policy": "50% refund if cancelled 7 days before"}'),
  ('c1b2c3d4-0000-0000-0000-000000000002',
   '["Air Conditioning", "Parking", "Sound System", "Stage", "WiFi"]',
   '{"seating": 300, "dining": 200, "standing": 400}',
   '["No pets allowed", "Venue closed by 11 PM"]',
   '{"advance": 25, "cancellation_policy": "Full refund if cancelled 10 days before"}'),
  ('c1b2c3d4-0000-0000-0000-000000000003',
   '["Open Air", "Parking", "Generator Backup", "Catering Kitchen", "Stage"]',
   '{"seating": 1500, "dining": 1000, "standing": 2000}',
   '["Prior permission required for fireworks", "Security deposit mandatory"]',
   '{"advance": 40, "cancellation_policy": "No refund within 3 days"}')
ON CONFLICT (hall_id) DO NOTHING;

-- Insert hall images
INSERT INTO hall_images (hall_id, image_url, is_primary) VALUES
  ('c1b2c3d4-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800', true),
  ('c1b2c3d4-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800', false),
  ('c1b2c3d4-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800', true),
  ('c1b2c3d4-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800', false),
  ('c1b2c3d4-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=800', true)
ON CONFLICT DO NOTHING;

-- Insert bookings
INSERT INTO bookings (id, hall_id, user_id, date, status, amount, event_type, guest_count) VALUES
  ('d1b2c3d4-0000-0000-0000-000000000001', 'c1b2c3d4-0000-0000-0000-000000000001', 'b1b2c3d4-0000-0000-0000-000000000001', '2025-12-10', 'Completed', 45000, 'Wedding', 400),
  ('d1b2c3d4-0000-0000-0000-000000000002', 'c1b2c3d4-0000-0000-0000-000000000002', 'b1b2c3d4-0000-0000-0000-000000000004', '2025-12-15', 'Cancelled', 30000, 'Birthday Party', 150),
  ('d1b2c3d4-0000-0000-0000-000000000003', 'c1b2c3d4-0000-0000-0000-000000000003', 'b1b2c3d4-0000-0000-0000-000000000005', '2025-12-20', 'Completed', 80000, 'Corporate Event', 1200),
  ('d1b2c3d4-0000-0000-0000-000000000004', 'c1b2c3d4-0000-0000-0000-000000000001', 'b1b2c3d4-0000-0000-0000-000000000003', '2026-01-05', 'Completed', 45000, 'Reception', 350),
  ('d1b2c3d4-0000-0000-0000-000000000005', 'c1b2c3d4-0000-0000-0000-000000000002', 'b1b2c3d4-0000-0000-0000-000000000002', '2026-01-15', 'Pending', 30000, 'Engagement', 200),
  ('d1b2c3d4-0000-0000-0000-000000000006', 'c1b2c3d4-0000-0000-0000-000000000001', 'b1b2c3d4-0000-0000-0000-000000000001', '2026-02-14', 'Confirmed', 45000, 'Anniversary', 300)
ON CONFLICT (id) DO NOTHING;

-- Insert transactions
INSERT INTO transactions (booking_id, amount, payment_method, status, created_at) VALUES
  ('d1b2c3d4-0000-0000-0000-000000000001', 45000, 'Online', 'Success', '2025-12-10 10:30:00'),
  ('d1b2c3d4-0000-0000-0000-000000000002', 30000, 'UPI', 'Refunded', '2025-12-15 14:00:00'),
  ('d1b2c3d4-0000-0000-0000-000000000003', 80000, 'Bank Transfer', 'Success', '2025-12-20 09:00:00'),
  ('d1b2c3d4-0000-0000-0000-000000000004', 45000, 'Online', 'Success', '2026-01-05 11:00:00'),
  ('d1b2c3d4-0000-0000-0000-000000000005', 9000, 'UPI', 'Success', '2026-01-14 16:00:00'),
  ('d1b2c3d4-0000-0000-0000-000000000006', 13500, 'Online', 'Pending', '2026-01-20 10:00:00');

-- Insert reviews
INSERT INTO reviews (hall_id, user_id, rating, comment, created_at) VALUES
  ('c1b2c3d4-0000-0000-0000-000000000001', 'b1b2c3d4-0000-0000-0000-000000000001', 5, 'Amazing hall with great central AC. The staff was very helpful and the event was a grand success!', '2025-12-11 09:00:00'),
  ('c1b2c3d4-0000-0000-0000-000000000001', 'b1b2c3d4-0000-0000-0000-000000000004', 4, 'Good space, but parking was slightly congested during the evening.', '2025-11-22 11:00:00'),
  ('c1b2c3d4-0000-0000-0000-000000000002', 'b1b2c3d4-0000-0000-0000-000000000003', 5, 'Perfect for our corporate event. Modern amenities and excellent sound system.', '2025-11-02 14:00:00'),
  ('c1b2c3d4-0000-0000-0000-000000000003', 'b1b2c3d4-0000-0000-0000-000000000005', 4, 'Beautiful open grounds. The space is huge and very well maintained.', '2025-12-21 10:00:00');

-- Insert notifications
INSERT INTO notifications (user_id, type, title, message, status, read, booking_id, created_at) VALUES
  ('a1b2c3d4-0000-0000-0000-000000000001', 'booking_request', 'New Booking Request', 'Priya Singh wants to book Silver Crown Hall on Jan 15.', 'Pending', false, 'd1b2c3d4-0000-0000-0000-000000000005', NOW() - INTERVAL '10 minutes'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'booking_request', 'New Booking Request', 'Rahul Sharma wants to book Grand Orchid for Feb 14.', 'Pending', false, 'd1b2c3d4-0000-0000-0000-000000000006', NOW() - INTERVAL '2 hours'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'cancellation', 'Booking Cancelled', 'Meera Patel cancelled booking B-1002 due to an emergency.', 'Refund Pending', false, 'd1b2c3d4-0000-0000-0000-000000000002', NOW() - INTERVAL '1 day'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'payment', 'Payment Received', '₹45,000 received for Grand Orchid Banquet booking on Dec 10.', 'Success', true, 'd1b2c3d4-0000-0000-0000-000000000001', NOW() - INTERVAL '5 hours'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'payment', 'Payment Pending', '₹13,500 advance payment pending for booking B-6.', 'Pending', false, 'd1b2c3d4-0000-0000-0000-000000000006', NOW() - INTERVAL '3 hours');
