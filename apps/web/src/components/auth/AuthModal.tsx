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
    <div className="fixed inset-0 bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative overflow-hidden">
        
        {/* Header decoration */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

        {/* Title */}
        <div className="flex flex-col items-center text-center mt-3">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-3 shadow-sm">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-50">
            {!isGuest ? 'Workspace Account' : isSignUp ? 'Create your workspace' : 'Welcome back to CatNoted'}
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            {!isGuest ? 'You are currently logged in securely.' : 'Client-side End-to-End Encryption keeps your spatial notes completely private.'}
          </p>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs rounded-xl border border-rose-200 dark:border-rose-900/50 text-center">
            {errorMsg}
          </div>
        )}

        {!isGuest ? (
          <div className="mt-6 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xl font-bold shadow-inner">
              {userEmail.charAt(0).toUpperCase()}
            </div>
            <div className="text-sm font-semibold text-slate-700 dark:text-zinc-300">
              {userEmail}
            </div>
            <button
              onClick={handleLogout}
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-100 dark:shadow-none transition-all disabled:opacity-50"
            >
              <LogOut className="w-4 h-4" />
              {loading ? 'Logging out...' : 'Log Out'}
            </button>
          </div>
        ) : (
          <>
            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 mt-6">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Secret Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 dark:shadow-none transition-all disabled:opacity-50"
              >
                {isSignUp ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Log In'}
              </button>
            </form>

            <div className="relative flex py-4 items-center">
              <div className="flex-grow border-t border-slate-100 dark:border-zinc-800"></div>
              <span className="flex-shrink mx-4 text-[10px] font-bold text-slate-300 uppercase tracking-widest">or</span>
              <div className="flex-grow border-t border-slate-100 dark:border-zinc-800"></div>
            </div>

            {/* Offline Guest Action */}
            <button
              onClick={handleGuestMode}
              className="w-full py-3 rounded-xl border border-dashed border-slate-200 dark:border-zinc-800 hover:border-slate-350 hover:bg-slate-50 dark:hover:bg-zinc-850 text-slate-500 dark:text-zinc-400 font-semibold text-sm flex items-center justify-center gap-2 transition-all"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              Continue in Offline Guest Mode
            </button>

            {/* Footer switch state */}
            <div className="mt-6 text-center text-xs">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
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
