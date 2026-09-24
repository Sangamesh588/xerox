'use client';

import React, { useState } from 'react';
import { X, MapPin, Navigation, Check } from 'lucide-react';
import { POPULAR_LOCATIONS } from '@/lib/location';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userLocationName: string;
  onSelectLocation: (coords: { lat: number; lng: number }, name: string) => void;
}

export function LocationModal({
  isOpen,
  onClose,
  userLocationName,
  onSelectLocation,
}: LocationModalProps) {
  const [customAddress, setCustomAddress] = useState('');

  if (!isOpen) return null;

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customAddress) return;
    // Default to central coords with custom display name
    onSelectLocation({ lat: 12.9344, lng: 77.6060 }, customAddress);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 relative text-white">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800/50 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Set Your Location</h3>
            <p className="text-xs text-slate-400">Select campus hub or enter custom address</p>
          </div>
        </div>

        <form onSubmit={handleCustomSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Enter city, locality, pincode or campus..."
              value={customAddress}
              onChange={(e) => setCustomAddress(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Popular College & Tech Hubs
            </label>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {POPULAR_LOCATIONS.map((loc, idx) => {
                const isSelected = userLocationName === loc.name;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      onSelectLocation({ lat: loc.lat, lng: loc.lng }, loc.name);
                      onClose();
                    }}
                    className={`w-full text-left p-3 rounded-xl border text-xs flex items-center justify-between transition ${
                      isSelected
                        ? 'border-amber-400 bg-amber-500/10 text-white font-bold'
                        : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{loc.name}</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-amber-400" />}
                  </button>
                );
              })}
            </div>
          </div>
        </form>

      </div>
    </div>
  );
}
