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
    <Overlay isOpen={isOpen} className="bg-background/80 backdrop-blur-sm">
      <Panel className="w-full max-w-[340px] p-5 shadow-xl transition-all border-border">
        
        {/* Header - Calm AFFiNE design with soft brand accent */}
        <div className="flex flex-col items-center text-center mb-4">
          <div className="w-9 h-9 bg-muted rounded-xl flex items-center justify-center text-foreground mb-2.5">
            <KeyRound className="w-4 h-4" />
          </div>
          <h2 className="text-base font-semibold text-foreground tracking-tight">
            {!isGuest ? 'Workspace Account' : isSignUp ? 'Create your workspace' : 'Welcome back'}
          </h2>
          {!isGuest ? (
            <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
              You are currently logged in securely.
            </p>
          ) : (
            <p className="text-[11px] text-muted-foreground mt-1 max-w-[260px] leading-relaxed">
              End-to-End Encryption keeps your spatial notes completely private.
            </p>
          )}
        </div>

        {errorMsg && (
          <div role="alert" id="auth-error" aria-live="assertive" className="mb-3.5 p-2 bg-danger-soft text-danger text-[11px] font-medium rounded-lg border border-border/20 text-center">
            {errorMsg}
          </div>
        )}

        {!isGuest ? (
          <div className="flex flex-col items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-foreground dark:text-foreground text-base font-semibold border border-muted dark:border-border">
              {userEmail.charAt(0).toUpperCase()}
            </div>
            <div className="text-xs font-medium text-foreground text-center break-all px-2">
              {userEmail}
            </div>
            <button
              onClick={handleLogout}
              disabled={loading}
              className="w-full py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
            >
              <LogOut className="w-3.5 h-3.5" />
              {loading ? 'Logging out...' : 'Log Out'}
            </button>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Form Grouping with Clear Visual Boundaries */}
              <div className="rounded-xl border border-border/80 bg-muted dark:bg-muted p-3 space-y-2.5 shadow-sm">
                <div className="space-y-1">
                  <label htmlFor="auth-email" className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Email address
                  </label>
                  <input
                    id="auth-email"
                    aria-invalid={!!errorMsg}
                    aria-describedby={errorMsg ? "auth-error" : undefined}
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@domain.com"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-card dark:bg-card text-xs text-foreground placeholder:text-muted-foreground dark:placeholder:text-muted-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-border dark:focus-visible:ring-border focus:border-transparent transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="auth-password" className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Password
                  </label>
                  <input
                    id="auth-password"
                    aria-invalid={!!errorMsg}
                    aria-describedby={errorMsg ? "auth-error" : undefined}
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-card dark:bg-card text-xs text-foreground placeholder:text-muted-foreground dark:placeholder:text-muted-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-border dark:focus-visible:ring-border focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Stronger Primary CTA */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm hover:shadow transition-all disabled:opacity-50 mt-1"
              >
                {isSignUp ? <UserPlus className="w-3.5 h-3.5" /> : <LogIn className="w-3.5 h-3.5" />}
                {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
              </button>
            </form>

            {/* Restrained Separator */}
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-muted"></div>
              <span className="flex-shrink mx-2.5 text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">
                or
              </span>
              <div className="flex-grow border-t border-muted"></div>
            </div>

            {/* Offline Guest Mode Button - Subtle and Calm */}
            <button
              onClick={handleGuestMode}
              className="w-full py-2 rounded-lg border border-border hover:bg-muted dark:hover:bg-muted text-foreground hover:text-foreground dark:hover:text-foreground font-medium text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-foreground" />
              Continue in Offline Guest Mode
            </button>

            {/* Navigation Toggle */}
            <div className="pt-2.5 text-center text-[11px]">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-muted-foreground hover:text-foreground dark:hover:text-foreground hover:underline font-medium transition-colors"
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
