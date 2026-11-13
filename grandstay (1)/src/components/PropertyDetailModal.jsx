import React, { useEffect, useState } from 'react';
import { X, Star, MapPin, Check, Heart } from 'lucide-react';
import { apiRequest } from '../utils/api.js';
import { formatINR, formatDateShort, resolveMediaUrl } from '../utils/propertyImages.js';

export default function PropertyDetailModal({
  propertySlug,
  searchParams,
  isSaved,
  onToggleSave,
  onClose,
  onReserveRoom,
  user,
}) {
  const [detail, setDetail] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [reviewForm, setReviewForm] = useState({
    authorName: user?.name || '',
    authorCity: '',
    stayType: 'Leisure Stay',
    rating: 5,
    title: '',
    comment: '',
  });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState('');

  useEffect(() => {
    if (!propertySlug) return;
    let active = true;
    setLoading(true);
    setError('');
    const qs = new URLSearchParams();
    if (searchParams?.checkIn) qs.set('checkIn', searchParams.checkIn);
    if (searchParams?.checkOut) qs.set('checkOut', searchParams.checkOut);

    apiRequest(`/api/properties/${propertySlug}?${qs.toString()}`)
      .then((data) => {
        if (!active) return;
        setDetail(data.property);
        setReviews(data.reviews || []);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [propertySlug, searchParams?.checkIn, searchParams?.checkOut]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!detail) return;
    setSubmittingReview(true);
    setReviewMessage('');
    try {
      const res = await apiRequest(`/api/properties/${detail.slug}/reviews`, {
        method: 'POST',
        body: JSON.stringify(reviewForm),
      });
      setReviews((prev) => [res.review, ...prev]);
      setDetail((prev) => ({
        ...prev,
        rating: res.propertyRating,
        reviewCount: res.reviewCount,
      }));
      setReviewForm({
        authorName: user?.name || '',
        authorCity: '',
        stayType: 'Leisure Stay',
        rating: 5,
        title: '',
        comment: '',
      });
      setReviewMessage('Thank you. Your verified review has been saved.');
    } catch (err) {
      setReviewMessage(err.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (!propertySlug) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#07111e]/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-modal-title"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs text-slate-500 truncate">
              {detail ? `${detail.destination} · ${detail.propertyType}` : 'Loading property'}
            </p>
            <h2
              id="detail-modal-title"
              className="font-display text-xl font-semibold text-[#0c1a2e] truncate"
            >
              {detail?.name || 'Property Details'}
            </h2>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {detail && (
              <button
                type="button"
                onClick={() => onToggleSave(detail._id)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-slate-200 rounded-lg hover:bg-slate-50 text-[#0c1a2e] cursor-pointer"
              >
                <Heart
                  size={14}
                  className={isSaved ? 'fill-[#dc2626] text-[#dc2626]' : 'text-slate-600'}
                />
                {isSaved ? 'Saved' : 'Save'}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close property details"
              className="p-2 rounded-lg text-slate-500 hover:text-[#0c1a2e] hover:bg-slate-100 cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {loading && (
          <div className="p-8 space-y-4">
            <div className="h-64 bg-slate-100 rounded-xl animate-pulse" />
            <div className="h-6 w-2/3 bg-slate-100 rounded animate-pulse" />
            <div className="h-24 bg-slate-100 rounded animate-pulse" />
          </div>
        )}

        {error && !loading && (
          <div className="p-8 text-center text-sm text-red-600">{error}</div>
        )}

        {detail && !loading && (
          <div className="p-6 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
              <div className="md:col-span-7 aspect-[4/3] rounded-xl overflow-hidden bg-slate-100">
                <img
                  src={resolveMediaUrl(detail.image)}
                  alt={detail.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="md:col-span-5 flex flex-col justify-between bg-slate-50 rounded-xl p-5 border border-slate-200">
                <div>
                  <div className="flex items-center gap-2 text-sm text-[#0c1a2e] font-semibold tabular-nums">
                    <Star size={15} className="fill-[#c59b27] text-[#c59b27]" />
                    <span>{detail.rating?.toFixed(1)}</span>
                    <span className="text-slate-400">·</span>
                    <span className="font-normal text-slate-600">
                      {detail.reviewCount} verified reviews
                    </span>
                  </div>
                  <p className="mt-2 flex items-start gap-1.5 text-sm text-slate-600">
                    <MapPin size={15} className="shrink-0 mt-0.5 text-[#a8811b]" />
                    <span>{detail.location}</span>
                  </p>
                  <p className="mt-4 text-sm text-slate-700 leading-relaxed">
                    {detail.description}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-200 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>Cancellation policy</span>
                    <span className="font-semibold text-[#0c1a2e]">
                      {detail.bookingConditions?.freeCancellation
                        ? 'Free up to 48h prior'
                        : 'Standard flexible'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Payment option</span>
                    <span className="font-semibold text-[#0c1a2e]">
                      {detail.bookingConditions?.payAtHotel
                        ? 'Pay at Hotel or Online'
                        : 'Online Reservation'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-display text-lg font-semibold text-[#0c1a2e] mb-3">
                Amenities &amp; Landmarks
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid grid-cols-2 gap-2.5 text-sm text-slate-700">
                  {detail.amenities?.map((am) => (
                    <div key={am} className="flex items-center gap-2">
                      <Check size={14} className="text-[#059669] shrink-0" />
                      <span>{am}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6 space-y-2">
                  {detail.nearbyLandmarks?.map((lm) => (
                    <div
                      key={lm.name}
                      className="flex items-center justify-between text-sm text-slate-700"
                    >
                      <span>{lm.name}</span>
                      <span className="text-xs text-slate-500 tabular-nums">
                        {lm.distanceKm} km
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <h3 className="font-display text-lg font-semibold text-[#0c1a2e]">
                  Select Room or Suite Category
                </h3>
                {searchParams?.checkIn && searchParams?.checkOut && (
                  <span className="text-xs text-slate-500 tabular-nums">
                    Live availability for {formatDateShort(searchParams.checkIn)} –{' '}
                    {formatDateShort(searchParams.checkOut)}
                  </span>
                )}
              </div>

              <div className="space-y-3">
                {detail.roomTypes?.map((room) => {
                  const soldOut = room.availableUnits === 0;
                  return (
                    <div
                      key={room.name}
                      className="p-4 rounded-xl border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h4 className="font-semibold text-[#0c1a2e]">{room.name}</h4>
                          <span className="text-xs text-slate-500 tabular-nums">
                            {room.sizeSqFt} sq ft · {room.bedType} · Max {room.maxGuests} guests
                          </span>
                        </div>
                        <p className="text-sm text-slate-600">{room.description}</p>
                        <p className="text-xs text-slate-500">
                          {room.perks?.join(' · ')}
                        </p>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                        <div className="text-right">
                          <span className="text-lg font-semibold text-[#0c1a2e] tabular-nums">
                            {formatINR(room.pricePerNight)}
                          </span>
                          <span className="text-xs text-slate-500"> / night</span>
                          <p className="text-xs text-slate-500 tabular-nums mt-0.5">
                            {soldOut
                              ? 'Sold out for selected dates'
                              : `${room.availableUnits} unit${room.availableUnits > 1 ? 's' : ''} left`}
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={soldOut}
                          onClick={() => onReserveRoom(detail, room.name)}
                          className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#0c1a2e] text-white hover:bg-[#132742] disabled:bg-slate-200 disabled:text-slate-500 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          {soldOut ? 'Unavailable' : 'Reserve This Room'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-6 border-t border-slate-200">
              <h3 className="font-display text-lg font-semibold text-[#0c1a2e] mb-4">
                Verified Guest Reviews ({reviews.length})
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 space-y-4">
                  {reviews.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      No reviews yet. Be the first guest to share an impression.
                    </p>
                  ) : (
                    reviews.map((rev) => (
                      <div
                        key={rev._id}
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50/60"
                      >
                        <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                          <span className="font-semibold text-[#0c1a2e]">
                            {rev.authorName} · {rev.authorCity} · {rev.stayType}
                          </span>
                          <span className="inline-flex items-center gap-1 font-semibold text-[#0c1a2e] tabular-nums">
                            <Star size={12} className="fill-[#c59b27] text-[#c59b27]" />
                            {rev.rating}.0
                          </span>
                        </div>
                        <h4 className="mt-1.5 text-sm font-semibold text-[#0c1a2e]">
                          {rev.title}
                        </h4>
                        <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                          {rev.comment}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                <form
                  onSubmit={handleReviewSubmit}
                  className="lg:col-span-5 p-5 rounded-xl border border-slate-200 bg-white space-y-3 h-fit"
                >
                  <h4 className="text-sm font-semibold text-[#0c1a2e]">
                    Share Your Stay Impression
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      required
                      placeholder="Your name"
                      value={reviewForm.authorName}
                      onChange={(e) =>
                        setReviewForm((f) => ({ ...f, authorName: e.target.value }))
                      }
                      className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1d3557]"
                    />
                    <input
                      type="text"
                      placeholder="City (e.g. Mumbai)"
                      value={reviewForm.authorCity}
                      onChange={(e) =>
                        setReviewForm((f) => ({ ...f, authorCity: e.target.value }))
                      }
                      className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1d3557]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={reviewForm.stayType}
                      onChange={(e) =>
                        setReviewForm((f) => ({ ...f, stayType: e.target.value }))
                      }
                      className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-[#1d3557]"
                    >
                      <option>Leisure Stay</option>
                      <option>Couple Getaway</option>
                      <option>Family Retreat</option>
                      <option>Business Travel</option>
                    </select>
                    <select
                      value={reviewForm.rating}
                      onChange={(e) =>
                        setReviewForm((f) => ({ ...f, rating: Number(e.target.value) }))
                      }
                      className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white tabular-nums focus:outline-none focus:border-[#1d3557]"
                    >
                      <option value={5}>5 Stars · Exceptional</option>
                      <option value={4}>4 Stars · Very Good</option>
                      <option value={3}>3 Stars · Pleasant</option>
                      <option value={2}>2 Stars · Fair</option>
                      <option value={1}>1 Star · Poor</option>
                    </select>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Review headline"
                    value={reviewForm.title}
                    onChange={(e) =>
                      setReviewForm((f) => ({ ...f, title: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1d3557]"
                  />
                  <textarea
                    rows={3}
                    required
                    placeholder="What stood out about the rooms, dining, or location?"
                    value={reviewForm.comment}
                    onChange={(e) =>
                      setReviewForm((f) => ({ ...f, comment: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1d3557]"
                  />
                  {reviewMessage && (
                    <p className="text-xs text-[#059669] font-medium">{reviewMessage}</p>
                  )}
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="w-full py-2.5 text-xs font-semibold text-white bg-[#0c1a2e] hover:bg-[#132742] rounded-lg transition-colors cursor-pointer"
                  >
                    {submittingReview ? 'Submitting...' : 'Post Review'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
