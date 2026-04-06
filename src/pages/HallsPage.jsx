import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Eye, MapPin, Users, Wind, Star, Calendar, Building2, Trash2 } from 'lucide-react';
import { hallsAPI } from '../services/api';
import { LoadingSpinner, ErrorMessage, EmptyState, StatusBadge } from '../components/ui';
import Modal from '../components/Modal';

// ─── Edit Hall Modal ──────────────────────────────────────────
const EditHallModal = ({ hall, onClose, onSaved }) => {
  const [form, setForm] = useState({
    name: hall.name || '',
    location: hall.location || '',
    address: hall.address || '',
    price: hall.price || '',
    status: hall.status || 'Active',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await hallsAPI.update(hall.id, form);
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update hall');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-accent-rose text-sm bg-accent-rose/10 p-3 rounded-lg">{error}</p>}
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-slate-300 mb-1">Hall Name</label>
          <input className="input w-full" value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Location</label>
          <input className="input w-full" value={form.location} onChange={e => setForm(p => ({...p, location: e.target.value}))} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Price / Day (₹)</label>
          <input type="number" className="input w-full" value={form.price} onChange={e => setForm(p => ({...p, price: e.target.value}))} required />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-slate-300 mb-1">Address</label>
          <input className="input w-full" value={form.address} onChange={e => setForm(p => ({...p, address: e.target.value}))} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Status</label>
          <select className="input w-full" value={form.status} onChange={e => setForm(p => ({...p, status: e.target.value}))}>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
      </div>
      <div className="flex gap-3 pt-4">
        <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
        <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
};

// ─── Availability Modal ───────────────────────────────────────
const AvailabilityModal = ({ hall, onClose }) => {
  const [selectedDates, setSelectedDates] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay();

  useEffect(() => {
    const fetchAvail = async () => {
      try {
        const res = await hallsAPI.getAvailability(hall.id);
        const fetched = {};
        if (res.data && res.data.data) {
          res.data.data.forEach(item => {
            // Postgres returns date as ISO string, e.g. "2025-12-10T00:00:00.000Z"
            fetched[item.date.slice(0, 10)] = item.status;
          });
        }
        setSelectedDates(fetched);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAvail();
  }, [hall.id]);

  const handleDayClick = (day) => {
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDates(prev => {
      const current = prev[dateStr];
      if (current === 'Blocked') {
        return { ...prev, [dateStr]: 'Available' };
      } else {
        return { ...prev, [dateStr]: 'Blocked' };
      }
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const dates = Object.entries(selectedDates).map(([date, status]) => ({ date, status }));
      await hallsAPI.updateAvailability(hall.id, dates);
      setSaved(true);
      setTimeout(onClose, 1200);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="flex justify-center p-8"><span className="text-brand-400 animate-pulse">Loading calendar...</span></div>
      ) : (
        <>
          <p className="text-slate-400 text-sm flex gap-3 items-center">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-accent-emerald shadow-[0_0_8px_rgba(16,185,129,0.5)] bg-opacity-50 border border-accent-emerald"></span> Available</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-accent-rose shadow-[0_0_8px_rgba(244,63,94,0.5)] bg-opacity-50 border border-accent-rose"></span> Occupied (Blocked)</span>
          </p>
          <div className="bg-surface-900/50 rounded-xl p-4">
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                <div key={d} className="text-center text-xs text-slate-500 font-medium py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {[...Array(firstDay)].map((_, i) => <div key={`e${i}`} />)}
              {[...Array(daysInMonth)].map((_, i) => {
                const day = i + 1;
                const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                
                // Visual default is Available (Green) if not explicitly blocked
                const status = selectedDates[dateStr] || 'Available'; 
                const isPast = day < today.getDate();
                
                return (
                  <button
                    key={day}
                    disabled={isPast}
                    onClick={() => handleDayClick(day)}
                    className={`aspect-square rounded-lg text-sm font-medium transition-all ${
                      isPast ? 'text-slate-700 cursor-not-allowed opacity-50 bg-black/20' :
                      status === 'Blocked' ? 'bg-accent-rose/30 text-accent-rose border border-accent-rose/50 shadow-[0_0_10px_rgba(244,63,94,0.2)]' :
                      'bg-accent-emerald/30 text-accent-emerald border border-accent-emerald/50 shadow-[0_0_10px_rgba(16,185,129,0.2)] hover:brightness-125'
                    }`}
                  >{day}</button>
                );
              })}
            </div>
          </div>
        </>
      )}
      {saved ? (
        <p className="text-accent-emerald text-center font-medium">✓ Availability saved!</p>
      ) : (
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
          <button onClick={handleSave} disabled={saving || Object.keys(selectedDates).length === 0} className="btn-primary flex-1 justify-center">
            {saving ? 'Saving...' : `Save ${Object.keys(selectedDates).length > 0 ? `(${Object.keys(selectedDates).length} dates)` : ''}`}
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Main HallsPage ───────────────────────────────────────────
const HallsPage = () => {
  const navigate = useNavigate();
  const [halls, setHalls] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingHall, setEditingHall] = useState(null);
  const [availHall, setAvailHall] = useState(null);

  const fetchHalls = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await hallsAPI.getAll();
      const hallData = res.data.data || [];
      setHalls(hallData);
      // Fetch reviews for the first hall
      if (hallData.length > 0) {
        try {
          const revRes = await hallsAPI.getReviews(hallData[0].id);
          setReviews(revRes.data.data || []);
        } catch (_) {}
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load halls');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHalls(); }, []);

  if (loading) return <LoadingSpinner text="Loading your venues..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchHalls} />;

  return (
    <div className="space-y-8 animate-fade-in relative z-10">
      {/* Header */}
      <div className="flex justify-between items-center bg-surface-800/50 p-6 rounded-2xl glass border border-white/5 shadow-card">
        <div>
          <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">Your Venues</h1>
          <p className="text-slate-400">{halls.length} hall{halls.length !== 1 ? 's' : ''} registered</p>
        </div>
        <button onClick={() => navigate('/halls/add')} className="btn-primary shadow-[0_0_20px_rgba(99,102,241,0.4)]">
          <Plus size={18} /> Add New Hall
        </button>
      </div>

      {/* Empty State */}
      {halls.length === 0 ? (
        <EmptyState
          icon={<Building2 size={36} className="text-slate-500" />}
          title="No Venues Yet"
          description="Add your first venue to start receiving bookings."
          action={
            <button onClick={() => navigate('/halls/add')} className="btn-primary">
              <Plus size={18} /> Add Your First Hall
            </button>
          }
        />
      ) : (
        <>
          {/* Hall Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {halls.map(hall => (
              <div key={hall.id} className="card group overflow-hidden flex flex-col hover:-translate-y-1 transition-transform duration-300">
                {/* Image */}
                <div className="h-48 bg-surface-600 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-surface-800 to-transparent z-10" />
                  <img
                    src={hall.primary_image || `https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600`}
                    alt={hall.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-70 group-hover:opacity-100"
                    onError={e => { e.target.src = 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600'; }}
                  />
                  <div className="absolute bottom-3 left-3 z-20">
                    <span className="badge-violet backdrop-blur-md bg-accent-violet/30 border-white/10 text-white">
                      ₹{Number(hall.price).toLocaleString()}/day
                    </span>
                  </div>
                  <div className="absolute top-3 right-3 z-20">
                    <StatusBadge status={hall.status} />
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-white truncate pr-2">{hall.name}</h3>
                    <div className="flex items-center gap-1 bg-surface-800 px-2 py-1 rounded-md border border-white/5 flex-shrink-0">
                      <Star size={14} className="text-accent-amber fill-accent-amber" />
                      <span className="text-xs font-bold text-white">{hall.rating || '—'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 text-sm mb-4">
                    <MapPin size={14} className="text-brand-400 flex-shrink-0" />
                    <span className="truncate">{hall.location}</span>
                  </div>
                  {hall.capacity && (
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="flex items-center gap-2 text-sm text-slate-300 bg-surface-800/50 p-2 rounded-lg border border-white/5">
                        <Users size={16} className="text-accent-cyan" />
                        <span>{hall.capacity?.seating || '—'} seats</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-300 bg-surface-800/50 p-2 rounded-lg border border-white/5">
                        <Wind size={16} className="text-accent-emerald" />
                        <span>{hall.features?.includes?.('Air Conditioning') ? 'AC' : 'Non-AC'}</span>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-auto flex flex-wrap gap-2 pt-4 border-t border-white/5">
                    <button className="flex-1 btn-secondary justify-center py-2" onClick={() => navigate(`/halls/${hall.id}`)}>
                      <Eye size={16} /> View
                    </button>
                    <button className="flex-1 btn-secondary justify-center py-2" onClick={() => setEditingHall(hall)}>
                      <Edit2 size={16} /> Edit
                    </button>
                    <button
                      className="w-full btn-secondary justify-center mt-2 border-brand-500/20 text-brand-400 hover:bg-brand-500/10"
                      onClick={() => setAvailHall(hall)}
                    >
                      <Calendar size={16} /> Update Availability
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Reviews */}
          {reviews.length > 0 && (
            <div className="mt-8">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Star className="text-accent-amber fill-accent-amber" /> Recent Reviews
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reviews.map(review => (
                  <div key={review.id} className="card p-6 glass relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-accent-amber/5 rounded-full blur-[50px] group-hover:bg-accent-amber/10 transition-colors" />
                    <div className="flex justify-between items-start mb-4 relative z-10">
                      <div className="flex gap-3 items-center">
                        <div className="w-10 h-10 rounded-full bg-surface-600 border border-white/10 flex items-center justify-center font-bold text-brand-300">
                          {(review.user_name || 'U').charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-white font-medium">{review.user_name}</h4>
                          <p className="text-xs text-slate-400">{new Date(review.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={14} className={i < review.rating ? 'text-accent-amber fill-accent-amber' : 'text-surface-600'} />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed relative z-10 italic">"{review.comment}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Edit Modal */}
      <Modal isOpen={!!editingHall} onClose={() => setEditingHall(null)} title="Edit Hall Details">
        {editingHall && <EditHallModal hall={editingHall} onClose={() => setEditingHall(null)} onSaved={fetchHalls} />}
      </Modal>

      {/* Availability Modal */}
      <Modal isOpen={!!availHall} onClose={() => setAvailHall(null)} title={`Availability — ${availHall?.name}`}>
        {availHall && <AvailabilityModal hall={availHall} onClose={() => setAvailHall(null)} />}
      </Modal>
    </div>
  );
};

export default HallsPage;
