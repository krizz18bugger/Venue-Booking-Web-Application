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

// Handle 401 globally → redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ─── Auth ─────────────────────────────────────────────────────
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
};

// ─── Owner Profile ────────────────────────────────────────────
export const ownerAPI = {
  getProfile: () => api.get('/owner/profile'),
};

// ─── Halls ────────────────────────────────────────────────────
export const hallsAPI = {
  getAll: () => api.get('/owner/halls'),
  getById: (id) => api.get(`/owner/halls/${id}`),
  create: (data) => api.post('/owner/halls', data),
  update: (id, data) => api.patch(`/owner/halls/${id}`, data),
  getAvailability: (id) => api.get(`/owner/halls/${id}/availability`),
  updateAvailability: (id, dates) => api.patch(`/owner/halls/${id}/availability`, { dates }),
  getReviews: (id) => api.get(`/halls/${id}/reviews`),
};

// ─── Revenue ──────────────────────────────────────────────────
export const revenueAPI = {
  getSummary: () => api.get('/owner/revenue'),
  getTransactions: () => api.get('/owner/transactions'),
  getPendingInvoices: () => api.get('/owner/invoices/pending'),
};

// ─── Bookings ─────────────────────────────────────────────────
export const bookingsAPI = {
  getAll: () => api.get('/owner/bookings'),
  getById: (id) => api.get(`/owner/bookings/${id}`),
  exportCSV: () =>
    api.get('/owner/bookings/export', { responseType: 'blob' }).then((res) => {
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'bookings_export.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    }),
};

// ─── Notifications ────────────────────────────────────────────
export const notificationsAPI = {
  getRequests: () => api.get('/owner/requests'),
  acceptRequest: (id) => api.patch(`/owner/requests/${id}/accept`),
  declineRequest: (id) => api.patch(`/owner/requests/${id}/decline`),
  getCancellations: () => api.get('/owner/cancellations'),
  getPayments: () => api.get('/owner/payments'),
  markAllRead: () => api.patch('/notifications/mark-all-read'),
};

export default api;
