import React, { useState } from 'react';
import { Clock, Utensils, Car, Copy, Check } from 'lucide-react';
import { formatINR, resolveMediaUrl } from '../utils/propertyImages.js';

export function CuratedToursSection({ tours, onBookTourDestination }) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="pb-6 border-b border-slate-200 mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#a8811b]">
          Destination Experiences
        </p>
        <h2 className="font-display text-3xl font-semibold text-[#0c1a2e] mt-1">
          Curated Local Tours
        </h2>
        <p className="text-sm text-slate-600 mt-1 max-w-2xl">
          Add guided architectural walks, backwater voyages, and culinary trails directly while reserving any stay.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tours.map((tour) => (
          <article
            key={tour._id}
            className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col sm:flex-row"
          >
            <div className="sm:w-52 aspect-[4/3] sm:aspect-auto bg-slate-100 shrink-0">
              <img
                src={resolveMediaUrl(tour.image)}
                alt={tour.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-5 flex-1 flex flex-col justify-between gap-4">
              <div>
                <p className="text-xs text-slate-500">
                  {tour.destination} · {tour.guide}
                </p>
                <h3 className="font-display text-lg font-semibold text-[#0c1a2e] mt-1">
                  {tour.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  {tour.description}
                </p>
                <div className="mt-3 space-y-1 text-xs text-slate-500">
                  <p className="flex items-center gap-1.5">
                    <Clock size={13} className="text-[#a8811b]" />
                    {tour.duration}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Car size={13} className="text-[#a8811b]" />
                    {tour.transport}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Utensils size={13} className="text-[#a8811b]" />
                    {tour.meals}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                <div>
                  <span className="text-base font-semibold text-[#0c1a2e] tabular-nums">
                    {formatINR(tour.price)}
                  </span>
                  <span className="text-xs text-slate-500"> / {tour.priceType}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onBookTourDestination(tour.destination)}
                  className="px-3.5 py-2 text-xs font-semibold text-white bg-[#0c1a2e] hover:bg-[#132742] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Browse {tour.destination} Stays
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function ExclusiveOffersSection({ offers, onApplyOfferCode }) {
  const [copiedCode, setCopiedCode] = useState('');

  const handleCopy = (code) => {
    navigator.clipboard?.writeText(code).catch(() => {});
    setCopiedCode(code);
    onApplyOfferCode(code);
    setTimeout(() => setCopiedCode(''), 2500);
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="pb-6 border-b border-slate-200 mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#a8811b]">
          Seasonal Privileges
        </p>
        <h2 className="font-display text-3xl font-semibold text-[#0c1a2e] mt-1">
          Exclusive Offers &amp; Promo Codes
        </h2>
        <p className="text-sm text-slate-600 mt-1 max-w-2xl">
          Apply any verified privilege code during checkout for instant server-validated tariff reductions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {offers.map((offer) => {
          const isCopied = copiedCode === offer.code;
          return (
            <div
              key={offer._id}
              className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between gap-5"
            >
              <div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-[#a8811b] uppercase tracking-wider">
                    {offer.category} · {offer.discountLabel}
                  </span>
                  <span className="font-mono text-sm font-bold text-[#0c1a2e] bg-slate-100 px-2.5 py-1 rounded">
                    {offer.code}
                  </span>
                </div>
                <h3 className="font-display text-xl font-semibold text-[#0c1a2e] mt-2">
                  {offer.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  {offer.description}
                </p>
                <p className="mt-3 text-xs text-slate-500">{offer.validity}</p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 tabular-nums">
                  Min stay: {offer.minNights} night{offer.minNights > 1 ? 's' : ''}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(offer.code)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0c1a2e] hover:bg-[#132742] rounded-lg transition-colors cursor-pointer"
                >
                  {isCopied ? <Check size={14} /> : <Copy size={14} />}
                  {isCopied ? 'Code Ready in Checkout' : 'Use Code'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
