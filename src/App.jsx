import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useApp } from './context/AppContext';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';
import CustomerLayout  from './layouts/CustomerLayout';

// Auth
import AuthPage  from './pages/AuthPage';
import LoginPage from './pages/LoginPage'; // kept for backward compat

// Owner pages
import HallsPage          from './pages/HallsPage';
import AddHallPage        from './pages/AddHallPage';
import HallDetailsPage    from './pages/HallDetailsPage';
import RevenuePage        from './pages/RevenuePage';
import BookingHistoryPage from './pages/BookingHistoryPage';
import NotificationsPage  from './pages/NotificationsPage';

// Admin pages
import AdminLayout         from './pages/admin/AdminLayout';
import AdminDashboard      from './pages/admin/AdminDashboard';
import OwnerApprovals      from './pages/admin/OwnerApprovals';
import UserManagement      from './pages/admin/UserManagement';
import HallListings        from './pages/admin/HallListings';
import BookingMonitor      from './pages/admin/BookingMonitor';
import TransactionMonitor  from './pages/admin/TransactionMonitor';
import DisputesPage        from './pages/admin/DisputesPage';
import ReportsPage         from './pages/admin/ReportsPage';

// Customer pages
import VenuesPage         from './pages/customer/VenuesPage';
import VenueDetailPage    from './pages/customer/VenueDetailPage';
import ProfilePage        from './pages/customer/ProfilePage';
import BookingConfirmPage from './pages/customer/BookingConfirmPage';
import BookingSuccessPage from './pages/customer/BookingSuccessPage';
import MyBookingsPage     from './pages/customer/MyBookingsPage';

// ─── Route Guards ─────────────────────────────────────────────
const RequireAuth = ({ children, role }) => {
  const { user } = useApp();
  if (!user) return <Navigate to="/auth" replace />;
  if (role && user.role !== role) return <Navigate to="/auth" replace />;
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth */}
        <Route path="/auth"  element={<AuthPage />} />
        <Route path="/login" element={<Navigate to="/auth" replace />} />

        {/* ── Owner Dashboard ─────────────────────────────── */}
        <Route
          path="/"
          element={
            <RequireAuth role="owner">
              <DashboardLayout />
            </RequireAuth>
          }
        >
          <Route index         element={<Navigate to="/halls" replace />} />
          <Route path="halls"  element={<HallsPage />} />
          <Route path="halls/add" element={<AddHallPage />} />
          <Route path="halls/:id" element={<HallDetailsPage />} />
          <Route path="revenue"   element={<RevenuePage />} />
          <Route path="bookings"  element={<BookingHistoryPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
        </Route>

        {/* ── Admin Module ─────────────────────────────────── */}
        <Route
          path="/admin"
          element={
            <RequireAuth role="admin">
              <AdminLayout />
            </RequireAuth>
          }
        >
          <Route index                 element={<AdminDashboard />} />
          <Route path="owners"         element={<OwnerApprovals />} />
          <Route path="users"          element={<UserManagement />} />
          <Route path="venues"         element={<HallListings />} />
          <Route path="bookings"       element={<BookingMonitor />} />
          <Route path="transactions"   element={<TransactionMonitor />} />
          <Route path="disputes"       element={<DisputesPage />} />
          <Route path="reports"        element={<ReportsPage />} />
        </Route>

        {/* ── Customer Module ───────────────────────────────── */}

        {/* Public customer pages (with navbar) */}
        <Route element={<CustomerLayout />}>
          <Route path="/venues"     element={<VenuesPage />} />
          <Route path="/venues/:id" element={<VenueDetailPage />} />
        </Route>

        {/* Protected customer pages (with navbar) */}
        <Route
          element={
            <RequireAuth role="customer">
              <CustomerLayout />
            </RequireAuth>
          }
        >
          <Route path="/profile"  element={<ProfilePage />} />
          <Route path="/my-bookings" element={<MyBookingsPage />} />
        </Route>

        {/* Booking flow — protected, no layout navbar needed (full page) */}
        <Route path="/booking/confirm/:venueId" element={
          <RequireAuth role="customer"><BookingConfirmPage /></RequireAuth>
        } />
        <Route path="/booking/success" element={
          <RequireAuth role="customer"><BookingSuccessPage /></RequireAuth>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
