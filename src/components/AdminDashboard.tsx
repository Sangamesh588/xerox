'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, Store, UserPlus, RefreshCw, KeyRound, Trash2, MapPin, Map } from 'lucide-react';
import { XeroxShop } from '@/types';
import { fetchShopsFromServer, addShop, deleteShop } from '@/lib/storage';
import { GoogleMapPicker } from './GoogleMapPicker';

export function AdminDashboard() {
  const [shops, setShops] = useState<XeroxShop[]>([]);
  const [isAddingShop, setIsAddingShop] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [shopMapOpen, setShopMapOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

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

  const loadShops = async () => {
    setIsLoading(true);
    const serverShops = await fetchShopsFromServer();
    setShops(serverShops);
    setIsLoading(false);
  };

  useEffect(() => {
    loadShops();
    const interval = setInterval(async () => {
      const serverShops = await fetchShopsFromServer();
      setShops(serverShops);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateShop = async (e: React.FormEvent) => {
    e.preventDefault();
    const newShop: XeroxShop = {
      id: `shop-${Date.now()}`,
      name,
      ownerName,
      ownerPhone: ownerPhone || '+91 98765 43210',
      ownerEmail: ownerEmail || 'owner@xerox.com',
      ownerUsername: ownerUsername || `owner_${shops.length + 1}`,
      ownerPassword: ownerPassword || 'bhagya@123',
      googleMapsUrl: googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
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

    await addShop(newShop);
    setIsAddingShop(false);
    await loadShops();
    setSuccessMsg(`"${newShop.name}" was added successfully and is now live!`);
    setTimeout(() => setSuccessMsg(''), 5000);
    // Reset form
    setName('');
    setOwnerName('');
    setAddress('');
    setOwnerUsername('');
    setOwnerPassword('');
    setGoogleMapsUrl('');
    setLat('12.9344');
    setLng('77.6060');
  };

  const handleDeleteShop = async (shopId: string, shopName: string) => {
    if (confirm(`Are you sure you want to delete "${shopName}"?`)) {
      await deleteShop(shopId);
      await loadShops();
      setSuccessMsg(`"${shopName}" was deleted.`);
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-5 py-3 rounded-2xl text-sm font-semibold flex items-center justify-between shadow-sm animate-in fade-in">
          <span>✅ {successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="text-green-600 hover:text-green-900 text-xs font-bold">Dismiss</button>
        </div>
      )}
      
      {/* Header */}
      <div className="bg-white border border-blue-100 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Super Admin Control Center</h1>
            <p className="text-xs text-gray-400">Onboard Xerox shops & assign confidential credentials</p>
          </div>
        </div>

        <button
          onClick={() => setIsAddingShop(!isAddingShop)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-md shadow-blue-200 shrink-0 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>{isAddingShop ? 'Close Form' : '+ Add New Xerox Shop'}</span>
        </button>
      </div>

      {/* Add New Shop Form */}
      {isAddingShop && (
        <div className="bg-white border border-blue-200 rounded-3xl p-6 shadow-sm space-y-5">
          <h2 className="text-base font-bold text-gray-800 flex items-center gap-2 pb-3 border-b border-blue-50">
            <Store className="w-5 h-5 text-blue-500" />
            <span>Onboard New Xerox Shop & Assign Credentials</span>
          </h2>

          <form onSubmit={handleCreateShop} className="space-y-5 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-600 font-medium mb-1">Shop Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Enter Shop Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-blue-50 border border-blue-200 rounded-xl px-3.5 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div>
                <label className="block text-gray-600 font-medium mb-1">Owner Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Enter Owner Full Name"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full bg-blue-50 border border-blue-200 rounded-xl px-3.5 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>

            {/* Credential Assignment */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-3">
              <div className="font-bold text-blue-700 flex items-center gap-1.5 text-sm">
                <KeyRound className="w-4 h-4 text-blue-500" />
                <span>Assign Shop Owner Credentials (Kept Confidential)</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 font-medium mb-1 text-xs">Shop Owner Login ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter Login ID"
                    value={ownerUsername}
                    onChange={(e) => setOwnerUsername(e.target.value)}
                    className="w-full bg-white border border-blue-200 rounded-xl px-3 py-2 text-gray-800 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-medium mb-1 text-xs">Assigned Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={ownerPassword}
                    onChange={(e) => setOwnerPassword(e.target.value)}
                    className="w-full bg-white border border-blue-200 rounded-xl px-3 py-2 text-gray-800 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </div>
            </div>

            {/* Shop Location — Map Picker */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-3">
              <div className="font-bold text-blue-700 flex items-center gap-1.5 text-sm">
                <MapPin className="w-4 h-4 text-blue-500" />
                <span>Shop Location (Select on Map)</span>
              </div>

              <button
                type="button"
                onClick={() => setShopMapOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-blue-400 text-blue-600 font-bold text-sm hover:bg-blue-100 transition"
              >
                <Map className="w-5 h-5" />
                <span>
                  {lat && lng && address
                    ? `📍 ${address.slice(0, 50)}...`
                    : '📍 Click to Pick Shop Location on Map'}
                </span>
              </button>

              {lat && lng && (
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-gray-500 mb-1">Latitude</label>
                    <input
                      type="number"
                      step="0.000001"
                      value={lat}
                      onChange={(e) => setLat(e.target.value)}
                      className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-gray-800 font-mono focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-500 mb-1">Longitude</label>
                    <input
                      type="number"
                      step="0.000001"
                      value={lng}
                      onChange={(e) => setLng(e.target.value)}
                      className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-gray-800 font-mono focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Full Address & Maps URL */}
            <div className="space-y-3">
              <div>
                <label className="block text-gray-600 font-medium mb-1 text-xs">Full Shop Address (for display) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shop 12, 2nd Floor, Brigade Road, Bangalore – 560025"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-blue-50 border border-blue-200 rounded-xl px-3.5 py-2.5 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div>
                <label className="block text-gray-600 font-medium mb-1 text-xs flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-400" />
                  <span>Google Maps Link (Optional — auto-generated if empty)</span>
                </label>
                <input
                  type="url"
                  placeholder="https://maps.google.com/?q=..."
                  value={googleMapsUrl}
                  onChange={(e) => setGoogleMapsUrl(e.target.value)}
                  className="w-full bg-blue-50 border border-blue-200 rounded-xl px-3.5 py-2 text-gray-800 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>

            {/* Pricing Rates */}
            <div className="pt-2 border-t border-blue-100 space-y-3">
              <label className="block text-gray-700 font-bold text-xs uppercase tracking-wide">Base Pricing Rates (₹)</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'B&W Single', val: bwSingle, set: setBwSingle, step: '0.25' },
                  { label: 'B&W Double', val: bwDouble, set: setBwDouble, step: '0.25' },
                  { label: 'Color Single', val: colorSingle, set: setColorSingle, step: '0.5' },
                  { label: 'Color Double', val: colorDouble, set: setColorDouble, step: '0.5' },
                ].map(({ label, val, set, step }) => (
                  <div key={label}>
                    <span className="text-xs text-gray-500 block mb-1">{label}</span>
                    <input
                      type="number"
                      step={step}
                      value={val}
                      onChange={(e) => set(e.target.value)}
                      className="w-full bg-blue-50 border border-blue-200 rounded-lg px-2.5 py-2 text-gray-800 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm shadow-lg shadow-blue-200 transition cursor-pointer"
            >
              ✅ Save & Onboard Xerox Shop
            </button>
          </form>
        </div>
      )}

      {/* Registered Shops List */}
      <div className="bg-white border border-blue-100 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-blue-50">
          <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <Store className="w-5 h-5 text-blue-500" />
            <span>Registered Platform Xerox Shops ({shops.length})</span>
          </h2>
          <button onClick={loadShops} className="p-2 rounded-lg bg-blue-50 text-blue-400 hover:text-blue-600 hover:bg-blue-100 border border-blue-200 transition">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {shops.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-400 bg-blue-50 rounded-2xl border border-blue-100">
            {isLoading
              ? 'Loading shops from server...'
              : 'No Xerox shops registered yet. Click "+ Add New Xerox Shop" above to onboard your first shop.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {shops.map((shop) => (
              <div key={shop.id} className="bg-blue-50 border border-blue-200 rounded-2xl p-5 space-y-3 relative">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">{shop.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{shop.address}</p>
                  </div>
                  
                  <button
                    onClick={() => handleDeleteShop(shop.id, shop.name)}
                    className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-400 border border-red-200 transition text-xs flex items-center gap-1 shrink-0"
                    title="Delete Shop"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-blue-200">
                  <div className="text-gray-600">Owner: <strong className="text-gray-800">{shop.ownerName}</strong></div>
                  <div className="text-gray-600">Login ID: <strong className="text-blue-700 font-mono">{shop.ownerUsername}</strong></div>
                  <div className="text-gray-600">B&W Rate: <strong className="text-gray-800 font-mono">₹{shop.rates.bwSingle}/pg</strong></div>
                  <div className="text-gray-600">Color Rate: <strong className="text-gray-800 font-mono">₹{shop.rates.colorSingle}/pg</strong></div>
                  <div className="text-gray-600">Status: <strong className={shop.isOpen ? 'text-green-600' : 'text-red-500'}>{shop.isOpen ? 'Open ✓' : 'Closed'}</strong></div>
                  <div className="text-gray-500">📍 <span className="font-mono text-[10px]">{shop.lat.toFixed(4)}, {shop.lng.toFixed(4)}</span></div>
                </div>

                {shop.googleMapsUrl && (
                  <a
                    href={shop.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-500 hover:underline text-xs font-semibold"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    View Shop on Google Maps
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Map Picker for Shop Location */}
      <GoogleMapPicker
        isOpen={shopMapOpen}
        onClose={() => setShopMapOpen(false)}
        onConfirm={(coords, addr) => {
          setLat(coords.lat.toFixed(6));
          setLng(coords.lng.toFixed(6));
          setAddress(addr);
          // Auto generate Google Maps URL with precise coordinates
          setGoogleMapsUrl(`https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`);
        }}
        initialCoords={{ lat: parseFloat(lat), lng: parseFloat(lng) }}
        title="Set Shop Location"
        subtitle="Search or move the map to pin your exact shop address"
        confirmLabel="Set as Shop Location"
      />
    </div>
  );
}
