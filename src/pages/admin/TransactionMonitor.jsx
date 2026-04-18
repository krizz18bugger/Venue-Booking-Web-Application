import React, { useEffect, useState, useCallback } from 'react';
import { IndianRupee, CheckCircle, RotateCcw, Eye, Loader2, X } from 'lucide-react';
import { adminAPI } from '../../services/api';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const STATUSES = ['all', 'Pending', 'Success', 'Failed', 'Refunded'];

const payBadge = (s) => {
  const map = { Success: 'badge-green', Pending: 'badge-amber', Failed: 'badge-red', Refunded: 'badge-violet' };
  return <span className={map[s] || 'badge-amber'}>{s}</span>;
};

export default function TransactionMonitor() {
  const [txns,    setTxns]    = useState([]);
  const [summary, setSummary] = useState({ collected: 0, refunded: 0, net: 0 });
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [status,  setStatus]  = useState('all');
  const [page,    setPage]    = useState(1);
  const [acting,  setActing]  = useState({});
  const [detail,  setDetail]  = useState(null);
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getTransactions({ status: status === 'all' ? '' : status, page, limit: LIMIT });
      setTxns(res.data.data);
      setTotal(res.data.pagination?.total || res.data.data?.length || 0);
      setSummary(res.data.summary || { totalCollected: 0, totalRefunded: 0, netRevenue: 0 });
    } catch {}
    finally { setLoading(false); }
  }, [status, page]);

  useEffect(() => { load(); }, [load]);

  const act = async (id, data) => {
    setActing(p => ({ ...p, [id]: true }));
    try { await adminAPI.updateTransactionStatus(id, data); await load(); }
    catch {} finally { setActing(p => ({ ...p, [id]: false })); }
  };

  const pages = Math.ceil(total / LIMIT);

  const summaryCards = [
    { label: 'Total Collected', value: `₹${Number(summary.totalCollected || 0).toLocaleString('en-IN')}`, color: 'bg-accent-emerald' },
    { label: 'Total Refunded',  value: `₹${Number(summary.totalRefunded  || 0).toLocaleString('en-IN')}`, color: 'bg-accent-rose' },
    { label: 'Net Revenue',     value: `₹${Number(summary.netRevenue     || 0).toLocaleString('en-IN')}`, color: 'bg-brand-600' },
  ];

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Payment & Transaction Monitor</h1>
        <p className="text-slate-400 text-sm mt-1">View and manage all financial transactions on the platform</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {summaryCards.map(({ label, value, color }) => (
          <div key={label} className="card p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
              <IndianRupee size={18} className="text-white"/>
            </div>
            <div>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">{label}</p>
              <p className="text-xl font-extrabold text-white">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Status Filter */}
      <div className="flex flex-wrap gap-2">
        {STATUSES.map(s => (
          <button key={s} onClick={() => { setStatus(s); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${
              status === s ? 'bg-brand-600 text-white' : 'bg-surface-700 text-slate-400 hover:text-white'
            }`}>{s}</button>
        ))}
        <span className="ml-auto text-slate-500 text-sm self-center">{total} transactions</span>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 size={32} className="animate-spin text-brand-400"/></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-700/50 border-b border-white/5">
                <tr>{['Txn ID', 'Booking ID', 'Customer', 'Venue', 'Amount', 'Status', 'Method', 'Date', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {txns.map(t => (
                  <tr key={t.transaction_id || t.id} className="hover:bg-surface-700/30 transition-colors">
                    <td className="px-4 py-3 text-slate-500 text-xs font-mono">{String(t.transaction_id || t.id || '').slice(0, 8)}…</td>
                    <td className="px-4 py-3 text-slate-500 text-xs font-mono">{String(t.booking_id || '').slice(0, 8)}…</td>
                    <td className="px-4 py-3 text-white font-medium">{t.customer_name}</td>
                    <td className="px-4 py-3 text-slate-300 max-w-[120px] truncate">{t.venue_name}</td>
                    <td className="px-4 py-3 text-accent-emerald font-semibold">₹{Number(t.amount).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3">{payBadge(t.payment_status || t.status)}</td>
                    <td className="px-4 py-3 text-slate-400">{t.payment_method || '—'}</td>
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{fmtDate(t.transaction_date || t.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => setDetail(t)} className="p-1.5 rounded-lg text-slate-400 hover:text-brand-300 hover:bg-brand-600/10 transition-colors" title="View">
                          <Eye size={14}/>
                        </button>
                        {((t.payment_status || t.status) === 'Pending') && (
                          <button onClick={() => act(t.transaction_id || t.id, { payment_status: 'Success' })} disabled={acting[t.transaction_id || t.id]}
                            className="p-1.5 rounded-lg text-accent-emerald hover:bg-accent-emerald/10 transition-colors" title="Mark Completed">
                            {acting[t.transaction_id || t.id] ? <Loader2 size={14} className="animate-spin"/> : <CheckCircle size={14}/>}
                          </button>
                        )}
                        {((t.payment_status || t.status) === 'Success') && (
                          <button onClick={() => act(t.transaction_id || t.id, { payment_status: 'Refunded' })} disabled={acting[t.transaction_id || t.id]}
                            className="p-1.5 rounded-lg text-accent-violet hover:bg-accent-violet/10 transition-colors" title="Issue Refund">
                            {acting[t.transaction_id || t.id] ? <Loader2 size={14} className="animate-spin"/> : <RotateCcw size={14}/>}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {!txns.length && (
                  <tr><td colSpan={9} className="py-12 text-center text-slate-500">No transactions found</td></tr>
                )}
              </tbody>
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
              <h3 className="text-white font-bold text-lg">Transaction Details</h3>
              <button onClick={() => setDetail(null)} className="text-slate-400 hover:text-white"><X size={18}/></button>
            </div>
            <div className="space-y-2 text-sm">
              {[
                ['Transaction ID', String(detail.transaction_id || detail.id || '—')],
                ['Booking ID',     String(detail.booking_id || '—')],
                ['Customer',       detail.customer_name],
                ['Venue',          detail.venue_name],
                ['Amount',         `₹${Number(detail.amount).toLocaleString('en-IN')}`],
                ['Status',         detail.payment_status || detail.status],
                ['Method',         detail.payment_method || '—'],
                ['Date',           fmtDate(detail.transaction_date || detail.created_at)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-slate-500">{k}</span>
                  <span className="text-slate-200 text-right max-w-[200px] break-all">{v}</span>
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
