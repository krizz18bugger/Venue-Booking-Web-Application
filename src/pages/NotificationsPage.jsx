import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell, CreditCard, UserX, UserPlus, CheckCircle2, XCircle,
  RefreshCw, IndianRupee, Calendar, Users
} from 'lucide-react';
import { notificationsAPI } from '../services/api';
import { LoadingSpinner, ErrorMessage, EmptyState, StatusBadge } from '../components/ui';

// ─── Request Card ─────────────────────────────────────────────
const RequestCard = ({ item, onAccept, onDecline, processing }) => (
  <div className="p-5 rounded-2xl bg-surface-800/50 border border-white/5 hover:border-brand-500/30 hover:bg-surface-800 transition-all duration-300 group shadow-card flex gap-4">
    <div className="mt-1 w-12 h-12 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center flex-shrink-0">
      <UserPlus size={20} />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex justify-between items-start mb-1">
        <h4 className="text-lg font-bold text-white group-hover:text-brand-300 transition-colors truncate pr-2">{item.title}</h4>
        <span className="text-xs text-slate-500 bg-surface-900/50 px-2 py-1 rounded-md flex-shrink-0">
          {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      <p className="text-slate-300 text-sm mb-3">{item.message}</p>
      {/* Booking Info */}
      {item.booking_date && (
        <div className="flex flex-wrap gap-3 mb-3 text-xs text-slate-400">
          {item.hall_name && <span className="flex items-center gap-1"><Bell size={12} /> {item.hall_name}</span>}
          {item.booking_date && <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(item.booking_date).toLocaleDateString()}</span>}
          {item.guest_count && <span className="flex items-center gap-1"><Users size={12} /> {item.guest_count} guests</span>}
          {item.amount && <span className="flex items-center gap-1"><IndianRupee size={12} /> ₹{Number(item.amount).toLocaleString()}</span>}
        </div>
      )}
      <div className="flex justify-between items-center">
        <StatusBadge status={item.status} />
        {item.status === 'Pending' && (
          <div className="flex gap-2">
            <button
              disabled={processing === item.id}
              onClick={() => onDecline(item.id)}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-surface-700 text-slate-300 hover:bg-accent-rose/20 hover:text-accent-rose transition-colors disabled:opacity-50"
            >
              <XCircle size={14} /> Decline
            </button>
            <button
              disabled={processing === item.id}
              onClick={() => onAccept(item.id)}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white shadow-glow-sm transition-colors disabled:opacity-50"
            >
              <CheckCircle2 size={14} /> {processing === item.id ? '...' : 'Accept'}
            </button>
          </div>
        )}
      </div>
    </div>
  </div>
);

// ─── Notification Card (generic) ──────────────────────────────
const NotifCard = ({ item, icon, iconColor }) => (
  <div className="p-5 rounded-2xl bg-surface-800/50 border border-white/5 hover:border-white/10 hover:bg-surface-800 transition-all duration-300 flex gap-4">
    <div className={`mt-1 w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${iconColor}`}>
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex justify-between items-start mb-1">
        <h4 className="text-base font-bold text-white truncate pr-2">{item.title}</h4>
        <span className="text-xs text-slate-500 bg-surface-900/50 px-2 py-1 rounded-md flex-shrink-0">
          {new Date(item.created_at).toLocaleDateString()}
        </span>
      </div>
      <p className="text-slate-300 text-sm mb-2">{item.message}</p>
      <div className="flex flex-wrap gap-3 items-center">
        <StatusBadge status={item.payment_status || item.status} />
        {item.transaction_amount && (
          <span className="text-xs text-brand-300 font-bold">₹{Number(item.transaction_amount).toLocaleString()}</span>
        )}
        {item.payment_method && (
          <span className="text-xs text-slate-400 bg-surface-700 px-2 py-0.5 rounded">{item.payment_method}</span>
        )}
      </div>
    </div>
  </div>
);

