import { query } from '../config/db.js';
import supabase from '../config/supabase.js';
import { v4 as uuidv4 } from 'uuid';

// Helper to parse JSON from FormData if needed
const parseJSON = (data, fallback) => {
  if (typeof data === 'string') {
    try { return JSON.parse(data); } catch (e) { return fallback; }
  }
  return data || fallback;
};

// Helper to upload images to Supabase
const uploadImagesToSupabase = async (hallId, files) => {
  if (!files || files.length === 0) return [];
  
  const uploadedUrls = [];
  for (const file of files) {
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${hallId}/${uuidv4()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('hall_images')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });
      
    if (error) {
      console.error('Supabase upload error:', error);
      continue;
    }
    
    const { data: publicUrlData } = supabase.storage
      .from('hall_images')
      .getPublicUrl(fileName);
      
    if (publicUrlData) {
      uploadedUrls.push(publicUrlData.publicUrl);
    }
  }
  return uploadedUrls;
};

// GET /api/owner/profile
export const getOwnerProfile = async (req, res) => {
  try {
    const result = await query(
      'SELECT id, name, email, phone, avatar_url, created_at FROM owners WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Owner not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// GET /api/owner/halls
export const getOwnerHalls = async (req, res) => {
  try {
    const result = await query(
      `SELECT h.*, 
        (SELECT image_url FROM hall_images WHERE hall_id = h.id AND is_primary = true LIMIT 1) AS primary_image,
        hd.capacity, hd.features
       FROM halls h
       LEFT JOIN hall_details hd ON h.id = hd.hall_id
       WHERE h.owner_id = $1
       ORDER BY h.created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// POST /api/owner/halls
export const createHall = async (req, res) => {
  const { name, location, address, status, price } = req.body;
  const features = parseJSON(req.body.features, []);
  const capacity = parseJSON(req.body.capacity, {});
  const rules = parseJSON(req.body.rules, []);
  const payment_rules = parseJSON(req.body.payment_rules, {});
  
  if (!name || !location || !price) {
    return res.status(400).json({ success: false, message: 'Name, location, and price are required' });
  }
  
  try {
    const hallResult = await query(
      `INSERT INTO halls (owner_id, name, location, address, status, price)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.user.id, name, location, address || '', status || 'Active', price]
    );
    const hall = hallResult.rows[0];
    
    // Insert hall details
    await query(
      `INSERT INTO hall_details (hall_id, features, capacity, rules, payment_rules)
       VALUES ($1, $2, $3, $4, $5)`,
      [hall.id, JSON.stringify(features), JSON.stringify(capacity), JSON.stringify(rules), JSON.stringify(payment_rules)]
    );
    
    // Handle image uploads
    if (req.files && req.files.length > 0) {
      const urls = await uploadImagesToSupabase(hall.id, req.files);
      for (let i = 0; i < urls.length; i++) {
        await query(
          `INSERT INTO hall_images (hall_id, image_url, is_primary) VALUES ($1, $2, $3)`,
          [hall.id, urls[i], i === 0]
        );
      }
    }
    
    res.status(201).json({ success: true, data: hall, message: 'Hall created successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// GET /api/owner/halls/:id
export const getHallById = async (req, res) => {
  try {
    const hallResult = await query(
      `SELECT h.*, hd.features, hd.capacity, hd.rules, hd.payment_rules
       FROM halls h
       LEFT JOIN hall_details hd ON h.id = hd.hall_id
       WHERE h.id = $1 AND h.owner_id = $2`,
      [req.params.id, req.user.id]
    );
    if (hallResult.rows.length === 0) return res.status(404).json({ success: false, message: 'Hall not found' });

    const imagesResult = await query('SELECT * FROM hall_images WHERE hall_id = $1', [req.params.id]);
    const reviewsResult = await query(
      `SELECT r.*, u.name AS user_name FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.hall_id = $1 ORDER BY r.created_at DESC`,
      [req.params.id]
    );
    res.json({
      success: true,
      data: { ...hallResult.rows[0], images: imagesResult.rows, reviews: reviewsResult.rows }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// PATCH /api/owner/halls/:id
export const updateHall = async (req, res) => {
  const { name, location, address, status, price } = req.body;
  const features = parseJSON(req.body.features, []);
  const capacity = parseJSON(req.body.capacity, {});
  const rules = parseJSON(req.body.rules, []);
  const payment_rules = parseJSON(req.body.payment_rules, {});
  
  try {
    const result = await query(
      `UPDATE halls SET name=$1, location=$2, address=$3, status=$4, price=$5
       WHERE id=$6 AND owner_id=$7 RETURNING *`,
      [name, location, address, status, price, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Hall not found' });
    
    // Update hall details
    await query(
      `UPDATE hall_details SET features=$1, capacity=$2, rules=$3, payment_rules=$4 WHERE hall_id=$5`,
      [JSON.stringify(features), JSON.stringify(capacity), JSON.stringify(rules), JSON.stringify(payment_rules), req.params.id]
    );
    
    // Handle image uploads
    if (req.files && req.files.length > 0) {
      const urls = await uploadImagesToSupabase(req.params.id, req.files);
      
      // If there were no previous images, make the first one primary
      const existingImages = await query('SELECT id FROM hall_images WHERE hall_id = $1 LIMIT 1', [req.params.id]);
      const hasExistingImages = existingImages.rows.length > 0;
      
      for (let i = 0; i < urls.length; i++) {
        await query(
          `INSERT INTO hall_images (hall_id, image_url, is_primary) VALUES ($1, $2, $3)`,
          [req.params.id, urls[i], !hasExistingImages && i === 0]
        );
      }
    }
    
    res.json({ success: true, data: result.rows[0], message: 'Hall updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// PATCH /api/owner/halls/:id/availability
export const updateAvailability = async (req, res) => {
  const { dates } = req.body; // [{ date, status }]
  if (!dates || !Array.isArray(dates)) {
    return res.status(400).json({ success: false, message: 'dates array is required' });
  }
  try {
    for (const { date, status } of dates) {
      await query(
        `INSERT INTO availability (hall_id, date, status) VALUES ($1, $2, $3)
         ON CONFLICT (hall_id, date) DO UPDATE SET status = $3`,
        [req.params.id, date, status]
      );
    }
    res.json({ success: true, message: 'Availability updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// GET /api/owner/halls/:id/availability
export const getAvailability = async (req, res) => {
  try {
    const result = await query(
      `SELECT to_char(date, 'YYYY-MM-DD') as date, status FROM availability WHERE hall_id = $1`,
      [req.params.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// GET /api/halls/:id/reviews (public)
export const getHallReviews = async (req, res) => {
  try {
    const result = await query(
      `SELECT r.*, u.name AS user_name FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.hall_id = $1 ORDER BY r.created_at DESC`,
      [req.params.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};
