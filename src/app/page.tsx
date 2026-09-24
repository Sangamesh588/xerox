'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { DocumentUploader } from '@/components/DocumentUploader';
import { PrintConfigurator } from '@/components/PrintConfigurator';
import { ShopLocator } from '@/components/ShopLocator';
import { OrderSummaryModal } from '@/components/OrderSummaryModal';
import { CustomerDashboard } from '@/components/CustomerDashboard';
import { ShopOwnerDashboard } from '@/components/ShopOwnerDashboard';
import { AdminDashboard } from '@/components/AdminDashboard';
import { LocationModal } from '@/components/LocationModal';
import { LoginModal } from '@/components/LoginModal';

import { DocumentDetails, PrintConfiguration, XeroxShop, XeroxOrder } from '@/types';
import { fetchShopsFromServer, getShops } from '@/lib/storage';
import { calculatePrice } from '@/lib/pricing';
import { Sparkles, Printer, Zap } from 'lucide-react';

export default function Home() {
  const [role, setRole] = useState<'customer' | 'owner' | 'admin'>('customer');

  // Authentication Session
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authenticatedShop, setAuthenticatedShop] = useState<XeroxShop | undefined>();
  const [loginModalRole, setLoginModalRole] = useState<'owner' | 'admin' | null>(null);

  // Customer workflow states
  const [document, setDocument] = useState<DocumentDetails | null>(null);
  const [shops, setShops] = useState<XeroxShop[]>([]);
  const [selectedShop, setSelectedShop] = useState<XeroxShop | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'booking' | 'orders'>('booking');
  const [recentOrderId, setRecentOrderId] = useState<string | undefined>();

  // Location State
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [userLocationName, setUserLocationName] = useState<string>('Detecting location...');

  // Print configuration
  const [config, setConfig] = useState<PrintConfiguration>({
    colorMode: 'bw',
    sideMode: 'double',
    nUp: '1in1',
    paperSize: 'A4',
    paperGsm: '70',
    binding: 'none',
    pageRangeType: 'all',
    startPage: 1,
    endPage: 1,
    customPageRange: '',
    copies: 1,
    orientation: 'portrait',
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserCoords(coords);
          setUserLocationName('Your Current Location');
        },
        (err) => {
          console.warn('GPS location access denied or timeout:', err);
          setUserCoords({ lat: 12.9344, lng: 77.6060 });
          setUserLocationName('College Road, Bangalore');
        },
        { enableHighAccuracy: false, timeout: 5000 }
      );
    }
  }, []);

  const reloadShopsList = async () => {
    const loadedShops = await fetchShopsFromServer();
    setShops(loadedShops);
    if (loadedShops.length > 0 && !selectedShop) {
      setSelectedShop(loadedShops[0]);
    }
  };

  useEffect(() => {
    reloadShopsList();
    const interval = setInterval(reloadShopsList, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleRoleChangeRequest = (newRole: 'customer' | 'owner' | 'admin') => {
    if (newRole === 'customer') {
      setRole('customer');
      return;
    }

    if (!isAuthenticated || role !== newRole) {
      setLoginModalRole(newRole);
    } else {
      setRole(newRole);
    }
  };

  const handleLoginSuccess = (authenticatedRole: 'owner' | 'admin', shop?: XeroxShop) => {
    setIsAuthenticated(true);
    setAuthenticatedShop(shop);
    setRole(authenticatedRole);
    setLoginModalRole(null);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAuthenticatedShop(undefined);
    setRole('customer');
  };

  const handleUpdateCoords = (coords: { lat: number; lng: number }, name?: string) => {
    setUserCoords(coords);
    if (name) setUserLocationName(name);
  };

  const handleOrderSuccess = (order: XeroxOrder) => {
    setIsCheckoutOpen(false);
    setRecentOrderId(order.id);
    setViewMode('orders');
    setDocument(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-violet-500 selection:text-white flex flex-col">
      
      <Header
        currentRole={role}
        onRoleChange={handleRoleChangeRequest}
        userLocationName={userLocationName}
        onOpenLocationModal={() => setIsLocationModalOpen(true)}
        isAuthenticated={isAuthenticated}
        activeShopName={authenticatedShop?.name}
        onLogout={handleLogout}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* CUSTOMER VIEW */}
        {role === 'customer' && (
          <div className="space-y-8">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setViewMode('booking')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                    viewMode === 'booking'
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <Printer className="w-4 h-4" />
                  <span>Book New Print Job</span>
                </button>

                <button
                  onClick={() => setViewMode('orders')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                    viewMode === 'orders'
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <Zap className="w-4 h-4" />
                  <span>My Orders & Tracker</span>
                </button>
              </div>
            </div>

            {viewMode === 'orders' ? (
              <CustomerDashboard
                onNewOrder={() => setViewMode('booking')}
                highlightOrderId={recentOrderId}
              />
            ) : (
              <div className="space-y-8">
                
                {/* Hero Feature Banner */}
                <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-violet-950/40 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
                  <div className="max-w-2xl">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-cyan-300 text-xs font-extrabold mb-3">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Smart Xerox Booking & Document Printing</span>
                    </div>

                    <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                      Pick nearby shop, upload document & collect easily.
                    </h1>

                    <p className="text-xs sm:text-sm text-slate-400 mt-2">
                      Instant page detection, B&W or Color, Front & Back duplex, 4-in-1 layout, spiral binding & Razorpay payment.
                    </p>
                  </div>
                </div>

                {/* STEP 1: CHOOSE NEARBY XEROX SHOP */}
                <ShopLocator
                  shops={shops}
                  selectedShop={selectedShop}
                  onSelectShop={(s) => setSelectedShop(s)}
                  userCoords={userCoords}
                  onUpdateCoords={handleUpdateCoords}
                />

                {/* STEP 2: UPLOAD DOCUMENT */}
                <DocumentUploader
                  document={document}
                  onDocumentChange={(doc) => {
                    setDocument(doc);
                    if (doc) {
                      setConfig((prev) => ({
                        ...prev,
                        startPage: 1,
                        endPage: doc.totalPages,
                        customPageRange: `1-${doc.totalPages}`,
                      }));
                    }
                  }}
                />

                {/* STEP 3: PRINT CONFIGURATOR & CHECKOUT */}
                {document && selectedShop && (
                  <PrintConfigurator
                    document={document}
                    config={config}
                    onConfigChange={setConfig}
                    selectedShop={selectedShop}
                    onProceedToCheckout={() => setIsCheckoutOpen(true)}
                  />
                )}

              </div>
            )}

          </div>
        )}

        {/* SHOP OWNER VIEW */}
        {role === 'owner' && (
          <ShopOwnerDashboard authenticatedShopId={authenticatedShop?.id} />
        )}

        {/* SUPER ADMIN VIEW */}
        {role === 'admin' && <AdminDashboard />}

      </main>

      {/* Checkout Modal */}
      {document && selectedShop && (
        <OrderSummaryModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          document={document}
          config={config}
          shop={selectedShop}
          pricing={calculatePrice(document.totalPages, config, selectedShop)}
          onOrderSuccess={handleOrderSuccess}
        />
      )}

      {/* Login Modal */}
      {loginModalRole && (
        <LoginModal
          isOpen={true}
          targetRole={loginModalRole}
          onClose={() => setLoginModalRole(null)}
          onSuccess={handleLoginSuccess}
        />
      )}

      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        userLocationName={userLocationName}
        onSelectLocation={handleUpdateCoords}
      />

      <footer className="bg-slate-900/50 border-t border-slate-800 text-slate-500 py-6 text-xs text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-400">
            <Printer className="w-4 h-4 text-violet-400" />
            <span className="font-bold text-slate-300">Xerox Express</span>
            <span>• Instant Online Xerox Booking</span>
          </div>

          <div>
            Razorpay Payment Gateway Enabled
          </div>
        </div>
      </footer>

    </div>
  );
}
