import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Eye, Loader2, Search, Building2, Phone, Mail, Calendar } from 'lucide-react';
import { adminAPI } from '../../services/api';

const TABS = ['pending','approved','rejected'];
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—';

export default function OwnerApprovals() {
  const [tab,     setTab]     = useState('pending');
  const [owners,  setOwners]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting,  setActing]  = useState({});
  const [selected,setSelected]= useState(null); // profile drawer
  const [rejectModal, setRejectModal] = useState(null); // { id, name }
  const [rejectReason, setRejectReason] = useState('');

  const load = async (t = tab) => {
    setLoading(true);
    try {
      const res = await adminAPI.getOwners(t);
      setOwners(res.data.data);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(tab); }, [tab]);

  const handleApproval = async (id, status, reason) => {
    setActing(p => ({ ...p, [id]: true }));
    try {
      await adminAPI.updateOwnerApproval(id, { status, reason });
      setRejectModal(null); setRejectReason('');
      await load(tab);
    } catch {}
    finally { setActing(p => ({ ...p, [id]: false })); }
  };

  const openProfile = async (id) => {
    try {
      const res = await adminAPI.getOwnerById(id);
      setSelected(res.data.data);
    } catch {}
  };

  const tabColor = { pending:'badge-amber', approved:'badge-green', rejected:'badge-red' };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Owner Approvals & Verification</h1>
        <p className="text-slate-400 text-sm mt-1">Review and manage venue owner registrations</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
              tab === t ? 'bg-brand-600 text-white shadow-glow-sm' : 'bg-surface-700 text-slate-400 hover:text-white'
            }`}>
            {t === 'pending' ? 'Pending' : t === 'approved' ? 'Approved' : 'Rejected'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 size={32} className="animate-spin text-brand-400"/></div>
        ) : owners.length === 0 ? (
          <div className="py-16 text-center text-slate-500">No {tab} owners found</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface-700/50 border-b border-white/5">
              <tr>{['Owner','Email','Phone','Registered','Venues','Status','Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {owners.map(o => (
                <tr key={o.id} className="hover:bg-surface-700/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-300 text-xs font-bold">
                        {o.name?.[0]?.toUpperCase()}
                      </div>
                      <span className="text-white font-medium">{o.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{o.email}</td>
                  <td className="px-4 py-3 text-slate-400">{o.phone || '—'}</td>
                  <td className="px-4 py-3 text-slate-400">{fmtDate(o.created_at)}</td>
                  <td className="px-4 py-3 text-slate-300">{o.venue_count}</td>
                  <td className="px-4 py-3"><span className={tabColor[o.approval_status] || 'badge-amber'}>{o.approval_status}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openProfile(o.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-brand-300 hover:bg-brand-600/10 transition-colors" title="View Profile">
                        <Eye size={15}/>
                      </button>
                      {o.approval_status === 'pending' && (
                        <>
                          <button onClick={() => handleApproval(o.id,'approved')} disabled={acting[o.id]}
                            className="p-1.5 rounded-lg text-accent-emerald hover:bg-accent-emerald/10 transition-colors" title="Approve">
                            {acting[o.id] ? <Loader2 size={15} className="animate-spin"/> : <CheckCircle size={15}/>}
                          </button>
                          <button onClick={() => setRejectModal({ id: o.id, name: o.name })}
                            className="p-1.5 rounded-lg text-accent-rose hover:bg-accent-rose/10 transition-colors" title="Reject">
                            <XCircle size={15}/>
                          </button>
                        </>
                      )}
                      {o.approval_status === 'approved' && (
                        <button onClick={() => setRejectModal({ id: o.id, name: o.name })}
                          className="px-2 py-1 text-xs rounded-lg text-accent-amber hover:bg-accent-amber/10 border border-accent-amber/30 transition-colors">
                          Suspend
                        </button>
                      )}
                      {o.approval_status === 'rejected' && (
                        <button onClick={() => handleApproval(o.id,'approved')} disabled={acting[o.id]}
                          className="px-2 py-1 text-xs rounded-lg text-accent-emerald hover:bg-accent-emerald/10 border border-accent-emerald/30 transition-colors">
                          Restore
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Profile Drawer */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end" onClick={() => setSelected(null)}>
          <div className="w-full max-w-md bg-surface-800 h-full overflow-y-auto p-6 space-y-5 border-l border-white/10 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Owner Profile</h2>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-300 text-2xl font-bold">
                {selected.name?.[0]}
              </div>
              <div>
                <p className="text-white font-bold text-lg">{selected.name}</p>
                <span className={tabColor[selected.approval_status] || 'badge-amber'}>{selected.approval_status}</span>
              </div>
            </div>
            <div className="space-y-2">
              {[
                { icon: Mail, label: 'Email', val: selected.email },
                { icon: Phone, label: 'Phone', val: selected.phone || 'N/A' },
                { icon: Calendar, label: 'Registered', val: fmtDate(selected.created_at) },
                { icon: Building2, label: 'Halls Listed', val: selected.halls?.length || 0 },
              ].map(({ icon: Icon, label, val }) => (
                <div key={label} className="flex items-center gap-3 p-3 rounded-xl bg-surface-700/50 border border-white/5">
                  <Icon size={16} className="text-slate-400 shrink-0"/>
                  <div>
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className="text-white text-sm">{val}</p>
                  </div>
                </div>
              ))}
            </div>
            {selected.halls?.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-slate-300 mb-2">Halls</p>
                <div className="space-y-2">
                  {selected.halls.map(h => (
                    <div key={h.id} className="p-3 rounded-xl bg-surface-700/50 border border-white/5 flex justify-between items-center">
                      <div>
                        <p className="text-white text-sm font-medium">{h.name}</p>
                        <p className="text-slate-500 text-xs">{h.location}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-accent-emerald text-sm font-semibold">₹{h.price?.toLocaleString('en-IN')}</p>
                        <p className="text-slate-500 text-xs">{h.booking_count} bookings</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-800 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-white font-bold text-lg mb-1">Reject / Suspend Owner</h3>
            <p className="text-slate-400 text-sm mb-4">{rejectModal.name}</p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Optional reason for rejection..."
              className="input resize-none h-24 mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => { setRejectModal(null); setRejectReason(''); }} className="flex-1 btn-secondary justify-center">Cancel</button>
              <button onClick={() => handleApproval(rejectModal.id,'rejected',rejectReason)} className="flex-1 btn-danger justify-center">
                {acting[rejectModal.id] ? <Loader2 size={15} className="animate-spin"/> : <XCircle size={15}/>} Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
