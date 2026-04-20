import React, { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  MapPin, CalendarDays, IndianRupee, User, Mail, Phone,
  CreditCard, Banknote, CheckSquare, Loader2, AlertTriangle, ChevronLeft,
} from 'lucide-react';
import { customerAPI } from '../../services/api';
import { useApp } from '../../context/AppContext';

export default function BookingConfirmPage() {
  const { venueId } = useParams();
  const navigate    = useNavigate();
  const { state }   = useLocation();
  const { profile } = useApp();

  const venue = state?.venue;
  const date  = state?.date;

  const [name,      setName]      = useState(profile?.name  || '');
  const [email,     setEmail]     = useState(profile?.email || '');
  const [phone,     setPhone]     = useState(profile?.phone || '');
  const [eventType, setEventType] = useState('');
  const [guests,    setGuests]    = useState('');
  const [special,   setSpecial]   = useState('');
  const [method,    setMethod]    = useState('online');
  const [agreed,    setAgreed]    = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');

  if (!venue || !date) {
    navigate('/venues');
    return null;
  }

  const handleConfirm = async (e) => {
    e.preventDefault();
    if (!agreed) { setError('Please accept the terms and conditions.'); return; }
    setLoading(true); setError('');
    try {
      const res = await customerAPI.createBooking({
        hall_id: venue.id,
        date,
        event_type:      eventType || null,
        guest_count:     guests ? parseInt(guests) : null,
        special_requests: special || null,
        payment_method:  method,
      });
      navigate('/booking/success', { state: { booking: res.data.data, venue, date, method } });
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed. Please try again.');
    } finally { setLoading(false); }
  };

  const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

  return (
    <div className="min-h-screen bg-surface-900 py-8">
      <div className="max-w-2xl mx-auto px-4 space-y-6">
        {/* Header */}
        <div>
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-4 transition-colors">
            <ChevronLeft size={16}/> Back
          </button>
          <h1 className="text-2xl font-extrabold text-white">Confirm Booking</h1>
          <p className="text-slate-400 text-sm mt-1">Review your booking details before confirming</p>
        </div>

        {/* Venue Summary */}
        <div className="card overflow-hidden">
          {venue.primary_image && (
            <div className="w-full h-40 bg-surface-600 relative">
              <img src={venue.primary_image} alt={venue.name} className="w-full h-full object-cover"/>
              <div className="absolute inset-0 bg-gradient-to-t from-surface-800 to-transparent"/>
            </div>
          )}
          <div className="p-5">
            <h2 className="text-base font-bold text-white mb-4">Booking Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 flex items-center gap-2"><MapPin size={14}/> Venue</span>
                <span className="text-white font-semibold">{venue.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 flex items-center gap-2"><MapPin size={14}/> Location</span>
                <span className="text-white">{venue.location}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 flex items-center gap-2"><CalendarDays size={14}/> Event Date</span>
                <span className="text-white font-semibold">{fmtDate(date)}</span>
              </div>
              <div className="flex justify-between items-center border-t border-white/10 pt-3 mt-2">
                <span className="text-white font-semibold">Total Amount</span>
                <span className="text-accent-emerald font-extrabold text-lg flex items-center gap-1">
                  <IndianRupee size={16}/>{Number(venue.price).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleConfirm} className="card p-6 space-y-5">
          <h2 className="text-base font-bold text-white">Your Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name</label>
              <div className="relative">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/>
                <input value={name} onChange={e => setName(e.target.value)} required
                  className="input pl-9" placeholder="Your name"/>
              </div>
            </div>
            <div>
              <label className="label">Phone</label>
              <div className="relative">
                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/>
                <input value={phone} onChange={e => setPhone(e.target.value)} required
                  className="input pl-9" placeholder="+91 9876543210"/>
              </div>
            </div>
          </div>
          <div>
            <label className="label">Email</label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/>
              <input value={email} readOnly className="input pl-9 opacity-60 cursor-not-allowed"/>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Event Type</label>
              <select value={eventType} onChange={e => setEventType(e.target.value)} className="input">
                <option value="">Select type</option>
                {['Wedding','Birthday','Corporate','Reception','Conference','Other'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Guest Count</label>
              <input type="number" min="1" value={guests} onChange={e => setGuests(e.target.value)}
                className="input" placeholder="e.g. 200"/>
            </div>
          </div>
          <div>
            <label className="label">Special Requests (optional)</label>
            <textarea value={special} onChange={e => setSpecial(e.target.value)}
              className="input resize-none h-20" placeholder="Any special arrangements…"/>
          </div>

          {/* Payment Method */}
          <div>
            <label className="label">Payment Method</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'online', label: 'Online Payment', icon: CreditCard, sub: 'Pay now — instant confirmation' },
                { key: 'cash',   label: 'Pay at Venue',   icon: Banknote,   sub: 'Pay later — pending confirmation' },
              ].map(({ key, label, icon: Icon, sub }) => (
                <button key={key} type="button" onClick={() => setMethod(key)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    method === key
                      ? 'bg-brand-600/20 border-brand-500/50 text-brand-300'
                      : 'bg-surface-700/50 border-white/10 text-slate-400 hover:border-white/20'
                  }`}>
                  <Icon size={20} className="mb-2"/>
                  <p className="font-semibold text-sm">{label}</p>
                  <p className="text-xs mt-0.5 opacity-70">{sub}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Online payment mock */}
          {method === 'online' && (
            <div className="p-4 rounded-xl bg-accent-emerald/5 border border-accent-emerald/20 text-sm">
              <p className="text-accent-emerald font-semibold mb-1">💳 Secure Payment (Demo)</p>
              <p className="text-slate-400">Clicking "Confirm Booking" will simulate a successful online payment of <strong className="text-white">₹{Number(venue.price).toLocaleString('en-IN')}</strong>.</p>
            </div>
          )}

          {/* T&C */}
          <label className="flex items-start gap-3 cursor-pointer">
            <div className="relative mt-0.5">
              <input type="checkbox" className="sr-only" checked={agreed} onChange={e => setAgreed(e.target.checked)}/>
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${agreed ? 'bg-brand-600 border-brand-600' : 'border-white/20 bg-surface-600'}`}>
                {agreed && <CheckSquare size={12} className="text-white fill-white"/>}
              </div>
            </div>
            <span className="text-slate-400 text-sm leading-relaxed">
              I agree to the <span className="text-brand-400 underline cursor-pointer">Terms & Conditions</span> and <span className="text-brand-400 underline cursor-pointer">Cancellation Policy</span>
            </span>
          </label>

          {error && (
            <div className="flex items-center gap-2 text-accent-rose text-sm">
              <AlertTriangle size={14}/>{error}
            </div>
          )}

          <button type="submit" disabled={loading || !agreed} className="btn-primary w-full justify-center py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? <Loader2 size={16} className="animate-spin"/> : <CreditCard size={16}/>}
            {method === 'online' ? `Pay ₹${Number(venue.price).toLocaleString('en-IN')} & Confirm` : 'Confirm Booking'}
          </button>
        </form>
      </div>
    </div>
  );
}
