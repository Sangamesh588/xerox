'use client';

import React, { useState, useEffect } from 'react';
import {
  Store,
  Clock,
  CheckCircle2,
  TrendingUp,
  FileText,
  DollarSign,
  Printer,
  Layers,
  Download,
  Check,
  Play,
  CheckCheck,
  RefreshCw,
  Edit3,
  Save,
  Trash2,
  MapPin,
  Power,
  Map,
} from 'lucide-react';
import { XeroxOrder, XeroxShop, ShopEarningsAnalytics } from '@/types';
import { fetchOrdersFromServer, fetchShopsFromServer, updateOrderStatus, calculateShopAnalytics, updateShopRates, deleteShop, deleteOrder, toggleShopOpenStatus } from '@/lib/storage';
import { GoogleMapPicker } from './GoogleMapPicker';

interface ShopOwnerDashboardProps {
  authenticatedShopId?: string;
}

export function ShopOwnerDashboard({ authenticatedShopId }: ShopOwnerDashboardProps) {
  const [shops, setShops] = useState<XeroxShop[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<string>(authenticatedShopId || '');
  const [orders, setOrders] = useState<XeroxOrder[]>([]);
  const [timeframe, setTimeframe] = useState<'1week' | '1month' | '1year'>('1week');
  const [analytics, setAnalytics] = useState<ShopEarningsAnalytics | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'orders' | 'settings' | 'analytics'>('orders');

  // Shop Settings Form State
  const [bwSingle, setBwSingle] = useState('');
  const [bwDouble, setBwDouble] = useState('');
  const [colorSingle, setColorSingle] = useState('');
  const [colorDouble, setColorDouble] = useState('');
  const [spiralBinding, setSpiralBinding] = useState('');
  const [hardBinding, setHardBinding] = useState('');
  const [cornerClip, setCornerClip] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [isOpenStatus, setIsOpenStatus] = useState<boolean>(true);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [shopMapOpen, setShopMapOpen] = useState(false);
  const [shopLat, setShopLat] = useState('');
  const [shopLng, setShopLng] = useState('');

  const reloadData = async () => {
    const allShops = await fetchShopsFromServer();
    setShops(allShops);

    const targetShopId = authenticatedShopId || selectedShopId || (allShops[0] ? allShops[0].id : '');
    setSelectedShopId(targetShopId);

    if (targetShopId) {
      const currentShop = allShops.find((s) => s.id === targetShopId);
      if (currentShop) {
        setBwSingle(currentShop.rates.bwSingle.toString());
        setBwDouble(currentShop.rates.bwDouble.toString());
        setColorSingle(currentShop.rates.colorSingle.toString());
        setColorDouble(currentShop.rates.colorDouble.toString());
        setSpiralBinding(currentShop.rates.spiralBinding.toString());
        setHardBinding(currentShop.rates.hardBinding.toString());
        setCornerClip(currentShop.rates.cornerClip.toString());
        setGoogleMapsUrl(currentShop.googleMapsUrl || '');
        setIsOpenStatus(currentShop.isOpen);
        setShopLat(currentShop.lat.toString());
        setShopLng(currentShop.lng.toString());
      }

      const allOrders = await fetchOrdersFromServer(targetShopId);
      setOrders(allOrders);

      const stats = await calculateShopAnalytics(targetShopId, timeframe);
      setAnalytics(stats);
    }
  };

  useEffect(() => {
    reloadData();
    const interval = setInterval(reloadData, 3000);
    return () => clearInterval(interval);
  }, [selectedShopId, timeframe, authenticatedShopId]);

  const handleToggleOpenStatus = async () => {
    if (!selectedShopId) return;
    const nextStatus = !isOpenStatus;
    setIsOpenStatus(nextStatus);
    await toggleShopOpenStatus(selectedShopId, nextStatus);
    reloadData();
  };

  const handleStatusChange = async (orderId: string, newStatus: XeroxOrder['status']) => {
    await updateOrderStatus(orderId, newStatus);
    reloadData();
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (confirm('Are you sure you want to delete this order?')) {
      await deleteOrder(orderId);
      reloadData();
    }
  };

  const handleDeleteCurrentShop = async () => {
    if (selectedShopId && window.confirm('Are you sure you want to delete this shop? This action cannot be undone.')) {
      const targetId = selectedShopId;
      setSelectedShopId('');
      setShops((prev) => prev.filter((s) => s.id !== targetId));
      await deleteShop(targetId);
      await reloadData();
    }
  };

  const handleSaveShopSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShopId) return;

    const newRates = {
      bwSingle: parseFloat(bwSingle) || 1.5,
      bwDouble: parseFloat(bwDouble) || 2.5,
      colorSingle: parseFloat(colorSingle) || 6.0,
      colorDouble: parseFloat(colorDouble) || 10.0,
      spiralBinding: parseFloat(spiralBinding) || 25.0,
      hardBinding: parseFloat(hardBinding) || 75.0,
      cornerClip: parseFloat(cornerClip) || 10.0,
    };

    const latNum = parseFloat(shopLat);
    const lngNum = parseFloat(shopLng);
    const mapsUrl = googleMapsUrl ||
      (latNum && lngNum ? `https://www.google.com/maps/search/?api=1&query=${latNum},${lngNum}` : '');

    await updateShopRates(selectedShopId, newRates, mapsUrl, latNum || undefined, lngNum || undefined);
    setSaveSuccessMsg('Shop settings saved successfully!');
    setTimeout(() => setSaveSuccessMsg(''), 3000);
    reloadData();
  };

  const handleDownloadCustomerFile = (order: XeroxOrder) => {
    if (order.document.fileUrl) {
      const a = document.createElement('a');
      a.href = order.document.fileUrl;
      a.download = `${order.id}_${order.document.fileName}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      const blob = new Blob([
        `PRINT JOB DETAILS FOR ORDER: ${order.id}\nCustomer: ${order.customerName}\nPhone: ${order.customerPhone || 'N/A'}\nPages: ${order.document.totalPages}\nLayout: ${order.config.nUp}\nColor Mode: ${order.config.colorMode}\nBinding: ${order.config.binding}\n\n[Document Content]`
      ], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${order.id}_${order.document.fileName}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const activeShop = shops.find((s) => s.id === selectedShopId) || shops[0];

  const filteredOrders = orders.filter((o) => {
    if (statusFilter === 'all') return true;
    return o.status === statusFilter;
  });

  if (shops.length === 0) {
    return (
      <div className="bg-white border border-blue-100 rounded-3xl p-12 text-center text-gray-500 shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mx-auto mb-3">
          <Store className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">No Shops Registered</h3>
        <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
          Please log in as Super Admin (`sangamesh` / `bhagya@123`) to onboard your first Xerox shop.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Top Console Header Banner & Open/Closed Status Toggle */}
      <div className="bg-white border border-blue-100 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900">
                {activeShop ? activeShop.name : 'Shop Owner Console'}
              </h1>
              
              <button
                type="button"
                onClick={handleToggleOpenStatus}
                className={`flex items-center gap-1.5 text-[11px] font-extrabold uppercase px-3 py-1 rounded-full border transition cursor-pointer ${
                  isOpenStatus
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                }`}
                title="Click to toggle shop open/closed status for customers"
              >
                <Power className="w-3.5 h-3.5" />
                <span>{isOpenStatus ? 'Shop Open Now' : 'Shop Closed'}</span>
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">Owner: <span className="font-semibold text-gray-700">{activeShop?.ownerName}</span></p>
          </div>
        </div>

        {/* Tab Controls & Refresh */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-blue-50/70 text-gray-600 border border-blue-100 hover:text-blue-600 hover:bg-blue-100/50'
            }`}
          >
            📋 Print Jobs ({orders.length})
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-blue-50/70 text-gray-600 border border-blue-100 hover:text-blue-600 hover:bg-blue-100/50'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Shop Settings & Rates</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-blue-50/70 text-gray-600 border border-blue-100 hover:text-blue-600 hover:bg-blue-100/50'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Analytics</span>
          </button>

          <button
            onClick={reloadData}
            className="p-2 rounded-xl bg-blue-50 border border-blue-100 text-gray-500 hover:text-blue-600 hover:bg-blue-100 transition cursor-pointer"
            title="Refresh data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* TAB 1: SHOP SETTINGS, RATES & GOOGLE MAPS LINK */}
      {activeTab === 'settings' && activeShop && (
        <div className="bg-white border border-blue-100 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 flex-wrap gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-600" />
                <span>Shop Rates & Location Link Settings</span>
              </h2>
              <p className="text-xs text-gray-500">Configure page rates, Google Maps link, and manage shop profile</p>
            </div>

            {saveSuccessMsg && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>{saveSuccessMsg}</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSaveShopSettings} className="space-y-6 text-xs">
            
            {/* SHOP LOCATION — MAP PICKER */}
            <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-4 space-y-3">
              <label className="block font-bold text-blue-800 text-xs flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>Shop Location on Map</span>
              </label>

              <button
                type="button"
                onClick={() => setShopMapOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-blue-300 hover:border-blue-500 bg-white text-blue-700 hover:bg-blue-50 font-bold text-sm transition shadow-sm cursor-pointer"
              >
                <Map className="w-5 h-5 text-blue-600" />
                <span>
                  {shopLat && shopLng
                    ? `📍 Lat: ${parseFloat(shopLat).toFixed(4)}, Lng: ${parseFloat(shopLng).toFixed(4)} — Click to update pin`
                    : '📍 Set Shop Location on Google Maps'}
                </span>
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 font-semibold text-xs mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={shopLat}
                    onChange={(e) => setShopLat(e.target.value)}
                    className="w-full bg-white border border-blue-200 rounded-xl px-3 py-2 text-xs font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold text-xs mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={shopLng}
                    onChange={(e) => setShopLng(e.target.value)}
                    className="w-full bg-white border border-blue-200 rounded-xl px-3 py-2 text-xs font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-600 font-semibold text-xs mb-1">
                  Google Maps Direct Link (auto-generated or custom)
                </label>
                <input
                  type="url"
                  placeholder="https://maps.google.com/?q=..."
                  value={googleMapsUrl}
                  onChange={(e) => setGoogleMapsUrl(e.target.value)}
                  className="w-full bg-white border border-blue-200 rounded-xl px-3 py-2 text-xs font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-[11px] text-gray-500 block mt-1">
                  Customers will use this link to navigate to your shop.
                </span>
              </div>
            </div>

            {/* PAGE RATES GRID */}
            <div className="space-y-3">
              <h3 className="font-bold text-gray-800 text-xs uppercase tracking-wider">
                Xerox Page Rates (₹)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50/40 border border-blue-100 rounded-2xl p-4">
                  <label className="block font-bold text-gray-700 mb-1">B&W Single Sided (₹)</label>
                  <input
                    type="number"
                    step="0.10"
                    value={bwSingle}
                    onChange={(e) => setBwSingle(e.target.value)}
                    className="w-full bg-white border border-blue-200 text-gray-900 font-mono font-bold text-base px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="bg-blue-50/40 border border-blue-100 rounded-2xl p-4">
                  <label className="block font-bold text-gray-700 mb-1">B&W Double Sided (₹)</label>
                  <input
                    type="number"
                    step="0.10"
                    value={bwDouble}
                    onChange={(e) => setBwDouble(e.target.value)}
                    className="w-full bg-white border border-blue-200 text-gray-900 font-mono font-bold text-base px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="bg-blue-50/40 border border-blue-100 rounded-2xl p-4">
                  <label className="block font-bold text-gray-700 mb-1">Color Single Sided (₹)</label>
                  <input
                    type="number"
                    step="0.50"
                    value={colorSingle}
                    onChange={(e) => setColorSingle(e.target.value)}
                    className="w-full bg-white border border-blue-200 text-gray-900 font-mono font-bold text-base px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="bg-blue-50/40 border border-blue-100 rounded-2xl p-4">
                  <label className="block font-bold text-gray-700 mb-1">Color Double Sided (₹)</label>
                  <input
                    type="number"
                    step="0.50"
                    value={colorDouble}
                    onChange={(e) => setColorDouble(e.target.value)}
                    className="w-full bg-white border border-blue-200 text-gray-900 font-mono font-bold text-base px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* BINDING RATES GRID */}
            <div className="pt-2 border-t border-gray-100 space-y-3">
              <h3 className="font-bold text-gray-800 text-xs uppercase tracking-wider">
                Binding & Finishing Rates (₹)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-blue-50/40 border border-blue-100 rounded-2xl p-4">
                  <label className="block font-bold text-gray-700 mb-1">Soft Spiral Binding (₹)</label>
                  <input
                    type="number"
                    value={spiralBinding}
                    onChange={(e) => setSpiralBinding(e.target.value)}
                    className="w-full bg-white border border-blue-200 text-gray-900 font-mono font-bold text-base px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="bg-blue-50/40 border border-blue-100 rounded-2xl p-4">
                  <label className="block font-bold text-gray-700 mb-1">Hardcover Thesis Binding (₹)</label>
                  <input
                    type="number"
                    value={hardBinding}
                    onChange={(e) => setHardBinding(e.target.value)}
                    className="w-full bg-white border border-blue-200 text-gray-900 font-mono font-bold text-base px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="bg-blue-50/40 border border-blue-100 rounded-2xl p-4">
                  <label className="block font-bold text-gray-700 mb-1">Corner Strip Clip (₹)</label>
                  <input
                    type="number"
                    value={cornerClip}
                    onChange={(e) => setCornerClip(e.target.value)}
                    className="w-full bg-white border border-blue-200 text-gray-900 font-mono font-bold text-base px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-100">
              <button
                type="submit"
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm transition shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Rates & Google Maps Link</span>
              </button>

              <button
                type="button"
                onClick={handleDeleteCurrentShop}
                className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete This Shop</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: ANALYTICS */}
      {activeTab === 'analytics' && analytics && (
        <div className="bg-white border border-blue-100 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <span>Earnings & Pages Printed Analytics</span>
              </h2>
              <p className="text-xs text-gray-500">Total revenue and print volume statistics</p>
            </div>

            <div className="flex items-center bg-blue-50/70 p-1 rounded-2xl border border-blue-100 text-xs">
              <button
                onClick={() => setTimeframe('1week')}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                  timeframe === '1week'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                1 Week
              </button>
              <button
                onClick={() => setTimeframe('1month')}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                  timeframe === '1month'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                1 Month
              </button>
              <button
                onClick={() => setTimeframe('1year')}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                  timeframe === '1year'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                1 Year
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-blue-50/40 border border-blue-100 rounded-2xl p-5 flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-500 font-semibold">Total Revenue ({timeframe})</div>
                <div className="text-2xl font-extrabold text-blue-600 font-mono mt-1">
                  ₹{analytics.totalEarnings.toLocaleString()}
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-600">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-emerald-50/40 border border-emerald-100 rounded-2xl p-5 flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-500 font-semibold">Total Printed Pages</div>
                <div className="text-2xl font-extrabold text-emerald-600 font-mono mt-1">
                  {analytics.totalPrintedPages.toLocaleString()} pgs
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <Printer className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-indigo-50/40 border border-indigo-100 rounded-2xl p-5 flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-500 font-semibold">Completed Jobs</div>
                <div className="text-2xl font-extrabold text-indigo-600 font-mono mt-1">
                  {analytics.totalOrders} Orders
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-600">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-blue-50/30 border border-blue-100 rounded-2xl p-5">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-4">
              Earnings Trend Chart ({timeframe})
            </h3>
            
            <div className="h-44 flex items-end justify-between gap-2 pt-6 pb-2 border-b border-gray-200">
              {analytics.chartData.map((d, i) => {
                const maxVal = Math.max(...analytics.chartData.map((cd) => cd.earnings), 1);
                const heightPct = Math.max(12, Math.round((d.earnings / maxVal) * 100));

                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative">
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 bg-gray-900 text-white text-[10px] py-1 px-2.5 rounded-lg font-mono transition pointer-events-none z-20 whitespace-nowrap shadow-md">
                      ₹{d.earnings} | {d.pages} pgs
                    </div>

                    <div
                      className="w-full max-w-[36px] bg-gradient-to-t from-blue-600 to-indigo-500 rounded-t-lg group-hover:brightness-110 transition-all shadow-sm"
                      style={{ height: `${heightPct}%` }}
                    />
                    <span className="text-[11px] text-gray-500 font-medium">{d.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ORDERS QUEUE */}
      {activeTab === 'orders' && (
        <div className="bg-white border border-blue-100 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-600" />
                <span>Customer Xerox Queue ({filteredOrders.length})</span>
              </h2>
              <p className="text-xs text-gray-500">Download customer document files, update status, and manage queue</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">Filter:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-blue-50/70 border border-blue-200 text-xs text-gray-800 font-semibold rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Orders</option>
                <option value="pending">Pending</option>
                <option value="printing">In Printing</option>
                <option value="ready">Ready for Pickup</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-xs">
              No orders found matching status filter "{statusFilter}".
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-blue-50/30 border border-blue-100 hover:border-blue-300 rounded-2xl p-4 sm:p-5 transition space-y-4 shadow-sm"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-blue-700 font-mono text-sm">{order.id}</span>
                        <span className="text-xs text-gray-600">• Customer: <strong className="text-gray-900">{order.customerName}</strong></span>
                        {order.customerPhone && (
                          <span className="text-xs text-gray-500 font-mono">({order.customerPhone})</span>
                        )}
                        <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                          order.status === 'pending'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : order.status === 'printing'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : order.status === 'ready'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {order.status}
                        </span>
                      </div>

                      <div className="text-xs text-gray-700 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                        <span className="font-bold text-gray-900 truncate max-w-sm">{order.document.fileName}</span>
                        <span className="text-gray-500">({order.document.totalPages} pgs)</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-[11px] pt-1">
                        <span className="bg-white border border-blue-100 px-2 py-0.5 rounded-lg text-blue-700 font-bold uppercase">
                          {order.config.colorMode}
                        </span>
                        <span className="bg-white border border-blue-100 px-2 py-0.5 rounded-lg text-gray-700">
                          {order.config.sideMode === 'double' ? 'Front & Back (Duplex)' : 'Single Sided'}
                        </span>
                        <span className="bg-white border border-blue-100 px-2 py-0.5 rounded-lg text-blue-700 font-semibold">
                          Layout: {order.config.nUp}
                        </span>
                        <span className="bg-white border border-blue-100 px-2 py-0.5 rounded-lg text-gray-700">
                          Binding: {order.config.binding}
                        </span>
                        <span className="bg-white border border-blue-100 px-2 py-0.5 rounded-lg text-gray-700">
                          Copies: {order.config.copies}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
                      
                      <button
                        onClick={() => handleDownloadCustomerFile(order)}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition shadow-sm cursor-pointer"
                        title="Download customer document for printing"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download File</span>
                      </button>

                      <div className="text-left sm:text-right">
                        <div className="text-[10px] uppercase text-gray-400 font-medium">Earnings</div>
                        <div className="text-xl font-extrabold text-blue-700 font-mono">₹{order.pricing.totalCost}</div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {order.status === 'pending' && (
                          <button
                            onClick={() => handleStatusChange(order.id, 'printing')}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition cursor-pointer shadow-sm"
                          >
                            <Play className="w-3.5 h-3.5 fill-white" />
                            <span>Start Printing</span>
                          </button>
                        )}

                        {order.status === 'printing' && (
                          <button
                            onClick={() => handleStatusChange(order.id, 'ready')}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-700 transition cursor-pointer shadow-sm"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Mark Ready</span>
                          </button>
                        )}

                        {order.status === 'ready' && (
                          <button
                            onClick={() => handleStatusChange(order.id, 'completed')}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition cursor-pointer shadow-sm"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                            <span>Mark Handed Over</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteOrder(order.id)}
                          className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition cursor-pointer"
                          title="Delete Order"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Shop Location Map Picker Modal */}
      <GoogleMapPicker
        isOpen={shopMapOpen}
        onClose={() => setShopMapOpen(false)}
        onConfirm={(coords, addr) => {
          setShopLat(coords.lat.toFixed(6));
          setShopLng(coords.lng.toFixed(6));
          // Auto-generate accurate Google Maps URL with coordinates
          setGoogleMapsUrl(`https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`);
        }}
        initialCoords={
          shopLat && shopLng
            ? { lat: parseFloat(shopLat), lng: parseFloat(shopLng) }
            : undefined
        }
        title="Update Shop Location"
        subtitle="Search or move the map to set your exact shop pin"
        confirmLabel="Set Shop Location"
      />

    </div>
  );
}
