import express from 'express';
import { protect, adminOnly } from '../middleware/auth.js';
import {
  getDashboardStats, getOwners, getOwnerProfile, updateOwnerApproval,
  getUsers, getUserById, updateUserStatus, deleteUser,
  getAdminVenues, updateVenueStatus,
  getAdminBookings, updateBookingStatus, exportAdminBookingsCSV,
  getAdminTransactions, updateTransactionStatus,
  getDisputes, updateDispute,
  getReports,
} from '../controllers/adminController.js';

const router = express.Router();

// All admin routes require authentication + admin role
router.use(protect, adminOnly);

// Dashboard
router.get('/dashboard', getDashboardStats);

// Owner management
router.get('/owners',                  getOwners);
router.get('/owners/:id',              getOwnerProfile);
router.patch('/owners/:id/approval',   updateOwnerApproval);

// User management
router.get('/users',                   getUsers);
router.get('/users/:id',               getUserById);
router.patch('/users/:id/status',      updateUserStatus);
router.delete('/users/:id',            deleteUser);

// Venue management
router.get('/venues',                  getAdminVenues);
router.patch('/venues/:id/status',     updateVenueStatus);

// Booking monitor
router.get('/bookings/export',         exportAdminBookingsCSV);
router.get('/bookings',                getAdminBookings);
router.patch('/bookings/:id/status',   updateBookingStatus);

// Transactions
router.get('/transactions',            getAdminTransactions);
router.patch('/transactions/:id/status', updateTransactionStatus);

// Disputes
router.get('/disputes',                getDisputes);
router.patch('/disputes/:id',          updateDispute);

// Reports
router.get('/reports/summary',         getReports);

export default router;
