import React, { useCallback, useEffect, useState } from 'react';
import { apiRequest, setAuthToken } from './utils/api.js';
import { getDefaultDates } from './utils/propertyImages.js';
import Navbar from './components/Navbar.jsx';
import HeroSearch from './components/HeroSearch.jsx';
import PropertyCard from './components/PropertyCard.jsx';
import PropertyDetailModal from './components/PropertyDetailModal.jsx';
import BookingModal from './components/BookingModal.jsx';
import MyStaysView from './components/MyStaysView.jsx';
import {
  CuratedToursSection,
  ExclusiveOffersSection,
} from './components/ToursOffersSection.jsx';
import AuthModal from './components/AuthModal.jsx';

export default function App() {
  const defaultDates = getDefaultDates();

  const [activeView, setActiveView] = useState('stays');
  const [destinations, setDestinations] = useState([]);
  const [properties, setProperties] = useState([]);
  const [tours, setTours] = useState([]);
  const [offers, setOffers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [savedIds, setSavedIds] = useState([]);
  const [savedProperties, setSavedProperties] = useState([]);
  const [user, setUser] = useState(null);

  const [loadingProperties, setLoadingProperties] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [searchParams, setSearchParams] = useState({
    destination: 'All',
    keyword: '',
    checkIn: defaultDates.checkIn,
    checkOut: defaultDates.checkOut,
    guests: 2,
  });

  const [filters, setFilters] = useState({
    category: 'all',
    sort: 'recommended',
    freeCancellation: false,
    payAtHotel: false,
  });

  const [selectedSlug, setSelectedSlug] = useState('');
  const [bookingContext, setBookingContext] = useState(null);
  const [activePromoCode, setActivePromoCode] = useState('');
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const fetchProperties = useCallback(async (params, filterOpts, viewMode) => {
    setLoadingProperties(true);
    setLoadError('');
    try {
      const qs = new URLSearchParams();
      const effectiveCategory =
        viewMode === 'villas'
          ? 'villa'
          : filterOpts.category !== 'all'
            ? filterOpts.category
            : '';

      if (effectiveCategory) qs.set('category', effectiveCategory);
      if (params.destination && params.destination !== 'All') {
        qs.set('destination', params.destination);
      }
      if (params.keyword?.trim()) qs.set('search', params.keyword.trim());
      if (params.guests) qs.set('guests', String(params.guests));
      if (filterOpts.freeCancellation) qs.set('freeCancellation', 'true');
      if (filterOpts.payAtHotel) qs.set('payAtHotel', 'true');
      if (filterOpts.sort) qs.set('sort', filterOpts.sort);

      const res = await apiRequest(`/api/properties?${qs.toString()}`);
      setProperties(res.properties || []);
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setLoadingProperties(false);
    }
  }, []);

  const fetchUserContext = useCallback(async () => {
    try {
      const [meRes, wishRes, bookRes] = await Promise.all([
        apiRequest('/api/auth/me'),
        apiRequest('/api/wishlist'),
        apiRequest('/api/bookings'),
      ]);
      setUser(meRes.user || null);
      setSavedIds(wishRes.propertyIds || []);
      setSavedProperties(wishRes.properties || []);
      setBookings(bookRes.bookings || []);
    } catch {
      // ignore initial auth/session sync error
    }
  }, []);

  useEffect(() => {
    Promise.all([
      apiRequest('/api/properties/destinations'),
      apiRequest('/api/tours'),
      apiRequest('/api/offers'),
    ])
      .then(([destRes, tourRes, offerRes]) => {
        setDestinations(destRes.destinations || []);
        setTours(tourRes.tours || []);
        setOffers(offerRes.offers || []);
      })
      .catch(() => {});

    fetchUserContext();
  }, [fetchUserContext]);

  useEffect(() => {
    if (activeView === 'stays' || activeView === 'villas') {
      fetchProperties(searchParams, filters, activeView);
    }
  }, [activeView, searchParams, filters, fetchProperties]);

  const handleHeroSearch = (nextParams) => {
    setSearchParams(nextParams);
    if (activeView !== 'stays' && activeView !== 'villas') {
      setActiveView('stays');
    }
  };

  const handleToggleSave = async (propertyId) => {
    try {
      const res = await apiRequest('/api/wishlist/toggle', {
        method: 'POST',
        body: JSON.stringify({ propertyId }),
      });
      setSavedIds(res.propertyIds || []);
      setSavedProperties(res.properties || []);
    } catch {
      // ignore
    }
  };

  const handleOpenBooking = (property, roomName = '') => {
    setSelectedSlug('');
    setBookingContext({
      property,
      roomName: roomName || property.roomTypes?.[0]?.name || '',
      checkIn: searchParams.checkIn,
      checkOut: searchParams.checkOut,
      guests: searchParams.guests,
    });
  };

  const handleBookingCreated = async () => {
    await fetchUserContext();
  };

  const handleLogout = async () => {
    await apiRequest('/api/auth/logout', { method: 'POST' }).catch(() => {});
    setAuthToken('');
    setUser(null);
    await fetchUserContext();
  };

  const handleApplyOfferAndBrowse = (code) => {
    setActivePromoCode(code);
    setActiveView('stays');
  };

  const handleBrowseTourDestination = (dest) => {
    setSearchParams((prev) => ({ ...prev, destination: dest }));
    setActiveView('stays');
  };

  const showCatalog = activeView === 'stays' || activeView === 'villas';

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-[#0c1a2e]">
      <Navbar
        activeView={activeView}
        onNavigate={setActiveView}
        user={user}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
        savedCount={savedIds.length + bookings.length}
      />

      <main className="flex-1">
        {showCatalog && (
          <>
            <HeroSearch
              destinations={destinations}
              searchParams={searchParams}
              onSearch={handleHeroSearch}
            />

            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-200 mb-8">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#a8811b]">
                    {activeView === 'villas' ? 'Entire Residences' : 'Curated Collection'}
                  </p>
                  <h2 className="font-display text-3xl font-semibold text-[#0c1a2e] mt-1">
                    {activeView === 'villas'
                      ? 'Private Pool & Courtyard Villas'
                      : searchParams.destination !== 'All'
                        ? `Luxury Stays in ${searchParams.destination}`
                        : 'Handpicked Hotels, Palaces & Villas'}
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {activeView === 'stays' && (
                    <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                      {[
                        { id: 'all', label: 'All Stays' },
                        { id: 'hotel', label: 'Hotels & Palaces' },
                        { id: 'villa', label: 'Private Villas' },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() =>
                            setFilters((f) => ({ ...f, category: tab.id }))
                          }
                          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                            filters.category === tab.id
                              ? 'bg-white text-[#0c1a2e] shadow-sm'
                              : 'text-slate-600 hover:text-[#0c1a2e]'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  )}

                  <label className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.freeCancellation}
                      onChange={(e) =>
                        setFilters((f) => ({ ...f, freeCancellation: e.target.checked }))
                      }
                      className="accent-[#0c1a2e]"
                    />
                    Free Cancellation
                  </label>

                  <label className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.payAtHotel}
                      onChange={(e) =>
                        setFilters((f) => ({ ...f, payAtHotel: e.target.checked }))
                      }
                      className="accent-[#0c1a2e]"
                    />
                    Pay at Hotel
                  </label>

                  <select
                    aria-label="Sort properties"
                    value={filters.sort}
                    onChange={(e) =>
                      setFilters((f) => ({ ...f, sort: e.target.value }))
                    }
                    className="h-9 px-3 text-xs font-semibold text-[#0c1a2e] bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#1d3557]"
                  >
                    <option value="recommended">Recommended</option>
                    <option value="rating">Top Rated</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                  </select>
                </div>
              </div>

              {loadError && (
                <div className="p-6 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700 mb-6">
                  {loadError}
                </div>
              )}

              {loadingProperties ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <div
                      key={n}
                      className="bg-white border border-slate-200 rounded-xl overflow-hidden h-[420px] animate-pulse"
                    >
                      <div className="aspect-[4/3] bg-slate-100" />
                      <div className="p-5 space-y-3">
                        <div className="h-4 w-1/2 bg-slate-100 rounded" />
                        <div className="h-6 w-3/4 bg-slate-100 rounded" />
                        <div className="h-10 w-full bg-slate-100 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : properties.length === 0 ? (
                <div className="p-12 rounded-xl border border-slate-200 bg-white text-center space-y-3">
                  <h3 className="font-display text-xl font-semibold text-[#0c1a2e]">
                    No stays match your current filters
                  </h3>
                  <p className="text-sm text-slate-600">
                    Try clearing your destination or amenity filters to explore all properties.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchParams((prev) => ({
                        ...prev,
                        destination: 'All',
                        keyword: '',
                        guests: 2,
                      }));
                      setFilters({
                        category: 'all',
                        sort: 'recommended',
                        freeCancellation: false,
                        payAtHotel: false,
                      });
                    }}
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#0c1a2e] rounded-lg cursor-pointer"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {properties.map((property) => (
                    <PropertyCard
                      key={property._id}
                      property={property}
                      isSaved={savedIds.includes(property._id)}
                      onToggleSave={handleToggleSave}
                      onSelectProperty={(p) => setSelectedSlug(p.slug)}
                      onQuickBook={(p) => handleOpenBooking(p)}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {activeView === 'tours' && (
          <CuratedToursSection
            tours={tours}
            onBookTourDestination={handleBrowseTourDestination}
          />
        )}

        {activeView === 'offers' && (
          <ExclusiveOffersSection
            offers={offers}
            onApplyOfferCode={handleApplyOfferAndBrowse}
          />
        )}

        {activeView === 'mystays' && (
          <MyStaysView
            bookings={bookings}
            savedProperties={savedProperties}
            savedIds={savedIds}
            onToggleSave={handleToggleSave}
            onSelectProperty={(p) => setSelectedSlug(p.slug)}
            onQuickBook={(p) => handleOpenBooking(p)}
            onBookingsRefresh={fetchUserContext}
          />
        )}
      </main>

      <footer className="bg-[#07111e] text-slate-300 border-t border-white/10 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <span className="font-display text-xl font-semibold text-white">GrandStay</span>
            <p className="text-xs text-slate-400 mt-1">
              Luxury Hotels, Heritage Palaces &amp; Private Villas across India.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-xs text-slate-400">
            <button
              type="button"
              onClick={() => setActiveView('stays')}
              className="hover:text-white cursor-pointer"
            >
              Stays
            </button>
            <button
              type="button"
              onClick={() => setActiveView('villas')}
              className="hover:text-white cursor-pointer"
            >
              Private Villas
            </button>
            <button
              type="button"
              onClick={() => setActiveView('tours')}
              className="hover:text-white cursor-pointer"
            >
              Curated Tours
            </button>
            <button
              type="button"
              onClick={() => setActiveView('offers')}
              className="hover:text-white cursor-pointer"
            >
              Offers
            </button>
            <button
              type="button"
              onClick={() => setActiveView('mystays')}
              className="hover:text-white cursor-pointer"
            >
              My Stays
            </button>
          </div>
        </div>
      </footer>

      <PropertyDetailModal
        propertySlug={selectedSlug}
        searchParams={searchParams}
        isSaved={
          selectedSlug
            ? savedProperties.some((p) => p.slug === selectedSlug)
            : false
        }
        onToggleSave={handleToggleSave}
        onClose={() => setSelectedSlug('')}
        onReserveRoom={(prop, roomName) => handleOpenBooking(prop, roomName)}
        user={user}
      />

      <BookingModal
        bookingContext={bookingContext}
        tours={tours}
        initialPromoCode={activePromoCode}
        user={user}
        onClose={() => setBookingContext(null)}
        onBookingCreated={handleBookingCreated}
      />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={(loggedInUser) => {
          setUser(loggedInUser);
          fetchUserContext();
        }}
      />
    </div>
  );
}
