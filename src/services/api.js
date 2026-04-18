import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ─── Axios Instance ───────────────────────────────────────────
const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally → redirect to auth
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/auth';
    }
    return Promise.reject(err);
  }
);

// ─── Auth ─────────────────────────────────────────────────────
export const authAPI = {
  // Owner
  login:            (data) => api.post('/auth/login',               data),
  register:         (data) => api.post('/auth/register',            data),
  // Admin
  adminLogin:       (data) => api.post('/auth/admin/login',         data),
  // Customer
  customerLogin:    (data) => api.post('/auth/customer/login',      data),
  customerRegister: (data) => api.post('/auth/customer/register',   data),
};

// ─── Owner ────────────────────────────────────────────────────
export const ownerAPI = {
  getProfile: () => api.get('/owner/profile'),
};

// ─── Halls (owner) ────────────────────────────────────────────
export const hallsAPI = {
  getAll:             ()         => api.get('/owner/halls'),
  getById:            (id)       => api.get(`/owner/halls/${id}`),
  create:             (data)     => api.post('/owner/halls', data),
  update:             (id, data) => api.patch(`/owner/halls/${id}`, data),
  getAvailability:    (id)       => api.get(`/owner/halls/${id}/availability`),
  updateAvailability: (id, dates)=> api.patch(`/owner/halls/${id}/availability`, { dates }),
  getReviews:         (id)       => api.get(`/halls/${id}/reviews`),
};

// ─── Revenue (owner) ──────────────────────────────────────────
export const revenueAPI = {
  getSummary:       () => api.get('/owner/revenue'),
  getTransactions:  () => api.get('/owner/transactions'),
  getPendingInvoices:() => api.get('/owner/invoices/pending'),
};

// ─── Bookings (owner) ─────────────────────────────────────────
export const bookingsAPI = {
  getAll:    () => api.get('/owner/bookings'),
  getById:   (id) => api.get(`/owner/bookings/${id}`),
  exportCSV: () =>
    api.get('/owner/bookings/export', { responseType: 'blob' }).then((res) => {
      const url  = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href  = url;
      link.setAttribute('download', 'bookings_export.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    }),
};

// ─── Notifications (owner) ────────────────────────────────────
export const notificationsAPI = {
  getRequests:     () => api.get('/owner/requests'),
  acceptRequest:   (id) => api.patch(`/owner/requests/${id}/accept`),
  declineRequest:  (id) => api.patch(`/owner/requests/${id}/decline`),
  getCancellations:() => api.get('/owner/cancellations'),
  getPayments:     () => api.get('/owner/payments'),
  markAllRead:     () => api.patch('/notifications/mark-all-read'),
};

// ─── Admin API ────────────────────────────────────────────────
export const adminAPI = {
  getDashboard:       ()         => api.get('/admin/dashboard'),
  // Owners
  getOwners:          (status)   => api.get(`/admin/owners?status=${status}`),
  getOwnerById:       (id)       => api.get(`/admin/owners/${id}`),
  updateOwnerApproval:(id, data) => api.patch(`/admin/owners/${id}/approval`, data),
  // Users
  getUsers:           (params)   => api.get('/admin/users', { params }),
  getUserById:        (id)       => api.get(`/admin/users/${id}`),
  updateUserStatus:   (id, data) => api.patch(`/admin/users/${id}/status`, data),
  deleteUser:         (id)       => api.delete(`/admin/users/${id}`),
  // Venues
  getVenues:          (params)   => api.get('/admin/venues', { params }),
  updateVenueStatus:  (id, data) => api.patch(`/admin/venues/${id}/status`, data),
  // Bookings
  getBookings:        (params)   => api.get('/admin/bookings', { params }),
  updateBookingStatus:(id, data) => api.patch(`/admin/bookings/${id}/status`, data),
  exportBookingsCSV:  (params)   =>
    api.get('/admin/bookings/export', { params, responseType: 'blob' }).then((res) => {
      const url  = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href  = url;
      link.setAttribute('download', 'admin_bookings.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    }),
  // Transactions
  getTransactions:        (params)   => api.get('/admin/transactions', { params }),
  updateTransactionStatus:(id, data) => api.patch(`/admin/transactions/${id}/status`, data),
  // Disputes
  getDisputes:    (status) => api.get(`/admin/disputes?status=${status}`),
  updateDispute:  (id, data) => api.patch(`/admin/disputes/${id}`, data),
  // Reports
  getReports:     () => api.get('/admin/reports/summary'),
};

// ─── Customer API ─────────────────────────────────────────────
export const customerAPI = {
  // Profile
  getProfile:     () => api.get('/users/profile'),
  updateProfile:  (data) => api.put('/users/profile', data),
  changePassword: (data) => api.put('/users/change-password', data),
  // Venues
  getVenues:     (params) => api.get('/venues', { params }),
  getVenueById:  (id)     => api.get(`/venues/${id}`),
  // Bookings
  getBookings:     () => api.get('/customer/bookings'),
  createBooking:   (data) => api.post('/customer/bookings', data),
  cancelBooking:   (id)   => api.patch(`/customer/bookings/${id}/cancel`),
};

// ─── Reviews API ──────────────────────────────────────────────
export const reviewsAPI = {
  getReviews:   (venueId, params) => api.get(`/venues/${venueId}/reviews`, { params }),
  submitReview: (venueId, data)   => api.post(`/venues/${venueId}/reviews`, data),
};

// ─── Disputes API ─────────────────────────────────────────────
export const disputesAPI = {
  raise:     (data) => api.post('/disputes', data),
  getMine:   ()     => api.get('/disputes/my'),
};

export default api;
