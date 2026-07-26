/**
 * z-index layering reference:
 * - Modals & Overlays (e.g. AuthModal, SettingsModal, CommandPalette): z-[100]
 * - Floating UI & Rails (e.g. Left/Right rails, Floating Space Agent Panel, FAB): z-20 to z-40
 * - Workspace / Editor Content (e.g. Doc Editor, Canvas elements): z-0 to z-10
 */

import React, { useState } from 'react';
import { LogIn, UserPlus, KeyRound, Sparkles, LogOut } from 'lucide-react';
import { supabase } from '../../utils/supabase.js';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (email: string) => void;
  userEmail: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  userEmail
}) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const isGuest = userEmail.includes('guest') || userEmail === 'Guest User';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    if (!supabase) {
      setErrorMsg('Supabase is not configured.');
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        onAuthSuccess(data.user?.email || email);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onAuthSuccess(data.user?.email || email);
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    if (supabase) {
      await supabase.auth.signOut();
    }
    onAuthSuccess('guest@catnoted.com');
    setLoading(false);
    onClose();
  };

  const handleGuestMode = () => {
    onAuthSuccess('Guest User');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/30 dark:bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl w-full max-w-[340px] p-5 shadow-xl relative transition-all">
        
        {/* Header - Calm AFFiNE design with soft brand accent */}
        <div className="flex flex-col items-center text-center mb-4">
          <div className="w-9 h-9 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-2.5">
            <KeyRound className="w-4 h-4" />
          </div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-zinc-100 tracking-tight">
            {!isGuest ? 'Workspace Account' : isSignUp ? 'Create your workspace' : 'Welcome back'}
          </h2>
          {!isGuest ? (
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1 leading-relaxed">
              You are currently logged in securely.
            </p>
          ) : (
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1 max-w-[260px] leading-relaxed">
              End-to-End Encryption keeps your spatial notes completely private.
            </p>
          )}
        </div>

        {errorMsg && (
          <div className="mb-3.5 p-2 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-[11px] font-medium rounded-lg border border-red-100 dark:border-red-900/20 text-center">
            {errorMsg}
          </div>
        )}

        {!isGuest ? (
          <div className="flex flex-col items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-zinc-850 flex items-center justify-center text-slate-700 dark:text-zinc-200 text-base font-semibold border border-slate-100 dark:border-zinc-800">
              {userEmail.charAt(0).toUpperCase()}
            </div>
            <div className="text-xs font-medium text-slate-700 dark:text-zinc-300 text-center break-all px-2">
              {userEmail}
            </div>
            <button
              onClick={handleLogout}
              disabled={loading}
              className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
            >
              <LogOut className="w-3.5 h-3.5" />
              {loading ? 'Logging out...' : 'Log Out'}
            </button>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Form Grouping with Clear Visual Boundaries */}
              <div className="rounded-xl border border-slate-200/80 dark:border-zinc-800/80 bg-slate-50/30 dark:bg-[#16161a]/10 p-3 space-y-2.5 shadow-sm">
                <div className="space-y-1">
                  <label className="block text-[10px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                    Email address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@domain.com"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#16161a] text-xs text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#16161a] text-xs text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Stronger Primary CTA */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm hover:shadow transition-all disabled:opacity-50 mt-1"
              >
                {isSignUp ? <UserPlus className="w-3.5 h-3.5" /> : <LogIn className="w-3.5 h-3.5" />}
                {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
              </button>
            </form>

            {/* Restrained Separator */}
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-100 dark:border-zinc-800/50"></div>
              <span className="flex-shrink mx-2.5 text-[9px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
                or
              </span>
              <div className="flex-grow border-t border-slate-100 dark:border-zinc-800/50"></div>
            </div>

            {/* Offline Guest Mode Button - Subtle and Calm */}
            <button
              onClick={handleGuestMode}
              className="w-full py-2 rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-850/60 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-zinc-100 font-medium text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
              Continue in Offline Guest Mode
            </button>

            {/* Navigation Toggle */}
            <div className="pt-2.5 text-center text-[11px]">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-slate-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline font-medium transition-colors"
              >
                {isSignUp ? 'Already have an account? Log In' : "Don't have an account? Create one"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
