import React, { useEffect, useState } from 'react';
import { Users, Building2, CalendarDays, IndianRupee, Clock, AlertTriangle, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { adminAPI } from '../../services/api';

const fmt = (n) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—';

const MetricCard = ({ label, value, icon: Icon, color, sub }) => (
  <div className="card p-5 flex items-start gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
      <Icon size={22} className="text-white" />
    </div>
    <div>
      <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-extrabold text-white mt-0.5">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
    </div>
  </div>
);

const statusBadge = (s) => {
  const map = { Pending:'badge-amber', Confirmed:'badge-cyan', Completed:'badge-green', Cancelled:'badge-red' };
  return <span className={map[s] || 'badge-amber'}>{s}</span>;
};

export default function AdminDashboard() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting,  setActing]  = useState({});

  const load = async () => {
    try {
      const res = await adminAPI.getDashboard();
      setData(res.data.data);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleApproval = async (id, status) => {
    setActing(p => ({ ...p, [id]: true }));
    try {
      await adminAPI.updateOwnerApproval(id, { status });
      await load();
    } catch {}
    finally { setActing(p => ({ ...p, [id]: false })); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full min-h-screen">
      <Loader2 size={36} className="animate-spin text-brand-400" />
    </div>
  );

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white">Admin Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Platform overview — {new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
        <MetricCard label="Total Users"          value={fmt(data?.totalUsers ?? 0)}     icon={Users}        color="bg-brand-600"          sub="Customers & owners" />
        <MetricCard label="Hall Listings"        value={fmt(data?.totalHalls ?? 0)}     icon={Building2}    color="bg-accent-violet"      sub="All statuses" />
        <MetricCard label="Bookings Today"       value={fmt(data?.todayBookings ?? 0)}  icon={CalendarDays} color="bg-accent-cyan"         sub="As of today" />
        <MetricCard label="Total Revenue"        value={`₹${fmt(data?.totalRevenue ?? 0)}`} icon={IndianRupee} color="bg-accent-emerald" sub="Completed transactions" />
        <MetricCard label="Pending Approvals"    value={fmt(data?.pendingOwners ?? 0)}  icon={Clock}        color="bg-accent-amber"       sub="Owner registrations" />
        <MetricCard label="Open Disputes"        value={fmt(data?.openDisputes ?? 0)}   icon={AlertTriangle} color="bg-accent-rose"       sub="Awaiting resolution" />
      </div>

      {/* Widgets row */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Recent bookings — 3/5 */}
        <div className="xl:col-span-3 card p-5">
          <h2 className="section-title mb-4">Recent Bookings</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-white/5">
                  {['Customer','Venue','Event Date','Status','Amount'].map(h => (
                    <th key={h} className="pb-2 pr-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {(data?.recentBookings || []).map(b => (
                  <tr key={b.id} className="hover:bg-surface-700/30 transition-colors">
                    <td className="py-2.5 pr-4 text-white font-medium">{b.customer_name}</td>
                    <td className="py-2.5 pr-4 text-slate-300 truncate max-w-[120px]">{b.venue_name}</td>
                    <td className="py-2.5 pr-4 text-slate-400">{fmtDate(b.event_date)}</td>
                    <td className="py-2.5 pr-4">{statusBadge(b.status)}</td>
                    <td className="py-2.5 text-accent-emerald font-semibold">₹{fmt(b.amount)}</td>
                  </tr>
                ))}
                {(!data?.recentBookings?.length) && (
                  <tr><td colSpan={5} className="py-6 text-center text-slate-500">No bookings yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pending Owners — 2/5 */}
        <div className="xl:col-span-2 card p-5">
          <h2 className="section-title mb-4">Pending Owner Approvals</h2>
          <div className="space-y-3">
            {(data?.pendingOwnersList || []).map(o => (
              <div key={o.id} className="p-3 rounded-xl bg-surface-700/50 border border-white/5 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-white text-sm font-semibold">{o.name}</p>
                    <p className="text-slate-500 text-xs">{o.email}</p>
                    <p className="text-slate-500 text-xs mt-0.5">Registered {fmtDate(o.created_at)}</p>
                  </div>
                  <span className="badge-amber shrink-0">Pending</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApproval(o.id, 'approved')}
                    disabled={acting[o.id]}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-accent-emerald/20 hover:bg-accent-emerald/30 text-accent-emerald text-xs font-medium border border-accent-emerald/30 transition-all"
                  >
                    {acting[o.id] ? <Loader2 size={12} className="animate-spin"/> : <CheckCircle size={12}/>} Approve
                  </button>
                  <button
                    onClick={() => handleApproval(o.id, 'rejected')}
                    disabled={acting[o.id]}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-accent-rose/10 hover:bg-accent-rose/20 text-accent-rose text-xs font-medium border border-accent-rose/30 transition-all"
                  >
                    <XCircle size={12}/> Reject
                  </button>
                </div>
              </div>
            ))}
            {(!data?.pendingOwnersList?.length) && (
              <div className="py-8 text-center text-slate-500 text-sm">No pending approvals 🎉</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
