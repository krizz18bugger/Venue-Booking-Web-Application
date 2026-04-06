import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, MapPin, Users, Star, CheckCircle2, ImageIcon, Loader2 } from 'lucide-react';
import { hallsAPI } from '../services/api';
import { LoadingSpinner, ErrorMessage, StatusBadge } from '../components/ui';

const HallDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [hall, setHall]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [imgIdx, setImgIdx]   = useState(0);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await hallsAPI.getById(id);
        setHall(res.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load hall details');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  if (loading) return <LoadingSpinner text="Loading hall details..." />;
  if (error)   return <ErrorMessage message={error} onRetry={() => window.location.reload()} />;
  if (!hall)   return null;

  const images = hall.images?.length > 0
    ? hall.images
    : [{ image_url: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800' }];

  const features = Array.isArray(hall.features) ? hall.features : [];
  const rules    = Array.isArray(hall.rules)    ? hall.rules    : [];
  const capacity = hall.capacity || {};
  const payRules = hall.payment_rules || {};

  return (
    <div className="animate-fade-in pb-10">
      <button onClick={() => navigate('/halls')}
        className="flex items-center gap-2 text-brand-400 hover:text-brand-300 font-medium mb-6 hover:-translate-x-1 transition-transform">
        <ArrowLeft size={20} /> Back to Halls
      </button>

      {/* Hero */}
      <div className="card glass overflow-hidden mb-8 relative">
        <div className="h-64 md:h-96 relative">
          <img
            src={images[imgIdx]?.image_url}
            alt={hall.name}
            className="w-full h-full object-cover opacity-70 transition-opacity duration-500"
            onError={e => { e.target.src = 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800'; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface-800 via-surface-800/40 to-transparent" />

          {/* Image switcher thumbnails */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-8 flex gap-2 z-20">
              {images.map((_, i) => (
                <button key={i} onClick={() => setImgIdx(i)}
                  className={`w-2 h-2 rounded-full transition-all ${i === imgIdx ? 'bg-white scale-125' : 'bg-white/40 hover:bg-white/70'}`} />
              ))}
            </div>
          )}

          <div className="absolute bottom-0 left-0 p-8 w-full flex justify-between items-end z-10">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <StatusBadge status={hall.status} />
                <span className="flex items-center gap-1 bg-surface-900/50 px-2 py-0.5 rounded-full border border-white/10 text-xs text-white">
                  <Star size={12} className="text-accent-amber fill-accent-amber" /> {hall.rating || 'New'}
                </span>
              </div>
              <h1 className="text-4xl font-extrabold text-white mb-2">{hall.name}</h1>
              <div className="flex items-center gap-2 text-slate-300">
                <MapPin size={18} className="text-brand-400" /> {hall.location}
              </div>
              {hall.address && <p className="text-slate-400 text-sm mt-1">{hall.address}</p>}
            </div>
            <button className="btn-primary" onClick={() => navigate('/halls')}>
              <Edit2 size={18} /> Edit Hall
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Main */}
        <div className="lg:col-span-2 space-y-8">

          {/* Capacity specs */}
          <div className="card p-8 glass">
            <h2 className="section-title mb-6 border-b border-white/5 pb-4">Capacity</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {[
                { label: 'Seating', value: capacity.seating, icon: <Users size={24} />, color: 'text-brand-400' },
                { label: 'Dining',  value: capacity.dining,  icon: <Users size={24} />, color: 'text-accent-cyan' },
                { label: 'Standing',value: capacity.standing,icon: <Users size={24} />, color: 'text-accent-emerald' },
              ].map(s => (
                <div key={s.label} className="bg-surface-800/50 p-4 rounded-xl border border-white/5 text-center">
                  <div className={`mx-auto mb-2 ${s.color}`}>{s.icon}</div>
                  <div className="text-2xl font-bold text-white mb-1">{s.value || '—'}</div>
                  <div className="text-xs text-slate-400 uppercase tracking-widest">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Features */}
          {features.length > 0 && (
            <div className="card p-8 glass">
              <h2 className="section-title mb-6 border-b border-white/5 pb-4">Features & Amenities</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {features.map(f => (
                  <div key={f} className="flex items-center gap-3 text-slate-300">
                    <CheckCircle2 size={18} className="text-brand-400 flex-shrink-0" /> {f}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews */}
          {hall.reviews?.length > 0 && (
            <div className="card p-8 glass">
              <h2 className="section-title mb-6 border-b border-white/5 pb-4 flex items-center gap-2">
                <Star size={20} className="text-accent-amber fill-accent-amber" /> Reviews
              </h2>
              <div className="space-y-4">
                {hall.reviews.map(r => (
                  <div key={r.id} className="p-4 rounded-xl bg-surface-800/50 border border-white/5">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-brand flex items-center justify-center text-white text-sm font-bold">
                          {(r.user_name || 'U').charAt(0)}
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm">{r.user_name}</p>
                          <p className="text-xs text-slate-500">{new Date(r.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={13} className={i < r.rating ? 'text-accent-amber fill-accent-amber' : 'text-surface-600'} />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-slate-300 italic">"{r.comment}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Price card */}
          <div className="card p-8 glass bg-gradient-brand border-none relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-[30px]" />
            <h2 className="text-white/80 font-medium mb-1">Base Rental Price</h2>
            <div className="text-4xl font-extrabold text-white mb-4">
              ₹{Number(hall.price).toLocaleString()}
              <span className="text-lg font-normal text-white/70">/day</span>
            </div>
            {payRules.advance && (
              <div className="space-y-2 mt-4 text-sm text-white/90">
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <span>Advance Required</span>
                  <span className="font-bold">{payRules.advance}%</span>
                </div>
                {payRules.cancellation_policy && (
                  <p className="text-xs text-white/60 pt-1">{payRules.cancellation_policy}</p>
                )}
              </div>
            )}
          </div>

          {/* Rules */}
          {rules.length > 0 && (
            <div className="card p-6 glass">
              <h3 className="section-title mb-4">Rules & Policies</h3>
              <ul className="space-y-3 text-sm text-slate-300">
                {rules.map((rule, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-rose mt-1.5 flex-shrink-0" />
                    {rule}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Images gallery */}
          {images.length > 1 && (
            <div className="card p-4 glass">
              <h3 className="section-title mb-3 flex items-center gap-2">
                <ImageIcon size={16} /> Gallery
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setImgIdx(i)}
                    className={`overflow-hidden rounded-lg border-2 transition-all ${i === imgIdx ? 'border-brand-500' : 'border-transparent'}`}>
                    <img src={img.image_url} alt={`Gallery ${i + 1}`}
                      className="w-full h-20 object-cover hover:scale-105 transition-transform duration-300"
                      onError={e => { e.target.src = 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=200'; }} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HallDetailsPage;
