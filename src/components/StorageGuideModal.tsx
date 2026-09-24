'use client';

import React from 'react';
import { X, HardDrive, CheckCircle2, ShieldCheck, Zap, Sparkles, ExternalLink } from 'lucide-react';

interface StorageGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StorageGuideModal({ isOpen, onClose }: StorageGuideModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl p-6 relative text-white my-8">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800/50 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Best Free & Long-Term Storage Recommendation</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-extrabold uppercase px-2 py-0.5 rounded">
                Free Forever
              </span>
            </h3>
            <p className="text-xs text-slate-400">Comparing top free cloud storage options for Xerox document hosting</p>
          </div>
        </div>

        <div className="space-y-4 text-xs">
          
          {/* Top Recommendation #1: Supabase Storage */}
          <div className="bg-slate-950 border border-emerald-500/40 rounded-xl p-4 space-y-2 relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                  🥇 Best Overall for Next.js & Xerox Booking
                </span>
                <h4 className="text-base font-bold text-white flex items-center gap-2 mt-0.5">
                  <span>Supabase Storage + Postgres DB</span>
                </h4>
              </div>
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold px-2.5 py-1 rounded-lg">
                1 GB Free Storage + 500MB DB
              </span>
            </div>

            <p className="text-slate-300 leading-relaxed">
              Supabase gives you 1GB of free object storage alongside a full PostgreSQL database. Perfect for storing PDF document uploads, Xerox shop metadata, order state, and customer records with built-in Auth.
            </p>

            <div className="bg-slate-900 rounded-lg p-2.5 font-mono text-[11px] text-slate-300 space-y-1">
              <div className="text-amber-400 font-semibold">// Installing Supabase JS Client</div>
              <div>npm install @supabase/supabase-js</div>
            </div>
          </div>

          {/* Recommendation #2: Cloudflare R2 */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                  🥈 Highest Free Capacity & Zero Egress Fees
                </span>
                <h4 className="text-base font-bold text-white mt-0.5">Cloudflare R2 Object Storage</h4>
              </div>
              <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[11px] font-bold px-2.5 py-1 rounded-lg">
                10 GB Free Monthly Storage
              </span>
            </div>

            <p className="text-slate-300 leading-relaxed">
              Cloudflare R2 provides 10GB free tier every month with <strong>Zero Egress / Bandwidth fees</strong>! Ideal if you expect high volumes of heavy student PDF project files.
            </p>
          </div>

          {/* Recommendation #3: Cloudinary / Firebase */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-1">
              <div className="font-bold text-white">Cloudinary</div>
              <div className="text-emerald-400 font-bold">25 GB Free Credits</div>
              <p className="text-[11px] text-slate-400">Great for automatic PDF image preview thumbnail generation.</p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-1">
              <div className="font-bold text-white">Firebase Storage</div>
              <div className="text-amber-400 font-bold">5 GB Free Storage</div>
              <p className="text-[11px] text-slate-400">Google Cloud backed storage with real-time listeners.</p>
            </div>
          </div>

        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition"
        >
          Got It, Thanks!
        </button>

      </div>
    </div>
  );
}
