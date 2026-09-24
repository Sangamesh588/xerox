'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, Store, UserPlus, RefreshCw, KeyRound, Trash2, MapPin } from 'lucide-react';
import { XeroxShop } from '@/types';
import { getShops, addShop, deleteShop } from '@/lib/storage';

export function AdminDashboard() {
  const [shops, setShops] = useState<XeroxShop[]>([]);
  const [isAddingShop, setIsAddingShop] = useState(false);

  // Form State for Adding New Shop
  const [name, setName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerUsername, setOwnerUsername] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState('12.9344');
  const [lng, setLng] = useState('77.6060');
  const [bwSingle, setBwSingle] = useState('1.50');
  const [bwDouble, setBwDouble] = useState('2.50');
  const [colorSingle, setColorSingle] = useState('6.00');
  const [colorDouble, setColorDouble] = useState('10.00');
  const [spiralBinding, setSpiralBinding] = useState('30.00');
  const [hardBinding, setHardBinding] = useState('80.00');
  const [cornerClip, setCornerClip] = useState('15.00');

  const loadShops = () => {
    setShops(getShops());
  };

  useEffect(() => {
    loadShops();
  }, []);

  const handleCreateShop = (e: React.FormEvent) => {
    e.preventDefault();
    const newShop: XeroxShop = {
      id: `shop-${Date.now()}`,
      name,
      ownerName,
      ownerPhone: ownerPhone || '+91 98765 43210',
      ownerEmail: ownerEmail || 'owner@xerox.com',
      ownerUsername: ownerUsername || `owner_${shops.length + 1}`,
      ownerPassword: ownerPassword || 'bhagya@123',
      googleMapsUrl: googleMapsUrl || undefined,
      address,
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      rating: 4.8,
      reviewCount: 1,
      isOpen: true,
      openingHours: '08:00 AM - 09:30 PM',
      rates: {
        bwSingle: parseFloat(bwSingle),
        bwDouble: parseFloat(bwDouble),
        colorSingle: parseFloat(colorSingle),
        colorDouble: parseFloat(colorDouble),
        spiralBinding: parseFloat(spiralBinding),
        hardBinding: parseFloat(hardBinding),
        cornerClip: parseFloat(cornerClip),
      },
      features: ['Duplex Xerox', 'Color Printing', 'Spiral Binding'],
    };

    addShop(newShop);
    setIsAddingShop(false);
    loadShops();
    // Reset form
    setName('');
    setOwnerName('');
    setAddress('');
    setOwnerUsername('');
    setOwnerPassword('');
    setGoogleMapsUrl('');
  };

  const handleDeleteShop = (shopId: string, shopName: string) => {
    if (confirm(`Are you sure you want to delete "${shopName}"?`)) {
      deleteShop(shopId);
      loadShops();
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-violet-500/20">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Super Admin Control Center</h1>
            <p className="text-xs text-slate-400">Onboard Xerox shops & assign confidential credentials</p>
          </div>
        </div>

        <button
          onClick={() => setIsAddingShop(!isAddingShop)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs transition shadow-lg shadow-violet-500/20 shrink-0 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>{isAddingShop ? 'Close Form' : '+ Add New Xerox Shop'}</span>
        </button>
      </div>

      {/* Add New Shop Form */}
      {isAddingShop && (
        <div className="bg-slate-900 border border-violet-500/30 rounded-2xl p-6 shadow-2xl space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
            <Store className="w-5 h-5 text-violet-400" />
            <span>Onboard New Xerox Shop & Assign Credentials</span>
          </h2>

          <form onSubmit={handleCreateShop} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Shop Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Enter Shop Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Owner Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Enter Owner Full Name"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>

            {/* CREDENTIAL ASSIGNMENT FIELDS */}
            <div className="bg-slate-950 border border-violet-500/30 rounded-xl p-4 space-y-3">
              <div className="font-bold text-cyan-300 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-violet-400" />
                <span>Assign Shop Owner Credentials (Kept Confidential)</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Shop Owner Login ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter Shop Owner Login ID"
                    value={ownerUsername}
                    onChange={(e) => setOwnerUsername(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Assigned Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={ownerPassword}
                    onChange={(e) => setOwnerPassword(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>
            </div>

            {/* GOOGLE MAPS LINK INPUT */}
            <div>
              <label className="block text-slate-400 font-medium mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-violet-400" />
                <span>Shop Location Google Maps Link (Optional)</span>
              </label>
              <input
                type="url"
                placeholder="https://maps.google.com/?q=..."
                value={googleMapsUrl}
                onChange={(e) => setGoogleMapsUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Full Shop Address *</label>
              <input
                type="text"
                required
                placeholder="Enter Full Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-violet-500"
              />
            </div>

            <div className="pt-2 border-t border-slate-800">
              <label className="block text-slate-300 font-bold mb-2">Base Pricing Rate List (₹)</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <span className="text-[10px] text-slate-400">B&W Single</span>
                  <input
                    type="number"
                    step="0.25"
                    value={bwSingle}
                    onChange={(e) => setBwSingle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-white font-mono"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">B&W Double</span>
                  <input
                    type="number"
                    step="0.25"
                    value={bwDouble}
                    onChange={(e) => setBwDouble(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-white font-mono"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Color Single</span>
                  <input
                    type="number"
                    step="0.5"
                    value={colorSingle}
                    onChange={(e) => setColorSingle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-white font-mono"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Color Double</span>
                  <input
                    type="number"
                    step="0.5"
                    value={colorDouble}
                    onChange={(e) => setColorDouble(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-white font-mono"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-violet-500/20 transition cursor-pointer"
            >
              Save & Onboard Xerox Shop
            </button>
          </form>
        </div>
      )}

      {/* Managed Registered Shops List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Store className="w-5 h-5 text-violet-400" />
            <span>Registered Platform Xerox Shops ({shops.length})</span>
          </h2>

          <button onClick={loadShops} className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {shops.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 bg-slate-950 rounded-xl p-6 border border-slate-800">
            No Xerox shops registered yet. Click "+ Add New Xerox Shop" above to onboard your first shop.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {shops.map((shop) => (
              <div key={shop.id} className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3 relative">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-white text-base">{shop.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{shop.address}</p>
                  </div>
                  
                  <button
                    onClick={() => handleDeleteShop(shop.id, shop.name)}
                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition text-xs flex items-center gap-1"
                    title="Delete Xerox Shop"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 pt-2 border-t border-slate-800/80">
                  <div>Owner: <strong className="text-white">{shop.ownerName}</strong></div>
                  <div>Owner ID: <strong className="text-violet-300 font-mono">{shop.ownerUsername}</strong></div>
                  <div>B&W Rate: <strong className="text-white font-mono">₹{shop.rates.bwSingle}/pg</strong></div>
                  <div>Color Rate: <strong className="text-white font-mono">₹{shop.rates.colorSingle}/pg</strong></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
