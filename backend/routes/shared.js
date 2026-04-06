import express from 'express';
import { protect } from '../middleware/auth.js';
import { markAllAsRead } from '../controllers/notificationController.js';
import { getHallReviews } from '../controllers/hallController.js';

const router = express.Router();

router.patch('/notifications/mark-all-read', protect, markAllAsRead);
router.get('/halls/:id/reviews', getHallReviews);

export default router;
