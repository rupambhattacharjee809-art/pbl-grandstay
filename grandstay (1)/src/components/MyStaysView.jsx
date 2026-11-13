import React, { useState } from 'react';
import { Search, Calendar, Printer, XCircle } from 'lucide-react';
import { apiRequest } from '../utils/api.js';
import { formatINR, formatDateShort, resolveMediaUrl } from '../utils/propertyImages.js';
import PropertyCard from './PropertyCard.jsx';

export default function MyStaysView({
  bookings,
  savedProperties,
  savedIds,
  onToggleSave,
  onSelectProperty,
  onQuickBook,
  onBookingsRefresh,
}) {
  const [lookupRef, setLookupRef] = useState('');
  const [lookupResults, setLookupResults] = useState(null);
  const [lookupError, setLookupError] = useState('');
  const [lookingUp, setLookingUp] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!lookupRef.trim()) {
      setLookupResults(null);
      return;
    }
    setLookingUp(true);
    setLookupError('');
    try {
      const q = lookupRef.trim();
      const param = q.includes('@')
        ? `email=${encodeURIComponent(q)}`
        : `reference=${encodeURIComponent(q)}`;
      const res = await apiRequest(`/api/bookings?${param}`);
      setLookupResults(res.bookings || []);
      if ((res.bookings || []).length === 0) {
        setLookupError('No reservation matched that booking reference or email.');
      }
    } catch (err) {
      setLookupError(err.message);
    } finally {
      setLookingUp(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      await apiRequest(`/api/bookings/${bookingId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'Cancelled' }),
      });
      await onBookingsRefresh();
      if (lookupResults) {
        setLookupResults((prev) =>
          prev.map((b) => (b._id === bookingId ? { ...b, status: 'Cancelled' } : b))
        );
      }
    } catch (err) {
      setLookupError(err.message);
    }
  };

  const displayedBookings = lookupResults !== null ? lookupResults : bookings;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#a8811b]">
            Reservations &amp; Saved Stays
          </p>
          <h1 className="font-display text-3xl font-semibold text-[#0c1a2e] mt-1">
            My Stays &amp; Vouchers
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Look up any reservation by reference code (try <span className="font-mono font-semibold">GS-2026-4812</span>) or guest email.
          </p>
        </div>

        <form onSubmit={handleLookup} className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Reference (GS-2026-...) or email"
              value={lookupRef}
              onChange={(e) => setLookupRef(e.target.value)}
              className="w-full h-10 pl-9 pr-3 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#1d3557]"
            />
          </div>
          <button
            type="submit"
            disabled={lookingUp}
            className="h-10 px-4 text-xs font-semibold text-white bg-[#0c1a2e] hover:bg-[#132742] rounded-lg cursor-pointer whitespace-nowrap shrink-0"
          >
            {lookingUp ? 'Searching...' : 'Find'}
          </button>
          {lookupResults !== null && (
            <button
              type="button"
              onClick={() => {
                setLookupRef('');
                setLookupResults(null);
                setLookupError('');
              }}
              className="h-10 px-3 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              Reset
            </button>
          )}
        </form>
      </div>

      {lookupError && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          {lookupError}
        </p>
      )}

      <div>
        <h2 className="font-display text-xl font-semibold text-[#0c1a2e] mb-4">
          Reservations ({displayedBookings.length})
        </h2>

        {displayedBookings.length === 0 ? (
          <div className="p-8 rounded-xl border border-slate-200 bg-white text-center">
            <p className="text-sm text-slate-600">
              No reservations found for your current session. Reserve a stay or search by reference number above.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedBookings.map((booking) => (
              <div
                key={booking._id}
                className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-5"
              >
                <div className="flex items-start gap-4">
                  <img
                    src={resolveMediaUrl(booking.propertyImage)}
                    alt={booking.propertyName}
                    referrerPolicy="no-referrer"
                    className="w-24 h-20 rounded-lg object-cover shrink-0 bg-slate-100"
                  />
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="font-mono font-semibold text-[#0c1a2e] tabular-nums">
                        {booking.referenceNumber}
                      </span>
                      <span>·</span>
                      <span
                        className={
                          booking.status === 'Cancelled'
                            ? 'text-red-600 font-semibold'
                            : 'text-[#059669] font-semibold'
                        }
                      >
                        {booking.status}
                      </span>
                      <span>·</span>
                      <span>{booking.paymentMethod}</span>
                    </div>
                    <h3 className="font-display text-lg font-semibold text-[#0c1a2e] mt-1">
                      {booking.propertyName}
                    </h3>
                    <p className="text-sm text-slate-600">
                      {booking.roomType} · {booking.nights} night{booking.nights > 1 ? 's' : ''} ·{' '}
                      {booking.guestName}
                    </p>
                    <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-slate-500 tabular-nums">
                      <Calendar size={13} />
                      {formatDateShort(booking.checkIn)} – {formatDateShort(booking.checkOut)}
                    </p>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0">
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Total Amount</p>
                    <p className="text-lg font-semibold text-[#0c1a2e] tabular-nums">
                      {formatINR(booking.totalAmount)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedVoucher(booking)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#0c1a2e] border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer"
                    >
                      <Printer size={13} />
                      Voucher
                    </button>
                    {booking.status !== 'Cancelled' && (
                      <button
                        type="button"
                        onClick={() => handleCancelBooking(booking._id)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 border border-red-200 hover:bg-red-50 rounded-lg cursor-pointer"
                      >
                        <XCircle size={13} />
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pt-8 border-t border-slate-200">
        <h2 className="font-display text-xl font-semibold text-[#0c1a2e] mb-4">
          Saved Stays ({savedProperties.length})
        </h2>
        {savedProperties.length === 0 ? (
          <p className="text-sm text-slate-500">
            Tap the heart icon on any hotel or villa to save it here.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedProperties.map((prop) => (
              <PropertyCard
                key={prop._id}
                property={prop}
                isSaved={savedIds.includes(prop._id)}
                onToggleSave={onToggleSave}
                onSelectProperty={onSelectProperty}
                onQuickBook={onQuickBook}
              />
            ))}
          </div>
        )}
      </div>

      {selectedVoucher && (
        <div
          className="fixed inset-0 z-50 bg-[#07111e]/70 flex items-center justify-center p-4"
          onClick={() => setSelectedVoucher(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <p className="text-xs text-slate-500">Official Stay Voucher</p>
                <h3 className="font-display text-xl font-semibold text-[#0c1a2e]">
                  {selectedVoucher.propertyName}
                </h3>
              </div>
              <span className="font-mono text-sm font-bold text-[#0c1a2e] tabular-nums">
                {selectedVoucher.referenceNumber}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-slate-500">Guest</p>
                <p className="font-medium text-[#0c1a2e]">{selectedVoucher.guestName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Status</p>
                <p className="font-medium text-[#0c1a2e]">{selectedVoucher.status}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Check-in</p>
                <p className="font-medium tabular-nums">{formatDateShort(selectedVoucher.checkIn)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Check-out</p>
                <p className="font-medium tabular-nums">{formatDateShort(selectedVoucher.checkOut)}</p>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between font-semibold text-[#0c1a2e]">
              <span>Total ({selectedVoucher.paymentMethod})</span>
              <span className="tabular-nums">{formatINR(selectedVoucher.totalAmount)}</span>
            </div>
            <div className="flex justify-end gap-2 pt-2 no-print">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 text-xs font-semibold border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                Print
              </button>
              <button
                type="button"
                onClick={() => setSelectedVoucher(null)}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#0c1a2e] rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
