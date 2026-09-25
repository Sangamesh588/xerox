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
  return `📍 Location (${lat.toFixed(5)}, ${lng.toFixed(5)})`;
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
  title = 'Select Your Location on Map',
  subtitle = 'Drag the pin or search to set your exact location',
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

  // Leaflet map refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRef = useRef<any>(null);
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

  // Initialize Leaflet map when modal opens
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    // Dynamically import Leaflet (client-only)
    let isMounted = true;
    import('leaflet').then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      // Fix Leaflet default icon paths (broken in bundlers)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      // Cleanup any existing map instance
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }

      const startCoords = initialCoords || pin;

      // Create map
      const map = L.map(mapContainerRef.current!, {
        center: [startCoords.lat, startCoords.lng],
        zoom: 16,
        zoomControl: true,
      });

      mapRef.current = map;

      // Add OpenStreetMap tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // Create a draggable marker
      const customIcon = L.divIcon({
        html: `<div style="
          width: 36px; height: 36px;
          background: #2563eb;
          border: 3px solid #fff;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 4px 12px rgba(37,99,235,0.5);
          display: flex; align-items: center; justify-content: center;
        ">
          <div style="
            width: 10px; height: 10px;
            background: #fff;
            border-radius: 50%;
            transform: rotate(45deg);
          "></div>
        </div>`,
        className: '',
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36],
      });

      const marker = L.marker([startCoords.lat, startCoords.lng], {
        draggable: true,
        icon: customIcon,
      }).addTo(map);

      markerRef.current = marker;

      // Update pin state when marker is dragged
      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        const newCoords = { lat: pos.lat, lng: pos.lng };
        setPin(newCoords);
        setSearchMessage(`📍 Pin moved to (${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)})`);
      });

      // Click on map moves marker
      map.on('click', (e: { latlng: { lat: number; lng: number } }) => {
        const newCoords = { lat: e.latlng.lat, lng: e.latlng.lng };
        marker.setLatLng([newCoords.lat, newCoords.lng]);
        setPin(newCoords);
        setSearchMessage(`📍 Pin set to (${newCoords.lat.toFixed(5)}, ${newCoords.lng.toFixed(5)})`);
      });

      // Fix Leaflet map size after modal animation
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
        }
      }, 200);
    });

    return () => {
      isMounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Move the map/marker when pin state changes (from search or GPS)
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    markerRef.current.setLatLng([pin.lat, pin.lng]);
    mapRef.current.setView([pin.lat, pin.lng], 16, { animate: true });
  }, [pin]);

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

  // Reverse geocode when pin changes (debounced 400ms)
  useEffect(() => {
    if (!isOpen) return;
    setIsGeocoding(true);
    const t = setTimeout(async () => {
      const addr = await fetchReverseGeocode(pin.lat, pin.lng);
      setAddress(addr);
      setIsGeocoding(false);
    }, 400);
    return () => clearTimeout(t);
  }, [pin.lat, pin.lng, isOpen]);

  // Reset or initialize state on open
  useEffect(() => {
    if (isOpen) {
      const startCoords = initialCoords || { lat: 12.9716, lng: 77.5946 };
      setPin(startCoords);
      setSearchQuery('');
      setSuggestions([]);
      setShowSuggestions(false);
      setSearchMessage('');

      // If no initialCoords, try to auto-detect GPS when the map opens
      if (!initialCoords && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setPin(coords);
            setSearchMessage(`✅ GPS detected (±${Math.round(pos.coords.accuracy)}m) — drag pin to fine-tune`);
          },
          () => {},
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
      }
    }
  }, [isOpen, initialCoords]);

  const handleSelectSuggestion = (s: Suggestion) => {
    setPin({ lat: s.lat, lng: s.lng });
    setAddress(`${s.title}, ${s.subtitle}`);
    setSearchQuery(s.title);
    setShowSuggestions(false);
    setSearchMessage(`📍 Pinned: ${s.title} — drag pin to fine-tune`);
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
        setSearchMessage(`✅ GPS detected (±${Math.round(pos.coords.accuracy)}m) — drag pin to fine-tune`);
      },
      () => {
        // Fallback to lower accuracy
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setPin(coords);
            setIsLocating(false);
            setSearchMessage(`✅ Approx. location (±${Math.round(pos.coords.accuracy)}m) — drag pin to fine-tune`);
          },
          () => {
            setIsLocating(false);
            alert('Could not retrieve GPS. Please search your location in the search bar.');
          },
          { enableHighAccuracy: false, timeout: 5000, maximumAge: 0 }
        );
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Leaflet CSS */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        crossOrigin=""
      />

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

          {/* Drag-pin hint */}
          <div className="px-4 pb-1 shrink-0">
            <p className="text-[11px] text-blue-600 font-semibold bg-blue-50 border border-blue-200 rounded-xl px-3 py-1.5 text-center">
              🗺️ <strong>Drag the pin</strong> or <strong>tap anywhere</strong> on the map to set your exact location
            </p>
          </div>

          {/* Leaflet Interactive Map */}
          <div
            ref={mapContainerRef}
            className="mx-4 mb-2 rounded-2xl overflow-hidden shrink-0 border-2 border-blue-200 shadow-inner"
            style={{ height: 220, zIndex: 10 }}
          />

          {/* Selected Location Address Display */}
          <div className="mx-4 mb-3 bg-blue-50/80 border border-blue-200 rounded-2xl px-4 py-2.5 shrink-0">
            <div className="text-[10px] text-blue-700 font-extrabold uppercase tracking-wider mb-0.5 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Compass className="w-3.5 h-3.5 text-blue-600" />
                <span>Selected Location</span>
              </span>
              <span className="font-mono text-gray-500 text-[10px]">{pin.lat.toFixed(5)}, {pin.lng.toFixed(5)}</span>
            </div>
            {isGeocoding ? (
              <div className="flex items-center gap-2 text-gray-500 text-xs py-0.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                <span>Resolving address...</span>
              </div>
            ) : (
              <p className="text-xs font-bold text-gray-900 line-clamp-2 leading-relaxed">
                {address || `Coordinates: ${pin.lat.toFixed(5)}, ${pin.lng.toFixed(5)}`}
              </p>
            )}
          </div>

          {/* Confirm Button */}
          <div className="px-4 pb-4 shrink-0 rounded-b-3xl">
            <button
              type="button"
              onClick={() => {
                const finalAddress = address || `📍 Location (${pin.lat.toFixed(5)}, ${pin.lng.toFixed(5)})`;
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
    </>
  );
}
