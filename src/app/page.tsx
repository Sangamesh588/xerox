'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/Header';
import { DocumentUploader } from '@/components/DocumentUploader';
import { PrintConfigurator } from '@/components/PrintConfigurator';
import { ShopLocator } from '@/components/ShopLocator';
import { OrderSummaryModal } from '@/components/OrderSummaryModal';
import { CustomerDashboard } from '@/components/CustomerDashboard';
import { ShopOwnerDashboard } from '@/components/ShopOwnerDashboard';
import { AdminDashboard } from '@/components/AdminDashboard';
import { LoginModal } from '@/components/LoginModal';

import { DocumentDetails, PrintConfiguration, XeroxShop, XeroxOrder } from '@/types';
import { fetchShopsFromServer } from '@/lib/storage';
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
  const [viewMode, setViewMode] = useState<'booking' | 'orders'>('booking');
  const [recentOrderId, setRecentOrderId] = useState<string | undefined>();

  // Location State — starts empty, detected via GPS or set via Map
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [userLocationName, setUserLocationName] = useState<string>('Select location on Google Map');
  const [locationError, setLocationError] = useState<string | null>(null);

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

  // ── ACCURATE REAL GPS GEOLOCATION & REVERSE GEOCODING ─────────────────
  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocationError('Geolocation not supported');
      return;
    }

    let isCancelled = false;

    const setLocation = (lat: number, lng: number, fallbackName: string) => {
      if (isCancelled) return;
      setUserCoords({ lat, lng });
      setLocationError(null);

      // Reverse geocode to get REAL physical address for the detected GPS coordinates
      fetch(`/api/geocode?action=reverse&lat=${lat}&lng=${lng}`)
        .then((r) => r.json())
        .then((data) => {
          if (!isCancelled && data.address) {
            setUserLocationName(data.address);
          } else if (!isCancelled) {
            setUserLocationName(fallbackName);
          }
        })
        .catch(() => {
          if (!isCancelled) setUserLocationName(fallbackName);
        });
    };

    // Step 1: Try high accuracy GPS chip first
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation(
          pos.coords.latitude,
          pos.coords.longitude,
          `📍 GPS Location (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`
        );
      },
      () => {
        // Step 2: Fallback to low accuracy Wi-Fi/cell tower
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setLocation(
              pos.coords.latitude,
              pos.coords.longitude,
              `📍 Approximate Location (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`
            );
          },
          () => {
            // Step 3: IP-based fallback
            fetch('https://ipapi.co/json/')
              .then((r) => r.json())
              .then((data) => {
                if (data.latitude && data.longitude) {
                  setLocation(data.latitude, data.longitude, `📍 ${data.city || 'Your Area'} (IP-based)`);
                } else {
                  setLocationError('Could not detect location');
                }
              })
              .catch(() => {
                setLocationError('Location detection failed');
              });
          },
          { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
        );
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );

    return () => {
      isCancelled = true;
    };
  }, []);

  // ── SHOP SYNC (polls server every 3 seconds) ─────────────────────────
  const reloadShopsList = useCallback(async () => {
    const loadedShops = await fetchShopsFromServer();
    setShops(loadedShops);
  }, []);

  useEffect(() => {
    reloadShopsList();
    const interval = setInterval(reloadShopsList, 3000);
    return () => clearInterval(interval);
  }, [reloadShopsList]);

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
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-blue-500 selection:text-white flex flex-col">
      
      <Header
        currentRole={role}
        onRoleChange={handleRoleChangeRequest}
        userLocationName={userLocationName}
        isAuthenticated={isAuthenticated}
        activeShopName={authenticatedShop?.name}
        onLogout={handleLogout}
        userCoords={userCoords}
        onLocationUpdate={handleUpdateCoords}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* CUSTOMER VIEW */}
        {role === 'customer' && (
          <div className="space-y-8">
            
            <div className="flex items-center justify-between border-b border-blue-100 pb-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('booking')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                    viewMode === 'booking'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                      : 'bg-white text-gray-500 hover:text-gray-800 border border-gray-200'
                  }`}
                >
                  <Printer className="w-4 h-4" />
                  <span>Book New Print Job</span>
                </button>

                <button
                  onClick={() => setViewMode('orders')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                    viewMode === 'orders'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                      : 'bg-white text-gray-500 hover:text-gray-800 border border-gray-200'
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
              <div className="space-y-6">
                
                {/* Hero Feature Banner */}
                <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 rounded-3xl p-6 sm:p-8 shadow-lg shadow-blue-200 relative overflow-hidden">
                  <div className="absolute right-0 top-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/3 translate-x-1/3" />
                  <div className="absolute right-20 bottom-0 w-32 h-32 rounded-full bg-white/5 translate-y-1/2" />
                  <div className="max-w-2xl relative">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-extrabold mb-3">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Smart Xerox Booking & Document Printing</span>
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                      Pick a nearby shop, upload your document & collect easily. 🖨️
                    </h1>

                    <p className="text-sm text-blue-100 mt-2">
                      Instant page detection · B&W or Color · Duplex · 4-in-1 layout · Spiral binding · Razorpay payment
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
                  userLocationName={userLocationName}
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

      <footer className="bg-white border-t border-blue-100 text-gray-400 py-5 text-xs text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-gray-600">
            <Printer className="w-4 h-4 text-blue-500" />
            <span className="font-bold text-gray-800">Xerox Express</span>
            <span>• Instant Online Xerox Booking</span>
          </div>

          <div className="text-gray-400">
            Razorpay Payment Gateway Enabled
          </div>
        </div>
      </footer>

    </div>
  );
}
