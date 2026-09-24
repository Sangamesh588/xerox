'use client';

import React, { useState, useEffect } from 'react';
import { Package, Clock, CheckCircle2, Printer, RefreshCw, FileText, Download } from 'lucide-react';
import { XeroxOrder } from '@/types';
import { fetchOrdersFromServer, getOrders } from '@/lib/storage';

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
      
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-violet-400" />
            <span>My Bookings & Live Order Tracker</span>
          </h1>
          <p className="text-xs text-slate-400">Track real-time printing progress and download document files</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadOrders}
            className="p-2.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition"
            title="Refresh order statuses"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          
          <button
            onClick={onNewOrder}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-xs transition shadow-lg shadow-violet-500/20"
          >
            + Print New Document
          </button>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
          <Printer className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-200">No Orders Placed Yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Upload your PDF or JPG file to find open Xerox shops and print instantly.
          </p>
          <button
            onClick={onNewOrder}
            className="mt-4 px-5 py-2.5 rounded-xl bg-violet-600 text-white font-bold text-xs shadow-md"
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
                className={`bg-slate-900 border rounded-2xl p-6 shadow-xl transition-all ${
                  isHighlighted ? 'border-violet-500 ring-2 ring-violet-500/20' : 'border-slate-800'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-cyan-300 font-mono text-base">{order.id}</span>
                      <span className="text-xs text-slate-500">
                        • {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-[10px] uppercase font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded">
                        {order.paymentStatus === 'paid' ? 'PAID via Razorpay' : 'Pending'}
                      </span>
                    </div>

                    <h3 className="font-bold text-white text-base mt-1 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-violet-400" />
                      <span>{order.document.fileName}</span>
                    </h3>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleDownloadFile(order)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
                    >
                      <Download className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Download Document</span>
                    </button>
                  </div>
                </div>

                <div className="py-6">
                  <div className="relative flex items-center justify-between max-w-2xl mx-auto">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-800 -z-0" />
                    <div
                      className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-violet-600 to-cyan-400 transition-all duration-500 -z-0"
                      style={{ width: `${((stepIndex - 1) / 3) * 100}%` }}
                    />

                    <div className="flex flex-col items-center relative z-10">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        stepIndex >= 1 ? 'bg-violet-600 text-white shadow-md' : 'bg-slate-800 text-slate-500'
                      }`}>
                        1
                      </div>
                      <span className="text-[11px] font-semibold text-slate-300 mt-2">Placed</span>
                    </div>

                    <div className="flex flex-col items-center relative z-10">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        stepIndex >= 2 ? 'bg-violet-600 text-white shadow-md' : 'bg-slate-800 text-slate-500'
                      }`}>
                        2
                      </div>
                      <span className="text-[11px] font-semibold text-slate-300 mt-2">Printing</span>
                    </div>

                    <div className="flex flex-col items-center relative z-10">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        stepIndex >= 3 ? 'bg-violet-600 text-white shadow-md' : 'bg-slate-800 text-slate-500'
                      }`}>
                        3
                      </div>
                      <span className="text-[11px] font-semibold text-slate-300 mt-2">Ready</span>
                    </div>

                    <div className="flex flex-col items-center relative z-10">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        stepIndex >= 4 ? 'bg-emerald-500 text-slate-950 shadow-md' : 'bg-slate-800 text-slate-500'
                      }`}>
                        ✓
                      </div>
                      <span className="text-[11px] font-semibold text-slate-300 mt-2">Completed</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400">Shop:</span>
                    <div className="font-bold text-white truncate">{order.shopName}</div>
                  </div>

                  <div>
                    <span className="text-slate-400">Configuration:</span>
                    <div className="text-slate-200 capitalize font-medium">
                      {order.config.colorMode.toUpperCase()} • {order.config.sideMode} • {order.config.nUp}
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400">Total Paid:</span>
                    <div className="font-extrabold text-cyan-400 font-mono text-sm">
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
