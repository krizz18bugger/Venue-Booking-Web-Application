import { query } from '../config/db.js';

// GET /api/owner/requests  (pending booking requests)
export const getBookingRequests = async (req, res) => {
  try {
    const result = await query(
      `SELECT n.*, b.date AS booking_date, b.amount, b.event_type, b.guest_count,
              h.name AS hall_name, u.name AS customer_name, u.phone AS customer_phone
       FROM notifications n
       LEFT JOIN bookings b ON n.booking_id = b.id
       LEFT JOIN halls h ON b.hall_id = h.id
       LEFT JOIN users u ON b.user_id = u.id
       WHERE n.user_id = $1 AND n.type = 'booking_request' AND n.status = 'Pending'
       ORDER BY n.created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// PATCH /api/owner/requests/:id/accept
export const acceptBookingRequest = async (req, res) => {
  try {
    // Update notification status
    const notif = await query(
      `UPDATE notifications SET status = 'Accepted', read = true WHERE id = $1 AND user_id = $2 RETURNING booking_id`,
      [req.params.id, req.user.id]
    );
    if (notif.rows.length === 0) return res.status(404).json({ success: false, message: 'Request not found' });

    // Update booking status
    const bookingId = notif.rows[0].booking_id;
    if (bookingId) {
      await query(`UPDATE bookings SET status = 'Confirmed' WHERE id = $1`, [bookingId]);
    }
    res.json({ success: true, message: 'Booking request accepted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// PATCH /api/owner/requests/:id/decline
export const declineBookingRequest = async (req, res) => {
  try {
    const notif = await query(
      `UPDATE notifications SET status = 'Declined', read = true WHERE id = $1 AND user_id = $2 RETURNING booking_id`,
      [req.params.id, req.user.id]
    );
    if (notif.rows.length === 0) return res.status(404).json({ success: false, message: 'Request not found' });

    const bookingId = notif.rows[0].booking_id;
    if (bookingId) {
      const booking = await query(`UPDATE bookings SET status = 'Cancelled' WHERE id = $1 RETURNING hall_id, date`, [bookingId]);
      if (booking.rows.length > 0) {
         await query(`UPDATE availability SET status = 'Available' WHERE hall_id = $1 AND date = $2`, [booking.rows[0].hall_id, booking.rows[0].date]);
      }
    }
    res.json({ success: true, message: 'Booking request declined' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// GET /api/owner/cancellations
export const getCancellations = async (req, res) => {
  try {
    const result = await query(
      `SELECT n.*, b.date AS booking_date, b.amount, h.name AS hall_name, u.name AS customer_name
       FROM notifications n
       LEFT JOIN bookings b ON n.booking_id = b.id
       LEFT JOIN halls h ON b.hall_id = h.id
       LEFT JOIN users u ON b.user_id = u.id
       WHERE n.user_id = $1 AND n.type = 'cancellation'
       ORDER BY n.created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// GET /api/owner/payments
export const getPaymentNotifications = async (req, res) => {
  try {
    const result = await query(
      `SELECT n.*, t.amount AS transaction_amount, t.payment_method, t.status AS payment_status,
              h.name AS hall_name
       FROM notifications n
       LEFT JOIN bookings b ON n.booking_id = b.id
       LEFT JOIN halls h ON b.hall_id = h.id
       LEFT JOIN transactions t ON t.booking_id = b.id
       WHERE n.user_id = $1 AND n.type = 'payment'
       ORDER BY n.created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// PATCH /api/notifications/mark-all-read
export const markAllAsRead = async (req, res) => {
  try {
    await query(`UPDATE notifications SET read = true WHERE user_id = $1`, [req.user.id]);
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};
