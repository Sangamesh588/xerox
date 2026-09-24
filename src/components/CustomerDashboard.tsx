'use client';

import React, { useState, useEffect } from 'react';
import { Package, Clock, CheckCircle2, Printer, RefreshCw, FileText, Download } from 'lucide-react';
import { XeroxOrder } from '@/types';
import { fetchOrdersFromServer } from '@/lib/storage';

interface CustomerDashboardProps {
  onNewOrder: () => void;
  highlightOrderId?: string;
}

export function CustomerDashboard({ onNewOrder, highlightOrderId }: CustomerDashboardProps) {
  const [orders, setOrders] = useState<XeroxOrder[]>([]);

  const loadOrders = async () => {
    const fetched = await fetchOrdersFromServer();
    setOrders(fetched);
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 3000);
    return () => clearInterval(interval);
  }, []);

  const getStatusStepIndex = (status: XeroxOrder['status']) => {
    switch (status) {
      case 'pending': return 1;
      case 'printing': return 2;
      case 'ready': return 3;
      case 'completed': return 4;
      default: return 1;
    }
  };

  const handleDownloadFile = (order: XeroxOrder) => {
    if (order.document.fileUrl) {
      const a = document.createElement('a');
      a.href = order.document.fileUrl;
      a.download = order.document.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      const blob = new Blob([`Print document content for ${order.document.fileName}`], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = order.document.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-blue-100 rounded-3xl p-5 sm:p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-gray-900">
              My Orders & Live Tracker
            </h1>
            <p className="text-xs text-gray-500">Track printing progress & download document receipts</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={loadOrders}
            className="p-2.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 transition cursor-pointer"
            title="Refresh orders"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          
          <button
            type="button"
            onClick={onNewOrder}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-md shadow-blue-200 cursor-pointer"
          >
            + Print New Document
          </button>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white border border-blue-100 rounded-3xl p-10 sm:p-14 text-center text-gray-500 space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-500 flex items-center justify-center mx-auto">
            <Printer className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-gray-900">No Print Orders Placed Yet</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            Upload your document, choose a nearby Xerox shop and place an order to track live progress here.
          </p>
          <button
            type="button"
            onClick={onNewOrder}
            className="mt-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-200 cursor-pointer"
          >
            Upload Document & Book
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const stepIndex = getStatusStepIndex(order.status);
            const isHighlighted = highlightOrderId === order.id;

            return (
              <div
                key={order.id}
                className={`bg-white border rounded-3xl p-5 sm:p-6 shadow-sm transition-all space-y-4 ${
                  isHighlighted ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-blue-100'
                }`}
              >
                {/* Order Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-blue-50">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-blue-700 font-mono text-sm">{order.id}</span>
                      <span className="text-xs text-gray-400">
                        • {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-[10px] uppercase font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full">
                        {order.paymentStatus === 'paid' ? 'PAID via Razorpay' : 'Pending'}
                      </span>
                    </div>

                    <h3 className="font-bold text-gray-900 text-sm sm:text-base mt-1 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="truncate max-w-[220px] sm:max-w-md">{order.document.fileName}</span>
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDownloadFile(order)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition self-start sm:self-auto cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download File</span>
                  </button>
                </div>

                {/* Progress Stepper */}
                <div className="py-2 sm:py-4 overflow-hidden">
                  <div className="relative flex items-center justify-between max-w-xl mx-auto px-2 sm:px-4">
                    <div className="absolute left-4 right-4 sm:left-6 sm:right-6 top-1/2 -translate-y-1/2 h-1 bg-gray-200 z-0" />
                    <div
                      className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 h-1 bg-blue-600 transition-all duration-500 z-0"
                      style={{ width: `calc(${((stepIndex - 1) / 3) * 100}% - 8px)` }}
                    />

                    {[
                      { step: 1, label: 'Placed' },
                      { step: 2, label: 'Printing' },
                      { step: 3, label: 'Ready' },
                      { step: 4, label: 'Completed' },
                    ].map(({ step, label }) => (
                      <div key={step} className="flex flex-col items-center relative z-10">
                        <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[11px] sm:text-xs font-extrabold shadow-sm transition ${
                          stepIndex >= step
                            ? 'bg-blue-600 text-white ring-2 sm:ring-4 ring-blue-100'
                            : 'bg-white border-2 border-gray-300 text-gray-400'
                        }`}>
                          {stepIndex > step ? '✓' : step}
                        </div>
                        <span className={`text-[10px] sm:text-[11px] font-bold mt-1 ${
                          stepIndex >= step ? 'text-blue-700' : 'text-gray-400'
                        }`}>
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Summary Info Box */}
                <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-gray-500 block text-[11px]">Xerox Shop:</span>
                    <div className="font-bold text-gray-900 truncate">{order.shopName}</div>
                  </div>

                  <div>
                    <span className="text-gray-500 block text-[11px]">Print Config:</span>
                    <div className="text-gray-800 capitalize font-medium">
                      {order.config.colorMode.toUpperCase()} • {order.config.sideMode} • {order.config.nUp}
                    </div>
                  </div>

                  <div>
                    <span className="text-gray-500 block text-[11px]">Total Paid:</span>
                    <div className="font-extrabold text-blue-700 font-mono text-sm">
                      ₹{order.pricing.totalCost}
                    </div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
