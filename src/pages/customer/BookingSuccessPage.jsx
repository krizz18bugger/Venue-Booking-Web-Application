import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, CalendarDays, MapPin, IndianRupee, Home, List } from 'lucide-react';

export default function BookingSuccessPage() {
  const navigate  = useNavigate();
  const { state } = useLocation();

  const booking = state?.booking;
  const venue   = state?.venue;
  const date    = state?.date;
  const method  = state?.method;

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' }) : '—';

  if (!booking) {
    navigate('/venues');
    return null;
  }

  return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 animate-fade-in">
        {/* Success Icon */}
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-accent-emerald/20 border-2 border-accent-emerald/40 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={40} className="text-accent-emerald"/>
          </div>
          <h1 className="text-2xl font-extrabold text-white">Booking Confirmed!</h1>
          <p className="text-slate-400 text-sm mt-1">
            {method === 'online'
              ? 'Your payment was successful and booking is confirmed.'
              : 'Your booking is placed. Please pay at the venue.'}
          </p>
        </div>

        {/* Booking Card */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Booking ID</span>
            <span className="text-xs text-slate-300 font-mono bg-surface-700 px-2 py-1 rounded-lg">
              {String(booking.id).slice(0, 16)}…
            </span>
          </div>

          {[
            { icon: MapPin,         label: 'Venue',         value: venue?.name || '—' },
            { icon: MapPin,         label: 'Location',      value: venue?.location || '—' },
            { icon: CalendarDays,   label: 'Event Date',    value: fmtDate(date || booking.date) },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3 py-2 border-b border-white/5">
              <Icon size={16} className="text-slate-500 shrink-0"/>
              <span className="text-slate-400 text-sm flex-1">{label}</span>
              <span className="text-white text-sm font-medium text-right max-w-[180px]">{value}</span>
            </div>
          ))}

          <div className="flex items-center gap-3 py-2 border-b border-white/5">
            <IndianRupee size={16} className="text-slate-500 shrink-0"/>
            <span className="text-slate-400 text-sm flex-1">Amount</span>
            <span className="text-accent-emerald text-base font-extrabold">
              ₹{Number(booking.amount || venue?.price || 0).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-slate-400 text-sm">Payment Status</span>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${
              method === 'online'
                ? 'bg-accent-emerald/20 text-accent-emerald border border-accent-emerald/30'
                : 'bg-accent-amber/20 text-accent-amber border border-accent-amber/30'
            }`}>
              {method === 'online' ? '✓ Paid' : '⏳ Pending'}
            </span>
          </div>
        </div>

        {/* Info box for cash */}
        {method !== 'online' && (
          <div className="p-4 rounded-xl bg-accent-amber/5 border border-accent-amber/20 text-sm text-slate-400">
            <p className="text-accent-amber font-semibold mb-1">Reminder</p>
            Please arrive early and make payment at the venue to confirm your slot.
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => navigate('/my-bookings')} className="btn-secondary justify-center py-3">
            <List size={16}/> My Bookings
          </button>
          <button onClick={() => navigate('/venues')} className="btn-primary justify-center py-3">
            <Home size={16}/> Explore More
          </button>
        </div>
      </div>
    </div>
  );
}
