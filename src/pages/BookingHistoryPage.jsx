import React, { useState, useEffect } from 'react';
import { Filter, Calendar as CalendarIcon, Search, Download, Eye, X } from 'lucide-react';
import { bookingsAPI } from '../services/api';
import { LoadingSpinner, ErrorMessage, EmptyState, StatusBadge } from '../components/ui';
import Modal from '../components/Modal';

// ─── Booking Detail Modal ─────────────────────────────────────
const BookingDetailModal = ({ booking, onClose }) => {
  if (!booking) return null;
  const fields = [
    { label: 'Booking ID', value: booking.id, mono: true },
    { label: 'Customer', value: booking.customer_name },
    { label: 'Email', value: booking.customer_email },
    { label: 'Phone', value: booking.customer_phone || '—' },
    { label: 'Hall', value: booking.hall_name },
    { label: 'Location', value: booking.location },
    { label: 'Event Date', value: new Date(booking.date).toLocaleDateString() },
    { label: 'Event Type', value: booking.event_type || '—' },
    { label: 'Guest Count', value: booking.guest_count || '—' },
    { label: 'Booking Amount', value: `₹${Number(booking.amount).toLocaleString()}`, highlight: true },
    { label: 'Payment Method', value: booking.payment_method || '—' },
    { label: 'Payment Status', value: booking.payment_status, badge: true },
    { label: 'Booking Status', value: booking.status, badge: true },
    { label: 'Special Requests', value: booking.special_requests || 'None' },
    { label: 'Booked On', value: new Date(booking.created_at).toLocaleString() },
  ];
  return (
    <div className="space-y-3">
      {fields.map(f => (
        <div key={f.label} className="flex justify-between items-start py-2 border-b border-white/5 last:border-0">
          <span className="text-slate-400 text-sm">{f.label}</span>
          {f.badge ? (
            <StatusBadge status={f.value} />
          ) : (
            <span className={`text-sm text-right max-w-[60%] ${f.highlight ? 'text-brand-300 font-bold' : f.mono ? 'font-mono text-xs text-slate-300' : 'text-white font-medium'}`}>
              {f.value}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

// ─── Main BookingHistoryPage ───────────────────────────────────
const BookingHistoryPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  const fetchBookings = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await bookingsAPI.getAll();
      setBookings(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      await bookingsAPI.exportCSV();
    } catch (err) {
      console.error('Export failed', err);
    } finally {
      setExporting(false);
    }
  };

  const handleViewDetail = async (booking) => {
    try {
      const res = await bookingsAPI.getById(booking.id);
      setSelectedBooking(res.data.data);
    } catch (_) {
      setSelectedBooking(booking);
    }
  };

  const filtered = bookings.filter(b => {
    const term = searchTerm.toLowerCase();
    const matchSearch = b.customer_name?.toLowerCase().includes(term) ||
      b.id?.toLowerCase().includes(term) ||
      b.hall_name?.toLowerCase().includes(term);
    const matchStatus = statusFilter === 'All' || b.status === statusFilter;
    const matchDate = !dateFilter || b.date === dateFilter;
    return matchSearch && matchStatus && matchDate;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  if (loading) return <LoadingSpinner text="Loading bookings..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchBookings} />;

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">Booking History</h1>
          <p className="text-slate-400">{bookings.length} total bookings</p>
        </div>
        <button onClick={handleExport} disabled={exporting} className="btn-secondary">
          <Download size={18} /> {exporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      {/* Filters Bar */}
      <div className="card p-4 glass flex flex-wrap gap-4 items-center bg-surface-800/80">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by ID, Customer, or Hall..."
            className="input pl-10"
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Filter size={18} className="text-slate-400" />
          <select className="input w-40 text-slate-300" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="All">All Statuses</option>
            <option value="Completed">Completed</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Pending">Pending</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
        <div className="flex items-center gap-3">
          <CalendarIcon size={18} className="text-slate-400" />
          <input type="date" className="input w-auto text-slate-300 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
            value={dateFilter} onChange={e => { setDateFilter(e.target.value); setPage(1); }} />
        </div>
        {(searchTerm || statusFilter !== 'All' || dateFilter) && (
          <button onClick={() => { setSearchTerm(''); setStatusFilter('All'); setDateFilter(''); setPage(1); }} className="text-sm text-slate-400 hover:text-white transition-colors">
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card glass overflow-hidden shadow-xl border-white/10">
        <div className="overflow-x-auto min-h-[300px]">
          {paginated.length === 0 ? (
            <EmptyState
              icon={<CalendarIcon size={32} className="text-slate-500" />}
              title="No bookings found"
              description="Try adjusting your search or filters."
            />
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-800/80 text-xs uppercase tracking-wider text-slate-400 border-b border-white/5">
                  <th className="p-5 font-medium">Booking ID</th>
                  <th className="p-5 font-medium">Customer</th>
                  <th className="p-5 font-medium">Hall</th>
                  <th className="p-5 font-medium">Date</th>
                  <th className="p-5 font-medium">Amount</th>
                  <th className="p-5 font-medium">Status</th>
                  <th className="p-5 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm text-slate-300">
                {paginated.map(b => (
                  <tr key={b.id} className="hover:bg-surface-700/50 transition-colors group cursor-pointer" onClick={() => handleViewDetail(b)}>
                    <td className="p-5 font-mono text-xs text-brand-300 group-hover:text-brand-400">{b.id.slice(0, 8)}...</td>
                    <td className="p-5 font-medium text-white">{b.customer_name}</td>
                    <td className="p-5">{b.hall_name}</td>
                    <td className="p-5">{new Date(b.date).toLocaleDateString()}</td>
                    <td className="p-5 font-bold text-brand-200">₹{Number(b.amount).toLocaleString()}</td>
                    <td className="p-5"><StatusBadge status={b.status} /></td>
                    <td className="p-5">
                      <button className="flex items-center gap-1 text-brand-400 hover:text-brand-300 text-sm font-medium transition-colors">
                        <Eye size={15} /> Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-white/5 flex justify-between items-center text-sm text-slate-400 bg-surface-800/30">
          <div>Showing {Math.min(paginated.length, PER_PAGE)} of {filtered.length} entries</div>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 rounded-md bg-surface-700 text-slate-300 hover:bg-surface-600 transition-colors disabled:opacity-40">Prev</button>
            {[...Array(totalPages)].map((_, i) => (
              <button key={i} onClick={() => setPage(i + 1)} className={`px-3 py-1 rounded-md transition-colors ${page === i + 1 ? 'bg-brand-600 text-white shadow-glow-sm' : 'bg-surface-700 text-slate-300 hover:bg-surface-600'}`}>{i + 1}</button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 rounded-md bg-surface-700 text-slate-300 hover:bg-surface-600 transition-colors disabled:opacity-40">Next</button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <Modal isOpen={!!selectedBooking} onClose={() => setSelectedBooking(null)} title="Booking Details" maxWidth="max-w-lg">
        <BookingDetailModal booking={selectedBooking} onClose={() => setSelectedBooking(null)} />
      </Modal>
    </div>
  );
};

export default BookingHistoryPage;
