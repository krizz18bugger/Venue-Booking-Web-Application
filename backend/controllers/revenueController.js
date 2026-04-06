import { query } from '../config/db.js';

// GET /api/owner/revenue
export const getRevenueSummary = async (req, res) => {
  try {
    // Total revenue (completed transactions for this owner's halls)
    const totalResult = await query(
      `SELECT COALESCE(SUM(t.amount), 0) AS total
       FROM transactions t
       JOIN bookings b ON t.booking_id = b.id
       JOIN halls h ON b.hall_id = h.id
       WHERE h.owner_id = $1 AND t.status = 'Success'`,
      [req.user.id]
    );

    // Monthly revenue for current year
    const monthlyResult = await query(
      `SELECT TO_CHAR(t.created_at, 'Mon') AS month,
              EXTRACT(MONTH FROM t.created_at) AS month_num,
              COALESCE(SUM(t.amount), 0) AS total
       FROM transactions t
       JOIN bookings b ON t.booking_id = b.id
       JOIN halls h ON b.hall_id = h.id
       WHERE h.owner_id = $1 AND t.status = 'Success'
         AND EXTRACT(YEAR FROM t.created_at) = EXTRACT(YEAR FROM NOW())
       GROUP BY month, month_num
       ORDER BY month_num`,
      [req.user.id]
    );

    // Hall-wise revenue
    const hallRevenueResult = await query(
      `SELECT h.name, COALESCE(SUM(t.amount), 0) AS revenue
       FROM halls h
       LEFT JOIN bookings b ON b.hall_id = h.id
       LEFT JOIN transactions t ON t.booking_id = b.id AND t.status = 'Success'
       WHERE h.owner_id = $1
       GROUP BY h.id, h.name
       ORDER BY revenue DESC`,
      [req.user.id]
    );

    // This month revenue
    const thisMonthResult = await query(
      `SELECT COALESCE(SUM(t.amount), 0) AS monthly
       FROM transactions t
       JOIN bookings b ON t.booking_id = b.id
       JOIN halls h ON b.hall_id = h.id
       WHERE h.owner_id = $1 AND t.status = 'Success'
         AND EXTRACT(MONTH FROM t.created_at) = EXTRACT(MONTH FROM NOW())
         AND EXTRACT(YEAR FROM t.created_at) = EXTRACT(YEAR FROM NOW())`,
      [req.user.id]
    );

    // Pending amount
    const pendingResult = await query(
      `SELECT COALESCE(SUM(t.amount), 0) AS pending
       FROM transactions t
       JOIN bookings b ON t.booking_id = b.id
       JOIN halls h ON b.hall_id = h.id
       WHERE h.owner_id = $1 AND t.status = 'Pending'`,
      [req.user.id]
    );

    res.json({
      success: true,
      data: {
        totalRevenue: parseFloat(totalResult.rows[0].total),
        monthlyRevenue: parseFloat(thisMonthResult.rows[0].monthly),
        pendingAmount: parseFloat(pendingResult.rows[0].pending),
        monthlyChartData: monthlyResult.rows.map(r => ({ name: r.month, total: parseFloat(r.total) })),
        hallRevenue: hallRevenueResult.rows.map(r => ({ name: r.name, revenue: parseFloat(r.revenue) })),
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// GET /api/owner/transactions
export const getTransactions = async (req, res) => {
  try {
    const result = await query(
      `SELECT t.*, b.date AS booking_date, h.name AS hall_name, u.name AS customer_name
       FROM transactions t
       JOIN bookings b ON t.booking_id = b.id
       JOIN halls h ON b.hall_id = h.id
       JOIN users u ON b.user_id = u.id
       WHERE h.owner_id = $1
       ORDER BY t.created_at DESC
       LIMIT 50`,
      [req.user.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// GET /api/owner/invoices/pending
export const getPendingInvoices = async (req, res) => {
  try {
    const result = await query(
      `SELECT t.*, b.date AS booking_date, h.name AS hall_name, u.name AS customer_name
       FROM transactions t
       JOIN bookings b ON t.booking_id = b.id
       JOIN halls h ON b.hall_id = h.id
       JOIN users u ON b.user_id = u.id
       WHERE h.owner_id = $1 AND t.status = 'Pending'
       ORDER BY t.created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};
