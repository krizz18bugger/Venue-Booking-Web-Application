import React, { useEffect, useState, useCallback } from 'react';
import { Search, Flag, ArchiveX, ArchiveRestore, Eye, Loader2, X } from 'lucide-react';
import { adminAPI } from '../../services/api';

const STATUSES = ['all','active','flagged','removed'];
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—';

function useDebounce(v, d) {
  const [dv, setDv] = useState(v);
  useEffect(() => { const t = setTimeout(() => setDv(v), d); return () => clearTimeout(t); }, [v, d]);
  return dv;
}

export default function HallListings() {
  const [venues,   setVenues]   = useState([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [status,   setStatus]   = useState('all');
  const [page,     setPage]     = useState(1);
  const [acting,   setActing]   = useState({});
  const [flagModal,setFlagModal]= useState(null); // { id, name }
  const [flagReason, setFlagReason] = useState('');
  const [detailVenue, setDetailVenue] = useState(null);
  const debouncedSearch = useDebounce(search, 400);
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getVenues({ search: debouncedSearch, status, page, limit: LIMIT });
      setVenues(res.data.data);
      setTotal(res.data.pagination.total);
    } catch {}
    finally { setLoading(false); }
  }, [debouncedSearch, status, page]);

  useEffect(() => { load(); }, [load]);

  const act = async (id, body) => {
    setActing(p => ({ ...p, [id]: true }));
    try { await adminAPI.updateVenueStatus(id, body); await load(); }
    catch {} finally { setActing(p => ({ ...p, [id]: false })); }
  };

  const handleFlag = () => {
    if (!flagReason.trim()) return;
    act(flagModal.id, { is_active: true, flag_reason: flagReason });
    setFlagModal(null); setFlagReason('');
  };

  const getStatusBadge = (v) => {
    if (!v.is_active) return <span className="badge-red">Removed</span>;
    if (v.flag_reason) return <span className="badge-amber">Flagged</span>;
    return <span className="badge-green">Active</span>;
  };

  const pages = Math.ceil(total / LIMIT);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Hall Listings Management</h1>
        <p className="text-slate-400 text-sm mt-1">Oversee all venue listings on the platform</p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/>
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="input pl-9" placeholder="Search venue or location…"/>
        </div>
        <div className="flex gap-2">
          {STATUSES.map(s => (
            <button key={s} onClick={() => { setStatus(s); setPage(1); }}
              className={`px-4 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${
                status===s ? 'bg-brand-600 text-white' : 'bg-surface-700 text-slate-400 hover:text-white'
              }`}>{s}</button>
          ))}
        </div>
        <span className="text-slate-500 text-sm">{total} venues</span>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 size={32} className="animate-spin text-brand-400"/></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface-700/50 border-b border-white/5">
              <tr>{['Venue','Owner','Location','Capacity','Price/Day','Bookings','Listed','Status','Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {venues.map(v => (
                <tr key={v.id} className="hover:bg-surface-700/30 transition-colors">
                  <td className="px-4 py-3 text-white font-medium max-w-[140px] truncate">{v.name}</td>
                  <td className="px-4 py-3 text-slate-400">{v.owner_name}</td>
                  <td className="px-4 py-3 text-slate-400 max-w-[120px] truncate">{v.location}</td>
                  <td className="px-4 py-3 text-slate-300">{v.capacity?.seating ?? '—'}</td>
                  <td className="px-4 py-3 text-accent-emerald font-semibold">₹{Number(v.price).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-slate-300">{v.total_bookings}</td>
                  <td className="px-4 py-3 text-slate-400">{fmtDate(v.created_at)}</td>
                  <td className="px-4 py-3">{getStatusBadge(v)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setDetailVenue(v)} className="p-1.5 rounded-lg text-slate-400 hover:text-brand-300 hover:bg-brand-600/10 transition-colors" title="View">
                        <Eye size={14}/>
                      </button>
                      {v.is_active && !v.flag_reason && (
                        <button onClick={() => setFlagModal({ id: v.id, name: v.name })} className="p-1.5 rounded-lg text-accent-amber hover:bg-accent-amber/10 transition-colors" title="Flag">
                          <Flag size={14}/>
                        </button>
                      )}
                      {v.is_active && (
                        <button onClick={() => act(v.id, { is_active: false, flag_reason: null })} disabled={acting[v.id]} className="p-1.5 rounded-lg text-accent-rose hover:bg-accent-rose/10 transition-colors" title="Remove">
                          {acting[v.id] ? <Loader2 size={14} className="animate-spin"/> : <ArchiveX size={14}/>}
                        </button>
                      )}
                      {!v.is_active && (
                        <button onClick={() => act(v.id, { is_active: true, flag_reason: null })} disabled={acting[v.id]} className="p-1.5 rounded-lg text-accent-emerald hover:bg-accent-emerald/10 transition-colors" title="Restore">
                          {acting[v.id] ? <Loader2 size={14} className="animate-spin"/> : <ArchiveRestore size={14}/>}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!venues.length && <tr><td colSpan={9} className="py-12 text-center text-slate-500">No venues found</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1} className="btn-secondary px-3 py-1.5 text-xs">Prev</button>
          <span className="text-slate-400 text-sm">Page {page} of {pages}</span>
          <button onClick={() => setPage(p => Math.min(pages,p+1))} disabled={page===pages} className="btn-secondary px-3 py-1.5 text-xs">Next</button>
        </div>
      )}

      {/* Flag Modal */}
      {flagModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-800 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-white font-bold text-lg mb-1">Flag Venue</h3>
            <p className="text-slate-400 text-sm mb-4">{flagModal.name}</p>
            <label className="label">Reason for flagging</label>
            <textarea value={flagReason} onChange={e => setFlagReason(e.target.value)} className="input resize-none h-24 mb-4" placeholder="Describe the issue…" required/>
            <div className="flex gap-3">
              <button onClick={() => { setFlagModal(null); setFlagReason(''); }} className="flex-1 btn-secondary justify-center">Cancel</button>
              <button onClick={handleFlag} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-accent-amber/20 hover:bg-accent-amber/30 text-accent-amber border border-accent-amber/30 text-sm font-medium transition-all">
                <Flag size={15}/> Flag Venue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailVenue && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-800 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-bold text-lg">{detailVenue.name}</h3>
              <button onClick={() => setDetailVenue(null)} className="text-slate-400 hover:text-white"><X size={18}/></button>
            </div>
            <div className="space-y-2 text-sm">
              {[
                ['Owner',    detailVenue.owner_name],
                ['Location', detailVenue.location],
                ['Price',    `₹${Number(detailVenue.price).toLocaleString('en-IN')}/day`],
                ['Total Bookings', detailVenue.total_bookings],
                ['Listed', fmtDate(detailVenue.created_at)],
                ['Status', detailVenue.is_active ? (detailVenue.flag_reason ? 'Flagged' : 'Active') : 'Removed'],
              ].map(([k,v]) => (
                <div key={k} className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-slate-500">{k}</span><span className="text-slate-200">{v}</span>
                </div>
              ))}
              {detailVenue.flag_reason && (
                <div className="mt-3 p-3 rounded-xl bg-accent-amber/10 border border-accent-amber/20 text-accent-amber text-xs">
                  <strong>Flag reason:</strong> {detailVenue.flag_reason}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
