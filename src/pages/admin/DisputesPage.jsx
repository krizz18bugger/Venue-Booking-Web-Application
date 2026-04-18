import React, { useEffect, useState, useCallback } from 'react';
import { AlertTriangle, ChevronRight, Loader2, X, Save } from 'lucide-react';
import { adminAPI } from '../../services/api';

const TABS = ['open', 'under_review', 'resolved', 'closed'];
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const statusBadge = (s) => {
  const map = {
    open:         'badge-red',
    under_review: 'badge-amber',
    resolved:     'badge-green',
    closed:       'badge-violet',
  };
  return <span className={map[s] || 'badge-amber'}>{s.replace('_', ' ')}</span>;
};

const tabLabel = (t) => ({ open: 'Open', under_review: 'Under Review', resolved: 'Resolved', closed: 'Closed' })[t];

export default function DisputesPage() {
  const [tab,     setTab]     = useState('open');
  const [disputes,setDisputes]= useState([]);
  const [loading, setLoading] = useState(true);
  const [selected,setSelected]= useState(null);
  const [notes,   setNotes]   = useState('');
  const [newStatus,setNewStatus] = useState('');
  const [saving,  setSaving]  = useState(false);

  const load = useCallback(async (t = tab) => {
    setLoading(true);
    try {
      const res = await adminAPI.getDisputes(t);
      setDisputes(res.data.data);
    } catch {}
    finally { setLoading(false); }
  }, [tab]);

  useEffect(() => { load(tab); setSelected(null); }, [tab]);

  const openDetail = (d) => {
    setSelected(d);
    setNotes(d.admin_notes || '');
    setNewStatus(d.status);
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await adminAPI.updateDispute(selected.dispute_id || selected.id, { status: newStatus, admin_notes: notes });
      await load(tab);
      setSelected(prev => prev ? { ...prev, status: newStatus, admin_notes: notes } : null);
    } catch {}
    finally { setSaving(false); }
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-start gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Disputes & Complaints</h1>
          <p className="text-slate-400 text-sm mt-1">Handle customer-raised disputes and complaints</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${
              tab === t ? 'bg-brand-600 text-white shadow-glow-sm' : 'bg-surface-700 text-slate-400 hover:text-white'
            }`}>{tabLabel(t)}</button>
        ))}
      </div>

      <div className="flex gap-6">
        {/* List */}
        <div className={`${selected ? 'hidden xl:block xl:w-1/2' : 'w-full'} card overflow-hidden`}>
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 size={32} className="animate-spin text-brand-400"/></div>
          ) : disputes.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-3 text-slate-500">
              <AlertTriangle size={32}/>
              <p>No {tabLabel(tab).toLowerCase()} disputes</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-surface-700/50 border-b border-white/5">
                <tr>{['Dispute ID', 'Raised By', 'Venue', 'Subject', 'Date', 'Status', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {disputes.map(d => (
                  <tr key={d.dispute_id || d.id}
                    onClick={() => openDetail(d)}
                    className={`hover:bg-surface-700/30 transition-colors cursor-pointer ${(selected?.dispute_id || selected?.id) === (d.dispute_id || d.id) ? 'bg-brand-600/10' : ''}`}>
                    <td className="px-4 py-3 text-slate-500 text-xs font-mono">{String(d.dispute_id || d.id || '').slice(0, 8)}…</td>
                    <td className="px-4 py-3 text-white font-medium">{d.raised_by_name}</td>
                    <td className="px-4 py-3 text-slate-400 max-w-[100px] truncate">{d.venue_name || '—'}</td>
                    <td className="px-4 py-3 text-slate-300 max-w-[150px] truncate">{d.subject}</td>
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{fmtDate(d.created_at)}</td>
                    <td className="px-4 py-3">{statusBadge(d.status)}</td>
                    <td className="px-4 py-3 text-slate-400"><ChevronRight size={16}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="flex-1 card p-6 space-y-5 min-w-0">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Dispute Detail</h2>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-white">
                <X size={18}/>
              </button>
            </div>

            {/* Meta */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Raised By',  selected.raised_by_name || selected.raised_by_email],
                ['Venue',      selected.venue_name || '—'],
                ['Booking ID', selected.booking_id ? String(selected.booking_id).slice(0,12) + '…' : '—'],
                ['Date',       fmtDate(selected.created_at)],
                ['Current Status', tabLabel(selected.status)],
                ['Resolved',   selected.resolved_at ? fmtDate(selected.resolved_at) : '—'],
              ].map(([k, v]) => (
                <div key={k} className="p-3 rounded-xl bg-surface-700/50 border border-white/5">
                  <p className="text-xs text-slate-500">{k}</p>
                  <p className="text-white text-sm mt-0.5 font-medium">{v}</p>
                </div>
              ))}
            </div>

            {/* Subject + Description */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Subject</p>
              <p className="text-white text-sm font-medium">{selected.subject}</p>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Description</p>
              <p className="text-slate-300 text-sm leading-relaxed p-3 rounded-xl bg-surface-700/50 border border-white/5">
                {selected.description}
              </p>
            </div>

            {/* Admin Action */}
            <div className="space-y-3 pt-2 border-t border-white/5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Admin Action</p>
              <div>
                <label className="label">Update Status</label>
                <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className="input">
                  {TABS.map(s => <option key={s} value={s}>{tabLabel(s)}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Admin Notes</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={4}
                  placeholder="Add internal notes about this dispute..."
                  className="input resize-none"
                />
              </div>
              <button onClick={handleSave} disabled={saving} className="btn-primary w-full justify-center">
                {saving ? <Loader2 size={15} className="animate-spin"/> : <Save size={15}/>}
                Save Changes
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
