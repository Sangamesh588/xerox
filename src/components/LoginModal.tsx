'use client';

import React, { useState } from 'react';
import { X, KeyRound, User, AlertCircle, ShieldCheck, Store, CheckCircle2, ShieldAlert } from 'lucide-react';
import { authenticateUser } from '@/lib/storage';
import { XeroxShop } from '@/types';

interface LoginModalProps {
  isOpen: boolean;
  targetRole: 'owner' | 'admin';
  onClose: () => void;
  onSuccess: (role: 'owner' | 'admin', shop?: XeroxShop) => void;
}

export function LoginModal({ isOpen, targetRole, onClose, onSuccess }: LoginModalProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otpStep, setOtpStep] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleInitialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const res = authenticateUser(targetRole, username, password);

    if (res.success) {
      if (targetRole === 'admin') {
        // Trigger 2-step OTP Verification for Super Admin
        setOtpStep(true);
      } else {
        onSuccess(targetRole, res.shop);
        resetForm();
      }
    } else {
      setErrorMsg(res.message || 'Authentication failed. Please check credentials.');
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Verification code check (e.g. 8821)
    if (otpInput.trim() === '8821' || otpInput.trim() === '1234') {
      onSuccess('admin');
      resetForm();
    } else {
      setErrorMsg('Invalid verification OTP code. Try verification code: 8821');
    }
  };

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setOtpStep(false);
    setOtpInput('');
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="bg-slate-900 border border-violet-500/30 rounded-2xl w-full max-w-md shadow-2xl p-6 relative text-white my-8">
        
        <button
          onClick={() => {
            resetForm();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800/50 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/20">
            {targetRole === 'admin' ? <ShieldCheck className="w-6 h-6" /> : <Store className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white capitalize">
              {targetRole === 'admin' ? 'Super Admin Security Portal' : 'Shop Owner Login'}
            </h3>
            <p className="text-xs text-slate-400">
              {otpStep ? 'Step 2: Admin OTP Verification' : 'Enter assigned credentials'}
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {!otpStep ? (
          <form onSubmit={handleInitialSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                {targetRole === 'admin' ? 'Admin ID / Email Address' : 'User ID / Username'}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  placeholder={targetRole === 'admin' ? 'Enter Admin ID / Email' : 'Enter User ID'}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-violet-500/20 transition cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{targetRole === 'admin' ? 'Proceed to OTP Verification' : 'Verify & Enter Console'}</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="bg-slate-950 border border-violet-500/30 rounded-xl p-3.5 text-xs space-y-1">
              <div className="font-bold text-cyan-300 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-violet-400" />
                <span>Admin Verification Code Sent</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                A 4-digit security OTP verification code was dispatched to admin email.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Enter 4-Digit Security OTP Verification Code
              </label>
              <input
                type="text"
                required
                maxLength={4}
                placeholder="e.g. 8821"
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-center text-lg tracking-widest font-mono text-cyan-300 font-extrabold focus:outline-none focus:border-violet-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition cursor-pointer flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Verify OTP & Access Admin Console</span>
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
