import React, { useEffect, useState, useCallback } from 'react';
import {
  CalendarDays, Download, CheckCircle, XCircle, Eye, Loader2, X, IndianRupee,
} from 'lucide-react';
import { adminAPI } from '../../services/api';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const STATUSES = ['all', 'Pending', 'Confirmed', 'Completed', 'Cancelled'];

const statusBadge = (s) => {
  const map = { Pending: 'badge-amber', Confirmed: 'badge-cyan', Completed: 'badge-green', Cancelled: 'badge-red' };
  return <span className={map[s] || 'badge-amber'}>{s}</span>;
};

const payBadge = (s) => {
  const map = { Success: 'badge-green', Pending: 'badge-amber', Refunded: 'badge-violet', Failed: 'badge-red' };
  return <span className={map[s] || 'badge-amber'}>{s}</span>;
};

export default function BookingMonitor() {
  const [bookings, setBookings] = useState([]);
  const [total,    setTotal]   = useState(0);
  const [totalAmt, setTotalAmt]= useState(0);
  const [loading,  setLoading] = useState(true);
  const [status,   setStatus]  = useState('all');
  const [from,     setFrom]    = useState('');
  const [to,       setTo]      = useState('');
  const [page,     setPage]    = useState(1);
  const [acting,   setActing]  = useState({});
  const [detail,   setDetail]  = useState(null);
  const [exporting,setExporting]= useState(false);
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getBookings({ status: status === 'all' ? '' : status, from, to, page, limit: LIMIT });
      setBookings(res.data.data);
      setTotal(res.data.pagination?.total || 0);
      setTotalAmt(res.data.summary?.totalAmount || 0);
    } catch {}
    finally { setLoading(false); }
  }, [status, from, to, page]);

  useEffect(() => { load(); }, [load]);

  const act = async (id, data) => {
    setActing(p => ({ ...p, [id]: true }));
    try { await adminAPI.updateBookingStatus(id, data); await load(); }
    catch {} finally { setActing(p => ({ ...p, [id]: false })); }
  };

  const handleExport = async () => {
    setExporting(true);
    try { await adminAPI.exportBookingsCSV({ status: status === 'all' ? '' : status, from, to }); }
    catch {} finally { setExporting(false); }
  };

  const pages = Math.ceil(total / LIMIT);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Booking Monitor</h1>
          <p className="text-slate-400 text-sm mt-1">Global view of all bookings across the platform</p>
        </div>
        <button onClick={handleExport} disabled={exporting} className="btn-secondary">
          {exporting ? <Loader2 size={15} className="animate-spin"/> : <Download size={15}/>}
          Export CSV
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Shown', value: total, icon: CalendarDays, color: 'bg-brand-600' },
          { label: 'Total Amount', value: `₹${Number(totalAmt).toLocaleString('en-IN')}`, icon: IndianRupee, color: 'bg-accent-emerald' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
              <Icon size={18} className="text-white"/>
            </div>
            <div>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">{label}</p>
              <p className="text-xl font-extrabold text-white">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-2 flex-wrap">
          {STATUSES.map(s => (
            <button key={s} onClick={() => { setStatus(s); setPage(1); }}
              className={`px-4 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${
                status === s ? 'bg-brand-600 text-white' : 'bg-surface-700 text-slate-400 hover:text-white'
              }`}>{s}</button>
          ))}
        </div>
        <div className="flex gap-2 items-center ml-auto">
          <label className="text-slate-500 text-xs">From</label>
          <input type="date" value={from} onChange={e => { setFrom(e.target.value); setPage(1); }}
            className="input w-36 text-xs py-1.5"/>
          <label className="text-slate-500 text-xs">To</label>
          <input type="date" value={to} onChange={e => { setTo(e.target.value); setPage(1); }}
            className="input w-36 text-xs py-1.5"/>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 size={32} className="animate-spin text-brand-400"/></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-700/50 border-b border-white/5">
                <tr>{['ID', 'Customer', 'Venue', 'Event Date', 'Booked On', 'Status', 'Amount', 'Payment', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {bookings.map(b => (
                  <tr key={b.id} className="hover:bg-surface-700/30 transition-colors">
                    <td className="px-4 py-3 text-slate-500 text-xs font-mono">{String(b.id).slice(0,8)}…</td>
                    <td className="px-4 py-3 text-white font-medium">{b.customer_name}</td>
                    <td className="px-4 py-3 text-slate-300 max-w-[120px] truncate">{b.venue_name}</td>
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{fmtDate(b.event_date)}</td>
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{fmtDate(b.booked_on)}</td>
                    <td className="px-4 py-3">{statusBadge(b.status)}</td>
                    <td className="px-4 py-3 text-accent-emerald font-semibold">₹{Number(b.amount).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3">{payBadge(b.payment_status)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => setDetail(b)} className="p-1.5 rounded-lg text-slate-400 hover:text-brand-300 hover:bg-brand-600/10 transition-colors" title="View">
                          <Eye size={14}/>
                        </button>
                        {b.status === 'Pending' && (
                          <button onClick={() => act(b.id, { status: 'Confirmed' })} disabled={acting[b.id]}
                            className="p-1.5 rounded-lg text-accent-emerald hover:bg-accent-emerald/10 transition-colors" title="Approve">
                            {acting[b.id] ? <Loader2 size={14} className="animate-spin"/> : <CheckCircle size={14}/>}
                          </button>
                        )}
                        {b.status !== 'Cancelled' && b.status !== 'Completed' && (
                          <button onClick={() => act(b.id, { status: 'Cancelled' })} disabled={acting[b.id]}
                            className="p-1.5 rounded-lg text-accent-rose hover:bg-accent-rose/10 transition-colors" title="Cancel">
                            <XCircle size={14}/>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {!bookings.length && (
                  <tr><td colSpan={9} className="py-12 text-center text-slate-500">No bookings found</td></tr>
                )}
              </tbody>
              {bookings.length > 0 && (
                <tfoot className="border-t border-white/10 bg-surface-700/30">
                  <tr>
                    <td colSpan={6} className="px-4 py-3 text-slate-400 text-xs font-semibold">
                      Showing {bookings.length} of {total} bookings
                    </td>
                    <td className="px-4 py-3 text-accent-emerald font-bold text-sm">
                      ₹{Number(totalAmt).toLocaleString('en-IN')}
                    </td>
                    <td colSpan={2}/>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary px-3 py-1.5 text-xs">Prev</button>
          <span className="text-slate-400 text-sm">Page {page} of {pages}</span>
          <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} className="btn-secondary px-3 py-1.5 text-xs">Next</button>
        </div>
      )}

      {/* Detail Modal */}
      {detail && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-800 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-white font-bold text-lg">Booking Details</h3>
              <button onClick={() => setDetail(null)} className="text-slate-400 hover:text-white"><X size={18}/></button>
            </div>
            <div className="space-y-2 text-sm">
              {[
                ['Booking ID',   String(detail.id).slice(0,16) + '…'],
                ['Customer',     detail.customer_name],
                ['Venue',        detail.venue_name],
                ['Event Date',   fmtDate(detail.event_date)],
                ['Booked On',    fmtDate(detail.booked_on)],
                ['Status',       detail.status],
                ['Amount',       `₹${Number(detail.amount).toLocaleString('en-IN')}`],
                ['Payment',      detail.payment_status],
                ['Method',       detail.payment_method || '—'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-slate-500">{k}</span>
                  <span className="text-slate-200 text-right max-w-[220px]">{v}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setDetail(null)} className="btn-secondary w-full justify-center mt-4">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
