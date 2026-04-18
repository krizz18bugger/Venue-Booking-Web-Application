import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Search, MapPin, Users, IndianRupee, Star, SlidersHorizontal, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { customerAPI } from '../../services/api';

function useDebounce(v, d) {
  const [dv, setDv] = useState(v);
  useEffect(() => { const t = setTimeout(() => setDv(v), d); return () => clearTimeout(t); }, [v, d]);
  return dv;
}

const StarRow = ({ rating }) => {
  const r = Math.round(rating || 0);
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={12} className={i <= r ? 'text-accent-amber fill-accent-amber' : 'text-slate-600'}/>
      ))}
    </div>
  );
};

const SORT_OPTIONS = [
  { value: 'newest',     label: 'Newest First' },
  { value: 'price_asc',  label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'capacity',   label: 'Capacity' },
  { value: 'rating',     label: 'Top Rated' },
];

export default function VenuesPage() {
  const navigate = useNavigate();
  const [venues,   setVenues]   = useState([]);
  const [total,    setTotal]    = useState(0);
  const [cities,   setCities]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [search,        setSearch]        = useState('');
  const [city,          setCity]          = useState('');
  const [minPrice,      setMinPrice]      = useState(0);
  const [maxPrice,      setMaxPrice]      = useState(500000);
  const [minCapacity,   setMinCapacity]   = useState('');
  const [availableOn,   setAvailableOn]   = useState('');
  const [sortBy,        setSortBy]        = useState('newest');
  const [page,          setPage]          = useState(1);

  const dSearch = useDebounce(search, 400);
  const LIMIT = 12;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await customerAPI.getVenues({
        search: dSearch, city, minPrice, maxPrice,
        minCapacity: minCapacity || undefined,
        availableOn: availableOn || undefined,
        sortBy, page, limit: LIMIT,
      });
      setVenues(res.data.data);
      setTotal(res.data.pagination?.total || res.data.total || 0);
      if (res.data.cities?.length) setCities(res.data.cities);
    } catch {}
    finally { setLoading(false); }
  }, [dSearch, city, minPrice, maxPrice, minCapacity, availableOn, sortBy, page]);

  useEffect(() => { load(); }, [load]);

  const resetFilters = () => {
    setSearch(''); setCity(''); setMinPrice(0); setMaxPrice(500000);
    setMinCapacity(''); setAvailableOn(''); setSortBy('newest'); setPage(1);
  };

  const pages = Math.ceil(total / LIMIT);

  return (
    <div className="min-h-screen bg-surface-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-900/80 to-surface-900 border-b border-white/5 sticky top-0 z-20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[240px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/>
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="input pl-9 text-sm" placeholder="Search venues by name or location…"/>
          </div>
          <select value={city} onChange={e => { setCity(e.target.value); setPage(1); }} className="input w-40 text-sm">
            <option value="">All Cities</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={sortBy} onChange={e => { setSortBy(e.target.value); setPage(1); }} className="input w-44 text-sm">
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button onClick={() => setShowFilters(p => !p)}
            className={`btn-secondary text-sm ${showFilters ? 'border-brand-500/50 text-brand-300' : ''}`}>
            <SlidersHorizontal size={15}/> Filters
          </button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="max-w-7xl mx-auto px-4 pb-4">
            <div className="flex flex-wrap gap-4 items-end p-4 rounded-xl bg-surface-700/50 border border-white/5">
              <div className="min-w-[200px] flex-1">
                <label className="label">Budget Range (₹)</label>
                <div className="flex gap-2 items-center">
                  <input type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)}
                    className="input" placeholder="Min"/>
                  <span className="text-slate-500 text-sm">—</span>
                  <input type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)}
                    className="input" placeholder="Max"/>
                </div>
              </div>
              <div className="min-w-[140px]">
                <label className="label">Min Capacity</label>
                <input type="number" value={minCapacity} onChange={e => setMinCapacity(e.target.value)}
                  className="input" placeholder="e.g. 100"/>
              </div>
              <div className="min-w-[160px]">
                <label className="label">Available On</label>
                <input type="date" value={availableOn} onChange={e => setAvailableOn(e.target.value)}
                  className="input"/>
              </div>
              <button onClick={resetFilters} className="btn-secondary text-sm h-[38px] self-end">
                <X size={14}/> Reset
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-5">
          <p className="text-slate-400 text-sm">
            {loading ? 'Loading…' : `Showing ${Math.min((page-1)*LIMIT+1, total)}–${Math.min(page*LIMIT, total)} of ${total} venues`}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="card h-72 animate-pulse bg-surface-700"/>
            ))}
          </div>
        ) : venues.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-slate-500">
            <Search size={48} strokeWidth={1}/>
            <p className="text-lg font-semibold">No venues found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
            <button onClick={resetFilters} className="btn-secondary text-sm mt-2">Clear Filters</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {venues.map(v => (
              <div key={v.id} onClick={() => navigate(`/venues/${v.id}`)}
                className="card overflow-hidden cursor-pointer group hover:border-brand-500/40 hover:-translate-y-1 transition-all duration-200">
                {/* Image */}
                <div className="h-44 bg-surface-600 relative overflow-hidden">
                  {v.primary_image ? (
                    <img src={v.primary_image} alt={v.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <MapPin size={32} className="text-slate-600"/>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"/>
                  {v.avg_rating && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 rounded-full px-2 py-1 backdrop-blur-sm">
                      <Star size={11} className="text-accent-amber fill-accent-amber"/>
                      <span className="text-white text-xs font-semibold">{Number(v.avg_rating).toFixed(1)}</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="text-white font-bold text-sm mb-1 truncate group-hover:text-brand-300 transition-colors">{v.name}</h3>
                  <div className="flex items-center gap-1 text-slate-400 text-xs mb-2">
                    <MapPin size={11}/> <span className="truncate">{v.location}</span>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-1 text-slate-400 text-xs">
                      <Users size={11}/> {v.capacity?.seating ?? '—'} guests
                    </div>
                    <div className="flex items-center gap-1 text-accent-emerald font-bold text-sm">
                      <IndianRupee size={12}/>{Number(v.price).toLocaleString('en-IN')}
                      <span className="text-xs text-slate-500 font-normal">/day</span>
                    </div>
                  </div>
                  {v.review_count > 0 && (
                    <div className="flex items-center gap-2 mt-2">
                      <StarRow rating={v.avg_rating}/>
                      <span className="text-slate-500 text-xs">({v.review_count})</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-8">
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}
              className="btn-secondary px-3 py-2"><ChevronLeft size={16}/></button>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(pages, 7) }).map((_, i) => {
                const pg = i + 1;
                return (
                  <button key={pg} onClick={() => setPage(pg)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                      page === pg ? 'bg-brand-600 text-white' : 'bg-surface-700 text-slate-400 hover:text-white'
                    }`}>{pg}</button>
                );
              })}
            </div>
            <button onClick={() => setPage(p => Math.min(pages, p+1))} disabled={page===pages}
              className="btn-secondary px-3 py-2"><ChevronRight size={16}/></button>
          </div>
        )}
      </div>
    </div>
  );
}
