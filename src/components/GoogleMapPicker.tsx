'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Search, Check, X, Loader2, Compass, CornerDownRight } from 'lucide-react';

interface LatLng {
  lat: number;
  lng: number;
}

interface Suggestion {
  title: string;
  subtitle: string;
  lat: number;
  lng: number;
}

interface GoogleMapPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (coords: LatLng, address: string) => void;
  initialCoords?: LatLng;
  title?: string;
  subtitle?: string;
  confirmLabel?: string;
}

// Server-proxied reverse geocoding
async function fetchReverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(`/api/geocode?action=reverse&lat=${lat}&lng=${lng}`);
    if (res.ok) {
      const data = await res.json();
      if (data.address) return data.address;
    }
  } catch (err) {
    console.warn('Reverse geocode failed:', err);
  }
  return `📍 Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
}

// Server-proxied autocomplete search
async function fetchAutocomplete(query: string): Promise<Suggestion[]> {
  if (!query || query.trim().length < 1) return [];
  try {
    const res = await fetch(`/api/geocode?q=${encodeURIComponent(query.trim())}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.results)) {
        return data.results;
      }
    }
  } catch (err) {
    console.warn('Autocomplete fetch failed:', err);
  }
  return [];
}

export function GoogleMapPicker({
  isOpen,
  onClose,
  onConfirm,
  initialCoords,
  title = 'Select Your Location on Google Map',
  subtitle = 'Search area, street, landmark or drag map to set location',
  confirmLabel = 'Confirm Selected Location',
}: GoogleMapPickerProps) {
  const [pin, setPin] = useState<LatLng>(initialCoords || { lat: 12.9716, lng: 77.5946 });
  const [address, setAddress] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchMessage, setSearchMessage] = useState<string>('');

  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced live autocomplete search as user types
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const results = await fetchAutocomplete(searchQuery);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
      setIsSearching(false);
    }, 150);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reverse geocode when pin changes
  useEffect(() => {
    if (!isOpen) return;
    setIsGeocoding(true);
    const t = setTimeout(async () => {
      const addr = await fetchReverseGeocode(pin.lat, pin.lng);
      setAddress(addr);
      setIsGeocoding(false);
    }, 300);
    return () => clearTimeout(t);
  }, [pin.lat, pin.lng, isOpen]);

  // Reset or initialize state on open
  useEffect(() => {
    if (isOpen) {
      if (initialCoords) {
        setPin(initialCoords);
      } else if (navigator.geolocation) {
        // Automatically try fetching GPS when map opens if no coords set
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setPin({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          },
          () => {},
          { enableHighAccuracy: true, timeout: 5000 }
        );
      }
      setSearchQuery('');
      setSuggestions([]);
      setShowSuggestions(false);
      setSearchMessage('');
    }
  }, [isOpen, initialCoords]);

  const handleSelectSuggestion = (s: Suggestion) => {
    setPin({ lat: s.lat, lng: s.lng });
    setAddress(`${s.title}, ${s.subtitle}`);
    setSearchQuery(s.title);
    setShowSuggestions(false);
    setSearchMessage(`📍 Pinned: ${s.title}`);
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    const results = await fetchAutocomplete(searchQuery);
    setIsSearching(false);

    if (results.length > 0) {
      handleSelectSuggestion(results[0]);
    } else {
      setAddress(searchQuery.trim());
      setShowSuggestions(false);
      setSearchMessage(`📍 Location set to: "${searchQuery.trim()}"`);
    }
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setPin(coords);
        setIsLocating(false);
        setSearchMessage(`✅ Detected GPS (±${Math.round(pos.coords.accuracy)}m)`);
      },
      () => {
        setIsLocating(false);
        alert('Could not retrieve GPS. Please type your location in the search bar above.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Google Maps official embed URL using coordinates
  const googleMapIframeUrl = `https://maps.google.com/maps?q=${pin.lat},${pin.lng}&z=15&output=embed`;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-md animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl flex flex-col max-h-[94vh] relative">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4 rounded-t-3xl flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shadow-inner">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">{title}</h2>
              <p className="text-xs text-blue-100">{subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Search Engine with Dropdown */}
        <div ref={searchContainerRef} className="px-4 pt-3.5 pb-2 shrink-0 relative z-30">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
              <input
                type="text"
                placeholder="Type your area, landmark, street, city..."
                value={searchQuery}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 rounded-xl border-2 border-blue-400 bg-blue-50/70 text-gray-900 text-sm font-semibold placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-sm"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSuggestions([]);
                    setShowSuggestions(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition flex items-center gap-1.5 shrink-0 shadow-md shadow-blue-200 cursor-pointer"
            >
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>Search</span>
            </button>
          </form>

          {/* Autocomplete Dropdown List */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute left-4 right-4 top-[58px] bg-white rounded-2xl border-2 border-blue-300 shadow-2xl max-h-64 overflow-y-auto z-50 divide-y divide-gray-100">
              {suggestions.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelectSuggestion(item);
                  }}
                  className="w-full p-3 text-left hover:bg-blue-50 transition flex items-start gap-2.5 cursor-pointer group"
                >
                  <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                  <div className="flex-1 min-w-0">
                    <div className="font-extrabold text-gray-900 text-xs truncate">{item.title}</div>
                    <div className="text-[11px] text-gray-500 truncate mt-0.5">{item.subtitle}</div>
                  </div>
                  <CornerDownRight className="w-3.5 h-3.5 text-blue-400 shrink-0 self-center" />
                </button>
              ))}
            </div>
          )}
        </div>

        {searchMessage && (
          <div className="px-4 pb-1 text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
            <span>{searchMessage}</span>
          </div>
        )}

        {/* GPS Auto Button */}
        <div className="px-4 pb-2 shrink-0">
          <button
            type="button"
            onClick={handleDetectLocation}
            disabled={isLocating}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-blue-300 bg-blue-50/60 text-blue-700 hover:bg-blue-100 font-bold text-xs transition cursor-pointer"
          >
            {isLocating ? (
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            ) : (
              <Navigation className="w-4 h-4 text-blue-600" />
            )}
            <span>{isLocating ? 'Detecting current GPS location...' : '📍 Detect My Device GPS Location'}</span>
          </button>
        </div>

        {/* Google Maps Embed Frame */}
        <div className="relative mx-4 mb-2 rounded-2xl overflow-hidden shrink-0 border-2 border-blue-200 shadow-inner" style={{ height: 210 }}>
          <iframe
            key={`${pin.lat}-${pin.lng}`}
            src={googleMapIframeUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            title="Google Map Location"
          />

          {/* Directional Nudge Arrows */}
          <div className="absolute bottom-2 right-2 flex flex-col gap-1 z-10">
            {[
              { label: '▲', dx: 0, dy: 0.001 },
              { label: '▼', dx: 0, dy: -0.001 },
              { label: '◀', dx: -0.001, dy: 0 },
              { label: '▶', dx: 0.001, dy: 0 },
            ].map(({ label, dx, dy }) => (
              <button
                key={label}
                type="button"
                onClick={() => {
                  setPin((p) => ({ lat: p.lat + dy, lng: p.lng + dx }));
                }}
                className="w-7 h-7 rounded-lg bg-white shadow-md text-gray-800 font-bold text-xs flex items-center justify-center hover:bg-blue-100 transition border border-gray-300 cursor-pointer"
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Location Address Display */}
        <div className="mx-4 mb-3 bg-blue-50/80 border border-blue-200 rounded-2xl px-4 py-2.5 shrink-0">
          <div className="text-[10px] text-blue-700 font-extrabold uppercase tracking-wider mb-0.5 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-blue-600" />
              <span>Selected Location</span>
            </span>
            <span className="font-mono text-gray-500 text-[10px]">{pin.lat.toFixed(4)}, {pin.lng.toFixed(4)}</span>
          </div>
          {isGeocoding ? (
            <div className="flex items-center gap-2 text-gray-500 text-xs py-0.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
              <span>Resolving address...</span>
            </div>
          ) : (
            <p className="text-xs font-bold text-gray-900 line-clamp-2 leading-relaxed">
              {address || `Coordinates: ${pin.lat.toFixed(4)}, ${pin.lng.toFixed(4)}`}
            </p>
          )}
        </div>

        {/* Confirm Button */}
        <div className="px-4 pb-4 shrink-0 rounded-b-3xl">
          <button
            type="button"
            onClick={() => {
              const finalAddress = address || `📍 Location (${pin.lat.toFixed(4)}, ${pin.lng.toFixed(4)})`;
              onConfirm(pin, finalAddress);
              onClose();
            }}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-blue-200 cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{confirmLabel}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
