'use client';

import React from 'react';
import { Printer, MapPin, ShieldAlert, Store, UserCheck, LogOut } from 'lucide-react';

interface HeaderProps {
  currentRole: 'customer' | 'owner' | 'admin';
  onRoleChange: (role: 'customer' | 'owner' | 'admin') => void;
  userLocationName: string;
  onOpenLocationModal: () => void;
  isAuthenticated: boolean;
  activeShopName?: string;
  onLogout: () => void;
}

export function Header({
  currentRole,
  onRoleChange,
  userLocationName,
  onOpenLocationModal,
  isAuthenticated,
  activeShopName,
  onLogout,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 text-white shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onRoleChange('customer')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Printer className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-violet-400 via-indigo-300 to-cyan-300 bg-clip-text text-transparent">
                Xerox Express
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">Smart Xerox & Document Printing Hub</p>
          </div>
        </div>

        {/* Location Indicator */}
        <div
          className="hidden md:flex items-center bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl px-3 py-1.5 text-xs transition cursor-pointer"
          onClick={onOpenLocationModal}
        >
          <MapPin className="w-4 h-4 text-cyan-400 mr-2 shrink-0 animate-pulse" />
          <div className="text-left">
            <div className="text-[10px] uppercase text-slate-400 font-medium">Location</div>
            <div className="font-semibold text-slate-200 truncate max-w-[180px]">
              {userLocationName || 'Detecting location...'}
            </div>
          </div>
        </div>

        {/* Right Navigation & Role Switcher */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => onRoleChange('customer')}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg font-medium transition ${
                currentRole === 'customer'
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Customer</span>
            </button>

            <button
              onClick={() => onRoleChange('owner')}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg font-medium transition ${
                currentRole === 'owner'
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Shop Owner</span>
            </button>

            <button
              onClick={() => onRoleChange('admin')}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg font-medium transition ${
                currentRole === 'admin'
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
          </div>

          {currentRole !== 'customer' && isAuthenticated && (
            <button
              onClick={onLogout}
              className="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 text-xs transition"
              title="Logout from console"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}

        </div>

      </div>
    </header>
  );
}
