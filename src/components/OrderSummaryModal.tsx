'use client';

import React, { useState } from 'react';
import { X, CreditCard, ShieldCheck, FileText, MapPin, AlertCircle, Loader2, AlertOctagon } from 'lucide-react';
import confetti from 'canvas-confetti';
import { XeroxShop, PrintConfiguration, DocumentDetails, PriceBreakdown, XeroxOrder } from '@/types';
import { addOrder } from '@/lib/storage';

interface OrderSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentDetails;
  config: PrintConfiguration;
  shop: XeroxShop;
  pricing: PriceBreakdown;
  onOrderSuccess: (order: XeroxOrder) => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function OrderSummaryModal({
  isOpen,
  onClose,
  document,
  config,
  shop,
  pricing,
  onOrderSuccess,
}: OrderSummaryModalProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && window.Razorpay) {
        resolve(true);
        return;
      }
      const script = window.document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      window.document.body.appendChild(script);
    });
  };

  const handleRazorpayPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName) {
      setErrorMsg('Please enter your full name');
      return;
    }

    setErrorMsg('');
    setIsProcessing(true);

    try {
      const orderIdStr = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;

      const response = await fetch('/api/razorpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: pricing.totalCost,
          currency: 'INR',
          orderId: orderIdStr,
        }),
      });

      const rzpOrderData = await response.json();
      const isLoaded = await loadRazorpayScript();

      const newOrder: XeroxOrder = {
        id: orderIdStr,
        customerName,
        customerPhone: customerPhone || undefined,
        customerEmail: customerEmail || undefined,
        shopId: shop.id,
        shopName: shop.name,
        document,
        config,
        pricing,
        fulfillment: 'pickup',
        status: 'pending',
        paymentId: `pay_${Math.random().toString(36).substring(2, 12)}`,
        paymentStatus: 'paid',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (isLoaded && window.Razorpay) {
        const options = {
          key: rzpOrderData.key || 'rzp_test_XeroxBooking2026',
          amount: rzpOrderData.amount,
          currency: rzpOrderData.currency || 'INR',
          name: 'Xerox Express',
          description: `Print Job: ${document.fileName}`,
          order_id: rzpOrderData.id,
          handler: async function (res: any) {
            await fetch('/api/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: res.razorpay_order_id,
                razorpay_payment_id: res.razorpay_payment_id,
                razorpay_signature: res.razorpay_signature,
              }),
            });

            newOrder.paymentId = res.razorpay_payment_id || newOrder.paymentId;
            await addOrder(newOrder);

            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
            });

            setIsProcessing(false);
            onOrderSuccess(newOrder);
          },
          prefill: {
            name: customerName,
            email: customerEmail || '',
            contact: customerPhone || '',
          },
          theme: {
            color: '#2563eb',
          },
          modal: {
            ondismiss: function () {
              setIsProcessing(false);
            },
          },
        };

        const rzpInstance = new window.Razorpay(options);
        rzpInstance.open();
      } else {
        await addOrder(newOrder);
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        setIsProcessing(false);
        onOrderSuccess(newOrder);
      }
    } catch (err) {
      console.error('Payment launch error:', err);
      setErrorMsg('Failed to initialize checkout. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-md overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-5 sm:p-7 relative my-6 text-gray-900 border border-blue-100">
        
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-xs">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900">Order Summary & Payment</h3>
            <p className="text-xs text-gray-500">Review your print specs & pay securely</p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-2xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleRazorpayPayment} className="space-y-4">
          
          {/* Order Specs Box */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 space-y-2.5 text-xs">
            <div className="flex items-center justify-between font-medium gap-2">
              <span className="text-gray-600 flex items-center gap-1.5 shrink-0">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>Document:</span>
              </span>
              <span className="text-gray-900 font-bold truncate max-w-[180px] sm:max-w-[240px]">{document.fileName}</span>
            </div>

            <div className="flex items-center justify-between font-medium gap-2">
              <span className="text-gray-600 flex items-center gap-1.5 shrink-0">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span>Shop:</span>
              </span>
              <span className="text-blue-700 font-bold truncate max-w-[180px] sm:max-w-[240px]">{shop.name}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-blue-200 text-[11px] text-gray-700">
              <div>Color: <strong className="text-gray-900 uppercase font-bold">{config.colorMode}</strong> ({config.sideMode})</div>
              <div>Layout: <strong className="text-blue-700 font-bold">{config.nUp}</strong></div>
              <div>Binding: <strong className="text-gray-900 capitalize font-bold">{config.binding}</strong></div>
              <div>Pages: <strong className="text-gray-900 font-bold">{pricing.effectivePages} pgs × {config.copies} set</strong></div>
            </div>
          </div>

          {/* Customer Details Form */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Customer Details
            </h4>

            <div>
              <input
                type="text"
                placeholder="Full Name *"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-blue-50/40 border border-blue-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <input
                  type="tel"
                  placeholder="Phone (Optional)"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full bg-blue-50/40 border border-blue-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div>
                <input
                  type="email"
                  placeholder="Email (Optional)"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full bg-blue-50/40 border border-blue-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Policy Banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-[11px] text-amber-800 flex items-start gap-2">
            <AlertOctagon className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-gray-900 font-bold">Immediate Printing Notice:</strong>
              <span>Once paid, your print job is queued directly at {shop.name} for immediate execution.</span>
            </div>
          </div>

          {/* Price Bar */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500 font-semibold">Total Amount</div>
              <div className="text-2xl font-extrabold text-blue-700 font-mono">₹{pricing.totalCost}</div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Razorpay Secured</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isProcessing}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-sm transition shadow-lg shadow-blue-200 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Connecting to Payment Gateway...</span>
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 text-white" />
                <span>Pay ₹{pricing.totalCost} Securely</span>
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
}
