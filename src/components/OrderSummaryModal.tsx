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
      setErrorMsg('Please enter your name');
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
            addOrder(newOrder);

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
            color: '#6366f1',
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
        addOrder(newOrder);
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        setIsProcessing(false);
        onOrderSuccess(newOrder);
      }
    } catch (err) {
      console.error('Payment launch error:', err);
      setErrorMsg('Failed to initialize Razorpay checkout. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-violet-500/30 rounded-2xl w-full max-w-xl shadow-2xl p-6 relative text-white my-8">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800/50 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Order Summary & Razorpay Checkout</h3>
            <p className="text-xs text-slate-400">Review print specifications & pay securely</p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 px-3 py-2 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleRazorpayPayment} className="space-y-4">
          
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2.5 text-xs">
            <div className="flex items-center justify-between font-medium">
              <span className="text-slate-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-violet-400" />
                <span>Document:</span>
              </span>
              <span className="text-white font-bold truncate max-w-[200px]">{document.fileName}</span>
            </div>

            <div className="flex items-center justify-between font-medium">
              <span className="text-slate-400 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-violet-400" />
                <span>Selected Xerox Shop:</span>
              </span>
              <span className="text-cyan-300 font-bold">{shop.name}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-300">
              <div>Mode: <strong className="text-white uppercase">{config.colorMode}</strong> ({config.sideMode})</div>
              <div>Layout: <strong className="text-cyan-400">{config.nUp}</strong></div>
              <div>Binding: <strong className="text-white capitalize">{config.binding}</strong></div>
              <div>Selected Pages: <strong className="text-white">{pricing.effectivePages} pgs ({pricing.sheetsNeeded} sh)</strong></div>
            </div>
          </div>

          {/* Customer Details Form */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Customer Information
            </h4>

            <div>
              <input
                type="text"
                placeholder="Full Name *"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  type="tel"
                  placeholder="Phone Number (Optional)"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-400"
                />
              </div>

              <div>
                <input
                  type="email"
                  placeholder="Email Address (Optional)"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-400"
                />
              </div>
            </div>
          </div>

          {/* NO CANCELLATION POLICY DISCLAIMER */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-[11px] text-amber-300 flex items-start gap-2">
            <AlertOctagon className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-white font-bold">No Cancellation Policy:</strong>
              <span>Once payment is processed via Razorpay, orders cannot be cancelled or refunded as printing execution begins immediately at the shop.</span>
            </div>
          </div>

          <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <div className="text-xs text-violet-200/80 font-medium">Grand Total (Incl. GST)</div>
              <div className="text-2xl font-extrabold text-cyan-400 font-mono">₹{pricing.totalCost}</div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Razorpay Secured</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isProcessing}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-extrabold text-sm transition shadow-lg shadow-violet-500/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Launching Razorpay Gateway...</span>
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 text-white" />
                <span>Pay ₹{pricing.totalCost} via Razorpay</span>
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
}
