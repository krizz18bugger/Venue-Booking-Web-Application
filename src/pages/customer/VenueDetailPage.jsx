import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MapPin, Users, IndianRupee, Star, ChevronLeft, ChevronRight,
  CalendarDays, Wifi, Car, Utensils, Music, Thermometer, Loader2,
  Send, AlertTriangle,
} from 'lucide-react';
import { customerAPI, reviewsAPI } from '../../services/api';
import { useApp } from '../../context/AppContext';

const AMENITY_ICONS = {
  Parking:       <Car size={14}/>,
  AC:            <Thermometer size={14}/>,
  Catering:      <Utensils size={14}/>,
  'Sound System':<Music size={14}/>,
  WiFi:          <Wifi size={14}/>,
};

const StarPicker = ({ value, onChange }) => (
  <div className="flex gap-1">
    {[1,2,3,4,5].map(i => (
      <button key={i} type="button" onClick={() => onChange(i)}>
        <Star size={22} className={i <= value ? 'text-accent-amber fill-accent-amber' : 'text-slate-600 hover:text-accent-amber/60'} />
      </button>
    ))}
  </div>
);

const StarRow = ({ rating, size = 14 }) => (
  <div className="flex gap-0.5">
    {[1,2,3,4,5].map(i => (
      <Star key={i} size={size} className={i <= Math.round(rating||0) ? 'text-accent-amber fill-accent-amber' : 'text-slate-600'}/>
    ))}
  </div>
);

