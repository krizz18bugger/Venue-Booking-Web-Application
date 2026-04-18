import express from 'express';
import { protect } from '../middleware/auth.js';
import { getVenueReviews, submitReview } from '../controllers/reviewController.js';

const router = express.Router();

router.get('/venues/:id/reviews',  getVenueReviews);
router.post('/venues/:id/reviews', protect, submitReview);

export default router;
