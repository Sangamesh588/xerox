'use client';

import React, { useState } from 'react';
import {
  Sliders,
  Check,
  Zap,
  Info,
  Layers,
  ArrowRight,
  FileCheck,
  Sparkles,
} from 'lucide-react';
import { PrintConfiguration, XeroxShop, DocumentDetails } from '@/types';
import { calculatePrice } from '@/lib/pricing';

interface PrintConfiguratorProps {
  document: DocumentDetails;
  config: PrintConfiguration;
  onConfigChange: (config: PrintConfiguration) => void;
  selectedShop: XeroxShop;
  onProceedToCheckout: () => void;
}

export function PrintConfigurator({
  document,
  config,
  onConfigChange,
  selectedShop,
  onProceedToCheckout,
}: PrintConfiguratorProps) {
  const price = calculatePrice(document.totalPages, config, selectedShop);

  const [customStart, setCustomStart] = useState<number>(config.startPage || 1);
  const [customEnd, setCustomEnd] = useState<number>(config.endPage || document.totalPages);

  const updateConfig = (key: keyof PrintConfiguration, value: unknown) => {
    onConfigChange({
      ...config,
      [key]: value,
    });
  };

  const applyCustomRange = () => {
    const validStart = Math.max(1, Math.min(document.totalPages, customStart));
    const validEnd = Math.max(validStart, Math.min(document.totalPages, customEnd));

    setCustomStart(validStart);
    setCustomEnd(validEnd);

    onConfigChange({
      ...config,
      pageRangeType: 'custom',
      startPage: validStart,
      endPage: validEnd,
      customPageRange: `${validStart}-${validEnd}`,
    });
  };

  return (
    <div className="bg-white border border-blue-100 rounded-3xl p-4 sm:p-6 shadow-sm space-y-5 sm:space-y-6 w-full max-w-full overflow-hidden">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-blue-50">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <Sliders className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span>Step 3 — Print & Xerox Options</span>
          </h2>
          <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5 ml-10">
            Customize color mode, duplex sides, layout, binding and copies
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 text-blue-800 text-xs px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 self-start sm:self-auto shadow-xs">
          <Zap className="w-3.5 h-3.5 text-blue-600 fill-blue-600" />
          <span>Shop: {selectedShop.name}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column - Options */}
        <div className="space-y-5">
          
          {/* Color Mode */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              1. Color Option
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => updateConfig('colorMode', 'bw')}
                className={`flex items-center justify-between p-3.5 rounded-2xl border-2 text-xs sm:text-sm font-bold transition cursor-pointer ${
                  config.colorMode === 'bw'
                    ? 'border-blue-600 bg-blue-50/80 text-blue-900 shadow-sm ring-1 ring-blue-500/30'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300'
                }`}
              >
                <span>Black & White</span>
                <span className="text-xs text-blue-600 font-mono font-extrabold">₹{selectedShop.rates.bwSingle}/pg</span>
              </button>

              <button
                type="button"
                onClick={() => updateConfig('colorMode', 'color')}
                className={`flex items-center justify-between p-3.5 rounded-2xl border-2 text-xs sm:text-sm font-bold transition cursor-pointer ${
                  config.colorMode === 'color'
                    ? 'border-blue-600 bg-blue-50/80 text-blue-900 shadow-sm ring-1 ring-blue-500/30'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300'
                }`}
              >
                <span>Full Color</span>
                <span className="text-xs text-blue-600 font-mono font-extrabold">₹{selectedShop.rates.colorSingle}/pg</span>
              </button>
            </div>
          </div>

          {/* Print Sides (Single vs Double / Duplex) */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              2. Print Sides
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => updateConfig('sideMode', 'double')}
                className={`p-3.5 rounded-2xl border-2 text-left transition cursor-pointer ${
                  config.sideMode === 'double'
                    ? 'border-blue-600 bg-blue-50/80 text-blue-900 shadow-sm ring-1 ring-blue-500/30'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300'
                }`}
              >
                <div className="font-bold text-xs sm:text-sm flex items-center justify-between">
                  <span>Front & Back (Duplex)</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">Saves Paper</span>
                </div>
                <div className="text-[11px] text-gray-500 mt-1">Both sides of sheet (₹{selectedShop.rates.bwDouble}/sheet)</div>
              </button>

              <button
                type="button"
                onClick={() => updateConfig('sideMode', 'single')}
                className={`p-3.5 rounded-2xl border-2 text-left transition cursor-pointer ${
                  config.sideMode === 'single'
                    ? 'border-blue-600 bg-blue-50/80 text-blue-900 shadow-sm ring-1 ring-blue-500/30'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300'
                }`}
              >
                <div className="font-bold text-xs sm:text-sm">Single Sided</div>
                <div className="text-[11px] text-gray-500 mt-1">One page per separate sheet</div>
              </button>
            </div>
          </div>

          {/* Layout (N-Up / 4-in-1 Option) */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              3. Multi-Page Layout (N-Up)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: '1in1', name: '1-in-1', desc: 'Standard (1 pg/sheet)' },
                { id: '2in1', name: '2-in-1', desc: '2 pages/sheet' },
                { id: '4in1', name: '4-in-1', desc: '4 pgs/sheet (2 front, 2 back)' },
              ].map((layout) => (
                <button
                  key={layout.id}
                  type="button"
                  onClick={() => updateConfig('nUp', layout.id)}
                  className={`p-3 rounded-2xl border-2 text-center transition cursor-pointer flex flex-col items-center justify-center ${
                    config.nUp === layout.id
                      ? 'border-blue-600 bg-blue-50/80 text-blue-900 shadow-sm ring-1 ring-blue-500/30'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300'
                  }`}
                >
                  <span className="font-extrabold text-xs sm:text-sm">{layout.name}</span>
                  <span className="text-[10px] text-gray-500 mt-0.5 line-clamp-1">{layout.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Binding Option */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              4. Binding & Finishing
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'none', label: 'No Binding', cost: 0 },
                { id: 'staple', label: 'Corner Clip', cost: selectedShop.rates.cornerClip },
                { id: 'spiral', label: 'Spiral Binding', cost: selectedShop.rates.spiralBinding },
                { id: 'hardcover', label: 'Hardcover Thesis', cost: selectedShop.rates.hardBinding },
              ].map((bind) => (
                <button
                  key={bind.id}
                  type="button"
                  onClick={() => updateConfig('binding', bind.id)}
                  className={`p-3 rounded-2xl border-2 text-left transition cursor-pointer ${
                    config.binding === bind.id
                      ? 'border-blue-600 bg-blue-50/80 text-blue-900 shadow-sm ring-1 ring-blue-500/30'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300'
                  }`}
                >
                  <div className="font-bold text-xs truncate">{bind.label}</div>
                  <div className="text-[11px] text-blue-600 font-mono font-bold mt-0.5">
                    {bind.cost > 0 ? `+₹${bind.cost}` : 'Free'}
                  </div>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column - Page Range & Summary */}
        <div className="space-y-5">
          
          {/* Page Range Selection */}
          <div className="bg-blue-50/50 border border-blue-200 rounded-2xl p-4 space-y-3">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
              5. Page Range
            </label>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => updateConfig('pageRangeType', 'all')}
                className={`py-2.5 px-3 rounded-xl border-2 text-xs font-bold transition cursor-pointer text-center ${
                  config.pageRangeType === 'all'
                    ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300'
                }`}
              >
                All Pages (1-{document.totalPages})
              </button>

              <button
                type="button"
                onClick={() => updateConfig('pageRangeType', 'custom')}
                className={`py-2.5 px-3 rounded-xl border-2 text-xs font-bold transition cursor-pointer text-center ${
                  config.pageRangeType === 'custom'
                    ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300'
                }`}
              >
                Custom Page Range
              </button>
            </div>

            {config.pageRangeType === 'custom' && (
              <div className="p-3 bg-white border border-blue-200 rounded-xl space-y-2.5">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-gray-500">From Page:</span>
                  <input
                    type="number"
                    min={1}
                    max={document.totalPages}
                    value={customStart}
                    onChange={(e) => setCustomStart(parseInt(e.target.value, 10) || 1)}
                    className="w-16 border border-blue-300 rounded-lg px-2 py-1 text-center font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-gray-500">To Page:</span>
                  <input
                    type="number"
                    min={customStart}
                    max={document.totalPages}
                    value={customEnd}
                    onChange={(e) => setCustomEnd(parseInt(e.target.value, 10) || document.totalPages)}
                    className="w-16 border border-blue-300 rounded-lg px-2 py-1 text-center font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={applyCustomRange}
                  className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>Apply Range ({Math.max(1, customEnd - customStart + 1)} pgs)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Paper Size & GSM */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Paper Size
              </label>
              <select
                value={config.paperSize}
                onChange={(e) => updateConfig('paperSize', e.target.value)}
                className="w-full bg-blue-50/50 border border-blue-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="A4">A4 (Standard)</option>
                <option value="A3">A3 (Poster)</option>
                <option value="Legal">Legal Size</option>
                <option value="Letter">Letter Size</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Paper Quality
              </label>
              <select
                value={config.paperGsm}
                onChange={(e) => updateConfig('paperGsm', e.target.value)}
                className="w-full bg-blue-50/50 border border-blue-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="70">70 GSM Standard</option>
                <option value="80">80 GSM Executive (+₹0.50)</option>
                <option value="100">100 GSM Glossy (+₹1.50)</option>
              </select>
            </div>
          </div>

          {/* Total Copies */}
          <div className="bg-blue-50/50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="font-bold text-gray-900 text-xs block">Number of Sets / Copies</span>
              <span className="text-[11px] text-gray-500">How many complete sets to print</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => updateConfig('copies', Math.max(1, config.copies - 1))}
                className="w-8 h-8 rounded-xl bg-white border border-blue-200 text-gray-800 font-extrabold text-base hover:bg-blue-100 flex items-center justify-center transition shadow-xs cursor-pointer"
              >
                -
              </button>
              <span className="font-extrabold text-gray-900 text-base w-6 text-center">{config.copies}</span>
              <button
                type="button"
                onClick={() => updateConfig('copies', config.copies + 1)}
                className="w-8 h-8 rounded-xl bg-white border border-blue-200 text-gray-800 font-extrabold text-base hover:bg-blue-100 flex items-center justify-center transition shadow-xs cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          {/* Dynamic Price Breakdown Summary Card */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl p-5 text-white shadow-xl shadow-blue-200 space-y-3.5">
            <div className="flex justify-between text-xs text-blue-100">
              <span>Pages to Print:</span>
              <span className="font-mono font-bold text-white">{price.effectivePages} pgs × {config.copies} set(s)</span>
            </div>

            <div className="flex justify-between text-xs text-blue-100">
              <span>Paper Sheets Required:</span>
              <span className="font-mono font-bold text-white">{price.sheetsNeeded} Physical Sheets</span>
            </div>

            {price.bindingCost > 0 && (
              <div className="flex justify-between text-xs text-blue-100">
                <span>Binding Fee:</span>
                <span className="font-mono font-bold text-white">₹{price.bindingCost}</span>
              </div>
            )}

            <div className="pt-3 border-t border-white/20 flex justify-between items-center">
              <div>
                <span className="text-xs text-blue-100 block">Total Amount to Pay</span>
                <span className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight">
                  ₹{price.totalCost}
                </span>
              </div>

              <button
                type="button"
                onClick={onProceedToCheckout}
                className="px-6 py-3 rounded-2xl bg-white hover:bg-blue-50 text-blue-700 font-extrabold text-xs sm:text-sm shadow-lg transition flex items-center gap-2 cursor-pointer shrink-0"
              >
                <span>Proceed to Pay</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
