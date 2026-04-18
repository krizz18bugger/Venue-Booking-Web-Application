import { query } from '../config/db.js';

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
// GET /api/admin/dashboard
export const getDashboardStats = async (req, res) => {
  try {
    const [users, halls, todayBookings, revenue, pendingOwners, openDisputes, recentBookings, pendingOwnersList] = await Promise.all([
      query(`SELECT COUNT(*) FROM users`),
      query(`SELECT COUNT(*) FROM halls`),
      query(`SELECT COUNT(*) FROM bookings WHERE DATE(created_at) = CURRENT_DATE`),
      query(`SELECT COALESCE(SUM(amount),0) AS total FROM transactions WHERE status = 'Success'`),
      query(`SELECT COUNT(*) FROM owners WHERE approval_status = 'pending'`),
      query(`SELECT COUNT(*) FROM disputes WHERE status = 'open'`),
      query(`
        SELECT b.id, u.name AS customer_name, h.name AS venue_name,
               b.date AS event_date, b.status, b.amount, b.created_at
        FROM bookings b
        JOIN halls h ON b.hall_id = h.id
        JOIN users u ON b.user_id = u.id
        ORDER BY b.created_at DESC LIMIT 10
      `),
      query(`
        SELECT o.id, o.name, o.email, o.phone, o.approval_status, o.created_at,
               COUNT(h.id) AS venue_count
        FROM owners o
        LEFT JOIN halls h ON h.owner_id = o.id
        WHERE o.approval_status = 'pending'
        GROUP BY o.id
        ORDER BY o.created_at DESC LIMIT 5
      `),
    ]);

    res.json({
      success: true,
      data: {
        totalUsers:       parseInt(users.rows[0].count),
        totalHalls:       parseInt(halls.rows[0].count),
        todayBookings:    parseInt(todayBookings.rows[0].count),
        totalRevenue:     parseFloat(revenue.rows[0].total),
        pendingOwners:    parseInt(pendingOwners.rows[0].count),
        openDisputes:     parseInt(openDisputes.rows[0].count),
        recentBookings:   recentBookings.rows,
        pendingOwnersList: pendingOwnersList.rows,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── Owner Management ─────────────────────────────────────────────────────────
// GET /api/admin/owners?status=pending|approved|rejected
export const getOwners = async (req, res) => {
  const { status = 'pending' } = req.query;
  try {
    const result = await query(`
      SELECT o.id, o.name, o.email, o.phone, o.address, o.approval_status, o.created_at,
             COUNT(h.id) AS venue_count
      FROM owners o
      LEFT JOIN halls h ON h.owner_id = o.id
      WHERE o.approval_status = $1
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `, [status]);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// GET /api/admin/owners/:id  — full owner profile with docs/halls
export const getOwnerProfile = async (req, res) => {
  try {
    const owner = await query(`SELECT * FROM owners WHERE id = $1`, [req.params.id]);
    if (!owner.rows.length) return res.status(404).json({ success: false, message: 'Owner not found' });
    const halls = await query(`
      SELECT h.*, COUNT(b.id) AS booking_count
      FROM halls h LEFT JOIN bookings b ON b.hall_id = h.id
      WHERE h.owner_id = $1 GROUP BY h.id ORDER BY h.created_at DESC
    `, [req.params.id]);
    const { password: _, ...ownerData } = owner.rows[0];
    res.json({ success: true, data: { ...ownerData, halls: halls.rows } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// PATCH /api/admin/owners/:id/approval
export const updateOwnerApproval = async (req, res) => {
  const { status, reason } = req.body;
  if (!['pending', 'approved', 'rejected'].includes(status))
    return res.status(400).json({ success: false, message: 'Invalid status' });
  try {
    const result = await query(
      `UPDATE owners SET approval_status = $1 WHERE id = $2 RETURNING id, name, email, approval_status`,
      [status, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Owner not found' });
    res.json({ success: true, data: result.rows[0], message: `Owner ${status} successfully` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── User Management ──────────────────────────────────────────────────────────
// GET /api/admin/users?search=&role=&page=&limit=
export const getUsers = async (req, res) => {
  const { search = '', page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  try {
    const searchParam = `%${search}%`;
    const result = await query(`
      SELECT u.id, u.name, u.email, u.phone, u.city, u.is_active, u.created_at,
             COUNT(b.id) AS booking_count
      FROM users u
      LEFT JOIN bookings b ON b.user_id = u.id
      WHERE (u.name ILIKE $1 OR u.email ILIKE $1)
      GROUP BY u.id
      ORDER BY u.created_at DESC
      LIMIT $2 OFFSET $3
    `, [searchParam, parseInt(limit), offset]);

    const total = await query(`
      SELECT COUNT(*) FROM users
      WHERE name ILIKE $1 OR email ILIKE $1
    `, [searchParam]);

    res.json({
      success: true,
      data: result.rows,
      pagination: { total: parseInt(total.rows[0].count), page: parseInt(page), limit: parseInt(limit) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// GET /api/admin/users/:id
export const getUserById = async (req, res) => {
  try {
    const user = await query(`
      SELECT u.id, u.name, u.email, u.phone, u.city, u.profile_pic, u.is_active, u.created_at,
             COUNT(b.id) AS booking_count,
             COALESCE(SUM(t.amount) FILTER (WHERE t.status='Success'), 0) AS total_spent
      FROM users u
      LEFT JOIN bookings b ON b.user_id = u.id
      LEFT JOIN transactions t ON t.booking_id = b.id
      WHERE u.id = $1
      GROUP BY u.id
    `, [req.params.id]);
    if (!user.rows.length) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// PATCH /api/admin/users/:id/status
export const updateUserStatus = async (req, res) => {
  const { is_active } = req.body;
  try {
    const result = await query(
      `UPDATE users SET is_active = $1 WHERE id = $2 RETURNING id, name, email, is_active`,
      [is_active, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// DELETE /api/admin/users/:id
export const deleteUser = async (req, res) => {
  try {
    await query(`DELETE FROM users WHERE id = $1`, [req.params.id]);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── Venue/Hall Management ────────────────────────────────────────────────────
// GET /api/admin/venues?search=&status=&page=&limit=
export const getAdminVenues = async (req, res) => {
  const { search = '', status = 'all', page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  try {
    let whereClause = `WHERE (h.name ILIKE $1 OR h.location ILIKE $1)`;
    const params = [`%${search}%`];

    if (status === 'active')   { whereClause += ` AND h.is_active = true AND h.flag_reason IS NULL`; }
    if (status === 'flagged')  { whereClause += ` AND h.flag_reason IS NOT NULL`; }
    if (status === 'removed')  { whereClause += ` AND h.is_active = false`; }

    const result = await query(`
      SELECT h.id, h.name, h.location, h.price, h.status, h.is_active, h.flag_reason, h.created_at,
             o.name AS owner_name,
             hd.capacity,
             COUNT(b.id) AS total_bookings
      FROM halls h
      JOIN owners o ON o.id = h.owner_id
      LEFT JOIN hall_details hd ON hd.hall_id = h.id
      LEFT JOIN bookings b ON b.hall_id = h.id
      ${whereClause}
      GROUP BY h.id, o.name, hd.capacity
      ORDER BY h.created_at DESC
      LIMIT $2 OFFSET $3
    `, [...params, parseInt(limit), offset]);

    const total = await query(`
      SELECT COUNT(*) FROM halls h ${whereClause}
    `, params);

    res.json({
      success: true,
      data: result.rows,
      pagination: { total: parseInt(total.rows[0].count), page: parseInt(page), limit: parseInt(limit) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// PATCH /api/admin/venues/:id/status
export const updateVenueStatus = async (req, res) => {
  const { is_active, flag_reason } = req.body;
  try {
    const result = await query(
      `UPDATE halls SET is_active = $1, flag_reason = $2 WHERE id = $3 RETURNING id, name, is_active, flag_reason`,
      [is_active, flag_reason || null, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Venue not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── Booking Monitor ──────────────────────────────────────────────────────────
// GET /api/admin/bookings?from=&to=&status=&page=&limit=
export const getAdminBookings = async (req, res) => {
  const { from, to, status = 'all', page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  try {
    let conditions = [];
    const params = [];

    if (status !== 'all') { params.push(status); conditions.push(`b.status = $${params.length}`); }
    if (from) { params.push(from); conditions.push(`b.date >= $${params.length}`); }
    if (to)   { params.push(to);   conditions.push(`b.date <= $${params.length}`); }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    params.push(parseInt(limit));
    params.push(offset);

    const result = await query(`
      SELECT b.id, u.name AS customer_name, h.name AS venue_name,
             b.date AS event_date, b.created_at AS booked_on,
             b.status, b.amount,
             t.status AS payment_status, t.payment_method
      FROM bookings b
      JOIN halls h ON b.hall_id = h.id
      JOIN users u ON b.user_id = u.id
      LEFT JOIN transactions t ON t.booking_id = b.id
      ${whereClause}
      ORDER BY b.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params);

    const countParams = params.slice(0, params.length - 2);
    const total = await query(`SELECT COUNT(*), COALESCE(SUM(b.amount),0) AS total_amount FROM bookings b ${whereClause}`, countParams);

    res.json({
      success: true,
      data: result.rows,
      summary: {
        total: parseInt(total.rows[0].count),
        totalAmount: parseFloat(total.rows[0].total_amount),
      },
      pagination: { total: parseInt(total.rows[0].count), page: parseInt(page), limit: parseInt(limit) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// PATCH /api/admin/bookings/:id/status
export const updateBookingStatus = async (req, res) => {
  const { status } = req.body;
  try {
    const result = await query(
      `UPDATE bookings SET status = $1 WHERE id = $2 RETURNING id, status`,
      [status, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Booking not found' });
    // If cancelling, trigger refund on transaction
    if (status === 'Cancelled') {
      await query(`UPDATE transactions SET status = 'Refunded' WHERE booking_id = $1`, [req.params.id]);
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// Export bookings CSV
export const exportAdminBookingsCSV = async (req, res) => {
  const { from, to, status = 'all' } = req.query;
  try {
    let conditions = [];
    const params = [];
    if (status !== 'all') { params.push(status); conditions.push(`b.status = $${params.length}`); }
    if (from) { params.push(from); conditions.push(`b.date >= $${params.length}`); }
    if (to)   { params.push(to);   conditions.push(`b.date <= $${params.length}`); }
    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await query(`
      SELECT b.id, u.name AS customer_name, u.email AS customer_email,
             h.name AS venue_name, b.date, b.status, b.amount, b.event_type, b.guest_count,
             t.status AS payment_status, b.created_at
      FROM bookings b
      JOIN halls h ON b.hall_id = h.id
      JOIN users u ON b.user_id = u.id
      LEFT JOIN transactions t ON t.booking_id = b.id
      ${whereClause}
      ORDER BY b.created_at DESC
    `, params);

    const headers = ['Booking ID','Customer','Email','Venue','Event Date','Status','Amount','Event Type','Guests','Payment Status','Booked At'];
    const csv = [
      headers.join(','),
      ...result.rows.map(r =>
        [r.id, `"${r.customer_name}"`, r.customer_email, `"${r.venue_name}"`, r.date, r.status, r.amount, r.event_type||'', r.guest_count||'', r.payment_status||'', new Date(r.created_at).toLocaleDateString()].join(',')
      )
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="admin_bookings.csv"');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── Transaction Monitor ──────────────────────────────────────────────────────
// GET /api/admin/transactions?status=&page=&limit=
export const getAdminTransactions = async (req, res) => {
  const { status = 'all', page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  try {
    const params = [];
    let whereClause = '';
    if (status !== 'all') {
      params.push(status);
      whereClause = `WHERE t.status = $${params.length}`;
    }
    params.push(parseInt(limit), offset);

    const result = await query(`
      SELECT t.id AS transaction_id, t.booking_id, t.amount, t.payment_method,
             t.status AS payment_status, t.created_at AS transaction_date,
             u.name AS customer_name, h.name AS venue_name
      FROM transactions t
      JOIN bookings b ON b.id = t.booking_id
      JOIN users u ON u.id = b.user_id
      JOIN halls h ON h.id = b.hall_id
      ${whereClause}
      ORDER BY t.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params);

    const summaryParams = status !== 'all' ? [status] : [];
    const summaryWhere = status !== 'all' ? 'WHERE t.status = $1' : '';
    const summary = await query(`
      SELECT
        COALESCE(SUM(amount) FILTER (WHERE status='Success'),0)  AS total_collected,
        COALESCE(SUM(amount) FILTER (WHERE status='Refunded'),0) AS total_refunded
      FROM transactions t ${summaryWhere}
    `, summaryParams);

    const s = summary.rows[0];
    res.json({
      success: true,
      data: result.rows,
      summary: {
        totalCollected: parseFloat(s.total_collected),
        totalRefunded:  parseFloat(s.total_refunded),
        netRevenue:     parseFloat(s.total_collected) - parseFloat(s.total_refunded),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// PATCH /api/admin/transactions/:id/status
export const updateTransactionStatus = async (req, res) => {
  const { payment_status } = req.body;
  try {
    const result = await query(
      `UPDATE transactions SET status = $1 WHERE id = $2 RETURNING id, status`,
      [payment_status, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Transaction not found' });
    if (payment_status === 'Refunded') {
      await query(`UPDATE bookings SET status = 'Cancelled' WHERE id = (SELECT booking_id FROM transactions WHERE id = $1)`, [req.params.id]);
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── Disputes ─────────────────────────────────────────────────────────────────
// GET /api/admin/disputes?status=
export const getDisputes = async (req, res) => {
  const { status = 'all' } = req.query;
  try {
    const params = [];
    let whereClause = '';
    if (status !== 'all') { params.push(status); whereClause = `WHERE d.status = $1`; }

    const result = await query(`
      SELECT d.dispute_id, d.subject, d.description, d.status, d.admin_notes,
             d.created_at, d.resolved_at,
             u.name AS raised_by_name, u.email AS raised_by_email,
             h.name AS venue_name,
             b.date AS event_date, b.amount
      FROM disputes d
      JOIN users u ON u.id = d.raised_by
      LEFT JOIN bookings b ON b.id = d.booking_id
      LEFT JOIN halls h ON h.id = b.hall_id
      ${whereClause}
      ORDER BY d.created_at DESC
    `, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// PATCH /api/admin/disputes/:id
export const updateDispute = async (req, res) => {
  const { status, admin_notes } = req.body;
  try {
    const resolved_at = status === 'resolved' || status === 'closed' ? new Date() : null;
    const result = await query(
      `UPDATE disputes SET status=$1, admin_notes=$2, resolved_at=$3
       WHERE dispute_id=$4
       RETURNING dispute_id, status, admin_notes, resolved_at`,
      [status, admin_notes || null, resolved_at, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Dispute not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── Reports ──────────────────────────────────────────────────────────────────
// GET /api/admin/reports/summary
export const getReports = async (req, res) => {
  try {
    const [monthlyBookings, monthlyRevenue, topVenues, topCustomers, statusBreakdown] = await Promise.all([
      // Monthly bookings — last 6 months
      query(`
        SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') AS month,
               DATE_TRUNC('month', created_at) AS month_date,
               COUNT(*) AS count
        FROM bookings
        WHERE created_at >= NOW() - INTERVAL '6 months'
        GROUP BY month_date, month
        ORDER BY month_date ASC
      `),
      // Monthly revenue — last 6 months
      query(`
        SELECT TO_CHAR(DATE_TRUNC('month', t.created_at), 'Mon YYYY') AS month,
               DATE_TRUNC('month', t.created_at) AS month_date,
               COALESCE(SUM(t.amount),0) AS revenue
        FROM transactions t
        WHERE t.status = 'Success' AND t.created_at >= NOW() - INTERVAL '6 months'
        GROUP BY month_date, month
        ORDER BY month_date ASC
      `),
      // Top 5 venues
      query(`
        SELECT h.id, h.name AS venue_name, o.name AS owner_name,
               COUNT(b.id) AS total_bookings,
               COALESCE(SUM(t.amount) FILTER (WHERE t.status='Success'),0) AS total_revenue
        FROM halls h
        JOIN owners o ON o.id = h.owner_id
        LEFT JOIN bookings b ON b.hall_id = h.id
        LEFT JOIN transactions t ON t.booking_id = b.id
        GROUP BY h.id, h.name, o.name
        ORDER BY total_bookings DESC LIMIT 5
      `),
      // Top 5 customers
      query(`
        SELECT u.id, u.name AS customer_name,
               COUNT(b.id) AS total_bookings,
               COALESCE(SUM(t.amount) FILTER (WHERE t.status='Success'),0) AS total_spent
        FROM users u
        LEFT JOIN bookings b ON b.user_id = u.id
        LEFT JOIN transactions t ON t.booking_id = b.id
        GROUP BY u.id, u.name
        ORDER BY total_bookings DESC LIMIT 5
      `),
      // Status breakdown
      query(`
        SELECT status, COUNT(*) AS count
        FROM bookings
        GROUP BY status
      `),
    ]);

    res.json({
      success: true,
      data: {
        monthlyBookings: monthlyBookings.rows,
        monthlyRevenue:  monthlyRevenue.rows,
        topVenues:       topVenues.rows,
        topCustomers:    topCustomers.rows,
        statusBreakdown: statusBreakdown.rows,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};
