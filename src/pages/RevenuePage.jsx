import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { IndianRupee, TrendingUp, Clock, ArrowUpRight, RefreshCw } from 'lucide-react';
import { revenueAPI } from '../services/api';
import { LoadingSpinner, ErrorMessage, EmptyState, StatCard, StatusBadge } from '../components/ui';

const CHART_STYLE = {
  contentStyle: { backgroundColor: '#1e2537', borderColor: '#3b4a66', color: '#fff', borderRadius: '8px' },
  gridStroke: '#2e3a52',
  axis: { stroke: '#64748b', tick: { fill: '#94a3b8' } },
};

const RevenuePage = () => {
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [pendingInvoices, setPendingInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPending, setShowPending] = useState(false);
  const [loadingPending, setLoadingPending] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [revRes, txRes] = await Promise.all([
        revenueAPI.getSummary(),
        revenueAPI.getTransactions(),
      ]);
      setSummary(revRes.data.data);
      setTransactions(txRes.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load revenue data');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingInvoices = async () => {
    setLoadingPending(true);
    try {
      const res = await revenueAPI.getPendingInvoices();
      setPendingInvoices(res.data.data || []);
      setShowPending(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPending(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return <LoadingSpinner text="Loading revenue data..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchData} />;

  const fmt = (n) => {
    if (!n) return '₹0';
    if (n >= 10000000) return `₹${(n/10000000).toFixed(1)}Cr`;
    if (n >= 100000) return `₹${(n/100000).toFixed(1)}L`;
    if (n >= 1000) return `₹${(n/1000).toFixed(0)}K`;
    return `₹${n}`;
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">Revenue Dashboard</h1>
          <p className="text-slate-400">Track and analyze your income streams and pending payments.</p>
        </div>
        <button onClick={fetchData} className="btn-secondary gap-2">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          label="Total Revenue YTD"
          value={fmt(summary?.totalRevenue)}
          icon={<IndianRupee size={24} />}
          color="brand"
          sub="+15.2% vs last year"
          subIcon={<TrendingUp size={16} />}
        />
        <StatCard
          label="Monthly Revenue"
          value={fmt(summary?.monthlyRevenue)}
          icon={<ArrowUpRight size={24} />}
          color="cyan"
          sub="+4.1% vs last month"
          subIcon={<TrendingUp size={16} />}
        />
        <div className="card p-6 glass border-l-4 border-l-accent-amber relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent-amber/10 rounded-full blur-[40px]" />
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div>
              <p className="text-slate-400 text-sm font-medium mb-1">Pending Payments</p>
              <h3 className="text-3xl font-bold text-white">{fmt(summary?.pendingAmount)}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-accent-amber/20 flex items-center justify-center">
              <Clock className="text-accent-amber" size={24} />
            </div>
          </div>
          <button
            onClick={fetchPendingInvoices}
            disabled={loadingPending}
            className="text-sm text-accent-amber hover:text-white transition-colors relative z-10 underline underline-offset-4"
          >
            {loadingPending ? 'Loading...' : 'View pending invoices'}
          </button>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card p-6 glass">
          <h2 className="section-title mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-brand-400" /> Monthly Revenue Trend
          </h2>
          {summary?.monthlyChartData?.length > 0 ? (
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={summary.monthlyChartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.gridStroke} vertical={false} />
                  <XAxis dataKey="name" stroke={CHART_STYLE.axis.stroke} tick={CHART_STYLE.axis.tick} axisLine={false} tickLine={false} />
                  <YAxis stroke={CHART_STYLE.axis.stroke} tick={CHART_STYLE.axis.tick} axisLine={false} tickLine={false} tickFormatter={v => `₹${v/1000}k`} />
                  <Tooltip contentStyle={CHART_STYLE.contentStyle} formatter={v => [`₹${Number(v).toLocaleString()}`, 'Revenue']} />
                  <Legend iconType="circle" />
                  <Line type="monotone" dataKey="total" name="Total Revenue" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState icon={<TrendingUp size={28} />} title="No monthly data yet" description="Complete bookings will appear here." />
          )}
        </div>

        <div className="card p-6 glass">
          <h2 className="section-title mb-6 flex items-center gap-2">
            <IndianRupee size={20} className="text-accent-cyan" /> Hall-wise Revenue
          </h2>
          {summary?.hallRevenue?.length > 0 ? (
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.hallRevenue} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.gridStroke} vertical={false} />
                  <XAxis dataKey="name" stroke={CHART_STYLE.axis.stroke} tick={CHART_STYLE.axis.tick} axisLine={false} tickLine={false} />
                  <YAxis stroke={CHART_STYLE.axis.stroke} tick={CHART_STYLE.axis.tick} axisLine={false} tickLine={false} tickFormatter={v => `₹${v/100000}L`} />
                  <Tooltip cursor={{ fill: 'rgba(99,102,241,0.1)' }} contentStyle={CHART_STYLE.contentStyle} formatter={v => [`₹${Number(v).toLocaleString()}`, 'Revenue']} />
                  <Bar dataKey="revenue" name="Revenue" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState icon={<IndianRupee size={28} />} title="No hall data yet" />
          )}
        </div>
      </div>

      {/* Pending Invoices Panel */}
      {showPending && (
        <div className="card glass overflow-hidden">
          <div className="p-6 border-b border-white/5 flex justify-between items-center bg-surface-800/50">
            <h2 className="section-title !mb-0 text-accent-amber">⏳ Pending Invoices</h2>
            <button onClick={() => setShowPending(false)} className="text-slate-400 hover:text-white text-sm">Close</button>
          </div>
          {pendingInvoices.length === 0 ? (
            <EmptyState icon={<Clock size={28} />} title="No pending invoices" description="All payments are settled." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-800/80 text-xs uppercase tracking-wider text-slate-400 border-b border-white/5">
                  <tr>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Hall</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Method</th>
                    <th className="p-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {pendingInvoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-surface-700/50">
                      <td className="p-4 font-medium text-white">{inv.customer_name}</td>
                      <td className="p-4">{inv.hall_name}</td>
                      <td className="p-4 text-accent-amber font-bold">₹{Number(inv.amount).toLocaleString()}</td>
                      <td className="p-4">{inv.payment_method}</td>
                      <td className="p-4">{new Date(inv.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Transactions Table */}
      <div className="card glass overflow-hidden">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-surface-800/50">
          <h2 className="section-title !mb-0">Recent Transactions</h2>
          <span className="text-sm text-slate-400">{transactions.length} records</span>
        </div>
        {transactions.length === 0 ? (
          <EmptyState icon={<IndianRupee size={28} />} title="No transactions available" description="Completed bookings will appear here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-800/80 text-xs uppercase tracking-wider text-slate-400 border-b border-white/5">
                  <th className="p-4 font-medium">Date</th>
                  <th className="p-4 font-medium">Customer</th>
                  <th className="p-4 font-medium">Hall</th>
                  <th className="p-4 font-medium">Amount</th>
                  <th className="p-4 font-medium">Method</th>
                  <th className="p-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm text-slate-300">
                {transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-surface-700/50 transition-colors">
                    <td className="p-4">{new Date(t.created_at).toLocaleDateString()}</td>
                    <td className="p-4 font-medium text-white">{t.customer_name}</td>
                    <td className="p-4">{t.hall_name}</td>
                    <td className="p-4 text-brand-300 font-bold">₹{Number(t.amount).toLocaleString()}</td>
                    <td className="p-4">{t.payment_method}</td>
                    <td className="p-4"><StatusBadge status={t.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default RevenuePage;
