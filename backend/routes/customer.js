import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getCustomerProfile, updateCustomerProfile, changePassword,
  getPublicVenues, getVenueDetail,
  getCustomerBookings, createCustomerBooking, cancelCustomerBooking,
} from '../controllers/customerController.js';

const router = express.Router();

// ─── Public ───────────────────────────────────────────────────
router.get('/venues',      getPublicVenues);
router.get('/venues/:id',  getVenueDetail);

// ─── Authenticated Customer ───────────────────────────────────
router.get('/users/profile',              protect, getCustomerProfile);
router.put('/users/profile',              protect, updateCustomerProfile);
router.put('/users/change-password',      protect, changePassword);

router.get('/customer/bookings',          protect, getCustomerBookings);
router.post('/customer/bookings',         protect, createCustomerBooking);
router.patch('/customer/bookings/:id/cancel', protect, cancelCustomerBooking);

export default router;
