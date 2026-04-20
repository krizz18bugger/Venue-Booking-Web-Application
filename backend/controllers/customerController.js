import { query } from '../config/db.js';
import bcrypt from 'bcryptjs';

// ─── Get Customer Profile ─────────────────────────────────────────────────────
// GET /api/users/profile
export const getCustomerProfile = async (req, res) => {
  try {
    const result = await query(`
      SELECT u.id, u.name, u.email, u.phone, u.city, u.profile_pic, u.created_at,
             COUNT(b.id) AS total_bookings,
             COUNT(b.id) FILTER (WHERE b.date >= CURRENT_DATE AND b.status NOT IN ('Cancelled')) AS upcoming_events,
             COALESCE(SUM(t.amount) FILTER (WHERE t.status='Success'),0) AS total_spent
      FROM users u
      LEFT JOIN bookings b ON b.user_id = u.id
      LEFT JOIN transactions t ON t.booking_id = b.id
      WHERE u.id = $1
      GROUP BY u.id
    `, [req.user.id]);

    if (!result.rows.length) return res.status(404).json({ success: false, message: 'User not found' });
    const { password: _, ...user } = result.rows[0];
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── Update Customer Profile ──────────────────────────────────────────────────
// PUT /api/users/profile
export const updateCustomerProfile = async (req, res) => {
  const { name, phone, city, profile_pic } = req.body;
  try {
    const result = await query(
      `UPDATE users SET name=$1, phone=$2, city=$3, profile_pic=$4 WHERE id=$5
       RETURNING id, name, email, phone, city, profile_pic`,
      [name, phone || null, city || null, profile_pic || null, req.user.id]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── Change Password ──────────────────────────────────────────────────────────
// PUT /api/users/change-password
export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const result = await query(`SELECT password FROM users WHERE id = $1`, [req.user.id]);
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'User not found' });
    const isMatch = await bcrypt.compare(currentPassword, result.rows[0].password);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    const hashed = await bcrypt.hash(newPassword, 10);
    await query(`UPDATE users SET password=$1 WHERE id=$2`, [hashed, req.user.id]);
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── Get Public Venues (with advanced filters) ────────────────────────────────
// GET /api/venues?search=&city=&availableOn=&minPrice=&maxPrice=&minCapacity=&sortBy=&page=&limit=
export const getPublicVenues = async (req, res) => {
  const {
    search = '', city = '', availableOn = '',
    minPrice = 0, maxPrice = 9999999,
    minCapacity = 0,
    sortBy = 'newest',
    page = 1, limit = 12,
  } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    const conditions = [`h.is_active = true`, `h.status = 'Active'`];
    const params = [];

    if (search) { params.push(`%${search}%`); conditions.push(`(h.name ILIKE $${params.length} OR h.location ILIKE $${params.length})`); }
    if (city)   { params.push(`%${city}%`); conditions.push(`h.location ILIKE $${params.length}`); }

    params.push(parseFloat(minPrice)); conditions.push(`h.price >= $${params.length}`);
    params.push(parseFloat(maxPrice)); conditions.push(`h.price <= $${params.length}`);

    // Availability date filter — exclude halls booked on that date
    if (availableOn) {
      params.push(availableOn);
      conditions.push(`h.id NOT IN (
        SELECT hall_id FROM availability WHERE date = $${params.length} AND status IN ('Booked','Blocked')
      )`);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const orderMap = {
      'price_asc':  'h.price ASC',
      'price_desc': 'h.price DESC',
      'capacity':   '(hd.capacity->>\'seating\')::int DESC NULLS LAST',
      'newest':     'h.created_at DESC',
      'rating':     'avg_rating DESC NULLS LAST',
    };
    const orderBy = orderMap[sortBy] || 'h.created_at DESC';

    params.push(parseInt(limit), offset);

    const result = await query(`
      SELECT h.id, h.name, h.location, h.price, h.status, h.is_active, h.created_at,
             o.name AS owner_name,
             hd.capacity,
             hi.image_url AS primary_image,
             ROUND(AVG(r.rating),1) AS avg_rating,
             COUNT(DISTINCT r.id) AS review_count
      FROM halls h
      JOIN owners o ON o.id = h.owner_id
      LEFT JOIN hall_details hd ON hd.hall_id = h.id
      LEFT JOIN hall_images hi ON hi.hall_id = h.id AND hi.is_primary = true
      LEFT JOIN reviews r ON r.hall_id = h.id
      ${whereClause}
      GROUP BY h.id, o.name, hd.capacity, hi.image_url
      ORDER BY ${orderBy}
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params);

    const countParams = params.slice(0, params.length - 2);
    const total = await query(`SELECT COUNT(*) FROM halls h LEFT JOIN hall_details hd ON hd.hall_id = h.id ${whereClause}`, countParams);

    // Distinct city list for dropdown
    const cities = await query(`SELECT DISTINCT location FROM halls WHERE is_active=true AND status='Active' ORDER BY location`);

    res.json({
      success: true,
      data: result.rows,
      total: parseInt(total.rows[0].count),
      cities: cities.rows.map(r => r.location),
      pagination: { total: parseInt(total.rows[0].count), page: parseInt(page), limit: parseInt(limit) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── Get Single Venue Detail ──────────────────────────────────────────────────
// GET /api/venues/:id
export const getVenueDetail = async (req, res) => {
  try {
    const hall = await query(`
      SELECT h.*, o.name AS owner_name, o.phone AS owner_phone,
             hd.features, hd.capacity, hd.rules, hd.payment_rules,
             ROUND(AVG(r.rating),1) AS avg_rating,
             COUNT(DISTINCT r.id)   AS review_count
      FROM halls h
      JOIN owners o ON o.id = h.owner_id
      LEFT JOIN hall_details hd ON hd.hall_id = h.id
      LEFT JOIN reviews r ON r.hall_id = h.id
      WHERE h.id = $1
      GROUP BY h.id, o.name, o.phone, hd.features, hd.capacity, hd.rules, hd.payment_rules
    `, [req.params.id]);

    if (!hall.rows.length) return res.status(404).json({ success: false, message: 'Venue not found' });

    const images = await query(`SELECT image_url, is_primary FROM hall_images WHERE hall_id=$1 ORDER BY is_primary DESC`, [req.params.id]);
    const bookedDates = await query(`SELECT date FROM availability WHERE hall_id=$1 AND status IN ('Booked','Blocked')`, [req.params.id]);

    res.json({
      success: true,
      data: {
        ...hall.rows[0],
        images: images.rows,
        bookedDates: bookedDates.rows.map(r => r.date),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── Customer Bookings ────────────────────────────────────────────────────────
// GET /api/customer/bookings
export const getCustomerBookings = async (req, res) => {
  try {
    const result = await query(`
      SELECT b.id, b.date AS event_date, b.status, b.amount, b.event_type, b.guest_count,
             b.created_at AS booked_on,
             h.name AS venue_name, h.location,
             hi.image_url AS venue_image,
             t.status AS payment_status, t.payment_method,
             EXISTS(SELECT 1 FROM reviews rv WHERE rv.hall_id=b.hall_id AND rv.user_id=b.user_id) AS has_review,
             EXISTS(SELECT 1 FROM disputes d WHERE d.booking_id=b.id) AS has_dispute
      FROM bookings b
      JOIN halls h ON h.id = b.hall_id
      LEFT JOIN hall_images hi ON hi.hall_id = h.id AND hi.is_primary = true
      LEFT JOIN transactions t ON t.booking_id = b.id
      WHERE b.user_id = $1
      ORDER BY b.date DESC
    `, [req.user.id]);

    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── Create Booking ───────────────────────────────────────────────────────────
// POST /api/customer/bookings
export const createCustomerBooking = async (req, res) => {
  const { hall_id, date, event_type, guest_count, special_requests, payment_method } = req.body;
  try {
    // Check not already booked
    const conflict = await query(
      `SELECT id FROM bookings WHERE hall_id=$1 AND date=$2 AND status NOT IN ('Cancelled')`,
      [hall_id, date]
    );
    if (conflict.rows.length > 0)
      return res.status(409).json({ success: false, message: 'This date is already booked' });

    // Get hall price & owner
    const hall = await query(`SELECT price, owner_id FROM halls WHERE id=$1 AND is_active=true`, [hall_id]);
    if (!hall.rows.length) return res.status(404).json({ success: false, message: 'Venue not found' });

    const amount = hall.rows[0].price;
    const owner_id = hall.rows[0].owner_id;
    const txStatus = payment_method === 'online' ? 'Success' : 'Pending';
    const bookingStatus = 'Pending'; // Always pending until owner approves

    // Insert booking
    const booking = await query(`
      INSERT INTO bookings (hall_id, user_id, date, status, amount, event_type, guest_count, special_requests)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *
    `, [hall_id, req.user.id, date, bookingStatus, amount, event_type || null, guest_count || null, special_requests || null]);

    const bookingId = booking.rows[0].id;

    // Insert transaction
    await query(`
      INSERT INTO transactions (booking_id, amount, payment_method, status)
      VALUES ($1,$2,$3,$4)
    `, [bookingId, amount, payment_method === 'online' ? 'Online' : 'Cash', txStatus]);

    // Mark date as booked in availability
    await query(`
      INSERT INTO availability (hall_id, date, status) VALUES ($1,$2,'Booked')
      ON CONFLICT (hall_id, date) DO UPDATE SET status='Booked'
    `, [hall_id, date]);

    // Insert notification for the hall owner
    await query(`
      INSERT INTO notifications (user_id, type, title, message, status, booking_id)
      VALUES ($1, 'booking_request', 'New Booking Request', 'You have a new booking request for your hall.', 'Pending', $2)
    `, [owner_id, bookingId]);

    res.status(201).json({ success: true, data: booking.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── Cancel Booking ───────────────────────────────────────────────────────────
// PATCH /api/customer/bookings/:id/cancel
export const cancelCustomerBooking = async (req, res) => {
  try {
    const booking = await query(
      `SELECT * FROM bookings WHERE id=$1 AND user_id=$2`,
      [req.params.id, req.user.id]
    );
    if (!booking.rows.length) return res.status(404).json({ success: false, message: 'Booking not found' });

    const eventDate = new Date(booking.rows[0].date);
    const now = new Date();
    const hoursUntilEvent = (eventDate - now) / (1000 * 60 * 60);
    if (hoursUntilEvent < 48)
      return res.status(400).json({ success: false, message: 'Cannot cancel within 48 hours of the event' });

    await query(`UPDATE bookings SET status='Cancelled' WHERE id=$1`, [req.params.id]);
    await query(`UPDATE transactions SET status='Refunded' WHERE booking_id=$1`, [req.params.id]);
    await query(`UPDATE availability SET status='Available' WHERE hall_id=$1 AND date=$2`, [booking.rows[0].hall_id, booking.rows[0].date]);

    res.json({ success: true, message: 'Booking cancelled and refund initiated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};
