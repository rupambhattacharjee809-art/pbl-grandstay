import React, { useState } from 'react';
import { Search, Calendar, Users, MapPin } from 'lucide-react';
import { heroGrandResort } from '../utils/propertyImages.js';

export default function HeroSearch({
  destinations,
  searchParams,
  onSearch,
}) {
  const [destination, setDestination] = useState(searchParams.destination || 'All');
  const [checkIn, setCheckIn] = useState(searchParams.checkIn);
  const [checkOut, setCheckOut] = useState(searchParams.checkOut);
  const [guests, setGuests] = useState(searchParams.guests || 2);
  const [keyword, setKeyword] = useState(searchParams.keyword || '');
  const [imgFailed, setImgFailed] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch({ destination, checkIn, checkOut, guests: Number(guests), keyword });
  };

  return (
    <section className="relative bg-[#07111e] text-white overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-center">
            <p className="text-xs font-semibold tracking-widest uppercase text-[#f4be5c] mb-3">
              Curated Indian Hospitality
            </p>
            <h1 className="font-display text-[clamp(2.25rem,4vw,3.75rem)] leading-[1.1] font-semibold tracking-tight text-white [text-wrap:balance]">
              Architectural sanctuaries for unhurried stays.
            </h1>
            <p className="mt-4 text-base text-slate-300 leading-relaxed max-w-xl">
              Reserve heritage palaces, oceanfront resorts, and private courtyard villas across Goa,
              Udaipur, Kerala, and the Himalayas with instant confirmation.
            </p>
          </div>

          <div className="lg:col-span-6">
            <div className="relative w-full aspect-video lg:h-full rounded-xl overflow-hidden bg-[#0c1a2e] border border-white/10">
              {!imgFailed ? (
                <img
                  src={heroGrandResort}
                  alt="The Grand Azure Resort infinity pool at golden hour"
                  referrerPolicy="no-referrer"
                  onError={() => setImgFailed(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0c1a2e] to-[#1d3557] text-slate-300 text-sm">
                  GrandStay Coastal Sanctuary
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#07111e]/75 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-5 right-5 flex items-center justify-between text-xs text-slate-200">
                <span>The Grand Azure Resort &amp; Spa · Candolim, Goa</span>
                <span className="tabular-nums font-semibold text-[#f4be5c]">From ₹7,499 / night</span>
              </div>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 bg-white text-[#0c1a2e] rounded-xl p-4 sm:p-5 border border-slate-200 shadow-lg grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end"
        >
          <div className="lg:col-span-3">
            <label
              htmlFor="hero-destination"
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-1.5"
            >
              <MapPin size={14} className="text-[#a8811b]" />
              Destination
            </label>
            <select
              id="hero-destination"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full h-11 px-3 rounded-lg border border-slate-200 bg-slate-50 text-sm font-medium text-[#0c1a2e] focus:outline-none focus:border-[#1d3557]"
            >
              <option value="All">All Destinations</option>
              {destinations.map((dest) => (
                <option key={dest} value={dest}>
                  {dest}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-3">
            <label
              htmlFor="hero-keyword"
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-1.5"
            >
              <Search size={14} className="text-[#a8811b]" />
              Property or Vibe
            </label>
            <input
              id="hero-keyword"
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Palace, beach, villa..."
              className="w-full h-11 px-3 rounded-lg border border-slate-200 bg-slate-50 text-sm text-[#0c1a2e] placeholder:text-slate-400 focus:outline-none focus:border-[#1d3557]"
            />
          </div>

          <div className="lg:col-span-2">
            <label
              htmlFor="hero-checkin"
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-1.5"
            >
              <Calendar size={14} className="text-[#a8811b]" />
              Check-in
            </label>
            <input
              id="hero-checkin"
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              className="w-full h-11 px-3 rounded-lg border border-slate-200 bg-slate-50 text-sm tabular-nums text-[#0c1a2e] focus:outline-none focus:border-[#1d3557]"
            />
          </div>

          <div className="lg:col-span-2">
            <label
              htmlFor="hero-checkout"
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-1.5"
            >
              <Calendar size={14} className="text-[#a8811b]" />
              Check-out
            </label>
            <input
              id="hero-checkout"
              type="date"
              value={checkOut}
              min={checkIn}
              onChange={(e) => setCheckOut(e.target.value)}
              className="w-full h-11 px-3 rounded-lg border border-slate-200 bg-slate-50 text-sm tabular-nums text-[#0c1a2e] focus:outline-none focus:border-[#1d3557]"
            />
          </div>

          <div className="lg:col-span-1">
            <label
              htmlFor="hero-guests"
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-1.5"
            >
              <Users size={14} className="text-[#a8811b]" />
              Guests
            </label>
            <select
              id="hero-guests"
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value))}
              className="w-full h-11 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm tabular-nums font-medium text-[#0c1a2e] focus:outline-none focus:border-[#1d3557]"
            >
              {[1, 2, 3, 4, 6, 8].map((count) => (
                <option key={count} value={count}>
                  {count}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-1">
            <button
              type="submit"
              className="w-full h-11 px-4 bg-[#0c1a2e] hover:bg-[#132742] text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Search
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
