import express from 'express';
import multer from 'multer';
import { protect, ownerOnly } from '../middleware/auth.js';
import { getOwnerProfile } from '../controllers/hallController.js';
import { getOwnerHalls, createHall, getHallById, updateHall, updateAvailability, getAvailability } from '../controllers/hallController.js';
import { getRevenueSummary, getTransactions, getPendingInvoices } from '../controllers/revenueController.js';
import { getOwnerBookings, getBookingById, exportBookingsCSV } from '../controllers/bookingController.js';
import {
  getBookingRequests, acceptBookingRequest, declineBookingRequest,
  getCancellations, getPaymentNotifications, markAllAsRead
} from '../controllers/notificationController.js';

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

// All owner routes require authentication and owner role
router.use(protect, ownerOnly);

// Profile
router.get('/profile', getOwnerProfile);

// Halls
router.get('/halls', getOwnerHalls);
router.post('/halls', upload.array('images', 10), createHall);
router.get('/halls/:id', getHallById);
router.patch('/halls/:id', upload.array('images', 10), updateHall);
router.get('/halls/:id/availability', getAvailability);
router.patch('/halls/:id/availability', updateAvailability);

// Revenue
router.get('/revenue', getRevenueSummary);
router.get('/transactions', getTransactions);
router.get('/invoices/pending', getPendingInvoices);

// Bookings — export must come before :id
router.get('/bookings/export', exportBookingsCSV);
router.get('/bookings', getOwnerBookings);
router.get('/bookings/:id', getBookingById);

// Notifications
router.get('/requests', getBookingRequests);
router.patch('/requests/:id/accept', acceptBookingRequest);
router.patch('/requests/:id/decline', declineBookingRequest);
router.get('/cancellations', getCancellations);
router.get('/payments', getPaymentNotifications);

export default router;
