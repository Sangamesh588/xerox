'use client';

import React, { useState, useEffect } from 'react';
import {
  MapPin, Navigation, Star, Clock, Check, Search,
  ChevronRight, Map, ArrowUpDown, ExternalLink, AlertTriangle, Compass, Loader2, CheckCircle2
} from 'lucide-react';
import { XeroxShop } from '@/types';
import { calculateDistance, formatDistance } from '@/lib/location';
import { GoogleMapPicker } from './GoogleMapPicker';

interface ShopLocatorProps {
  shops: XeroxShop[];
  selectedShop: XeroxShop | null;
  onSelectShop: (shop: XeroxShop) => void;
  userCoords: { lat: number; lng: number } | null;
  onUpdateCoords: (coords: { lat: number; lng: number }, name?: string) => void;
  userLocationName?: string;
}

export function ShopLocator({
  shops,
  selectedShop,
  onSelectShop,
  userCoords,
  onUpdateCoords,
  userLocationName = '',
}: ShopLocatorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'distance' | 'price' | 'rating'>('distance');
  const [isLocating, setIsLocating] = useState(false);
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string>('');

  const detectLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocationStatus('Geolocation is not supported by your browser');
      return;
    }
    setIsLocating(true);
    setLocationStatus('Getting accurate GPS position...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setIsLocating(false);
        setLocationStatus(`✅ GPS location detected (±${Math.round(pos.coords.accuracy)}m)`);

        // Reverse geocode via server to get real street address
        fetch(`/api/geocode?action=reverse&lat=${coords.lat}&lng=${coords.lng}`)
          .then((r) => r.json())
          .then((data) => {
            onUpdateCoords(coords, data.address || `📍 GPS Location (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`);
          })
          .catch(() => {
            onUpdateCoords(coords, `📍 GPS Location (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`);
          });
      },
      () => {
        // Low accuracy fallback
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setIsLocating(false);
            setLocationStatus(`✅ Approximate location detected (±${Math.round(pos.coords.accuracy)}m)`);
            fetch(`/api/geocode?action=reverse&lat=${coords.lat}&lng=${coords.lng}`)
              .then((r) => r.json())
              .then((data) => {
                onUpdateCoords(coords, data.address || `📍 Location (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`);
              })
              .catch(() => {
                onUpdateCoords(coords, `📍 Location (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`);
              });
          },
          () => {
            setIsLocating(false);
            setLocationStatus('⚠️ Location access denied. Click "Select Location on Google Map" to search.');
          },
          { enableHighAccuracy: false, timeout: 5000 }
        );
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  // Compute distance for all shops
  const processedShops = shops.map((shop) => {
    if (!userCoords) {
      return { ...shop, distanceKm: undefined };
    }
    const distanceKm = calculateDistance(userCoords.lat, userCoords.lng, shop.lat, shop.lng);
    return { ...shop, distanceKm };
  }).sort((a, b) => {
    // Open shops first
    const aOpen = a.isOpen !== false ? 1 : 0;
    const bOpen = b.isOpen !== false ? 1 : 0;
    if (aOpen !== bOpen) return bOpen - aOpen;

    if (sortBy === 'distance' && userCoords) return (a.distanceKm ?? 999) - (b.distanceKm ?? 999);
    if (sortBy === 'price') return a.rates.bwSingle - b.rates.bwSingle;
    if (sortBy === 'rating') return b.rating - a.rating;
    return 0;
  });

  const filteredShops = processedShops.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white border border-blue-100 rounded-3xl p-4 sm:p-6 shadow-sm space-y-4 sm:space-y-5 w-full max-w-full overflow-hidden">

      {/* Header and Location Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-blue-50">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span>Step 1 — Choose Nearby Xerox Shop</span>
          </h2>
          <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5 ml-10">
            Pick a verified shop with live rates, duplex printing & instant pickup
          </p>
        </div>

        {/* Action Buttons: Google Map & GPS Detect */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setIsMapPickerOpen(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-blue-200 transition cursor-pointer"
          >
            <Map className="w-4 h-4" />
            <span>🗺️ Set Location on Map</span>
          </button>

          <button
            type="button"
            onClick={detectLocation}
            disabled={isLocating}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition cursor-pointer shrink-0"
            title="Auto detect GPS"
          >
            {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
            <span className="hidden xs:inline">{isLocating ? 'Locating...' : 'GPS'}</span>
          </button>
        </div>
      </div>

      {/* Active User Location Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50/50 border border-blue-200 rounded-2xl p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Compass className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-gray-500 font-medium block text-[10px] sm:text-[11px]">Your Current Location:</span>
            <span className="font-bold text-gray-900 text-xs sm:text-sm truncate block">
              {userLocationName || 'Location not set — Click to set location on Google Map'}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsMapPickerOpen(true)}
          className="text-blue-600 hover:text-blue-800 font-bold underline shrink-0 text-xs cursor-pointer self-start sm:self-auto"
        >
          {userCoords ? 'Change on Map →' : 'Set Location on Map →'}
        </button>
      </div>

      {locationStatus && (
        <div className="text-xs text-blue-800 bg-blue-50/80 px-3 py-1.5 rounded-xl border border-blue-200 flex items-center gap-2">
          <span>{locationStatus}</span>
        </div>
      )}

      {/* Selected Shop Highlight Banner (if a shop is selected) */}
      {selectedShop && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-200">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-800 font-extrabold text-sm">{selectedShop.name}</span>
                <span className="bg-emerald-200/80 text-emerald-900 font-bold text-[10px] px-2 py-0.5 rounded-full uppercase">
                  Selected
                </span>
              </div>
              <p className="text-xs text-emerald-700 mt-0.5">
                {userCoords ? `📍 ${formatDistance(calculateDistance(userCoords.lat, userCoords.lng, selectedShop.lat, selectedShop.lng))} away • ` : ''}{selectedShop.address}
              </p>
            </div>
          </div>

          <div className="text-xs font-semibold text-emerald-800 bg-white/80 px-3 py-1.5 rounded-xl border border-emerald-200 shrink-0">
            ✓ Ready for document upload below
          </div>
        </div>
      )}

      {/* Search Bar & Sorting */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by shop name, landmark or area..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-blue-50/50 border border-blue-200 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
          />
        </div>

        <div className="flex items-center bg-blue-50/50 border border-blue-200 rounded-xl px-3 py-2 text-xs gap-2">
          <ArrowUpDown className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'distance' | 'price' | 'rating')}
            className="bg-transparent text-gray-700 font-semibold focus:outline-none w-full cursor-pointer text-xs"
          >
            <option value="distance">Nearest Distance (📍)</option>
            <option value="price">Lowest Price (B&W)</option>
            <option value="rating">Highest Rating (⭐)</option>
          </select>
        </div>
      </div>

      {/* Shop Cards Grid */}
      {filteredShops.length === 0 ? (
        <div className="py-12 text-center bg-blue-50 rounded-2xl border border-blue-100 p-8 space-y-2">
          <AlertTriangle className="w-9 h-9 text-amber-500 mx-auto" />
          <h3 className="font-bold text-gray-800 text-sm">No Xerox Shops Found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Try adjusting your search query or reset the filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredShops.map((shop) => {
            const isSelected = selectedShop?.id === shop.id;
            const googleMapsUrl =
              shop.googleMapsUrl ||
              `https://www.google.com/maps/search/?api=1&query=${shop.lat},${shop.lng}`;

            return (
              <div
                key={shop.id}
                onClick={() => onSelectShop(shop)}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 relative flex flex-col justify-between ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/60 shadow-lg shadow-blue-100 ring-2 ring-blue-500/20'
                    : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
                }`}
              >
                {/* Selected Corner Badge */}
                {isSelected && (
                  <div className="absolute top-3 right-3 bg-blue-600 text-white text-[10px] uppercase font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                    <Check className="w-3 h-3 stroke-[3]" />
                    <span>Selected</span>
                  </div>
                )}

                <div>
                  <div className="pr-20">
                    <h3 className="font-bold text-gray-900 text-base leading-tight">
                      {shop.name}
                    </h3>
                  </div>

                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {shop.address}
                  </p>

                  {/* Distance and Status badges */}
                  <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
                    {/* ACCURATE DISTANCE BADGE */}
                    {shop.distanceKm !== undefined ? (
                      <span className="font-extrabold text-blue-700 bg-blue-100/80 px-2.5 py-1 rounded-lg border border-blue-200 flex items-center gap-1 shadow-xs">
                        <span>📍</span>
                        <span>{formatDistance(shop.distanceKm)} away</span>
                      </span>
                    ) : (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsMapPickerOpen(true);
                        }}
                        className="font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200 flex items-center gap-1 hover:bg-blue-100 cursor-pointer"
                      >
                        <span>📍 Set Location for Distance</span>
                      </span>
                    )}

                    <span className="flex items-center gap-1 text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{shop.rating}</span>
                      <span className="text-gray-400 text-[11px]">({shop.reviewCount})</span>
                    </span>

                    {shop.isOpen !== false ? (
                      <span className="flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                        <Clock className="w-3 h-3 text-emerald-600" />
                        <span>Open Now</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                        <Clock className="w-3 h-3 text-amber-600" />
                        <span>Closed</span>
                      </span>
                    )}
                  </div>

                  {/* Rates Preview */}
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-2 flex items-center justify-between">
                      <span className="text-gray-500 text-[11px]">B&W Single</span>
                      <span className="font-extrabold text-gray-900 font-mono">₹{shop.rates.bwSingle}</span>
                    </div>
                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-2 flex items-center justify-between">
                      <span className="text-gray-500 text-[11px]">Color Single</span>
                      <span className="font-extrabold text-gray-900 font-mono">₹{shop.rates.colorSingle}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Bar with Prominent SELECT BUTTON */}
                <div className="mt-4 pt-3.5 border-t border-gray-100 flex items-center justify-between gap-3">
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold text-xs hover:underline shrink-0"
                  >
                    <Map className="w-3.5 h-3.5" />
                    <span>View Map</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  {/* BIG DEDICATED SELECT BUTTON */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectShop(shop);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer shrink-0 ${
                      isSelected
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200 ring-2 ring-emerald-400/30'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Selected ✓</span>
                      </>
                    ) : (
                      <>
                        <span>Select Shop</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Embedded Google Map Location Picker Modal */}
      <GoogleMapPicker
        isOpen={isMapPickerOpen}
        onClose={() => setIsMapPickerOpen(false)}
        onConfirm={(coords, addr) => {
          onUpdateCoords(coords, addr);
          setIsMapPickerOpen(false);
        }}
        initialCoords={userCoords || undefined}
        title="Choose Your Location on Google Map"
        subtitle="Search your area, street or drag map to accurately calculate distances"
        confirmLabel="Confirm Location & Recalculate Distance"
      />

    </div>
  );
}
