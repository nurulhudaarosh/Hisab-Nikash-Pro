import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings as SettingsIcon,
  Plus,
  Zap,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  UserPlus,
  LogIn,
  Cloud,
  Sparkles,
  Smartphone,
  ShieldAlert,
  ArrowUpRight,
} from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { NetPositionWidget } from './components/NetPositionWidget';
import { DailyGoalTracker } from './components/DailyGoalTracker';
import { DashboardFinancialGraph } from './components/DashboardFinancialGraph';
import { CategoryVisualizer } from './components/CategoryVisualizer';
import { TwoWayLedgerSection } from './components/TwoWayLedgerSection';
import { ActivityAndNotes } from './components/ActivityAndNotes';
import { QuickAddDrawer } from './components/QuickAddDrawer';
import { RepaymentModal } from './components/RepaymentModal';
import { ShareWhatsAppModal } from './components/ShareWhatsAppModal';
import { SettingsModal } from './components/SettingsModal';
import { AuthModal } from './components/AuthModal';
import { BottomNav } from './components/BottomNav';

const MainAppContent: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    openQuickAdd,
    toasts,
    dismissToast,
    ledgers,
    transactions,
    settings,
    isPrivacyMasked,
    user,
    openAuthModal,
  } = useApp();

  const [hideAuthBanner, setHideAuthBanner] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col pb-24 sm:pb-12 transition-colors duration-200">
      {/* Top Application Header */}
      <Header />

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 pt-4 sm:pt-6 flex-1 space-y-5">
        {/* 1st UPFRONT AUTH BANNER: Login & Account Create Prominently Placed First */}
        {!user && !hideAuthBanner && (
          <section
            id="upfront-auth-banner"
            className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-emerald-300/80 dark:border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-slate-100 dark:from-emerald-950/60 dark:via-slate-900 dark:to-slate-950 p-4 sm:p-5 shadow-lg shadow-emerald-500/5 transition-all"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold tracking-wide uppercase">
                    <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    Account & Cloud Backup
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
                    • 100% Offline-First Enabled
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  লগইন অথবা অ্যাকাউন্ট তৈরি করুন (Sign In & Sync Everywhere)
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  অ্যাকাউন্ট খুললে আপনার হিসাব, দেনা-পাওনা ও ভাউচার সুরক্ষিত থাকবে এবং মোবাইল বা কম্পিউটারে স্বয়ংক্রিয়ভাবে সিন্ক হবে।
                </p>

                {/* Benefits Chips */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium">
                    <Cloud className="w-3 h-3 text-emerald-500" /> Cloud Sync
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium">
                    <Smartphone className="w-3 h-3 text-cyan-500" /> Mobile & PC
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium">
                    <ShieldCheck className="w-3 h-3 text-indigo-500" /> Safe Backup
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
                <button
                  id="upfront-create-account-btn"
                  onClick={() => openAuthModal('register')}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Create Account (নতুন অ্যাকাউন্ট)</span>
                </button>

                <button
                  id="upfront-login-btn"
                  onClick={() => openAuthModal('login')}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-sm cursor-pointer"
                >
                  <LogIn className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Sign In (লগইন)</span>
                </button>

                <button
                  onClick={() => setHideAuthBanner(true)}
                  aria-label="Dismiss banner"
                  title="Dismiss banner"
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Desktop Navigation Tabs & Quick Action Strip */}
        <div className="hidden sm:flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-4 transition-colors">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'dashboard'
                  ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-700 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Bento Dashboard
            </button>

            <button
              onClick={() => setActiveTab('ledgers')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'ledgers'
                  ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-700 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              Dena-Paona Ledger
            </button>

            <button
              onClick={() => setActiveTab('activity')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'activity'
                  ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-700 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              Activity & Notes
            </button>
          </div>

          {/* Desktop Quick Add Button */}
          <button
            onClick={() => openQuickAdd()}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Quick Entry</span>
          </button>
        </div>

        {/* Shorthand Interactive Quick Bar */}
        <div
          onClick={() => openQuickAdd()}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500/60 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between cursor-pointer transition-all group shadow-sm hover:shadow-md dark:shadow-none hover:scale-[1.008]"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">
                Smart Quick Entry & Shorthand (দ্রুত হিসাব যোগ)
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Tap to record expense, income, note, or type shorthand like <span className="text-emerald-600 dark:text-emerald-400 font-mono font-semibold">"Lunch 120"</span>, <span className="text-emerald-600 dark:text-emerald-400 font-mono font-semibold">"Tea 30"</span>
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold group-hover:translate-x-1.5 transition-transform">
            <span>Add Entry</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* View 1: Main Bento Grid Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Bento Grid Top Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Bento Card 1: Current Cash Balance & Due Overview (7 cols) */}
              <div className="lg:col-span-7 flex flex-col">
                <NetPositionWidget />
              </div>

              {/* Bento Card 2: Daily Goal Budget Tracker (5 cols) */}
              <div className="lg:col-span-5 flex flex-col">
                <DailyGoalTracker />
              </div>
            </div>

            {/* Bento Grid Middle Section: Interactive Financial Analytics Graph */}
            <div className="grid grid-cols-1 gap-5">
              <DashboardFinancialGraph />
            </div>

            {/* Category Breakdown */}
            <div className="grid grid-cols-1 gap-5">
              <CategoryVisualizer />
            </div>

            {/* Bento Grid Bottom Section: Two-Way Ledger + Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Bento Card 4: Dena-Paona Ledger Active List (5 cols) */}
              <div className="lg:col-span-5 flex flex-col">
                <TwoWayLedgerSection />
              </div>

              {/* Bento Card 5: Recent Transactions & Activity (7 cols) */}
              <div className="lg:col-span-7 flex flex-col">
                <ActivityAndNotes />
              </div>
            </div>
          </div>
        )}

        {/* View 2: Full Dena-Paona Ledger */}
        {activeTab === 'ledgers' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <NetPositionWidget />
              <DailyGoalTracker />
            </div>
            <TwoWayLedgerSection />
          </div>
        )}

        {/* View 3: Full Activity & Notes */}
        {activeTab === 'activity' && (
          <div className="space-y-4">
            <ActivityAndNotes />
          </div>
        )}

        {/* View 4: Settings */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl max-w-xl">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Application Preferences</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Configure your daily limits, backup your offline database, and connect your cloud account.
              </p>
              <button
                onClick={() => setActiveTab('dashboard')}
                className="px-4 py-2 bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl hover:bg-emerald-400 transition-colors"
              >
                Return to Bento Dashboard
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav />

      {/* Floating Drawers & Modals */}
      <QuickAddDrawer />
      <RepaymentModal />
      <ShareWhatsAppModal />
      <SettingsModal />
      <AuthModal />

      {/* Toast Notifications */}
      <div className="fixed bottom-20 sm:bottom-6 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto p-3.5 rounded-2xl border text-xs font-bold shadow-2xl flex items-center justify-between gap-2 transition-all backdrop-blur-md ${
              t.type === 'success'
                ? 'bg-white/95 dark:bg-slate-900/95 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                : t.type === 'error'
                ? 'bg-white/95 dark:bg-slate-900/95 border-rose-500 text-rose-700 dark:text-rose-300'
                : 'bg-white/95 dark:bg-slate-900/95 border-cyan-500 text-cyan-700 dark:text-cyan-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {t.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-cyan-500 shrink-0" />
              )}
              <span>{t.text}</span>
            </div>
            <button
              onClick={() => dismissToast(t.id)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
