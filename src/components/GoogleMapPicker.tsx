'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
      if (Array.isArray(data.results)) return data.results;
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
  title = 'Select Location on Map',
  subtitle = 'Search, drag the pin, or tap map to set exact location',
  confirmLabel = 'Confirm Selected Location',
}: GoogleMapPickerProps) {
  const [pin, setPin] = useState<LatLng>(() => initialCoords || { lat: 12.9716, lng: 77.5946 });
  const [address, setAddress] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchMessage, setSearchMessage] = useState<string>('');
  const [isMounted, setIsMounted] = useState(false);

  // Leaflet map refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRef = useRef<any>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const prevIsOpenRef = useRef(false);

  // Client-side mount flag for createPortal
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Close suggestions on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initialize / destroy Leaflet map
  useEffect(() => {
    if (!isOpen) {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
      return;
    }

    const initTimer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }

      import('leaflet').then((L) => {
        if (!mapContainerRef.current) return;

        // Fix Leaflet default icon broken paths
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });

        const startCoords = pin;

        const map = L.map(mapContainerRef.current!, {
          center: [startCoords.lat, startCoords.lng],
          zoom: 16,
          zoomControl: true,
        });
        mapRef.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map);

        // Custom blue teardrop marker
        const customIcon = L.divIcon({
          html: `<div style="
            width:34px;height:34px;
            background:#2563eb;border:3px solid #fff;
            border-radius:50% 50% 50% 0;transform:rotate(-45deg);
            box-shadow:0 4px 14px rgba(37,99,235,0.55);
            display:flex;align-items:center;justify-content:center;">
            <div style="width:9px;height:9px;background:#fff;border-radius:50%;transform:rotate(45deg);"></div>
          </div>`,
          className: '',
          iconSize: [34, 34],
          iconAnchor: [17, 34],
        });

        const marker = L.marker([startCoords.lat, startCoords.lng], {
          draggable: true,
          icon: customIcon,
        }).addTo(map);
        markerRef.current = marker;

        // Drag end → update pin
        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          const c = { lat: pos.lat, lng: pos.lng };
          setPin(c);
          setSearchMessage(`📍 Pin moved to (${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)})`);
        });

        // Tap map → move marker + update pin
        map.on('click', (e: { latlng: { lat: number; lng: number } }) => {
          const c = { lat: e.latlng.lat, lng: e.latlng.lng };
          marker.setLatLng([c.lat, c.lng]);
          setPin(c);
          setSearchMessage(`📍 Pin set (${c.lat.toFixed(5)}, ${c.lng.toFixed(5)})`);
        });

        setTimeout(() => map.invalidateSize(), 250);
      });
    }, 80);

    return () => {
      clearTimeout(initTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Sync map view + marker when pin coordinates change
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    markerRef.current.setLatLng([pin.lat, pin.lng]);
    mapRef.current.setView([pin.lat, pin.lng], 16, { animate: true });
  }, [pin.lat, pin.lng]);

  // Debounced autocomplete as user types
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const t = setTimeout(async () => {
      setIsSearching(true);
      const results = await fetchAutocomplete(searchQuery);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
      setIsSearching(false);
    }, 180);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Reverse geocode when pin changes
  useEffect(() => {
    if (!isOpen) return;
    setIsGeocoding(true);
    const t = setTimeout(async () => {
      const addr = await fetchReverseGeocode(pin.lat, pin.lng);
      setAddress(addr);
      setIsGeocoding(false);
    }, 450);
    return () => clearTimeout(t);
  }, [pin.lat, pin.lng, isOpen]);

  // CRITICAL: Reset state ONLY when the modal transitions from closed to open!
  // Do NOT include initialCoords in dependency array so parent polling re-renders
  // will NOT reset user's pin or wipe search input!
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      const validInitial = initialCoords && !isNaN(initialCoords.lat) && !isNaN(initialCoords.lng) && (initialCoords.lat !== 0 || initialCoords.lng !== 0);
      const startCoords = validInitial ? initialCoords! : { lat: 12.9716, lng: 77.5946 };
      setPin(startCoords);
      setSearchQuery('');
      setSuggestions([]);
      setShowSuggestions(false);
      setSearchMessage('');

      // If no initialCoords were provided, auto-detect device GPS immediately!
      if (!validInitial && typeof navigator !== 'undefined' && navigator.geolocation) {
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setPin(c);
            setIsLocating(false);
            setSearchMessage(`✅ GPS detected (±${Math.round(pos.coords.accuracy)}m)`);
            if (mapRef.current && markerRef.current) {
              markerRef.current.setLatLng([c.lat, c.lng]);
              mapRef.current.setView([c.lat, c.lng], 16, { animate: true });
            }
          },
          () => {
            setIsLocating(false);
          },
          { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
        );
      }

      setTimeout(() => searchInputRef.current?.focus(), 200);
    }
    prevIsOpenRef.current = isOpen;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleSelectSuggestion = useCallback((s: Suggestion) => {
    const coords = { lat: s.lat, lng: s.lng };
    setPin(coords);
    setAddress(`${s.title}, ${s.subtitle}`);
    setSearchQuery(s.title);
    setShowSuggestions(false);
    setSearchMessage(`📍 Pinned: ${s.title}`);

    // Immediately pan map & move marker
    if (mapRef.current && markerRef.current) {
      markerRef.current.setLatLng([coords.lat, coords.lng]);
      mapRef.current.setView([coords.lat, coords.lng], 16, { animate: true });
    }
  }, []);

  const handleSearchSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    const results = await fetchAutocomplete(searchQuery);
    setIsSearching(false);

    if (results.length > 0) {
      handleSelectSuggestion(results[0]);
    } else {
      // Direct Nominatim fallback if local search had no match
      try {
        const nomRes = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery.trim())}&format=json&limit=1`,
          { headers: { 'Accept-Language': 'en' } }
        );
        if (nomRes.ok) {
          const nomData = await nomRes.json();
          if (Array.isArray(nomData) && nomData.length > 0) {
            const lat = parseFloat(nomData[0].lat);
            const lng = parseFloat(nomData[0].lon);
            if (!isNaN(lat) && !isNaN(lng)) {
              handleSelectSuggestion({
                title: searchQuery.trim(),
                subtitle: nomData[0].display_name,
                lat,
                lng,
              });
              return;
            }
          }
        }
      } catch (err) {}

      setSearchMessage(`⚠️ No location found for "${searchQuery.trim()}". Try another area.`);
    }
  }, [searchQuery, handleSelectSuggestion]);

  const handleDetectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocation not supported by your browser.');
      return;
    }
    setIsLocating(true);
    setSearchMessage('Getting accurate device GPS position...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setPin(c);
        setIsLocating(false);
        setSearchMessage(`✅ GPS (±${Math.round(pos.coords.accuracy)}m)`);
        if (mapRef.current && markerRef.current) {
          markerRef.current.setLatLng([c.lat, c.lng]);
          mapRef.current.setView([c.lat, c.lng], 16, { animate: true });
        }
      },
      () => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setPin(c);
            setIsLocating(false);
            setSearchMessage(`✅ Approx. GPS (±${Math.round(pos.coords.accuracy)}m)`);
            if (mapRef.current && markerRef.current) {
              markerRef.current.setLatLng([c.lat, c.lng]);
              mapRef.current.setView([c.lat, c.lng], 16, { animate: true });
            }
          },
          () => {
            setIsLocating(false);
            alert('Could not detect GPS. Please search your area above.');
          },
          { enableHighAccuracy: false, timeout: 5000, maximumAge: 0 }
        );
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  }, []);

  if (!isOpen || !isMounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-md animate-in fade-in"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-xl shadow-2xl flex flex-col overflow-hidden"
        style={{ maxHeight: '92vh' }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
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
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex flex-col overflow-y-auto flex-1 min-h-0">

          {/* Search — isolated form via stopPropagation */}
          <div ref={searchContainerRef} className="px-4 pt-4 pb-2 shrink-0 relative z-30">
            <form
              onSubmit={handleSearchSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.stopPropagation();
              }}
              className="flex gap-2"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search area, landmark, street, city..."
                  value={searchQuery}
                  onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoComplete="off"
                  className="w-full pl-10 pr-9 py-2.5 rounded-xl border-2 border-blue-400 bg-blue-50/70 text-gray-900 text-sm font-semibold placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-sm"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => { setSearchQuery(''); setSuggestions([]); setShowSuggestions(false); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                disabled={isSearching}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-md shadow-blue-200 cursor-pointer transition"
              >
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span className="hidden sm:inline">Search</span>
              </button>
            </form>

            {/* Autocomplete dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-4 right-4 top-[60px] bg-white rounded-2xl border-2 border-blue-300 shadow-2xl max-h-60 overflow-y-auto z-50 divide-y divide-gray-100">
                {suggestions.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); handleSelectSuggestion(item); }}
                    onClick={() => handleSelectSuggestion(item)}
                    className="w-full p-3 text-left hover:bg-blue-50 flex items-start gap-2.5 cursor-pointer group transition"
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

          {/* Status message */}
          {searchMessage && (
            <div className="px-4 pb-1 text-xs font-semibold text-emerald-700 flex items-center gap-1.5 shrink-0">
              <span>{searchMessage}</span>
            </div>
          )}

          {/* GPS detect button */}
          <div className="px-4 pb-2 shrink-0">
            <button
              type="button"
              onClick={handleDetectLocation}
              disabled={isLocating}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-blue-300 bg-blue-50/60 text-blue-700 hover:bg-blue-100 disabled:opacity-60 font-bold text-xs transition cursor-pointer"
            >
              {isLocating
                ? <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                : <Navigation className="w-4 h-4 text-blue-600" />}
              <span>{isLocating ? 'Detecting device GPS...' : '📍 Use My Current GPS Location'}</span>
            </button>
          </div>

          {/* Map drag hint */}
          <div className="px-4 pb-1 shrink-0">
            <p className="text-[11px] text-blue-600 font-semibold bg-blue-50 border border-blue-200 rounded-xl px-3 py-1.5 text-center">
              🗺️ <strong>Drag the pin</strong> or <strong>tap anywhere</strong> on the map to set exact location
            </p>
          </div>

          {/* Leaflet map container */}
          <div
            ref={mapContainerRef}
            className="mx-4 mb-2 rounded-2xl overflow-hidden shrink-0 border-2 border-blue-200 shadow-inner"
            style={{ height: 230 }}
          />

          {/* Selected address display */}
          <div className="mx-4 mb-3 bg-blue-50/80 border border-blue-200 rounded-2xl px-4 py-2.5 shrink-0">
            <div className="text-[10px] text-blue-700 font-extrabold uppercase tracking-wider mb-0.5 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Compass className="w-3.5 h-3.5 text-blue-600" />
                <span>Selected Location</span>
              </span>
              <span className="font-mono text-gray-500 text-[10px]">
                {pin.lat.toFixed(5)}, {pin.lng.toFixed(5)}
              </span>
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

          {/* Confirm button */}
          <div className="px-4 pb-4 shrink-0">
            <button
              type="button"
              onClick={() => {
                const finalAddress = address || `📍 (${pin.lat.toFixed(5)}, ${pin.lng.toFixed(5)})`;
                onConfirm(pin, finalAddress);
                onClose();
              }}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-200 cursor-pointer transition"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{confirmLabel}</span>
            </button>
          </div>

        </div>
      </div>
    </div>,
    document.body
  );
}
