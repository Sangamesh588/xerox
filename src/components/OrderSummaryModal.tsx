'use client';

import React, { useState } from 'react';
import {
  X, CreditCard, ShieldCheck, FileText, MapPin,
  AlertCircle, Loader2, AlertOctagon, CheckCircle2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { XeroxShop, PrintConfiguration, DocumentDetails, PriceBreakdown, XeroxOrder } from '@/types';

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}

/** Lazily loads the Razorpay checkout script. */
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      resolve(true);
      return;
    }
    const script = window.document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    window.document.body.appendChild(script);
  });
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

  const handleRazorpayPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    setErrorMsg('');
    setIsProcessing(true);

    try {
      // ── STEP 1: Load Razorpay checkout script ──────────────────────────────
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded || !window.Razorpay) {
        setErrorMsg('Failed to load payment gateway. Check your internet connection and try again.');
        setIsProcessing(false);
        return;
      }

      // ── STEP 2: Create Razorpay order on backend ──────────────────────────
      const createRes = await fetch('/api/razorpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: pricing.totalCost,   // backend converts to paise
          currency: 'INR',
          receipt: `rcpt_${Date.now()}`,
        }),
      });

      if (!createRes.ok) {
        const errData = await createRes.json().catch(() => ({}));
        setErrorMsg(errData.error || 'Failed to create payment order. Please try again.');
        setIsProcessing(false);
        return;
      }

      const rzpOrder = await createRes.json();

      // The NEXT_PUBLIC_ key is safe to use on frontend
      const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      if (!keyId) {
        setErrorMsg('Payment gateway not configured. Please contact support.');
        setIsProcessing(false);
        return;
      }

      // ── STEP 3: Build the pending order (NOT yet saved — saved after verify) ─
      const internalOrderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
      const pendingOrder: XeroxOrder = {
        id: internalOrderId,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || undefined,
        customerEmail: customerEmail.trim() || undefined,
        shopId: shop.id,
        shopName: shop.name,
        document,
        config,
        pricing,
        fulfillment: 'pickup',
        status: 'pending',
        paymentId: undefined,          // set after real payment
        paymentStatus: 'pending',      // NOT 'paid' until verified
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // ── STEP 4: Open Razorpay checkout modal ─────────────────────────────
      const options = {
        key: keyId,
        amount: rzpOrder.amount,          // in paise, as returned by backend
        currency: rzpOrder.currency || 'INR',
        name: 'Xerox Express',
        description: `Print: ${document.fileName}`,
        image: '',
        order_id: rzpOrder.id,            // Razorpay order_id from backend

        // ── STEP 5a: Payment SUCCESS ─────────────────────────────────────────
        handler: async function (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) {
          try {
            // Verify signature on backend — order is saved there only if valid
            const verifyRes = await fetch('/api/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                order: pendingOrder,       // backend saves this after verifying
              }),
            });

            const verifyData = await verifyRes.json();

            if (!verifyRes.ok || !verifyData.success) {
              setErrorMsg(verifyData.message || 'Payment verification failed. Please contact support.');
              setIsProcessing(false);
              return;
            }

            // Use the verified order returned by the backend
            const confirmedOrder: XeroxOrder = verifyData.order || {
              ...pendingOrder,
              paymentId: response.razorpay_payment_id,
              paymentStatus: 'paid' as const,
              updatedAt: new Date().toISOString(),
            };

            confetti({
              particleCount: 120,
              spread: 70,
              origin: { y: 0.6 },
            });

            setIsProcessing(false);
            onOrderSuccess(confirmedOrder);
          } catch (err) {
            console.error('Verification call failed:', err);
            setErrorMsg('Payment completed but verification failed. Please contact support with your payment ID: ' + response.razorpay_payment_id);
            setIsProcessing(false);
          }
        },

        prefill: {
          name: customerName.trim(),
          email: customerEmail.trim() || '',
          contact: customerPhone.trim() || '',
        },

        notes: {
          shop_id: shop.id,
          shop_name: shop.name,
          internal_order_id: internalOrderId,
        },

        theme: { color: '#2563eb' },

        modal: {
          // ── STEP 5b: User dismissed the modal ─────────────────────────────
          ondismiss: function () {
            setIsProcessing(false);
            setErrorMsg('Payment was cancelled. You can try again.');
          },
          escape: true,
          backdropclose: false,
          animation: true,
        },
      };

      const rzpInstance = new window.Razorpay(options);

      // ── STEP 5c: Payment FAILED event ────────────────────────────────────
      rzpInstance.on('payment.failed', function (response: {
        error: { code: string; description: string; reason: string };
      }) {
        console.error('Razorpay payment failed:', response.error);
        setIsProcessing(false);
        setErrorMsg(
          `Payment failed: ${response.error.description || response.error.reason || 'Unknown error'}. Please try again.`
        );
      });

      rzpInstance.open();
    } catch (err) {
      console.error('Checkout launch error:', err);
      setErrorMsg('Could not initialize checkout. Please try again.');
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
            <h3 className="text-base sm:text-lg font-bold text-gray-900">Order Summary &amp; Payment</h3>
            <p className="text-xs text-gray-500">Review your print specs &amp; pay securely via Razorpay</p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-2xl text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
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

          {/* Price Breakdown */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3.5 space-y-1.5 text-xs">
            {pricing.printCost > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Print Cost</span>
                <span className="font-semibold text-gray-800">₹{pricing.printCost.toFixed(2)}</span>
              </div>
            )}
            {pricing.bindingCost > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Binding</span>
                <span className="font-semibold text-gray-800">₹{pricing.bindingCost.toFixed(2)}</span>
              </div>
            )}
            {pricing.gsmCost > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Paper Grade</span>
                <span className="font-semibold text-gray-800">₹{pricing.gsmCost.toFixed(2)}</span>
              </div>
            )}
            {pricing.paperSizeCost > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Paper Size</span>
                <span className="font-semibold text-gray-800">₹{pricing.paperSizeCost.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Customer Details Form */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Your Details
            </h4>

            <input
              type="text"
              placeholder="Full Name *"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full bg-blue-50/40 border border-blue-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <input
                type="tel"
                placeholder="Phone (Optional)"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full bg-blue-50/40 border border-blue-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
              <input
                type="email"
                placeholder="Email (Optional)"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full bg-blue-50/40 border border-blue-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>
          </div>

          {/* Immediate Printing Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-[11px] text-amber-800 flex items-start gap-2">
            <AlertOctagon className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-gray-900 font-bold">Immediate Printing Notice:</strong>
              <span>Once paid, your print job is queued at {shop.name} for immediate processing.</span>
            </div>
          </div>

          {/* Security Badge */}
          <div className="flex items-center gap-2 text-[11px] text-emerald-700 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Payments are secured by Razorpay — 256-bit SSL encrypted</span>
          </div>

          {/* Price Bar + Pay Button */}
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
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-extrabold text-sm transition shadow-lg shadow-blue-200 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Connecting to Razorpay...</span>
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
