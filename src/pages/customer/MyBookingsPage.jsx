import React, { useEffect, useState, useCallback } from 'react';
import {
  CalendarDays, MapPin, IndianRupee, Star, XCircle, MessageSquareWarning,
  Send, Loader2, AlertTriangle, X, CheckCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { customerAPI, reviewsAPI, disputesAPI } from '../../services/api';

const TABS = ['Upcoming', 'Past', 'Cancelled'];

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const statusBadge = (s) => {
  const map = {
    Pending:    'badge-amber',
    Confirmed:  'badge-cyan',
    Completed:  'badge-green',
    Cancelled:  'badge-red',
  };
  return <span className={map[s] || 'badge-amber'}>{s}</span>;
};

const payBadge = (s) => {
  const map = { Success:'badge-green', Pending:'badge-amber', Refunded:'badge-violet', Failed:'badge-red' };
  return <span className={map[s] || 'badge-amber'}>{s}</span>;
};

// ─── Raise Dispute Modal ───────────────────────────────────────────────────────
function DisputeModal({ booking, onClose, onSubmitted }) {
  const [subject, setSubject]   = useState('');
  const [desc,    setDesc]      = useState('');
  const [loading, setLoading]   = useState(false);
  const [err,     setErr]       = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !desc.trim()) { setErr('Subject and description are required.'); return; }
    setLoading(true); setErr('');
    try {
      await disputesAPI.raise({ booking_id: booking.id, subject, description: desc });
      onSubmitted();
      onClose();
    } catch (error) {
      setErr(error.response?.data?.message || 'Failed to raise dispute.');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface-800 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-white font-bold text-lg">Raise a Dispute</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={18}/></button>
        </div>
        <p className="text-slate-400 text-sm mb-4">
          Booking: <span className="text-white font-medium">{booking.venue_name}</span> on {fmtDate(booking.event_date)}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Subject <span className="text-slate-500 font-normal normal-case">(max 200 chars)</span></label>
            <input value={subject} onChange={e => setSubject(e.target.value.slice(0, 200))} required
              className="input" placeholder="Brief description of the issue"/>
            <p className="text-slate-600 text-xs mt-1">{subject.length}/200</p>
          </div>
          <div>
            <label className="label">Description <span className="text-slate-500 font-normal normal-case">(max 1000 chars)</span></label>
            <textarea value={desc} onChange={e => setDesc(e.target.value.slice(0, 1000))} required
              className="input resize-none h-28" placeholder="Explain the issue in detail…"/>
            <p className="text-slate-600 text-xs mt-1">{desc.length}/1000</p>
          </div>
          {err && <div className="flex items-center gap-2 text-accent-rose text-sm"><AlertTriangle size={14}/>{err}</div>}
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary justify-center">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 btn-primary justify-center">
              {loading ? <Loader2 size={15} className="animate-spin"/> : <Send size={15}/>} Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Write Review Modal ────────────────────────────────────────────────────────
function ReviewModal({ booking, onClose, onSubmitted }) {
  const [rating,  setRating]  = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [err,     setErr]     = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) { setErr('Please select a star rating.'); return; }
    setLoading(true); setErr('');
    try {
      await reviewsAPI.submitReview(booking.hall_id, { rating, comment });
      onSubmitted();
      onClose();
    } catch (error) {
      setErr(error.response?.data?.message || 'Failed to submit review.');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface-800 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white font-bold text-lg">Write a Review</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={18}/></button>
        </div>
        <p className="text-slate-400 text-sm mb-5">{booking.venue_name}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Rating</label>
            <div className="flex gap-2">
              {[1,2,3,4,5].map(i => (
                <button key={i} type="button" onClick={() => setRating(i)}>
                  <Star size={26} className={i <= rating ? 'text-accent-amber fill-accent-amber' : 'text-slate-600 hover:text-accent-amber/60'}/>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Comment (optional)</label>
            <textarea value={comment} onChange={e => setComment(e.target.value)}
              className="input resize-none h-24" placeholder="Share your experience…"/>
          </div>
          {err && <div className="flex items-center gap-2 text-accent-rose text-sm"><AlertTriangle size={14}/>{err}</div>}
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary justify-center">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 btn-primary justify-center">
              {loading ? <Loader2 size={15} className="animate-spin"/> : <Star size={15}/>} Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Booking Card ──────────────────────────────────────────────────────────────
function BookingCard({ booking, tab, onCancelled, onReviewed, onDisputed }) {
  const navigate = useNavigate();
  const [cancelling,   setCancelling]   = useState(false);
  const [showDispute,  setShowDispute]  = useState(false);
  const [showReview,   setShowReview]   = useState(false);
  const [disputeOk,    setDisputeOk]    = useState(booking.has_dispute);
  const [reviewOk,     setReviewOk]     = useState(booking.has_review);

  const now        = new Date();
  const eventDate  = new Date(booking.event_date);
  const hoursLeft  = (eventDate - now) / (1000 * 60 * 60);
  const canCancel  = tab === 'Upcoming' && hoursLeft > 48 && booking.status !== 'Cancelled';
  const canReview  = tab === 'Past' && !reviewOk;

  const handleCancel = async () => {
    if (!window.confirm('Cancel this booking?')) return;
    setCancelling(true);
    try {
      await customerAPI.cancelBooking(booking.id);
      onCancelled();
    } catch (e) {
      alert(e.response?.data?.message || 'Cannot cancel this booking.');
    } finally { setCancelling(false); }
  };

  return (
    <>
      <div className="card p-5 hover:border-brand-500/30 transition-all duration-200">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          {/* Image + Info */}
          <div className="flex gap-4">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-surface-600 shrink-0">
              {booking.venue_image
                ? <img src={booking.venue_image} className="w-full h-full object-cover" alt=""/>
                : <div className="w-full h-full flex items-center justify-center"><MapPin size={20} className="text-slate-600"/></div>}
            </div>
            <div className="min-w-0">
              <p className="text-white font-bold truncate">{booking.venue_name}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-slate-400 text-xs">
                <span className="flex items-center gap-1"><MapPin size={11}/> {booking.location}</span>
                <span className="flex items-center gap-1"><CalendarDays size={11}/> {fmtDate(booking.event_date)}</span>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {statusBadge(booking.status)}
                {payBadge(booking.payment_status)}
              </div>
            </div>
          </div>

          {/* Amount + Actions */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="flex items-center gap-1 text-accent-emerald font-extrabold text-lg">
              <IndianRupee size={15}/>{Number(booking.amount).toLocaleString('en-IN')}
            </div>
            <p className="text-slate-500 text-xs">Booked {fmtDate(booking.booked_on)}</p>

            <div className="flex flex-wrap gap-2 mt-1">
              {canCancel && (
                <button onClick={handleCancel} disabled={cancelling}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-accent-rose border border-accent-rose/30 hover:bg-accent-rose/10 text-xs font-medium transition-all">
                  {cancelling ? <Loader2 size={12} className="animate-spin"/> : <XCircle size={12}/>} Cancel
                </button>
              )}
              {canReview && (
                <button onClick={() => setShowReview(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-accent-amber border border-accent-amber/30 hover:bg-accent-amber/10 text-xs font-medium transition-all">
                  <Star size={12}/> Write Review
                </button>
              )}
              {reviewOk && (
                <span className="flex items-center gap-1 text-accent-emerald text-xs"><CheckCircle size={12}/> Reviewed</span>
              )}
              {!disputeOk && tab !== 'Cancelled' && (
                <button onClick={() => setShowDispute(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-400 border border-white/10 hover:border-accent-rose/30 hover:text-accent-rose text-xs font-medium transition-all">
                  <MessageSquareWarning size={12}/> Dispute
                </button>
              )}
              {disputeOk && (
                <span className="flex items-center gap-1 text-slate-500 text-xs"><MessageSquareWarning size={12}/> Dispute raised</span>
              )}
            </div>

            {tab === 'Cancelled' && booking.payment_status === 'Refunded' && (
              <span className="text-accent-violet text-xs flex items-center gap-1"><CheckCircle size={11}/> Refund initiated</span>
            )}
          </div>
        </div>

        {/* Booking ID */}
        <div className="mt-3 pt-3 border-t border-white/5 text-slate-600 text-xs font-mono">
          ID: {booking.id}
        </div>
      </div>

      {showDispute && (
        <DisputeModal
          booking={booking}
          onClose={() => setShowDispute(false)}
          onSubmitted={() => { setDisputeOk(true); onDisputed?.(); }}
        />
      )}
      {showReview && (
        <ReviewModal
          booking={booking}
          onClose={() => setShowReview(false)}
          onSubmitted={() => { setReviewOk(true); onReviewed?.(); }}
        />
      )}
    </>
  );
}

// ─── My Bookings Page ──────────────────────────────────────────────────────────
export default function MyBookingsPage() {
  const [tab,      setTab]      = useState('Upcoming');
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const navigate   = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await customerAPI.getBookings();
      setBookings(res.data.data || []);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const now = new Date();

  const filtered = bookings.filter(b => {
    const d = new Date(b.event_date);
    if (tab === 'Upcoming')  return b.status !== 'Cancelled' && d >= now;
    if (tab === 'Past')      return b.status !== 'Cancelled' && d < now;
    if (tab === 'Cancelled') return b.status === 'Cancelled';
    return true;
  });

  const emptyMessages = {
    Upcoming:  { text: 'No upcoming bookings',  cta: 'Explore Venues', href: '/venues' },
    Past:      { text: 'No past bookings',       cta: null },
    Cancelled: { text: 'No cancelled bookings',  cta: null },
  };

  return (
    <div className="min-h-screen bg-surface-900 py-8">
      <div className="max-w-3xl mx-auto px-4 space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white">My Bookings</h1>
          <p className="text-slate-400 text-sm mt-1">Track and manage all your venue bookings</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === t ? 'bg-brand-600 text-white shadow-glow-sm' : 'bg-surface-700 text-slate-400 hover:text-white'
              }`}>{t}</button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={32} className="animate-spin text-brand-400"/>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-20 gap-4 text-slate-500">
            <CalendarDays size={48} strokeWidth={1}/>
            <p className="text-lg font-semibold">{emptyMessages[tab]?.text}</p>
            {emptyMessages[tab]?.cta && (
              <button onClick={() => navigate(emptyMessages[tab].href)} className="btn-primary mt-2">
                {emptyMessages[tab].cta}
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(b => (
              <BookingCard
                key={b.id}
                booking={b}
                tab={tab}
                onCancelled={load}
                onReviewed={load}
                onDisputed={load}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
