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
} from 'lucide-react';
import { XeroxOrder, XeroxShop, ShopEarningsAnalytics } from '@/types';
import { getOrders, getShops, updateOrderStatus, calculateShopAnalytics, updateShopRates, deleteShop, deleteOrder, toggleShopOpenStatus } from '@/lib/storage';

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

  const reloadData = () => {
    const allShops = getShops();
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
      }

      const allOrders = getOrders().filter((o) => o.shopId === targetShopId);
      setOrders(allOrders);

      const stats = calculateShopAnalytics(targetShopId, timeframe);
      setAnalytics(stats);
    }
  };

  useEffect(() => {
    reloadData();
  }, [selectedShopId, timeframe, authenticatedShopId]);

  const handleToggleOpenStatus = () => {
    if (!selectedShopId) return;
    const nextStatus = !isOpenStatus;
    setIsOpenStatus(nextStatus);
    toggleShopOpenStatus(selectedShopId, nextStatus);
    reloadData();
  };

  const handleStatusChange = (orderId: string, newStatus: XeroxOrder['status']) => {
    updateOrderStatus(orderId, newStatus);
    reloadData();
  };

  const handleDeleteOrder = (orderId: string) => {
    if (confirm('Are you sure you want to delete this order?')) {
      deleteOrder(orderId);
      reloadData();
    }
  };

  const handleDeleteCurrentShop = () => {
    if (selectedShopId && confirm('Are you sure you want to delete this shop? This action cannot be undone.')) {
      deleteShop(selectedShopId);
      setSelectedShopId('');
      reloadData();
    }
  };

  const handleSaveShopSettings = (e: React.FormEvent) => {
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

    updateShopRates(selectedShopId, newRates, googleMapsUrl);
    setSaveSuccessMsg('Shop Rates & Google Maps URL updated successfully!');
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
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
        <Store className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-200">No Shops Registered</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Please log in as Super Admin (`sangamesh` / `bhagya@123`) to onboard your first Xerox shop.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Top Console Header Banner & Open/Closed Status Toggle */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-violet-500/20">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">
                {activeShop ? activeShop.name : 'Shop Owner Console'}
              </h1>
              
              {/* OPEN / CLOSED SHOP STATUS TOGGLE BUTTON */}
              <button
                type="button"
                onClick={handleToggleOpenStatus}
                className={`flex items-center gap-1.5 text-[11px] font-extrabold uppercase px-3 py-1 rounded-full border transition cursor-pointer ${
                  isOpenStatus
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                }`}
                title="Click to toggle shop open/closed status for customers"
              >
                <Power className="w-3.5 h-3.5" />
                <span>{isOpenStatus ? 'Shop Open Now' : 'Shop Closed'}</span>
              </button>
            </div>
            <p className="text-xs text-slate-400">Owner: {activeShop?.ownerName}</p>
          </div>
        </div>

        {/* Tab Controls & Refresh */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'orders'
                ? 'bg-violet-600 text-white shadow'
                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            📋 Print Jobs ({orders.length})
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'settings'
                ? 'bg-violet-600 text-white shadow'
                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Shop Settings & Rates</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'analytics'
                ? 'bg-violet-600 text-white shadow'
                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Analytics</span>
          </button>

          <button
            onClick={reloadData}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition"
            title="Refresh data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* TAB 1: SHOP SETTINGS, RATES & GOOGLE MAPS LINK */}
      {activeTab === 'settings' && activeShop && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-violet-400" />
                <span>Shop Rates & Location Link Settings</span>
              </h2>
              <p className="text-xs text-slate-400">Configure page rates, Google Maps link, and manage shop profile</p>
            </div>

            {saveSuccessMsg && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>{saveSuccessMsg}</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSaveShopSettings} className="space-y-6 text-xs">
            
            {/* GOOGLE MAPS LINK INPUT */}
            <div className="bg-slate-950 border border-violet-500/30 rounded-xl p-4 space-y-2">
              <label className="block font-bold text-cyan-300 text-xs flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-violet-400" />
                <span>Shop Location Google Maps Link</span>
              </label>
              <input
                type="url"
                placeholder="https://maps.google.com/?q=..."
                value={googleMapsUrl}
                onChange={(e) => setGoogleMapsUrl(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white font-mono text-xs px-3.5 py-2.5 rounded-lg focus:outline-none focus:border-violet-500"
              />
              <span className="text-[11px] text-slate-400 block">
                Paste your Google Maps location URL here so customers can navigate directly to your shop.
              </span>
            </div>

            {/* PAGE RATES GRID */}
            <div className="space-y-3">
              <h3 className="font-bold text-slate-200 text-xs uppercase tracking-wider">
                Xerox Page Rates (₹)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                  <label className="block font-bold text-slate-300 mb-1">B&W Single Sided (₹)</label>
                  <input
                    type="number"
                    step="0.10"
                    value={bwSingle}
                    onChange={(e) => setBwSingle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white font-mono font-bold text-base px-3 py-2 rounded-lg focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                  <label className="block font-bold text-slate-300 mb-1">B&W Double Sided (₹)</label>
                  <input
                    type="number"
                    step="0.10"
                    value={bwDouble}
                    onChange={(e) => setBwDouble(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white font-mono font-bold text-base px-3 py-2 rounded-lg focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                  <label className="block font-bold text-slate-300 mb-1">Color Single Sided (₹)</label>
                  <input
                    type="number"
                    step="0.50"
                    value={colorSingle}
                    onChange={(e) => setColorSingle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white font-mono font-bold text-base px-3 py-2 rounded-lg focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                  <label className="block font-bold text-slate-300 mb-1">Color Double Sided (₹)</label>
                  <input
                    type="number"
                    step="0.50"
                    value={colorDouble}
                    onChange={(e) => setColorDouble(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white font-mono font-bold text-base px-3 py-2 rounded-lg focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>
            </div>

            {/* BINDING RATES GRID */}
            <div className="pt-2 border-t border-slate-800 space-y-3">
              <h3 className="font-bold text-slate-200 text-xs uppercase tracking-wider">
                Binding & Finishing Rates (₹)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                  <label className="block font-bold text-slate-300 mb-1">Soft Spiral Binding (₹)</label>
                  <input
                    type="number"
                    value={spiralBinding}
                    onChange={(e) => setSpiralBinding(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white font-mono font-bold text-base px-3 py-2 rounded-lg focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                  <label className="block font-bold text-slate-300 mb-1">Hardcover Thesis Binding (₹)</label>
                  <input
                    type="number"
                    value={hardBinding}
                    onChange={(e) => setHardBinding(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white font-mono font-bold text-base px-3 py-2 rounded-lg focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                  <label className="block font-bold text-slate-300 mb-1">Corner Strip Clip (₹)</label>
                  <input
                    type="number"
                    value={cornerClip}
                    onChange={(e) => setCornerClip(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white font-mono font-bold text-base px-3 py-2 rounded-lg focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
              <button
                type="submit"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-extrabold text-sm transition shadow-lg shadow-violet-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Rates & Google Maps Link</span>
              </button>

              <button
                type="button"
                onClick={handleDeleteCurrentShop}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
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
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-violet-400" />
                <span>Earnings & Pages Printed Analytics</span>
              </h2>
              <p className="text-xs text-slate-400">Total revenue and print volume graphs</p>
            </div>

            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setTimeframe('1week')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                  timeframe === '1week'
                    ? 'bg-violet-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                1 Week
              </button>
              <button
                onClick={() => setTimeframe('1month')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                  timeframe === '1month'
                    ? 'bg-violet-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                1 Month
              </button>
              <button
                onClick={() => setTimeframe('1year')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                  timeframe === '1year'
                    ? 'bg-violet-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                1 Year
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-400 font-medium">Total Revenue ({timeframe})</div>
                <div className="text-2xl font-extrabold text-cyan-300 font-mono mt-1">
                  ₹{analytics.totalEarnings.toLocaleString()}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-400 font-medium">Total Printed Pages</div>
                <div className="text-2xl font-extrabold text-emerald-400 font-mono mt-1">
                  {analytics.totalPrintedPages.toLocaleString()} pgs
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Printer className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-400 font-medium">Completed Jobs</div>
                <div className="text-2xl font-extrabold text-sky-400 font-mono mt-1">
                  {analytics.totalOrders} Orders
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">
              Earnings Trend Chart ({timeframe})
            </h3>
            
            <div className="h-44 flex items-end justify-between gap-2 pt-6 pb-2 border-b border-slate-800">
              {analytics.chartData.map((d, i) => {
                const maxVal = Math.max(...analytics.chartData.map((cd) => cd.earnings), 1);
                const heightPct = Math.max(12, Math.round((d.earnings / maxVal) * 100));

                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative">
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 bg-slate-800 text-white text-[10px] py-1 px-2 rounded font-mono transition pointer-events-none z-20 whitespace-nowrap shadow-lg border border-slate-700">
                      ₹{d.earnings} | {d.pages} pgs
                    </div>

                    <div
                      className="w-full max-w-[36px] bg-gradient-to-t from-violet-600 via-indigo-500 to-cyan-400 rounded-t-md group-hover:brightness-125 transition-all shadow-md"
                      style={{ height: `${heightPct}%` }}
                    />
                    <span className="text-[11px] text-slate-400 font-medium">{d.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ORDERS QUEUE */}
      {activeTab === 'orders' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-violet-400" />
                <span>Customer Xerox Queue ({filteredOrders.length})</span>
              </h2>
              <p className="text-xs text-slate-400">Download customer document files, update status, and manage queue</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Filter status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-violet-500"
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
            <div className="py-8 text-center text-slate-500 text-xs">
              No orders found matching status filter "{statusFilter}".
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition space-y-4"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-cyan-300 font-mono">{order.id}</span>
                        <span className="text-xs text-slate-300">• Customer: <strong className="text-white">{order.customerName}</strong></span>
                        {order.customerPhone && (
                          <span className="text-xs text-slate-400">({order.customerPhone})</span>
                        )}
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                          order.status === 'pending'
                            ? 'bg-violet-500/10 text-cyan-300 border-violet-500/30'
                            : order.status === 'printing'
                            ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                            : order.status === 'ready'
                            ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        }`}>
                          {order.status}
                        </span>
                      </div>

                      <div className="text-xs text-slate-300 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-violet-400 shrink-0" />
                        <span className="font-bold text-white truncate max-w-sm">{order.document.fileName}</span>
                        <span className="text-slate-400">({order.document.totalPages} pgs)</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-[11px] pt-1">
                        <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-cyan-300 font-bold uppercase">
                          {order.config.colorMode}
                        </span>
                        <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-300">
                          {order.config.sideMode === 'double' ? 'Front & Back (Duplex)' : 'Single Sided'}
                        </span>
                        <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-cyan-300 font-semibold">
                          Layout: {order.config.nUp}
                        </span>
                        <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-300">
                          Binding: {order.config.binding}
                        </span>
                        <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-300">
                          Copies: {order.config.copies}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
                      
                      <button
                        onClick={() => handleDownloadCustomerFile(order)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 text-cyan-300 border border-violet-500/40 text-xs font-bold transition shadow"
                        title="Download customer document for printing"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download File</span>
                      </button>

                      <div className="text-left sm:text-right">
                        <div className="text-[10px] uppercase text-slate-400 font-medium">Earnings</div>
                        <div className="text-xl font-extrabold text-cyan-300 font-mono">₹{order.pricing.totalCost}</div>
                      </div>

                      <div className="flex items-center gap-2">
                        {order.status === 'pending' && (
                          <button
                            onClick={() => handleStatusChange(order.id, 'printing')}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-500 text-slate-950 font-bold text-xs hover:bg-sky-400 transition"
                          >
                            <Play className="w-3.5 h-3.5 fill-slate-950" />
                            <span>Start Printing</span>
                          </button>
                        )}

                        {order.status === 'printing' && (
                          <button
                            onClick={() => handleStatusChange(order.id, 'ready')}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-500 text-slate-950 font-bold text-xs hover:bg-purple-400 transition"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Mark Ready</span>
                          </button>
                        )}

                        {order.status === 'ready' && (
                          <button
                            onClick={() => handleStatusChange(order.id, 'completed')}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                            <span>Mark Handed Over</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteOrder(order.id)}
                          className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition"
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

    </div>
  );
}
