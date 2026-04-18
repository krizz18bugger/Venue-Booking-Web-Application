import { query } from '../config/db.js';

// POST /api/disputes  (authenticated customer)
export const raiseDispute = async (req, res) => {
  const { booking_id, subject, description } = req.body;
  if (!subject || !description)
    return res.status(400).json({ success: false, message: 'Subject and description are required' });

  try {
    // Verify booking belongs to this user
    if (booking_id) {
      const booking = await query(
        `SELECT id FROM bookings WHERE id=$1 AND user_id=$2`,
        [booking_id, req.user.id]
      );
      if (!booking.rows.length)
        return res.status(403).json({ success: false, message: 'Booking not found or not yours' });

      // One dispute per booking
      const existing = await query(
        `SELECT dispute_id FROM disputes WHERE booking_id=$1`,
        [booking_id]
      );
      if (existing.rows.length)
        return res.status(409).json({ success: false, message: 'A dispute already exists for this booking' });
    }

    const result = await query(`
      INSERT INTO disputes (booking_id, raised_by, subject, description)
      VALUES ($1,$2,$3,$4)
      RETURNING *
    `, [booking_id || null, req.user.id, subject, description]);

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// GET /api/disputes/my  (customer's own disputes)
export const getMyDisputes = async (req, res) => {
  try {
    const result = await query(`
      SELECT d.*, h.name AS venue_name, b.date AS event_date
      FROM disputes d
      LEFT JOIN bookings b ON b.id = d.booking_id
      LEFT JOIN halls h ON h.id = b.hall_id
      WHERE d.raised_by = $1
      ORDER BY d.created_at DESC
    `, [req.user.id]);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};
