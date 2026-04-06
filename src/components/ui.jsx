import React from 'react';
import { Loader2 } from 'lucide-react';

// ─── Loading Spinner ──────────────────────────────────────────
export const LoadingSpinner = ({ text = 'Loading...' }) => (
  <div className="flex flex-col items-center justify-center py-24 gap-4">
    <Loader2 size={40} className="text-brand-400 animate-spin" />
    <p className="text-slate-400 text-sm animate-pulse">{text}</p>
  </div>
);

// ─── Error Message ────────────────────────────────────────────
export const ErrorMessage = ({ message, onRetry }) => (
  <div className="flex flex-col items-center justify-center py-20 gap-4">
    <div className="w-16 h-16 rounded-full bg-accent-rose/20 flex items-center justify-center">
      <span className="text-accent-rose text-2xl">✕</span>
    </div>
    <p className="text-slate-300 font-medium">{message || 'Something went wrong'}</p>
    {onRetry && (
      <button onClick={onRetry} className="btn-primary mt-2">Try Again</button>
    )}
  </div>
);

// ─── Empty State ──────────────────────────────────────────────
export const EmptyState = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
    <div className="w-20 h-20 rounded-full bg-surface-700 flex items-center justify-center opacity-60">
      {icon}
    </div>
    <div>
      <h3 className="text-white font-semibold text-lg mb-1">{title}</h3>
      {description && <p className="text-slate-400 text-sm max-w-sm">{description}</p>}
    </div>
    {action && <div className="mt-2">{action}</div>}
  </div>
);

// ─── Status Badge ─────────────────────────────────────────────
export const StatusBadge = ({ status }) => {
  const map = {
    Completed:  'badge-green',
    Confirmed:  'badge-green',
    Success:    'badge-green',
    Active:     'badge-green',
    Pending:    'badge-amber',
    New:        'badge-amber',
    Cancelled:  'badge-red',
    Declined:   'badge-red',
    Refunded:   'badge-violet',
    'Refund Pending': 'badge-amber',
    Inactive:   'bg-surface-700 text-slate-400 text-xs font-bold px-2.5 py-1 rounded-full',
    Failed:     'badge-red',
  };
  return <span className={map[status] || 'badge-violet'}>{status}</span>;
};

// ─── Stat Card ────────────────────────────────────────────────
export const StatCard = ({ label, value, icon, color = 'brand', sub, subIcon }) => {
  const colors = {
    brand:   { border: 'border-l-brand-500',   bg: 'bg-brand-500/10',   text: 'text-brand-400',   glow: 'bg-brand-500/10' },
    cyan:    { border: 'border-l-accent-cyan',  bg: 'bg-accent-cyan/10', text: 'text-accent-cyan',  glow: 'bg-accent-cyan/10' },
    amber:   { border: 'border-l-accent-amber', bg: 'bg-accent-amber/10',text: 'text-accent-amber', glow: 'bg-accent-amber/10' },
    emerald: { border: 'border-l-accent-emerald',bg:'bg-accent-emerald/10',text:'text-accent-emerald',glow:'bg-accent-emerald/10'},
  };
  const c = colors[color] || colors.brand;
  return (
    <div className={`card p-6 glass border-l-4 ${c.border} relative overflow-hidden`}>
      <div className={`absolute top-0 right-0 w-32 h-32 ${c.glow} rounded-full blur-[40px]`} />
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div>
          <p className="text-slate-400 text-sm font-medium mb-1">{label}</p>
          <h3 className="text-3xl font-bold text-white">{value}</h3>
        </div>
        <div className={`w-12 h-12 rounded-xl ${c.bg} flex items-center justify-center`}>
          <span className={c.text}>{icon}</span>
        </div>
      </div>
      {sub && (
        <div className="flex items-center gap-2 text-sm text-accent-emerald relative z-10">
          {subIcon}
          <span>{sub}</span>
        </div>
      )}
    </div>
  );
};
