/**
 * z-index layering reference:
 * - Modals & Overlays (e.g. AuthModal, SettingsModal, CommandPalette): z-[100]
 * - Floating UI & Rails (e.g. Left/Right rails, Floating Space Agent Panel, FAB): z-20 to z-40
 * - Workspace / Editor Content (e.g. Doc Editor, Canvas elements): z-0 to z-10
 */

import React, { useState } from 'react';
import { LogIn, UserPlus, KeyRound, Sparkles, LogOut } from 'lucide-react';
import { supabase } from '../../utils/supabase.js';
import { Overlay } from '../primitives/Overlay.js';
import { Panel } from '../primitives/Panel.js';

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
    <Overlay isOpen={isOpen} className="bg-slate-900/30 dark:bg-black/40 backdrop-blur-sm">
      <Panel className="w-full max-w-[340px] p-5 shadow-xl transition-all dark:border-zinc-800/80">
        
        {/* Header - Calm AFFiNE design with soft brand accent */}
        <div className="flex flex-col items-center text-center mb-4">
          <div className="w-9 h-9 bg-accent-soft rounded-xl flex items-center justify-center text-accent mb-2.5">
            <KeyRound className="w-4 h-4" />
          </div>
          <h2 className="text-base font-semibold text-ink tracking-tight">
            {!isGuest ? 'Workspace Account' : isSignUp ? 'Create your workspace' : 'Welcome back'}
          </h2>
          {!isGuest ? (
            <p className="text-[11px] text-ink-muted mt-1 leading-relaxed">
              You are currently logged in securely.
            </p>
          ) : (
            <p className="text-[11px] text-ink-muted mt-1 max-w-[260px] leading-relaxed">
              End-to-End Encryption keeps your spatial notes completely private.
            </p>
          )}
        </div>

        {errorMsg && (
          <div className="mb-3.5 p-2 bg-danger-soft text-danger text-[11px] font-medium rounded-lg border border-soft/20 text-center">
            {errorMsg}
          </div>
        )}

        {!isGuest ? (
          <div className="flex flex-col items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-surface-soft flex items-center justify-center text-ink dark:text-ink text-base font-semibold border border-muted dark:border-soft">
              {userEmail.charAt(0).toUpperCase()}
            </div>
            <div className="text-xs font-medium text-ink text-center break-all px-2">
              {userEmail}
            </div>
            <button
              onClick={handleLogout}
              disabled={loading}
              className="w-full py-2 rounded-lg bg-accent hover:bg-accent-hover text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
            >
              <LogOut className="w-3.5 h-3.5" />
              {loading ? 'Logging out...' : 'Log Out'}
            </button>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Form Grouping with Clear Visual Boundaries */}
              <div className="rounded-xl border border-soft/80 bg-surface-soft dark:bg-surface-soft p-3 space-y-2.5 shadow-sm">
                <div className="space-y-1">
                  <label className="block text-[10px] font-semibold text-ink-muted uppercase tracking-wider">
                    Email address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@domain.com"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-soft bg-surface dark:bg-surface text-xs text-ink placeholder:text-ink-muted dark:placeholder:text-ink-muted focus:outline-none focus:ring-1 focus:ring-accent-dark:focus:ring-accent focus:border-transparent transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-semibold text-ink-muted uppercase tracking-wider">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-soft bg-surface dark:bg-surface text-xs text-ink placeholder:text-ink-muted dark:placeholder:text-ink-muted focus:outline-none focus:ring-1 focus:ring-accent-dark:focus:ring-accent focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Stronger Primary CTA */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 rounded-lg bg-accent hover:bg-accent-hover text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm hover:shadow transition-all disabled:opacity-50 mt-1"
              >
                {isSignUp ? <UserPlus className="w-3.5 h-3.5" /> : <LogIn className="w-3.5 h-3.5" />}
                {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
              </button>
            </form>

            {/* Restrained Separator */}
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-muted"></div>
              <span className="flex-shrink mx-2.5 text-[9px] font-semibold text-ink-muted uppercase tracking-widest">
                or
              </span>
              <div className="flex-grow border-t border-muted"></div>
            </div>

            {/* Offline Guest Mode Button - Subtle and Calm */}
            <button
              onClick={handleGuestMode}
              className="w-full py-2 rounded-lg border border-soft hover:bg-surface-soft dark:hover:bg-surface-soft text-ink hover:text-ink dark:hover:text-ink font-medium text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              Continue in Offline Guest Mode
            </button>

            {/* Navigation Toggle */}
            <div className="pt-2.5 text-center text-[11px]">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-ink-muted hover:text-accent dark:hover:text-accent hover:underline font-medium transition-colors"
              >
                {isSignUp ? 'Already have an account? Log In' : "Don't have an account? Create one"}
              </button>
            </div>
          </>
        )}
      </Panel>
    </Overlay>
  );
};
