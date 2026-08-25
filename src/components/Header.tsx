import React from 'react';
import {
  Eye,
  EyeOff,
  RefreshCw,
  Wifi,
  WifiOff,
  User,
  Settings,
  ShieldCheck,
  Cloud,
  CloudOff,
  Sun,
  Moon,
  Sparkles,
  LogIn,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Header: React.FC = () => {
  const {
    isPrivacyMasked,
    togglePrivacyMask,
    syncStatus,
    syncNow,
    user,
    openAuthModal,
    openSettingsModal,
    theme,
    toggleTheme,
  } = useApp();

  return (
    <header
      id="app-header"
      className="sticky top-0 z-30 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 px-2.5 sm:px-4 pb-2 sm:pb-3 safe-top-nav transition-colors duration-200 shadow-sm dark:shadow-none"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-1.5 sm:gap-2">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-2 shrink min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-black text-lg sm:text-xl shadow-inner hover:scale-105 transition-transform cursor-pointer shrink-0">
            হ
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <h1 className="text-sm sm:text-base font-bold tracking-tight text-slate-900 dark:text-white truncate">
                Hisab
              </h1>
              <span className="text-[9px] sm:text-[10px] px-1 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-bold uppercase tracking-wider">
                PWA
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 leading-none hidden xs:block truncate">
              Expense & Ledger
            </p>
          </div>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Online / Offline Sync Badge */}
          <button
            id="sync-status-badge"
            onClick={syncNow}
            disabled={syncStatus.isSyncing}
            className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-xl text-xs font-semibold border transition-all hover:scale-102 cursor-pointer ${
              !syncStatus.isOnline
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800/60 text-amber-700 dark:text-amber-300'
                : syncStatus.pendingOutboxCount > 0
                ? 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-300 dark:border-cyan-800/60 text-cyan-700 dark:text-cyan-300'
                : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300'
            }`}
            title={
              !syncStatus.isOnline
                ? 'Offline mode - Local writes active'
                : syncStatus.pendingOutboxCount > 0
                ? `${syncStatus.pendingOutboxCount} changes waiting to sync. Click to sync now.`
                : 'Synced with cloud'
            }
          >
            {syncStatus.isSyncing ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-500" />
            ) : !syncStatus.isOnline ? (
              <WifiOff className="w-3.5 h-3.5 text-amber-500" />
            ) : syncStatus.pendingOutboxCount > 0 ? (
              <Cloud className="w-3.5 h-3.5 text-cyan-500" />
            ) : (
              <Wifi className="w-3.5 h-3.5 text-emerald-500" />
            )}

            <span className="hidden md:inline text-[11px]">
              {syncStatus.isSyncing
                ? 'Syncing...'
                : !syncStatus.isOnline
                ? 'Offline'
                : syncStatus.pendingOutboxCount > 0
                ? `${syncStatus.pendingOutboxCount} Pending`
                : 'Synced'}
            </span>

            {syncStatus.pendingOutboxCount > 0 && !syncStatus.isSyncing && (
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping md:hidden" />
            )}
          </button>

          {/* Privacy Shield Toggle */}
          <button
            id="privacy-shield-btn"
            onClick={togglePrivacyMask}
            aria-label="Toggle Privacy Shield"
            title={isPrivacyMasked ? 'Reveal amounts' : 'Mask amounts (Privacy Shield)'}
            className={`p-1.5 sm:p-2 rounded-xl border transition-all hover:scale-105 cursor-pointer ${
              isPrivacyMasked
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-300 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            {isPrivacyMasked ? <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          </button>

          {/* Dark / Light Mode Toggle Button */}
          <button
            id="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            title={theme === 'dark' ? 'Switch to Light Mode (লাইট মোড)' : 'Switch to Dark Mode (ডার্ক মোড)'}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-amber-500 dark:text-amber-300 hover:text-amber-600 dark:hover:text-amber-200 hover:border-amber-300 dark:hover:border-amber-800/60 transition-all hover:scale-105 shadow-sm active:scale-95 cursor-pointer"
          >
            {theme === 'dark' ? (
              <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform hover:rotate-45 duration-300" />
            ) : (
              <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600 transition-transform hover:-rotate-12 duration-300" />
            )}
          </button>

          {/* Upfront Login / Account Button */}
          {user ? (
            <button
              id="user-auth-btn"
              onClick={() => openAuthModal('login')}
              aria-label="User Account"
              className="flex items-center gap-1 px-1.5 sm:px-2 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800/80 text-slate-800 dark:text-slate-200 hover:border-emerald-500 transition-all hover:scale-102 shadow-sm cursor-pointer"
              title={`Logged in as ${user.name} (${user.email})`}
            >
              <div className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-[10px] font-bold shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-[11px] font-bold hidden lg:inline max-w-[80px] truncate">
                {user.name}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            </button>
          ) : (
            <button
              id="user-auth-btn-guest"
              onClick={() => openAuthModal('login')}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all hover:scale-105 cursor-pointer"
              title="Sign in or Create Account"
            >
              <LogIn className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Sign In</span>
            </button>
          )}

          {/* Settings Button */}
          <button
            id="settings-btn"
            onClick={openSettingsModal}
            aria-label="Settings"
            className="p-1.5 sm:p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700 transition-all hover:scale-105 cursor-pointer shrink-0"
            title="Settings & Backup"
          >
            <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
