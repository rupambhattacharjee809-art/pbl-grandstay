import React, { useEffect, useMemo, useState } from 'react';
import { X, CheckCircle2, Printer, Tag } from 'lucide-react';
import { apiRequest } from '../utils/api.js';
import { formatINR, formatDateShort, resolveMediaUrl } from '../utils/propertyImages.js';

export default function BookingModal({
  bookingContext,
  tours,
  initialPromoCode,
  user,
  onClose,
  onBookingCreated,
}) {
  const property = bookingContext?.property;
  const initialRoomName =
    bookingContext?.roomName || property?.roomTypes?.[0]?.name || '';

  const [roomType, setRoomType] = useState(initialRoomName);
  const [checkIn, setCheckIn] = useState(bookingContext?.checkIn || '');
  const [checkOut, setCheckOut] = useState(bookingContext?.checkOut || '');
  const [adults, setAdults] = useState(bookingContext?.guests || 2);
  const [children, setChildren] = useState(0);
  const [roomsCount, setRoomsCount] = useState(1);
  const [selectedTours, setSelectedTours] = useState([]);

  const [guestName, setGuestName] = useState(user?.name || '');
  const [guestEmail, setGuestEmail] = useState(user?.email || '');
  const [guestPhone, setGuestPhone] = useState(user?.phone || '');
  const [paymentMethod, setPaymentMethod] = useState('Pay at Hotel');
  const [specialRequests, setSpecialRequests] = useState('');

  const [promoInput, setPromoInput] = useState(initialPromoCode || '');
  const [promoState, setPromoState] = useState({
    code: '',
    discountAmount: 0,
    message: '',
    error: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  useEffect(() => {
    if (!property) return;
    setRoomType(bookingContext?.roomName || property.roomTypes?.[0]?.name || '');
    setCheckIn(bookingContext?.checkIn || '');
    setCheckOut(bookingContext?.checkOut || '');
    setAdults(bookingContext?.guests || 2);
    setConfirmedBooking(null);
    setSubmitError('');
  }, [property, bookingContext]);

  const destinationTours = useMemo(() => {
    if (!property) return [];
    return (tours || []).filter(
      (t) => t.destination.toLowerCase() === property.destination.toLowerCase()
    );
  }, [tours, property]);

  const selectedRoomObj = useMemo(() => {
    return (
      property?.roomTypes?.find((r) => r.name === roomType) ||
      property?.roomTypes?.[0]
    );
  }, [property, roomType]);

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 1;
    const s = new Date(checkIn).getTime();
    const e = new Date(checkOut).getTime();
    if (Number.isNaN(s) || Number.isNaN(e) || e <= s) return 1;
    return Math.max(1, Math.round((e - s) / 86400000));
  }, [checkIn, checkOut]);

  const roomSubtotal = (selectedRoomObj?.pricePerNight || 0) * nights * roomsCount;
  const totalGuests = adults + children;
  const toursSubtotal = selectedTours.reduce((sum, slug) => {
    const t = destinationTours.find((item) => item.slug === slug);
    return sum + (t ? t.price * totalGuests : 0);
  }, 0);

  const discountAmount = promoState.code ? promoState.discountAmount : 0;
  const taxable = Math.max(0, roomSubtotal - discountAmount + toursSubtotal);
  const taxesAndFees = Math.round(taxable * 0.12);
  const totalAmount = taxable + taxesAndFees;

  const handleApplyPromo = async () => {
    if (!promoInput.trim() || !property) return;
    try {
      const res = await apiRequest('/api/offers/validate', {
        method: 'POST',
        body: JSON.stringify({
          code: promoInput.trim(),
          nights,
          checkInDate: checkIn,
          subtotal: roomSubtotal,
          category: property.category,
        }),
      });
      setPromoState({
        code: res.offer.code,
        discountAmount: res.discountAmount,
        message: res.message,
        error: '',
      });
    } catch (err) {
      setPromoState({
        code: '',
        discountAmount: 0,
        message: '',
        error: err.message,
      });
    }
  };

  const toggleTour = (slug) => {
    setSelectedTours((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!property) return;
    setSubmitting(true);
    setSubmitError('');

    try {
      const res = await apiRequest('/api/bookings', {
        method: 'POST',
        body: JSON.stringify({
          propertyId: property._id,
          roomType: selectedRoomObj?.name,
          checkIn,
          checkOut,
          adults,
          children,
          roomsCount,
          guestName,
          guestEmail,
          guestPhone,
          tourSlugs: selectedTours,
          promoCode: promoState.code,
          paymentMethod,
          specialRequests,
        }),
      });
      setConfirmedBooking(res.booking);
      onBookingCreated(res.booking);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!property) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#07111e]/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-modal-title"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto border border-slate-200 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between no-print">
          <div>
            <p className="text-xs text-slate-500">
              {confirmedBooking ? 'Reservation Confirmed' : 'Complete Reservation'}
            </p>
            <h2
              id="booking-modal-title"
              className="font-display text-xl font-semibold text-[#0c1a2e]"
            >
              {property.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close reservation dialog"
            className="p-2 rounded-lg text-slate-500 hover:text-[#0c1a2e] hover:bg-slate-100 cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {confirmedBooking ? (
          <div className="p-6 sm:p-8 space-y-6">
            <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
              <CheckCircle2 size={22} className="text-[#059669] shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-[#0c1a2e]">
                  Reservation Confirmed · Reference{' '}
                  <span className="font-mono tabular-nums">
                    {confirmedBooking.referenceNumber}
                  </span>
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  Your booking is stored in our reservation registry for{' '}
                  <span className="font-medium text-[#0c1a2e]">
                    {confirmedBooking.guestEmail}
                  </span>
                  . Present this reference at check-in.
                </p>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <span className="font-display text-xl font-semibold text-[#0c1a2e]">
                    GrandStay Voucher
                  </span>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {confirmedBooking.propertyName} · {confirmedBooking.propertyLocation}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Booking Reference</p>
                  <p className="font-mono text-base font-bold text-[#0c1a2e] tabular-nums">
                    {confirmedBooking.referenceNumber}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-xs text-slate-500">Guest</p>
                  <p className="font-semibold text-[#0c1a2e]">{confirmedBooking.guestName}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Check-in</p>
                  <p className="font-semibold text-[#0c1a2e] tabular-nums">
                    {formatDateShort(confirmedBooking.checkIn)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Check-out</p>
                  <p className="font-semibold text-[#0c1a2e] tabular-nums">
                    {formatDateShort(confirmedBooking.checkOut)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Suite / Room</p>
                  <p className="font-semibold text-[#0c1a2e]">{confirmedBooking.roomType}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-base font-semibold text-[#0c1a2e]">
                <span>Total Amount ({confirmedBooking.paymentMethod})</span>
                <span className="tabular-nums">{formatINR(confirmedBooking.totalAmount)}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 no-print">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#0c1a2e] border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                <Printer size={15} />
                Print Voucher
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-xs font-semibold text-white bg-[#0c1a2e] hover:bg-[#132742] rounded-lg cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleConfirmBooking} className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-[#0c1a2e]">1. Stay Details</h3>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Room or Villa Category
                  </label>
                  <select
                    value={selectedRoomObj?.name || ''}
                    onChange={(e) => setRoomType(e.target.value)}
                    className="w-full h-11 px-3 rounded-lg border border-slate-200 bg-white text-sm text-[#0c1a2e] focus:outline-none focus:border-[#1d3557]"
                  >
                    {property.roomTypes?.map((rt) => (
                      <option key={rt.name} value={rt.name}>
                        {rt.name} — {formatINR(rt.pricePerNight)} / night
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Check-in
                    </label>
                    <input
                      type="date"
                      required
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      className="w-full h-10 px-2.5 text-sm border border-slate-200 rounded-lg tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Check-out
                    </label>
                    <input
                      type="date"
                      required
                      min={checkIn}
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      className="w-full h-10 px-2.5 text-sm border border-slate-200 rounded-lg tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Adults
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={adults}
                      onChange={(e) => setAdults(Number(e.target.value))}
                      className="w-full h-10 px-2.5 text-sm border border-slate-200 rounded-lg tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Rooms
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={4}
                      value={roomsCount}
                      onChange={(e) => setRoomsCount(Number(e.target.value))}
                      className="w-full h-10 px-2.5 text-sm border border-slate-200 rounded-lg tabular-nums"
                    />
                  </div>
                </div>
              </div>

              {destinationTours.length > 0 && (
                <div className="pt-4 border-t border-slate-200 space-y-3">
                  <h3 className="text-sm font-semibold text-[#0c1a2e]">
                    2. Optional {property.destination} Experiences
                  </h3>
                  {destinationTours.map((tour) => {
                    const checked = selectedTours.includes(tour.slug);
                    return (
                      <label
                        key={tour.slug}
                        className={`flex items-start justify-between gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${
                          checked
                            ? 'border-[#0c1a2e] bg-slate-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleTour(tour.slug)}
                            className="mt-1 accent-[#0c1a2e]"
                          />
                          <div>
                            <p className="text-sm font-semibold text-[#0c1a2e]">{tour.title}</p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {tour.duration} · {tour.meals}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-[#0c1a2e] tabular-nums shrink-0">
                          +{formatINR(tour.price)} / guest
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}

              <div className="pt-4 border-t border-slate-200 space-y-4">
                <h3 className="text-sm font-semibold text-[#0c1a2e]">
                  {destinationTours.length > 0 ? '3. Guest Information' : '2. Guest Information'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Full name *"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="h-11 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1d3557]"
                  />
                  <input
                    type="email"
                    required
                    placeholder="Email address *"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className="h-11 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1d3557]"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="tel"
                    required
                    placeholder="Mobile number (+91...) *"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    className="h-11 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1d3557]"
                  />
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="h-11 px-3 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-[#1d3557]"
                  >
                    {property.bookingConditions?.payAtHotel && (
                      <option value="Pay at Hotel">Pay at Hotel (Zero Prepayment)</option>
                    )}
                    <option value="UPI">UPI Instant Payment</option>
                    <option value="Online Card">Credit / Debit Card</option>
                  </select>
                </div>
                <textarea
                  rows={2}
                  placeholder="Special requests (early check-in, dietary notes, airport pickup)..."
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  className="w-full p-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1d3557]"
                />
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="sticky top-24 p-5 rounded-xl border border-slate-200 bg-slate-50 space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
                  <img
                    src={resolveMediaUrl(property.image)}
                    alt={property.name}
                    referrerPolicy="no-referrer"
                    className="w-16 h-14 rounded-lg object-cover shrink-0"
                  />
                  <div className="min-w-0">
                    <h4 className="font-display text-base font-semibold text-[#0c1a2e] truncate">
                      {property.name}
                    </h4>
                    <p className="text-xs text-slate-500 truncate">{property.location}</p>
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-1.5">
                    <Tag size={13} className="text-[#a8811b]" />
                    Promo Code
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. EARLYBIRD20"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                      className="flex-1 h-10 px-3 text-sm bg-white border border-slate-200 rounded-lg uppercase focus:outline-none focus:border-[#1d3557]"
                    />
                    <button
                      type="button"
                      onClick={handleApplyPromo}
                      className="px-4 h-10 text-xs font-semibold text-[#0c1a2e] bg-white border border-slate-300 hover:bg-slate-100 rounded-lg cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                  {promoState.message && (
                    <p className="mt-1.5 text-xs text-[#059669] font-medium">
                      {promoState.message}
                    </p>
                  )}
                  {promoState.error && (
                    <p className="mt-1.5 text-xs text-red-600">{promoState.error}</p>
                  )}
                </div>

                <div className="space-y-2.5 pt-2 border-t border-slate-200 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>
                      {formatINR(selectedRoomObj?.pricePerNight)} × {nights} night
                      {nights > 1 ? 's' : ''} × {roomsCount} room{roomsCount > 1 ? 's' : ''}
                    </span>
                    <span className="tabular-nums font-medium text-[#0c1a2e]">
                      {formatINR(roomSubtotal)}
                    </span>
                  </div>

                  {toursSubtotal > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Curated tour add-ons ({totalGuests} guests)</span>
                      <span className="tabular-nums font-medium text-[#0c1a2e]">
                        {formatINR(toursSubtotal)}
                      </span>
                    </div>
                  )}

                  {discountAmount > 0 && (
                    <div className="flex justify-between text-[#059669]">
                      <span>Offer discount ({promoState.code})</span>
                      <span className="tabular-nums font-medium">
                        -{formatINR(discountAmount)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-600">
                    <span>Hospitality GST &amp; service fees (12%)</span>
                    <span className="tabular-nums font-medium text-[#0c1a2e]">
                      {formatINR(taxesAndFees)}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-slate-200 flex justify-between text-base font-semibold text-[#0c1a2e]">
                    <span>Total Payable</span>
                    <span className="tabular-nums">{formatINR(totalAmount)}</span>
                  </div>
                </div>

                {submitError && (
                  <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5">
                    {submitError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 text-sm font-semibold text-white bg-[#0c1a2e] hover:bg-[#132742] disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
                >
                  {submitting ? 'Confirming Reservation...' : 'Confirm Reservation'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
