import { query } from '../config/db.js';

// GET /api/venues/:id/reviews  (public)
export const getVenueReviews = async (req, res) => {
  const { limit = 5, offset = 0 } = req.query;
  try {
    const result = await query(`
      SELECT r.id AS review_id, r.rating, r.comment, r.created_at,
             u.name AS reviewer_name, u.profile_pic AS reviewer_pic
      FROM reviews r
      JOIN users u ON u.id = r.user_id
      WHERE r.hall_id = $1
      ORDER BY r.created_at DESC
      LIMIT $2 OFFSET $3
    `, [req.params.id, parseInt(limit), parseInt(offset)]);

    const total = await query(`SELECT COUNT(*), ROUND(AVG(rating),1) AS avg_rating FROM reviews WHERE hall_id=$1`, [req.params.id]);

    res.json({
      success: true,
      data: result.rows,
      total: parseInt(total.rows[0].count),
      avgRating: parseFloat(total.rows[0].avg_rating) || 0,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// POST /api/venues/:id/reviews  (authenticated customer with approved booking)
export const submitReview = async (req, res) => {
  const { rating, comment } = req.body;
  if (!rating || rating < 1 || rating > 5)
    return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });

  try {
    // Must have a completed/confirmed booking for this venue
    const eligible = await query(`
      SELECT id FROM bookings
      WHERE hall_id=$1 AND user_id=$2 AND status IN ('Completed','Confirmed')
      LIMIT 1
    `, [req.params.id, req.user.id]);

    if (!eligible.rows.length)
      return res.status(403).json({ success: false, message: 'You can only review venues you have booked and completed' });

    // Check if review already exists
    const existing = await query(
      `SELECT id FROM reviews WHERE hall_id=$1 AND user_id=$2`,
      [req.params.id, req.user.id]
    );
    if (existing.rows.length)
      return res.status(409).json({ success: false, message: 'You have already reviewed this venue' });

    const result = await query(`
      INSERT INTO reviews (hall_id, user_id, rating, comment)
      VALUES ($1,$2,$3,$4)
      RETURNING *
    `, [req.params.id, req.user.id, rating, comment || null]);

    // Update hall's average rating
    await query(`
      UPDATE halls SET rating = (
        SELECT ROUND(AVG(rating),2) FROM reviews WHERE hall_id=$1
      ) WHERE id=$1
    `, [req.params.id]);

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};
