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
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-violet-400" />
            <span>2. Print & Xerox Customizations</span>
          </h2>
          <p className="text-xs text-slate-400">Configure layout, sides, binding, paper GSM and customized page range</p>
        </div>

        <div className="bg-violet-500/10 border border-violet-500/20 text-cyan-300 text-xs px-3 py-1 rounded-full font-semibold flex items-center gap-1">
          <Zap className="w-3.5 h-3.5 text-cyan-400" />
          <span>Shop: {selectedShop.name}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Column - Print Options */}
        <div className="space-y-5">
          
          {/* Color Mode */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Color Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => updateConfig('colorMode', 'bw')}
                className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-semibold transition ${
                  config.colorMode === 'bw'
                    ? 'border-violet-500 bg-violet-500/10 text-white shadow-md'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <span>Black & White</span>
                <span className="text-xs text-cyan-400 font-mono">₹{selectedShop.rates.bwSingle}/pg</span>
              </button>

              <button
                type="button"
                onClick={() => updateConfig('colorMode', 'color')}
                className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-semibold transition ${
                  config.colorMode === 'color'
                    ? 'border-violet-500 bg-violet-500/10 text-white shadow-md'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <span>Full Color</span>
                <span className="text-xs text-cyan-400 font-mono">₹{selectedShop.rates.colorSingle}/pg</span>
              </button>
            </div>
          </div>

          {/* Front & Back / Single Sided */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Print Sides (Duplex / Simplex)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => updateConfig('sideMode', 'double')}
                className={`flex flex-col items-start p-3 rounded-xl border transition ${
                  config.sideMode === 'double'
                    ? 'border-violet-500 bg-violet-500/10 text-white'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-sm">Front & Back (Duplex)</span>
                  {config.sideMode === 'double' && <Check className="w-4 h-4 text-cyan-400" />}
                </div>
                <span className="text-[11px] text-slate-400 mt-0.5">Saves paper & cost</span>
              </button>

              <button
                type="button"
                onClick={() => updateConfig('sideMode', 'single')}
                className={`flex flex-col items-start p-3 rounded-xl border transition ${
                  config.sideMode === 'single'
                    ? 'border-violet-500 bg-violet-500/10 text-white'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-sm">Single Sided</span>
                  {config.sideMode === 'single' && <Check className="w-4 h-4 text-cyan-400" />}
                </div>
                <span className="text-[11px] text-slate-400 mt-0.5">One side per sheet</span>
              </button>
            </div>
          </div>

          {/* N-Up Layout (Pages Per Sheet) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Pages Per Sheet (N-Up Layout)
              </label>
              <span className="text-[11px] text-cyan-400 flex items-center gap-1">
                <Info className="w-3 h-3" />
                <span>4-in-1 = 2 front, 2 back</span>
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => updateConfig('nUp', '1in1')}
                className={`p-2.5 rounded-xl border text-center transition ${
                  config.nUp === '1in1'
                    ? 'border-violet-500 bg-violet-500/10 text-white font-bold'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-bold">1 Page / Sheet</div>
                <div className="text-[10px] text-slate-400">Standard</div>
              </button>

              <button
                type="button"
                onClick={() => updateConfig('nUp', '2in1')}
                className={`p-2.5 rounded-xl border text-center transition ${
                  config.nUp === '2in1'
                    ? 'border-violet-500 bg-violet-500/10 text-white font-bold'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-bold">2-in-1 Layout</div>
                <div className="text-[10px] text-slate-400">Compact Notes</div>
              </button>

              <button
                type="button"
                onClick={() => updateConfig('nUp', '4in1')}
                className={`p-2.5 rounded-xl border text-center transition ${
                  config.nUp === '4in1'
                    ? 'border-violet-500 bg-violet-500/10 text-white font-bold'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-bold">4-in-1 Layout</div>
                <div className="text-[10px] text-cyan-300">2 Front, 2 Back</div>
              </button>
            </div>
          </div>

          {/* Binding Options */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Binding & Finishing
            </label>
            <select
              value={config.binding}
              onChange={(e) => updateConfig('binding', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500 font-medium"
            >
              <option value="none">No Special Binding (Free Corner Staple)</option>
              <option value="spiral">Soft Spiral / Coil Binding (+₹{selectedShop.rates.spiralBinding})</option>
              <option value="hardcover">Thesis Hard Cover Binding (+₹{selectedShop.rates.hardBinding})</option>
              <option value="corner_clip">Corner Clip / Strip Binding (+₹{selectedShop.rates.cornerClip})</option>
            </select>
          </div>

        </div>

        {/* Right Column - Custom Page Selection Range & Price Summary */}
        <div className="space-y-5">
          
          {/* CUSTOM PAGE RANGE SELECTION WITH DYNAMIC AMOUNT RECALCULATION */}
          <div className="bg-slate-950 border border-violet-500/30 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-cyan-400" />
                <span>Customize Pages Range</span>
              </label>
              <span className="text-[11px] text-slate-400">Total File Pages: {document.totalPages}</span>
            </div>

            {/* Range Mode Switcher */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  updateConfig('pageRangeType', 'all');
                  setCustomStart(1);
                  setCustomEnd(document.totalPages);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                  config.pageRangeType === 'all'
                    ? 'border-violet-500 bg-violet-500/10 text-white'
                    : 'border-slate-800 bg-slate-900 text-slate-400'
                }`}
              >
                All Pages (1 to {document.totalPages})
              </button>

              <button
                type="button"
                onClick={() => updateConfig('pageRangeType', 'custom')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                  config.pageRangeType === 'custom'
                    ? 'border-violet-500 bg-violet-500/10 text-white'
                    : 'border-slate-800 bg-slate-900 text-slate-400'
                }`}
              >
                Select Specific Range
              </button>
            </div>

            {/* Custom Range Inputs */}
            {config.pageRangeType === 'custom' && (
              <div className="space-y-2.5 pt-2 border-t border-slate-800">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-1">Start Page (Min: 1)</span>
                    <input
                      type="number"
                      min={1}
                      max={document.totalPages}
                      value={customStart}
                      onChange={(e) => setCustomStart(parseInt(e.target.value, 10) || 1)}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-xs font-bold text-center focus:outline-none focus:border-violet-400"
                    />
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-400 block mb-1">End Page (Max: {document.totalPages})</span>
                    <input
                      type="number"
                      min={customStart}
                      max={document.totalPages}
                      value={customEnd}
                      onChange={(e) => setCustomEnd(parseInt(e.target.value, 10) || document.totalPages)}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-xs font-bold text-center focus:outline-none focus:border-violet-400"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={applyCustomRange}
                  className="w-full py-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow"
                >
                  <span>Apply Custom Range & Calculate Amount</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Range Selection Status Banner */}
            <div className="text-[11px] text-cyan-300 font-medium bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
              {config.pageRangeType === 'custom' ? (
                <span>Printing from <strong>Page {config.startPage || customStart}</strong> to <strong>Page {config.endPage || customEnd}</strong> ({price.effectivePages} pages total)</span>
              ) : (
                <span>Printing <strong>All {document.totalPages} Pages</strong></span>
              )}
            </div>
          </div>

          {/* Paper GSM & Size */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Paper GSM (Quality)
              </label>
              <select
                value={config.paperGsm}
                onChange={(e) => updateConfig('paperGsm', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
              >
                <option value="70">70 GSM (Standard)</option>
                <option value="80">80 GSM (+₹0.50/sh)</option>
                <option value="100">100 GSM Photo (+₹1.50/sh)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Paper Size
              </label>
              <select
                value={config.paperSize}
                onChange={(e) => updateConfig('paperSize', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
              >
                <option value="A4">A4 (Standard)</option>
                <option value="A3">A3 (Large Poster)</option>
                <option value="Legal">Legal Size</option>
                <option value="Letter">Letter Size</option>
              </select>
            </div>
          </div>

          {/* Number of Copies */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Total Copies
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => updateConfig('copies', Math.max(1, config.copies - 1))}
                className="w-9 h-9 rounded-lg bg-slate-950 border border-slate-800 text-white font-bold text-lg hover:border-slate-600"
              >
                -
              </button>
              <span className="font-extrabold text-white text-lg w-8 text-center">{config.copies}</span>
              <button
                type="button"
                onClick={() => updateConfig('copies', config.copies + 1)}
                className="w-9 h-9 rounded-lg bg-slate-950 border border-slate-800 text-white font-bold text-lg hover:border-slate-600"
              >
                +
              </button>
              <span className="text-xs text-slate-400">set(s) of document</span>
            </div>
          </div>

          {/* Dynamic Live Cost Summary Card */}
          <div className="bg-slate-950 border border-violet-500/40 rounded-xl p-4 space-y-2.5">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Selected Pages:</span>
              <span className="text-white font-mono">{price.effectivePages} pgs × {config.copies} copy</span>
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>Physical Paper Sheets Needed:</span>
              <span className="text-cyan-400 font-mono font-bold">{price.sheetsNeeded} Sheets</span>
            </div>
            {price.bindingCost > 0 && (
              <div className="flex justify-between text-xs text-slate-400">
                <span>Binding Fee:</span>
                <span className="text-white font-mono">₹{price.bindingCost}</span>
              </div>
            )}
            <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
              <span className="text-sm font-bold text-slate-200">Total Price:</span>
              <span className="text-2xl font-extrabold text-cyan-400 font-mono">
                ₹{price.totalCost}
              </span>
            </div>

            <button
              onClick={onProceedToCheckout}
              className="w-full mt-3 py-3 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-extrabold text-sm transition shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Select Xerox Shop & Checkout</span>
              <Zap className="w-4 h-4 fill-white" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
