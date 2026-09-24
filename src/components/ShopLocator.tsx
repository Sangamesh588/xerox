'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Star, Clock, Check, Search, ChevronRight, Map, ArrowUpDown, ExternalLink, AlertTriangle, Compass } from 'lucide-react';
import { XeroxShop } from '@/types';
import { calculateDistance, formatDistance } from '@/lib/location';

interface ShopLocatorProps {
  shops: XeroxShop[];
  selectedShop: XeroxShop | null;
  onSelectShop: (shop: XeroxShop) => void;
  userCoords: { lat: number; lng: number } | null;
  onUpdateCoords: (coords: { lat: number; lng: number }, name?: string) => void;
}

export function ShopLocator({
  shops,
  selectedShop,
  onSelectShop,
  userCoords,
  onUpdateCoords,
}: ShopLocatorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'distance' | 'price' | 'rating'>('distance');
  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string>('');

  const detectLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocationStatus('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    setLocationStatus('Requesting browser location permission...');

    // Fast, responsive location options (prevents Windows GPS hang)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        onUpdateCoords(coords, 'Your Precise Location');
        setIsLocating(false);
        setLocationStatus('📍 Live location detected! Open shops sorted by distance.');
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setIsLocating(false);
        // Instant fast fallback coords if denied/timeout
        onUpdateCoords({ lat: 12.9344, lng: 77.6060 }, 'Default Location');
        setLocationStatus('Permission denied or timed out. Location set to default.');
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
    );
  };

  // Trigger fast location prompt on mount
  useEffect(() => {
    if (!userCoords) {
      detectLocation();
    }
  }, []);

  const openShops = shops.filter((s) => s.isOpen === true);

  const processedShops = openShops.map((shop) => {
    if (!userCoords) return shop;
    const distanceKm = calculateDistance(userCoords.lat, userCoords.lng, shop.lat, shop.lng);
    return { ...shop, distanceKm };
  }).sort((a, b) => {
    if (sortBy === 'distance') {
      return (a.distanceKm ?? 999) - (b.distanceKm ?? 999);
    }
    if (sortBy === 'price') {
      return a.rates.bwSingle - b.rates.bwSingle;
    }
    if (sortBy === 'rating') {
      return b.rating - a.rating;
    }
    return 0;
  });

  const filteredShops = processedShops.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative">
      
      {/* Top Header & Fast Location Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-violet-400" />
            <span>1. Choose Nearby Xerox Shop</span>
          </h2>
          <p className="text-xs text-slate-400">Select an active Xerox shop that is currently OPEN to book your print job</p>
        </div>

        <button
          onClick={detectLocation}
          disabled={isLocating}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white border border-violet-400/30 text-xs font-bold transition shrink-0 shadow-lg shadow-violet-500/20 cursor-pointer"
        >
          <Navigation className={`w-4 h-4 text-cyan-300 ${isLocating ? 'animate-spin' : ''}`} />
          <span>{isLocating ? 'Locating...' : '📍 Detect My Location Now'}</span>
        </button>
      </div>

      {/* Instant Location Banner Prompt */}
      {!userCoords ? (
        <div className="mb-6 bg-violet-500/10 border border-violet-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-cyan-300 font-semibold">
            <Compass className="w-5 h-5 text-violet-400 shrink-0 animate-bounce" />
            <span>Allow location access to view Xerox shops near you with exact distances.</span>
          </div>
          <button
            onClick={detectLocation}
            className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shrink-0"
          >
            Allow Location
          </button>
        </div>
      ) : (
        locationStatus && (
          <div className="mb-4 text-xs text-slate-300 bg-slate-950 px-3.5 py-2 rounded-lg border border-slate-800 flex items-center gap-2 font-medium">
            <Navigation className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>{locationStatus}</span>
          </div>
        )
      )}

      {/* Search Bar & Sorting Dropdown */}
      <div className="mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by shop name or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
            />
          </div>

          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-violet-400 mr-2 shrink-0" />
            <span className="text-slate-400 mr-2 shrink-0">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-white font-semibold focus:outline-none w-full cursor-pointer"
            >
              <option value="distance" className="bg-slate-900">Nearest Distance</option>
              <option value="price" className="bg-slate-900">Lowest Price (B&W)</option>
              <option value="rating" className="bg-slate-900">Highest Rating</option>
            </select>
          </div>
        </div>
      </div>

      {/* Shops Grid or "No Shops Are Open Now" Message */}
      {filteredShops.length === 0 ? (
        <div className="py-12 text-center bg-slate-950 rounded-xl border border-slate-800 p-8 space-y-2">
          <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
          <h3 className="font-bold text-white text-base">No Xerox Shops are Open Now</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            All registered Xerox shops are currently marked as closed. Please check back during business opening hours.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredShops.map((shop) => {
            const isSelected = selectedShop?.id === shop.id;
            const googleMapsUrl = shop.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              `${shop.name}, ${shop.address}`
            )}`;

            return (
              <div
                key={shop.id}
                onClick={() => onSelectShop(shop)}
                className={`p-5 rounded-2xl border cursor-pointer transition-all duration-200 relative flex flex-col justify-between ${
                  isSelected
                    ? 'border-violet-500 bg-violet-500/10 shadow-lg shadow-violet-500/10 scale-[1.01]'
                    : 'border-slate-800 bg-slate-950/80 hover:border-slate-700 hover:bg-slate-950'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
                    <Check className="w-3 h-3 stroke-[3]" />
                    <span>Selected</span>
                  </div>
                )}

                <div>
                  <div className="flex items-start justify-between pr-16">
                    <h3 className="font-bold text-white text-base leading-tight">
                      {shop.name}
                    </h3>
                  </div>

                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                    {shop.address}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 mt-3 text-xs">
                    {shop.distanceKm !== undefined && (
                      <span className="font-bold text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                        📍 {formatDistance(shop.distanceKm)} away
                      </span>
                    )}

                    <span className="flex items-center gap-1 text-amber-300 font-semibold">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{shop.rating}</span>
                      <span className="text-slate-500 text-[11px]">({shop.reviewCount})</span>
                    </span>

                    <span className="flex items-center gap-1 text-emerald-400 text-[11px] font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      <Clock className="w-3 h-3" />
                      <span>Open Now</span>
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 text-cyan-400 hover:underline text-xs font-semibold"
                  >
                    <Map className="w-3.5 h-3.5" />
                    <span>Google Maps Directions</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <div className={`font-semibold flex items-center gap-1 text-xs ${isSelected ? 'text-cyan-300' : 'text-slate-400'}`}>
                    <span>{isSelected ? 'Selected' : 'Select Shop'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
