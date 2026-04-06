import express from 'express';
import { loginOwner, registerOwner } from '../controllers/authController.js';

const router = express.Router();

router.post('/login', loginOwner);
router.post('/register', registerOwner);

export default router;
