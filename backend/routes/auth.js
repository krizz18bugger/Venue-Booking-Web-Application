import express from 'express';
import {
  loginOwner, registerOwner,
  loginAdmin,
  loginCustomer, registerCustomer,
} from '../controllers/authController.js';

const router = express.Router();

// Owner
router.post('/login',    loginOwner);
router.post('/register', registerOwner);

// Admin
router.post('/admin/login', loginAdmin);

// Customer
router.post('/customer/login',    loginCustomer);
router.post('/customer/register', registerCustomer);

export default router;
