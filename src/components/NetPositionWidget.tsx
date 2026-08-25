import React, { useState } from 'react';
import {
  Wallet,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  HelpCircle,
  Sparkles,
  Scale,
  CreditCard,
  HandCoins,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/parser';

export const NetPositionWidget: React.FC = () => {
  const {
    settings,
    isPrivacyMasked,
    availableCash,
    totalIncome,
    totalExpense,
    totalPaona,
    totalDena,
    netPosition,
    setActiveTab,
  } = useApp();

  const [viewMode, setViewMode] = useState<'cash' | 'net'>('cash');
  const isCashPositive = availableCash >= 0;
  const isNetPositive = netPosition >= 0;

  return (
    <section
      id="net-position-section"
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 flex flex-col justify-between shadow-sm dark:shadow-xl relative overflow-hidden transition-all hover:border-slate-300 dark:hover:border-slate-700/80 hover:shadow-md h-full"
    >
      {/* Top Header with Mode Selector */}
      <div className="flex justify-between items-start mb-2">
        <div>
          <h2 className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${viewMode === 'cash' ? 'bg-emerald-500' : 'bg-indigo-500'} animate-pulse`} />
            {viewMode === 'cash' ? 'Current Balance (বর্তমান নগদ টাকা)' : 'Net Position (সর্বমোট স্থিতি)'}
          </h2>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            {viewMode === 'cash'
              ? 'Physical In-Hand Cash (পকেট ও ওয়ালেটে থাকা টাকা)'
              : 'Cash + Paona − Dena (দেনা-পাওনা সমন্বিত হিসাব)'}
          </span>
        </div>

        {/* Toggle Switch between Cash in Hand & Net Position */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setViewMode('cash')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
              viewMode === 'cash'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Wallet className="w-3 h-3" />
            <span>Cash</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('net')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
              viewMode === 'net'
                ? 'bg-indigo-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Scale className="w-3 h-3" />
            <span>Net</span>
          </button>
        </div>
      </div>

      {/* Main Primary Hero Metric Display */}
      <div className="my-2 p-3.5 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-950/80 dark:to-slate-900/60 border border-slate-200/80 dark:border-slate-800/80">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {viewMode === 'cash' ? 'In-Hand Cash Balance' : 'Overall Net Worth'}
          </span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold border transition-colors ${
              (viewMode === 'cash' ? isCashPositive : isNetPositive)
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'
            }`}
          >
            {(viewMode === 'cash' ? isCashPositive : isNetPositive)
              ? '● Available (হাতে জমা আছে)'
              : '● Negative (ঘাটতি)'}
          </span>
        </div>

        <div
          id="current-balance-value"
          className={`text-3xl sm:text-4xl font-black font-mono tracking-tight mt-1.5 transition-colors ${
            viewMode === 'cash'
              ? isCashPositive
                ? 'text-emerald-700 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
              : isNetPositive
              ? 'text-slate-900 dark:text-white'
              : 'text-rose-600 dark:text-rose-400'
          }`}
        >
          {formatCurrency(
            viewMode === 'cash' ? availableCash : netPosition,
            settings.currency,
            isPrivacyMasked
          )}
        </div>

        {viewMode === 'cash' ? (
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-500 shrink-0" />
            ধার বাবদ নগদ প্রাপ্ত টাকা যোগ হয়েছে ও যাবতীয় খরচ বাদ দেওয়া হয়েছে
          </p>
        ) : (
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono font-medium">
            Cash ({formatCurrency(availableCash, settings.currency, isPrivacyMasked)}) + Paona ({formatCurrency(totalPaona, settings.currency, isPrivacyMasked)}) − Dena ({formatCurrency(totalDena, settings.currency, isPrivacyMasked)})
          </p>
        )}
      </div>

      {/* 3 Core Bento Metric Cards: Have to Pay (Dena), Will Receive (Paona), Net/Cash */}
      <div className="grid grid-cols-2 gap-2.5 pt-2">
        {/* Card 1: Have to Pay (Dena / দিতে হবে) */}
        <button
          type="button"
          onClick={() => setActiveTab('ledgers')}
          className="bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 hover:border-rose-400 dark:hover:border-rose-700/80 rounded-2xl p-3 text-left transition-all hover:scale-[1.02] cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 mb-1">
            <span className="text-[11px] uppercase font-extrabold tracking-wide flex items-center gap-1">
              <ArrowDownLeft className="w-3.5 h-3.5" />
              Have to Pay (দিতে হবে)
            </span>
          </div>
          <p className="text-base sm:text-lg font-black font-mono text-rose-700 dark:text-rose-300 truncate">
            {formatCurrency(totalDena, settings.currency, isPrivacyMasked)}
          </p>
          <p className="text-[10px] text-rose-600/80 dark:text-rose-400/80 truncate font-semibold mt-0.5">
            দোকান ও বন্ধুর ঋণ (Dena)
          </p>
        </button>

        {/* Card 2: Will Receive (Paona / আমি পাবো) */}
        <button
          type="button"
          onClick={() => setActiveTab('ledgers')}
          className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 hover:border-emerald-400 dark:hover:border-emerald-700/80 rounded-2xl p-3 text-left transition-all hover:scale-[1.02] cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-1">
            <span className="text-[11px] uppercase font-extrabold tracking-wide flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              I will Receive (পাবো)
            </span>
          </div>
          <p className="text-base sm:text-lg font-black font-mono text-emerald-700 dark:text-emerald-300 truncate">
            {formatCurrency(totalPaona, settings.currency, isPrivacyMasked)}
          </p>
          <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 truncate font-semibold mt-0.5">
            পাওনা টাকা (Paona)
          </p>
        </button>
      </div>
    </section>
  );
};
