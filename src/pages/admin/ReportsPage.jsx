import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, Tooltip,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend,
} from 'recharts';
import { adminAPI } from '../../services/api';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const fmt = (n) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);

const SectionTitle = ({ title, sub }) => (
  <div className="mb-4">
    <h2 className="text-lg font-bold text-white">{title}</h2>
    {sub && <p className="text-slate-400 text-sm">{sub}</p>}
  </div>
);

export default function ReportsPage() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getReports()
      .then(r => setData(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 size={36} className="animate-spin text-brand-400"/>
    </div>
  );

  if (!data) return (
    <div className="flex items-center justify-center min-h-screen text-slate-500">
      Failed to load reports.
    </div>
  );

  // Backend returns statusBreakdown as [{status, count}] array → convert to object
  const statusObj = Array.isArray(data.statusBreakdown)
    ? Object.fromEntries((data.statusBreakdown).map(r => [r.status, parseInt(r.count)]))
    : (data.statusBreakdown || {});

  const pieData = [
    { name: 'Pending',   value: statusObj.Pending   || 0 },
    { name: 'Confirmed', value: statusObj.Confirmed || 0 },
    { name: 'Completed', value: statusObj.Completed || 0 },
    { name: 'Cancelled', value: statusObj.Cancelled || 0 },
  ].filter(d => d.value > 0);

  return (
    <div className="p-6 space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-white">System Reports & Analytics</h1>
        <p className="text-slate-400 text-sm mt-1">Platform-wide insights and performance metrics</p>
      </div>

      {/* Row 1: Monthly Bookings + Revenue */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Monthly Bookings */}
        <div className="card p-5">
          <SectionTitle title="Monthly Bookings" sub="Bookings per month — last 6 months"/>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.monthlyBookings || []} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08"/>
              <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }}/>
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }}/>
              <Tooltip
                contentStyle={{ background: '#1e2537', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#e2e8f0' }}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} name="Bookings"/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Revenue */}
        <div className="card p-5">
          <SectionTitle title="Monthly Revenue" sub="Revenue trend — last 6 months"/>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data.monthlyRevenue || []} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08"/>
              <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }}/>
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => `₹${fmt(v)}`}/>
              <Tooltip
                contentStyle={{ background: '#1e2537', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#e2e8f0' }}
                formatter={v => [`₹${fmt(v)}`, 'Revenue']}
              />
              <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2.5} dot={{ fill: '#10b981', r: 4 }} name="Revenue"/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2: Booking Status Breakdown */}
      {pieData.length > 0 && (
        <div className="card p-5">
          <SectionTitle title="Booking Status Breakdown" sub="Distribution of booking statuses across the platform"/>
          <div className="flex flex-col md:flex-row items-center gap-6">
            <ResponsiveContainer width="100%" height={240} className="flex-1">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                  dataKey="value" nameKey="name" paddingAngle={3}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]}/>
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#1e2537', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#e2e8f0' }}
                />
                <Legend formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{v}</span>}/>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-3 min-w-[180px]">
              {pieData.map((item, i) => {
                const total = pieData.reduce((sum, d) => sum + d.value, 0);
                const pct = total ? ((item.value / total) * 100).toFixed(1) : 0;
                return (
                  <div key={item.name} className="flex items-center justify-between gap-4 p-3 rounded-xl bg-surface-700/50 border border-white/5">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }}/>
                      <span className="text-slate-300 text-sm">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-white font-bold text-sm">{item.value}</span>
                      <span className="text-slate-500 text-xs ml-1">({pct}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Row 3: Top Venues + Top Customers */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Top 5 Venues */}
        <div className="card p-5">
          <SectionTitle title="Top 5 Most-Booked Venues" sub="By total bookings"/>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {['Rank', 'Venue', 'Owner', 'Bookings', 'Revenue'].map(h => (
                  <th key={h} className="pb-2 pr-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {(data.topVenues || []).map((v, i) => (
                <tr key={v.id} className="hover:bg-surface-700/20 transition-colors">
                  <td className="py-2.5 pr-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                      ${i === 0 ? 'bg-accent-amber/20 text-accent-amber' : i === 1 ? 'bg-slate-600/30 text-slate-300' : i === 2 ? 'bg-accent-amber/10 text-amber-700' : 'bg-surface-700 text-slate-500'}`}>
                      {i + 1}
                    </span>
                  </td>
                  <td className="py-2.5 pr-3 text-white font-medium max-w-[120px] truncate">{v.venue_name || v.name}</td>
                  <td className="py-2.5 pr-3 text-slate-400 text-xs">{v.owner_name}</td>
                  <td className="py-2.5 pr-3 text-slate-300 font-semibold">{v.total_bookings}</td>
                  <td className="py-2.5 text-accent-emerald font-semibold text-xs">₹{fmt(v.total_revenue)}</td>
                </tr>
              ))}
              {!(data.topVenues?.length) && (
                <tr><td colSpan={5} className="py-8 text-center text-slate-500">No data available</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Top 5 Customers */}
        <div className="card p-5">
          <SectionTitle title="Top 5 Most Active Customers" sub="By total bookings"/>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {['Rank', 'Customer', 'Bookings', 'Total Spent'].map(h => (
                  <th key={h} className="pb-2 pr-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {(data.topCustomers || []).map((c, i) => (
                <tr key={c.id} className="hover:bg-surface-700/20 transition-colors">
                  <td className="py-2.5 pr-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                      ${i === 0 ? 'bg-accent-amber/20 text-accent-amber' : i === 1 ? 'bg-slate-600/30 text-slate-300' : i === 2 ? 'bg-accent-amber/10 text-amber-700' : 'bg-surface-700 text-slate-500'}`}>
                      {i + 1}
                    </span>
                  </td>
                  <td className="py-2.5 pr-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-300 text-xs font-bold shrink-0">
                        {(c.customer_name || c.name)?.[0]?.toUpperCase()}
                      </div>
                      <span className="text-white font-medium">{c.customer_name || c.name}</span>
                    </div>
                  </td>
                  <td className="py-2.5 pr-3 text-slate-300 font-semibold">{c.total_bookings}</td>
                  <td className="py-2.5 text-accent-emerald font-semibold text-xs">₹{fmt(c.total_spent)}</td>
                </tr>
              ))}
              {!(data.topCustomers?.length) && (
                <tr><td colSpan={4} className="py-8 text-center text-slate-500">No data available</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