// ─── Main NotificationsPage ───────────────────────────────────
const NotificationsPage = () => {
  const [activeTab, setActiveTab]   = useState('requests');
  const [requests, setRequests]     = useState([]);
  const [cancels, setCancels]       = useState([]);
  const [payments, setPayments]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [processing, setProcessing] = useState(null); // id being accepted/declined
  const [markingRead, setMarkingRead] = useState(false);
  const [toast, setToast]           = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [reqRes, canRes, payRes] = await Promise.all([
        notificationsAPI.getRequests(),
        notificationsAPI.getCancellations(),
        notificationsAPI.getPayments(),
      ]);
      setRequests(reqRes.data.data || []);
      setCancels(canRes.data.data || []);
      setPayments(payRes.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleAccept = async (id) => {
    setProcessing(id);
    try {
      await notificationsAPI.acceptRequest(id);
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'Accepted' } : r));
      showToast('✅ Booking request accepted');
    } catch (err) {
      showToast('❌ Failed to accept request');
    } finally {
      setProcessing(null);
    }
  };

  const handleDecline = async (id) => {
    setProcessing(id);
    try {
      await notificationsAPI.declineRequest(id);
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'Declined' } : r));
      showToast('Request declined');
    } catch (err) {
      showToast('❌ Failed to decline request');
    } finally {
      setProcessing(null);
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingRead(true);
    try {
      await notificationsAPI.markAllRead();
      showToast('✅ All notifications marked as read');
      await fetchAll();
    } catch (err) {
      showToast('❌ Failed to mark as read');
    } finally {
      setMarkingRead(false);
    }
  };

  const totalUnread = requests.filter(r => !r.read).length + cancels.filter(c => !c.read).length + payments.filter(p => !p.read).length;

  const tabs = [
    { id: 'requests',      label: 'Booking Requests', count: requests.length,      icon: <UserPlus size={18} /> },
    { id: 'cancellations', label: 'Cancellations',    count: cancels.length,       icon: <UserX size={18} /> },
    { id: 'payments',      label: 'Payments',         count: payments.length,      icon: <CreditCard size={18} /> },
  ];

  const currentList = activeTab === 'requests' ? requests : activeTab === 'cancellations' ? cancels : payments;

  if (loading) return <LoadingSpinner text="Loading notifications..." />;
  if (error)   return <ErrorMessage message={error} onRetry={fetchAll} />;

  return (
    <div className="flex gap-6 animate-fade-in relative z-10 h-[calc(100vh-8rem)]">

      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-surface-700 border border-white/10 text-white px-4 py-3 rounded-xl shadow-xl animate-fade-in text-sm font-medium">
          {toast}
        </div>
      )}

      {/* Secondary Sidebar */}
      <div className="w-72 flex-shrink-0 card p-4 glass flex flex-col h-full">
        <div className="mb-6 px-2 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Bell className="text-brand-400" /> Notifications
          </h2>
          {totalUnread > 0 && (
            <span className="text-xs bg-accent-rose text-white font-bold px-2 py-0.5 rounded-full">{totalUnread}</span>
          )}
        </div>

        <div className="space-y-2 flex-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex justify-between items-center px-4 py-3 rounded-xl transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-brand-500/10 border border-brand-500/30 shadow-glow-sm text-brand-300'
                  : 'text-slate-400 hover:bg-surface-700 hover:text-white border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3 font-medium text-sm">{tab.icon} {tab.label}</div>
              {tab.count > 0 && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-brand-500/20 text-brand-400' : 'bg-surface-600 text-slate-300'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-2 border-t border-white/5 mt-auto space-y-2">
          <button
            onClick={handleMarkAllRead}
            disabled={markingRead}
            className="w-full text-sm text-slate-400 hover:text-brand-400 transition-colors text-center py-2 hover:bg-surface-700 rounded-lg"
          >
            {markingRead ? 'Marking...' : '✓ Mark all as read'}
          </button>
          <button onClick={fetchAll} className="w-full text-sm text-slate-500 hover:text-white transition-colors text-center py-2 flex items-center justify-center gap-2 hover:bg-surface-700 rounded-lg">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 card glass overflow-hidden flex flex-col h-full">
        <div className="p-6 border-b border-white/5 bg-surface-800/80 sticky top-0 z-10 backdrop-blur-md flex items-center justify-between">
          <h3 className="text-xl font-bold text-white flex items-center gap-3">
            {tabs.find(t => t.id === activeTab)?.icon}
            {tabs.find(t => t.id === activeTab)?.label}
          </h3>
          <span className="text-sm text-slate-400">{currentList.length} items</span>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'requests' && (
            requests.length === 0 ? (
              <EmptyState icon={<UserPlus size={40} className="text-slate-600" />} title="No Booking Requests" description="You're all caught up!" />
            ) : (
              requests.map(item => (
                <RequestCard key={item.id} item={item} onAccept={handleAccept} onDecline={handleDecline} processing={processing} />
              ))
            )
          )}

          {activeTab === 'cancellations' && (
            cancels.length === 0 ? (
              <EmptyState icon={<UserX size={40} className="text-slate-600" />} title="No Cancellations" description="Everything is running smoothly." />
            ) : (
              cancels.map(item => (
                <NotifCard key={item.id} item={item} icon={<UserX size={20} />} iconColor="bg-accent-rose/20 text-accent-rose" />
              ))
            )
          )}

          {activeTab === 'payments' && (
            payments.length === 0 ? (
              <EmptyState icon={<CreditCard size={40} className="text-slate-600" />} title="No Payments" description="Payment notifications will appear here." />
            ) : (
              payments.map(item => (
                <NotifCard key={item.id} item={item} icon={<IndianRupee size={20} />} iconColor="bg-accent-emerald/20 text-accent-emerald" />
              ))
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
