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
      <header className="sticky top-0 z-40 bg-white border-b border-blue-100 shadow-sm w-full max-w-full">
        <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-1.5 sm:gap-4 w-full">
          
          {/* Brand Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer shrink-0"
            onClick={() => onRoleChange('customer')}
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-300">
              <Printer className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="hidden md:block">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-blue-700">
                Xerox Express
              </span>
              <p className="text-[10px] text-gray-400 leading-none">Smart Printing Hub</p>
            </div>
          </div>

          {/* Location Pill — clickable to open map picker */}
          {currentRole === 'customer' && (
            <button
              onClick={() => setLocationModalOpen(true)}
              className="flex items-center gap-1 sm:gap-2 bg-blue-50/80 hover:bg-blue-100/80 border border-blue-200 rounded-xl px-2 sm:px-3 py-1 sm:py-1.5 text-left transition flex-1 min-w-0 max-w-[130px] xs:max-w-[170px] sm:max-w-[240px] group cursor-pointer"
              title="Click to select location on Google Map"
            >
              <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0 animate-pulse" />
              <div className="flex-1 min-w-0 overflow-hidden">
                <div className="text-[8px] sm:text-[9px] uppercase text-blue-600 font-extrabold tracking-wider leading-none mb-0.5">
                  Location
                </div>
                <div className="text-[11px] sm:text-xs font-semibold text-gray-800 truncate leading-tight">
                  {userLocationName || 'Select location...'}
                </div>
              </div>
              <ChevronDown className="w-3 h-3 text-blue-400 shrink-0 group-hover:text-blue-600 transition hidden xs:block" />
            </button>
          )}

          {/* Right Navigation / Role Switcher */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0 ml-auto">
            <div className="flex items-center bg-blue-50/90 p-0.5 sm:p-1 rounded-xl border border-blue-200 text-xs gap-0.5">
              <button
                onClick={() => onRoleChange('customer')}
                className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg font-bold transition cursor-pointer text-xs ${
                  currentRole === 'customer'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-blue-700 hover:bg-white'
                }`}
                title="Customer portal"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Customer</span>
              </button>

              <button
                onClick={() => onRoleChange('owner')}
                className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg font-bold transition cursor-pointer text-xs ${
                  currentRole === 'owner'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-blue-700 hover:bg-white'
                }`}
                title="Shop owner portal"
              >
                <Store className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Shop</span>
              </button>

              <button
                onClick={() => onRoleChange('admin')}
                className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg font-bold transition cursor-pointer text-xs ${
                  currentRole === 'admin'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-blue-700 hover:bg-white'
                }`}
                title="Super Admin portal"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Admin</span>
              </button>
            </div>

            {currentRole !== 'customer' && isAuthenticated && (
              <button
                onClick={onLogout}
                className="p-1.5 sm:p-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 border border-red-200 text-xs transition cursor-pointer"
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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
