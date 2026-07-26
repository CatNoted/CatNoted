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
    <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800/80 rounded-2xl w-full max-w-[360px] p-5 shadow-xl relative">
        
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-10 h-10 bg-slate-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-slate-700 dark:text-zinc-300 mb-3">
            <KeyRound className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-zinc-100 tracking-tight">
            {!isGuest ? 'Workspace Account' : isSignUp ? 'Create your workspace' : 'Welcome back'}
          </h2>
          {!isGuest ? (
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
              You are currently logged in securely.
            </p>
          ) : (
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1 max-w-[280px] leading-relaxed">
              End-to-End Encryption keeps your spatial notes completely private.
            </p>
          )}
        </div>

        {errorMsg && (
          <div className="mb-4 p-2.5 bg-slate-50 dark:bg-zinc-800/50 text-slate-600 dark:text-zinc-300 text-[11px] rounded-lg border border-slate-200 dark:border-zinc-700/60 text-center">
            {errorMsg}
          </div>
        )}

        {!isGuest ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-700 dark:text-zinc-200 text-lg font-semibold">
              {userEmail.charAt(0).toUpperCase()}
            </div>
            <div className="text-sm font-medium text-slate-700 dark:text-zinc-300 text-center break-all px-2">
              {userEmail}
            </div>
            <button
              onClick={handleLogout}
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-slate-900 dark:bg-zinc-100 hover:bg-slate-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-medium text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <LogOut className="w-4 h-4" />
              {loading ? 'Logging out...' : 'Log Out'}
            </button>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-medium text-slate-600 dark:text-zinc-400">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/40 text-sm text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1.5 focus:ring-slate-400 dark:focus:ring-zinc-500 focus:border-transparent transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-medium text-slate-600 dark:text-zinc-400">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/40 text-sm text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1.5 focus:ring-slate-400 dark:focus:ring-zinc-500 focus:border-transparent transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-slate-900 dark:bg-zinc-100 hover:bg-slate-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-medium text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-1"
              >
                {isSignUp ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
              </button>
            </form>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-100 dark:border-zinc-800"></div>
              <span className="flex-shrink mx-3 text-[10px] font-medium text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                or
              </span>
              <div className="flex-grow border-t border-slate-100 dark:border-zinc-800"></div>
            </div>

            <button
              onClick={handleGuestMode}
              className="w-full py-2.5 rounded-lg border border-slate-200 dark:border-zinc-700 hover:border-slate-300 dark:hover:border-zinc-600 hover:bg-slate-50 dark:hover:bg-zinc-800/60 text-slate-600 dark:text-zinc-400 font-medium text-sm flex items-center justify-center gap-2 transition-all"
            >
              <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              Continue in Offline Guest Mode
            </button>

            <div className="pt-1 text-center text-[11px]">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:underline font-medium transition-colors"
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