export default function VenueDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useApp();

  const [venue,    setVenue]    = useState(null);
  const [reviews,  setReviews]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [imgIdx,   setImgIdx]   = useState(0);
  const [selDate,  setSelDate]  = useState('');
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewTotal, setReviewTotal] = useState(0);

  // Review form
  const [myRating,  setMyRating]  = useState(0);
  const [myComment, setMyComment] = useState('');
  const [submitting,setSubmitting]= useState(false);
  const [reviewErr, setReviewErr] = useState('');
  const [reviewOk,  setReviewOk]  = useState(false);

  const REVIEWS_PER_PAGE = 5;

  const loadVenue = useCallback(async () => {
    try {
      const res = await customerAPI.getVenueById(id);
      setVenue(res.data.data);
    } catch { navigate('/venues'); }
    finally { setLoading(false); }
  }, [id]);

  const loadReviews = useCallback(async (p = 1) => {
    try {
      const res = await reviewsAPI.getReviews(id, { page: p, limit: REVIEWS_PER_PAGE });
      setReviews(res.data.data || []);
      setReviewTotal(res.data.total || 0);
    } catch {}
  }, [id]);

  useEffect(() => { loadVenue(); loadReviews(1); }, [loadVenue, loadReviews]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!myRating) { setReviewErr('Please select a rating.'); return; }
    setSubmitting(true); setReviewErr('');
    try {
      await reviewsAPI.submitReview(id, { rating: myRating, comment: myComment });
      setReviewOk(true);
      setMyRating(0); setMyComment('');
      await loadReviews(1);
    } catch (err) {
      setReviewErr(err.response?.data?.message || 'Failed to submit review.');
    } finally { setSubmitting(false); }
  };

  const today = new Date().toISOString().split('T')[0];
  const bookedSet = new Set((venue?.bookedDates || []).map(d => typeof d === 'string' ? d.slice(0,10) : new Date(d).toISOString().slice(0,10)));

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-surface-900">
      <Loader2 size={36} className="animate-spin text-brand-400"/>
    </div>
  );

  if (!venue) return null;

  const images = venue.images?.length ? venue.images : [{ image_url: null, is_primary: true }];
  const amenities = Array.isArray(venue.features) ? venue.features : [];
  const capacity  = venue.capacity?.seating ?? null;

  const revPages = Math.ceil(reviewTotal / REVIEWS_PER_PAGE);

  return (
    <div className="min-h-screen bg-surface-900 text-white">
      {/* Back */}
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <button onClick={() => navigate('/venues')} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-4 transition-colors">
          <ChevronLeft size={16}/> Back to Venues
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-12 grid grid-cols-1 xl:grid-cols-3 gap-8">

        {/* LEFT: Main Content */}
        <div className="xl:col-span-2 space-y-6">
          {/* Gallery */}
          <div className="relative rounded-2xl overflow-hidden h-72 sm:h-96 bg-surface-700 group">
            {images[imgIdx]?.image_url ? (
              <img src={images[imgIdx].image_url} alt={venue.name} className="w-full h-full object-cover"/>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <MapPin size={48} className="text-slate-600"/>
              </div>
            )}
            {images.length > 1 && (
              <>
                <button onClick={() => setImgIdx(p => (p - 1 + images.length) % images.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors opacity-0 group-hover:opacity-100">
                  <ChevronLeft size={18}/>
                </button>
                <button onClick={() => setImgIdx(p => (p + 1) % images.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors opacity-0 group-hover:opacity-100">
                  <ChevronRight size={18}/>
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {images.map((_, i) => (
                    <button key={i} onClick={() => setImgIdx(i)}
                      className={`w-2 h-2 rounded-full transition-all ${i === imgIdx ? 'bg-white w-4' : 'bg-white/40'}`}/>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button key={i} onClick={() => setImgIdx(i)}
                  className={`w-16 h-16 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${i === imgIdx ? 'border-brand-500' : 'border-transparent'}`}>
                  {img.image_url
                    ? <img src={img.image_url} className="w-full h-full object-cover" alt=""/>
                    : <div className="w-full h-full bg-surface-600"/>}
                </button>
              ))}
            </div>
          )}

          {/* Title + Meta */}
          <div>
            <h1 className="text-2xl font-extrabold">{venue.name}</h1>
            <div className="flex flex-wrap gap-4 mt-2 text-slate-400 text-sm">
              <span className="flex items-center gap-1.5"><MapPin size={14}/>{venue.location}</span>
              {capacity && <span className="flex items-center gap-1.5"><Users size={14}/>{capacity} guests</span>}
              {venue.avg_rating && (
                <span className="flex items-center gap-1.5">
                  <StarRow rating={venue.avg_rating} size={13}/>
                  <span className="text-white font-semibold">{Number(venue.avg_rating).toFixed(1)}</span>
                  <span>({venue.review_count} reviews)</span>
                </span>
              )}
            </div>
          </div>

          {/* Amenities */}
          {amenities.length > 0 && (
            <div className="card p-5">
              <h2 className="text-lg font-bold mb-3">Facilities & Amenities</h2>
              <div className="flex flex-wrap gap-2">
                {amenities.map(a => (
                  <span key={a} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600/10 border border-brand-500/20 text-brand-300 text-sm">
                    {AMENITY_ICONS[a] || null} {a}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Rules */}
          {(venue.rules || venue.payment_rules) && (
            <div className="card p-5 space-y-3">
              {venue.rules && (
                <div>
                  <h2 className="text-lg font-bold mb-1">Rules & Policies</h2>
                  <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-line">
                    {Array.isArray(venue.rules) ? venue.rules.join('\n') : venue.rules}
                  </p>
                </div>
              )}
              {venue.payment_rules && (
                <div>
                  <h2 className="text-base font-semibold mb-1">Payment Policy</h2>
                  <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-line">
                    {venue.payment_rules.advance ? `Advance Payment: ${venue.payment_rules.advance}%\n` : ''}
                    {venue.payment_rules.cancellation_policy ? `Cancellation Policy: ${venue.payment_rules.cancellation_policy}` : ''}
                    {typeof venue.payment_rules === 'string' && venue.payment_rules}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Reviews */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Customer Reviews ({reviewTotal})</h2>
            </div>

            {reviews.length === 0 ? (
              <div className="card p-6 text-center text-slate-500">No reviews yet. Be the first!</div>
            ) : (
              <>
                <div className="space-y-3">
                  {reviews.map(r => (
                    <div key={r.id} className="card p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-300 font-bold text-sm shrink-0">
                            {r.reviewer_name?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="text-white font-semibold text-sm">{r.reviewer_name}</p>
                            <p className="text-slate-500 text-xs">{new Date(r.created_at).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}</p>
                          </div>
                        </div>
                        <StarRow rating={r.rating} size={13}/>
                      </div>
                      {r.comment && <p className="text-slate-300 text-sm mt-3 leading-relaxed">{r.comment}</p>}
                    </div>
                  ))}
                </div>
                {revPages > 1 && (
                  <div className="flex gap-2 justify-center">
                    <button onClick={() => { setReviewPage(p=>Math.max(1,p-1)); loadReviews(reviewPage-1); }} disabled={reviewPage===1} className="btn-secondary text-xs px-3 py-1.5">Prev</button>
                    <span className="text-slate-400 text-sm self-center">Page {reviewPage} of {revPages}</span>
                    <button onClick={() => { setReviewPage(p=>Math.min(revPages,p+1)); loadReviews(reviewPage+1); }} disabled={reviewPage===revPages} className="btn-secondary text-xs px-3 py-1.5">Load More</button>
                  </div>
                )}
              </>
            )}

            {/* Write Review */}
            {user?.role === 'customer' && !reviewOk && (
              <div className="card p-5">
                <h3 className="text-base font-bold mb-4">Write a Review</h3>
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div>
                    <label className="label">Your Rating</label>
                    <StarPicker value={myRating} onChange={setMyRating}/>
                  </div>
                  <div>
                    <label className="label">Comment (optional)</label>
                    <textarea value={myComment} onChange={e => setMyComment(e.target.value)}
                      className="input resize-none h-24" placeholder="Share your experience…"/>
                  </div>
                  {reviewErr && (
                    <div className="flex items-center gap-2 text-accent-rose text-sm">
                      <AlertTriangle size={14}/>{reviewErr}
                    </div>
                  )}
                  <button type="submit" disabled={submitting} className="btn-primary">
                    {submitting ? <Loader2 size={15} className="animate-spin"/> : <Send size={15}/>}
                    Submit Review
                  </button>
                </form>
              </div>
            )}
            {reviewOk && (
              <div className="card p-4 flex items-center gap-2 text-accent-emerald border-accent-emerald/30">
                ✓ Review submitted successfully!
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Booking Panel */}
        <div className="xl:col-span-1">
          <div className="card p-5 sticky top-24 space-y-5">
            <div>
              <p className="text-slate-400 text-sm">Price per day</p>
              <div className="flex items-baseline gap-1 mt-1">
                <IndianRupee size={20} className="text-accent-emerald mb-1"/>
                <span className="text-3xl font-extrabold text-accent-emerald">
                  {Number(venue.price).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div>
              <label className="label">Select Event Date</label>
              <input type="date" min={today} value={selDate}
                onChange={e => setSelDate(e.target.value)}
                className="input"
              />
              {selDate && bookedSet.has(selDate) && (
                <p className="text-accent-rose text-xs mt-1.5 flex items-center gap-1">
                  <AlertTriangle size={12}/> This date is already booked
                </p>
              )}
              {selDate && !bookedSet.has(selDate) && (
                <p className="text-accent-emerald text-xs mt-1.5">✓ Available on this date</p>
              )}
            </div>

            {selDate && (
              <div className="p-3 rounded-xl bg-surface-700/50 border border-white/5 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Venue</span>
                  <span className="text-white font-medium truncate max-w-[140px]">{venue.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Date</span>
                  <span className="text-white">{new Date(selDate).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}</span>
                </div>
                <div className="flex justify-between border-t border-white/10 pt-1.5 mt-1.5">
                  <span className="text-slate-300 font-semibold">Total</span>
                  <span className="text-accent-emerald font-bold">₹{Number(venue.price).toLocaleString('en-IN')}</span>
                </div>
              </div>
            )}

            {user?.role === 'customer' ? (
              <button
                disabled={!selDate || bookedSet.has(selDate)}
                onClick={() => navigate(`/booking/confirm/${venue.id}`, { state: { venue, date: selDate } })}
                className="btn-primary w-full justify-center py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed">
                <CalendarDays size={17}/> Proceed to Book
              </button>
            ) : (
              <button onClick={() => navigate('/auth')} className="btn-primary w-full justify-center py-3">
                Login to Book
              </button>
            )}

            <div className="text-xs text-slate-500 text-center">
              No charge until confirmed. Free cancellation 48h before event.
            </div>

            {/* Owner info */}
            <div className="pt-3 border-t border-white/5 text-sm">
              <p className="text-slate-500 text-xs mb-1">Managed by</p>
              <p className="text-white font-semibold">{venue.owner_name}</p>
              {venue.owner_phone && <p className="text-slate-400 text-xs">{venue.owner_phone}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
