import React, { useEffect, useState, useCallback } from 'react';
import { Search, Eye, Ban, CheckCircle, Trash2, Loader2, X } from 'lucide-react';
import { adminAPI } from '../../services/api';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—';

function useDebounce(value, delay) {
  const [dv, setDv] = useState(value);
  useEffect(() => { const t = setTimeout(() => setDv(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return dv;
}

export default function UserManagement() {
  const [users,   setUsers]   = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [page,    setPage]    = useState(1);
  const [acting,  setActing]  = useState({});
  const [detailUser, setDetailUser] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // user obj
  const debouncedSearch = useDebounce(search, 400);
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getUsers({ search: debouncedSearch, page, limit: LIMIT });
      setUsers(res.data.data);
      setTotal(res.data.pagination.total);
    } catch {}
    finally { setLoading(false); }
  }, [debouncedSearch, page]);

  useEffect(() => { load(); }, [load]);

  const handleStatus = async (id, is_active) => {
    setActing(p => ({ ...p, [id]: true }));
    try { await adminAPI.updateUserStatus(id, { is_active }); await load(); }
    catch {} finally { setActing(p => ({ ...p, [id]: false })); }
  };

  const handleDelete = async (id) => {
    setActing(p => ({ ...p, [id]: true }));
    try { await adminAPI.deleteUser(id); setDeleteConfirm(null); await load(); }
    catch {} finally { setActing(p => ({ ...p, [id]: false })); }
  };

  const openDetail = async (id) => {
    try { const r = await adminAPI.getUserById(id); setDetailUser(r.data.data); }
    catch {}
  };

  const pages = Math.ceil(total / LIMIT);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-white">User Management</h1>
        <p className="text-slate-400 text-sm mt-1">View, suspend, and manage all platform users</p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/>
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="input pl-9" placeholder="Search by name or email…"/>
        </div>
        <span className="text-slate-500 text-sm">{total} users</span>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 size={32} className="animate-spin text-brand-400"/></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface-700/50 border-b border-white/5">
              <tr>{['User','Email','Phone','Registered','Bookings','Status','Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-surface-700/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {u.profile_pic
                        ? <img src={u.profile_pic} className="w-8 h-8 rounded-full object-cover" alt=""/>
                        : <div className="w-8 h-8 rounded-full bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-300 text-xs font-bold">
                            {u.name?.[0]?.toUpperCase()}
                          </div>
                      }
                      <span className="text-white font-medium">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{u.email}</td>
                  <td className="px-4 py-3 text-slate-400">{u.phone || '—'}</td>
                  <td className="px-4 py-3 text-slate-400">{fmtDate(u.created_at)}</td>
                  <td className="px-4 py-3 text-slate-300">{u.booking_count}</td>
                  <td className="px-4 py-3">
                    {u.is_active !== false
                      ? <span className="badge-green">Active</span>
                      : <span className="badge-red">Suspended</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => openDetail(u.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-brand-300 hover:bg-brand-600/10 transition-colors" title="View">
                        <Eye size={14}/>
                      </button>
                      {u.is_active !== false
                        ? <button onClick={() => handleStatus(u.id, false)} disabled={acting[u.id]} className="p-1.5 rounded-lg text-accent-amber hover:bg-accent-amber/10 transition-colors" title="Suspend">
                            {acting[u.id] ? <Loader2 size={14} className="animate-spin"/> : <Ban size={14}/>}
                          </button>
                        : <button onClick={() => handleStatus(u.id, true)} disabled={acting[u.id]} className="p-1.5 rounded-lg text-accent-emerald hover:bg-accent-emerald/10 transition-colors" title="Reactivate">
                            {acting[u.id] ? <Loader2 size={14} className="animate-spin"/> : <CheckCircle size={14}/>}
                          </button>
                      }
                      <button onClick={() => setDeleteConfirm(u)} className="p-1.5 rounded-lg text-accent-rose hover:bg-accent-rose/10 transition-colors" title="Delete">
                        <Trash2 size={14}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!users.length && <tr><td colSpan={7} className="py-12 text-center text-slate-500">No users found</td></tr>}
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

      {/* Detail Modal */}
      {detailUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-800 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-white font-bold text-lg">User Details</h3>
              <button onClick={() => setDetailUser(null)} className="text-slate-400 hover:text-white"><X size={18}/></button>
            </div>
            <div className="flex items-center gap-4 mb-5">
              {detailUser.profile_pic
                ? <img src={detailUser.profile_pic} className="w-16 h-16 rounded-2xl object-cover" alt=""/>
                : <div className="w-16 h-16 rounded-2xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-300 text-3xl font-bold">{detailUser.name?.[0]}</div>}
              <div>
                <p className="text-white font-bold text-lg">{detailUser.name}</p>
                <p className="text-slate-400 text-sm">{detailUser.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { label:'Bookings', val: detailUser.booking_count },
                { label:'Upcoming', val: detailUser.upcoming_events ?? '—' },
                { label:'Spent', val: `₹${(detailUser.total_spent||0).toLocaleString('en-IN')}` },
              ].map(({ label, val }) => (
                <div key={label} className="p-3 rounded-xl bg-surface-700/50 border border-white/5 text-center">
                  <p className="text-slate-500 text-xs">{label}</p>
                  <p className="text-white font-bold mt-0.5">{val}</p>
                </div>
              ))}
            </div>
            <div className="space-y-1 text-sm">
              {[['Phone', detailUser.phone||'—'], ['City', detailUser.city||'—'], ['Joined', fmtDate(detailUser.created_at)]].map(([k,v]) => (
                <div key={k} className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-slate-500">{k}</span><span className="text-slate-200">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-800 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-white font-bold text-lg mb-2">Delete User</h3>
            <p className="text-slate-400 text-sm mb-5">Are you sure you want to permanently delete <strong className="text-white">{deleteConfirm.name}</strong>? This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 btn-secondary justify-center">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm.id)} disabled={acting[deleteConfirm.id]} className="flex-1 btn-danger justify-center">
                {acting[deleteConfirm.id] ? <Loader2 size={15} className="animate-spin"/> : <Trash2 size={15}/>} Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
