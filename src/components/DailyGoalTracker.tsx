import React from 'react';
import { Target, AlertTriangle, CheckCircle2, Calendar } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/parser';

export const DailyGoalTracker: React.FC = () => {
  const {
    settings,
    isPrivacyMasked,
    todayExpense,
    todayBudgetRemaining,
    isOverLimitToday,
    todayLimitExceededBy,
    sevenDaysHistory,
    selectedDateFilter,
    setSelectedDateFilter,
  } = useApp();

  const dailyLimit = settings.dailyExpenseLimit || 150;
  const percentage = Math.min(100, Math.round((todayExpense / dailyLimit) * 100));

  // Determine progress bar color
  const progressColor = isOverLimitToday
    ? 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.4)]'
    : percentage > 80
    ? 'bg-amber-500'
    : 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.3)]';

  const handleBarClick = (dateStr: string, isToday: boolean) => {
    if (selectedDateFilter === dateStr) {
      setSelectedDateFilter(null);
    } else {
      setSelectedDateFilter(dateStr);
    }
  };

  return (
    <section
      id="daily-goal-tracker"
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm dark:shadow-xl relative flex flex-col justify-between overflow-hidden transition-all hover:border-slate-300 dark:hover:border-slate-700/80 hover:shadow-md h-full"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Daily Expense Budget (দৈনিক বাজেট)
          </h3>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            {settings.currency}{dailyLimit} Max Target Limit
          </span>
        </div>

        {/* Exceed / Safe Badge */}
        <div>
          {isOverLimitToday ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 animate-pulse">
              <AlertTriangle className="w-3 h-3" />
              +{formatCurrency(todayLimitExceededBy, settings.currency, isPrivacyMasked)} Over
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              {formatCurrency(todayBudgetRemaining, settings.currency, isPrivacyMasked)} Left
            </span>
          )}
        </div>
      </div>

      {/* Progress Bar & Amount Row */}
      <div className="space-y-1.5 my-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="font-bold text-slate-900 dark:text-white">
            Today: {formatCurrency(todayExpense, settings.currency, isPrivacyMasked)}
          </span>
          <span className="text-slate-500 dark:text-slate-400 font-bold">{percentage}% Used</span>
        </div>

        <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-950 rounded-full p-0.5 border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${progressColor}`}
            style={{ width: `${Math.max(4, Math.min(100, (todayExpense / dailyLimit) * 100))}%` }}
          />
        </div>
      </div>

      {/* 7-Day Interactive Mini-Bar History */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 mt-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-400" />
            7-Day History Trend
          </span>
          {selectedDateFilter ? (
            <button
              onClick={() => setSelectedDateFilter(null)}
              className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline font-bold"
            >
              Reset ({selectedDateFilter})
            </button>
          ) : (
            <span className="text-[10px] text-slate-400 font-medium">Tap day to filter</span>
          )}
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
          {sevenDaysHistory.map((item) => {
            const isSelected = selectedDateFilter === item.dateStr;
            const barHeightPct = Math.min(
              100,
              Math.max(12, Math.round((item.spent / (item.limit * 1.5)) * 100))
            );

            return (
              <button
                key={item.dateStr}
                onClick={() => handleBarClick(item.dateStr, item.isToday)}
                className={`group flex flex-col items-center justify-end p-1.5 rounded-xl border transition-all text-center cursor-pointer hover:scale-105 ${
                  isSelected
                    ? 'bg-emerald-50 dark:bg-slate-800 border-emerald-500 ring-1 ring-emerald-500 shadow-sm'
                    : item.isToday
                    ? 'bg-slate-50 dark:bg-slate-950/80 border-slate-300 dark:border-slate-700/80 hover:border-emerald-400'
                    : 'bg-white dark:bg-slate-950/50 border-slate-200 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Spent tooltip */}
                <span className="text-[9px] font-mono font-bold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white mb-1 truncate max-w-full">
                  {formatCurrency(item.spent, settings.currency, isPrivacyMasked)}
                </span>

                {/* Vertical Bar Meter */}
                <div className="w-full h-10 bg-slate-100 dark:bg-slate-900 rounded-md flex items-end p-0.5 mb-1 overflow-hidden">
                  <div
                    className={`w-full rounded-sm transition-all duration-300 ${
                      item.isExceeded
                        ? 'bg-rose-500 group-hover:bg-rose-400'
                        : item.spent > 0
                        ? 'bg-emerald-500 group-hover:bg-emerald-400'
                        : 'bg-slate-200 dark:bg-slate-800'
                    }`}
                    style={{ height: `${item.spent === 0 ? 6 : barHeightPct}%` }}
                  />
                </div>

                {/* Day Label */}
                <span
                  className={`text-[10px] font-bold leading-none ${
                    item.isToday
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : isSelected
                      ? 'text-slate-900 dark:text-white'
                      : 'text-slate-500'
                  }`}
                >
                  {item.dayLabel}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

