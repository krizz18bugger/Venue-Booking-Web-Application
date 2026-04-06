import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useApp } from './context/AppContext';
import DashboardLayout from './layouts/DashboardLayout';
import HallsPage from './pages/HallsPage';
import AddHallPage from './pages/AddHallPage';
import HallDetailsPage from './pages/HallDetailsPage';
import RevenuePage from './pages/RevenuePage';
import BookingHistoryPage from './pages/BookingHistoryPage';
import NotificationsPage from './pages/NotificationsPage';
import LoginPage from './pages/LoginPage';

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
  const { user } = useApp();
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/halls" replace />} />
          <Route path="halls" element={<HallsPage />} />
          <Route path="halls/add" element={<AddHallPage />} />
          <Route path="halls/:id" element={<HallDetailsPage />} />
          <Route path="revenue" element={<RevenuePage />} />
          <Route path="bookings" element={<BookingHistoryPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
        </Route>

        {/* fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
