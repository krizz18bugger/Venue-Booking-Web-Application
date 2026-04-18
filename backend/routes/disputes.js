import express from 'express';
import { protect } from '../middleware/auth.js';
import { raiseDispute, getMyDisputes } from '../controllers/disputeController.js';

const router = express.Router();

router.post('/disputes',      protect, raiseDispute);
router.get('/disputes/my',    protect, getMyDisputes);

export default router;
