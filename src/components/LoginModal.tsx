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

  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const res = await authenticateUser(targetRole, username, password);

    if (res.success) {
      if (targetRole === 'admin') {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-md animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-5 sm:p-7 relative text-gray-900 my-6 border border-blue-100">
        
        <button
          type="button"
          onClick={() => {
            resetForm();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            {targetRole === 'admin' ? <ShieldCheck className="w-6 h-6" /> : <Store className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 capitalize">
              {targetRole === 'admin' ? 'Super Admin Portal' : 'Shop Owner Login'}
            </h3>
            <p className="text-xs text-gray-500">
              {otpStep ? 'Step 2: Admin OTP Verification' : 'Enter assigned login credentials'}
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-2xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {!otpStep ? (
          <form onSubmit={handleInitialSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                {targetRole === 'admin' ? 'Admin ID / Email Address' : 'User ID / Username'}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-blue-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  placeholder={targetRole === 'admin' ? 'Enter Admin ID / Email' : 'Enter User ID'}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-blue-50/40 border border-blue-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-blue-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-blue-50/40 border border-blue-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-sm shadow-lg shadow-blue-200 transition cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{targetRole === 'admin' ? 'Proceed to OTP Verification' : 'Verify & Enter Console'}</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-3.5 text-xs space-y-1">
              <div className="font-bold text-blue-800 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-blue-600" />
                <span>Admin Verification Code</span>
              </div>
              <p className="text-gray-600 text-[11px]">
                Enter the 4-digit code (use <strong className="text-blue-700">8821</strong> for testing).
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                4-Digit Security OTP Code
              </label>
              <input
                type="text"
                required
                maxLength={4}
                placeholder="e.g. 8821"
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value)}
                className="w-full bg-blue-50/40 border border-blue-200 rounded-2xl px-4 py-3 text-center text-xl tracking-widest font-mono text-blue-700 font-extrabold focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-sm shadow-lg shadow-emerald-200 transition cursor-pointer flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Verify OTP & Access Console</span>
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
