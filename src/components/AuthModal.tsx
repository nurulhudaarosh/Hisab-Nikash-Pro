import React, { useState, useEffect } from 'react';
import { X, User, Lock, Mail, CheckCircle2, ShieldCheck, LogOut, ArrowRight, Eye, EyeOff, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { authService } from '../services/authService';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    user,
    setUserProfile,
    logout,
    showToast,
    authModalMode,
  } = useApp();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authModalMode) {
      setMode(authModalMode);
      setError(null);
    }
  }, [authModalMode, isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let result;
      if (mode === 'login') {
        result = await authService.login(email, password);
      } else {
        result = await authService.register(name, email, password);
      }

      setUserProfile({
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        token: result.token,
      });

      showToast(
        mode === 'login'
          ? `Welcome back, ${result.user.name}!`
          : `Account created! Logged in as ${result.user.name}`,
        'success'
      );
      closeAuthModal();
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 dark:bg-black/80 backdrop-blur-md transition-all animate-fadeIn">
      <div
        id="auth-modal"
        className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 text-slate-900 dark:text-slate-100 transition-colors"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-950 border border-emerald-500/30 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {user ? 'Account & Cloud Sync' : mode === 'login' ? 'Welcome Back' : 'Create Free Account'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {user
                  ? `Logged in as ${user.email}`
                  : 'Sync your expenses & Dena-Paona ledgers everywhere'}
              </p>
            </div>
          </div>
          <button
            onClick={closeAuthModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* If user is already logged in */}
        {user ? (
          <div className="space-y-4">
            <div className="bg-emerald-50 dark:bg-slate-950 border border-emerald-200 dark:border-slate-800 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
                <ShieldCheck className="w-4 h-4" /> Cloud Account Connected
              </div>
              <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
                <div>
                  Name: <span className="font-bold text-slate-900 dark:text-white">{user.name}</span>
                </div>
                <div>
                  Email: <span className="font-mono text-slate-600 dark:text-slate-400">{user.email}</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 leading-relaxed">
                Your auth session is securely cached. You can work 100% offline; when internet connects, data syncs automatically!
              </p>
            </div>

            <button
              onClick={() => {
                logout();
                closeAuthModal();
                showToast('Switched to offline guest mode', 'info');
              }}
              className="w-full py-3 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-950/40 dark:hover:text-rose-300 dark:text-slate-300 font-semibold text-xs transition-colors flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700"
            >
              <LogOut className="w-4 h-4" />
              Disconnect / Switch to Offline Guest
            </button>
          </div>
        ) : (
          /* Login / Register Form */
          <div className="space-y-4">
            {/* Tabs */}
            <div className="grid grid-cols-2 gap-1.5 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
                className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 font-bangla ${
                  mode === 'login'
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200 dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Sign In <span className="bangla-highlight-emerald font-bold">(লগইন)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError(null);
                }}
                className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 font-bangla ${
                  mode === 'register'
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200 dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                Create Account <span className="bangla-highlight-indigo font-bold">(অ্যাকাউন্ট)</span>
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-300 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {mode === 'register' && (
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Your Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Nurul Huda"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="user@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-10 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] text-slate-950 font-bold text-sm transition-all shadow-lg hover:shadow-emerald-500/20 mt-2 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading
                  ? 'Please wait...'
                  : mode === 'login'
                  ? 'Sign In to Account'
                  : 'Create Account & Start Sync'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                No account needed for offline use
              </span>
              <button
                onClick={closeAuthModal}
                className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold text-[11px]"
              >
                Continue as Guest →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

