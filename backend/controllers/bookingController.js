import { query } from '../config/db.js';

// GET /api/owner/bookings
export const getOwnerBookings = async (req, res) => {
  try {
    const result = await query(
      `SELECT b.*, h.name AS hall_name, u.name AS customer_name, u.email AS customer_email, u.phone AS customer_phone
       FROM bookings b
       JOIN halls h ON b.hall_id = h.id
       JOIN users u ON b.user_id = u.id
       WHERE h.owner_id = $1
       ORDER BY b.created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// GET /api/owner/bookings/:id
export const getBookingById = async (req, res) => {
  try {
    const result = await query(
      `SELECT b.*, h.name AS hall_name, h.location, u.name AS customer_name, u.email AS customer_email, u.phone AS customer_phone,
              t.amount AS paid_amount, t.payment_method, t.status AS payment_status, t.created_at AS payment_date
       FROM bookings b
       JOIN halls h ON b.hall_id = h.id
       JOIN users u ON b.user_id = u.id
       LEFT JOIN transactions t ON t.booking_id = b.id
       WHERE b.id = $1 AND h.owner_id = $2`,
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// GET /api/owner/bookings/export  (CSV)
export const exportBookingsCSV = async (req, res) => {
  try {
    const result = await query(
      `SELECT b.id, u.name AS customer_name, u.email AS customer_email, h.name AS hall_name,
              b.date, b.status, b.amount, b.event_type, b.guest_count, b.created_at
       FROM bookings b
       JOIN halls h ON b.hall_id = h.id
       JOIN users u ON b.user_id = u.id
       WHERE h.owner_id = $1
       ORDER BY b.created_at DESC`,
      [req.user.id]
    );
    const rows = result.rows;
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'No bookings to export' });

    const headers = ['Booking ID', 'Customer Name', 'Customer Email', 'Hall Name', 'Event Date', 'Status', 'Amount (INR)', 'Event Type', 'Guests', 'Booked At'];
    const csvLines = [
      headers.join(','),
      ...rows.map(r =>
        [r.id, `"${r.customer_name}"`, r.customer_email, `"${r.hall_name}"`, r.date, r.status, r.amount, r.event_type || '', r.guest_count || '', new Date(r.created_at).toLocaleDateString()].join(',')
      )
    ];
    const csv = csvLines.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="bookings_export.csv"');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};
