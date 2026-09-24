'use client';

import React, { useState } from 'react';
import { Printer, MapPin, ShieldAlert, Store, UserCheck, LogOut, ChevronDown } from 'lucide-react';
import { LocationModal } from './LocationModal';

interface HeaderProps {
  currentRole: 'customer' | 'owner' | 'admin';
  onRoleChange: (role: 'customer' | 'owner' | 'admin') => void;
  userLocationName: string;
  isAuthenticated: boolean;
  activeShopName?: string;
  onLogout: () => void;
  userCoords?: { lat: number; lng: number } | null;
  onLocationUpdate?: (coords: { lat: number; lng: number }, name: string) => void;
}

export function Header({
  currentRole,
  onRoleChange,
  userLocationName,
  isAuthenticated,
  activeShopName,
  onLogout,
  userCoords,
  onLocationUpdate,
}: HeaderProps) {
  const [locationModalOpen, setLocationModalOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-blue-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Brand Logo */}
          <div
            className="flex items-center space-x-2.5 cursor-pointer shrink-0"
            onClick={() => onRoleChange('customer')}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center shadow-md shadow-blue-200">
              <Printer className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <span className="font-extrabold text-lg tracking-tight text-blue-700">
                Xerox Express
              </span>
              <p className="text-xs text-gray-400 leading-none">Smart Printing Hub</p>
            </div>
          </div>

          {/* Location Pill — clickable to open map picker */}
          {currentRole === 'customer' && (
            <button
              onClick={() => setLocationModalOpen(true)}
              className="flex items-center gap-1.5 sm:gap-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl px-2.5 sm:px-3 py-1.5 sm:py-2 text-left transition max-w-[160px] sm:max-w-[240px] group cursor-pointer shrink-0"
              title="Click to select location on Google Map"
            >
              <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500 shrink-0 animate-pulse" />
              <div className="flex-1 min-w-0">
                <div className="text-[9px] sm:text-[10px] uppercase text-blue-500 font-bold tracking-wider leading-none mb-0.5">
                  Location
                </div>
                <div className="text-xs font-semibold text-gray-800 truncate leading-tight">
                  {userLocationName || 'Select location...'}
                </div>
              </div>
              <ChevronDown className="w-3 h-3 text-blue-400 shrink-0 group-hover:text-blue-600 transition" />
            </button>
          )}

          {/* Right Navigation */}
          <div className="flex items-center gap-2 ml-auto">

            {/* Role Switcher */}
            <div className="flex items-center bg-blue-50 p-1 rounded-xl border border-blue-200 text-xs gap-0.5">
              <button
                onClick={() => onRoleChange('customer')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition ${
                  currentRole === 'customer'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-white'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Customer</span>
              </button>

              <button
                onClick={() => onRoleChange('owner')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition ${
                  currentRole === 'owner'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-white'
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Shop</span>
              </button>

              <button
                onClick={() => onRoleChange('admin')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition ${
                  currentRole === 'admin'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-white'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Admin</span>
              </button>
            </div>

            {currentRole !== 'customer' && isAuthenticated && (
              <button
                onClick={onLogout}
                className="p-2 rounded-xl bg-red-50 text-red-400 hover:bg-red-100 border border-red-200 text-xs transition"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Location Map Modal */}
      <LocationModal
        isOpen={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
        userLocationName={userLocationName}
        onSelectLocation={(coords, name) => {
          onLocationUpdate?.(coords, name);
          setLocationModalOpen(false);
        }}
        initialCoords={userCoords || undefined}
      />
    </>
  );
}
