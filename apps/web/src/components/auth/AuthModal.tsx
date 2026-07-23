import React, { useState } from 'react';
import { LogIn, UserPlus, KeyRound, Sparkles } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (email: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess
}) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate login success locally
    setTimeout(() => {
      setLoading(false);
      onAuthSuccess(email || 'guest@catnoted.com');
      onClose();
    }, 800);
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
            {isSignUp ? 'Create your workspace' : 'Welcome back to CatNoted'}
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            Client-side End-to-End Encryption keeps your spatial notes completely private.
          </p>
        </div>

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
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
          >
            {isSignUp ? 'Already have an account? Log In' : "Don't have an account? Create one"}
          </button>
        </div>
      </div>
    </div>
  );
};
