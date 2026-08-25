import React from 'react';
import { PieChart, Tag, ArrowRight, Sparkles, Filter, Layers } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/parser';

export const CategoryVisualizer: React.FC = () => {
  const {
    transactions,
    categories,
    settings,
    isPrivacyMasked,
    selectedCategoryFilter,
    setSelectedCategoryFilter,
    openQuickAdd,
  } = useApp();

  // Compute expense amounts per category
  const expenseTransactions = transactions.filter((t) => t.type === 'expense');
  const totalExpenseAmount = expenseTransactions.reduce((acc, t) => acc + (t.amount || 0), 0);

  const categoryBreakdown = categories
    .map((cat) => {
      const items = expenseTransactions.filter((t) => t.category === cat.id);
      const total = items.reduce((acc, t) => acc + (t.amount || 0), 0);
      const percentage = totalExpenseAmount > 0 ? Math.round((total / totalExpenseAmount) * 100) : 0;
      return {
        ...cat,
        total,
        count: items.length,
        percentage,
      };
    })
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total);

  const handleCategoryClick = (catId: string) => {
    if (selectedCategoryFilter === catId) {
      setSelectedCategoryFilter(null);
    } else {
      setSelectedCategoryFilter(catId);
    }
  };

  return (
    <section
      id="category-visualizer-section"
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm dark:shadow-xl flex flex-col justify-between transition-all hover:border-slate-300 dark:hover:border-slate-700/80 hover:shadow-md"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
        <div>
          <h3 className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1.5 font-bangla">
            <span className="w-2 h-2 rounded-full bg-violet-500" />
            Spending By Category <span className="bangla-highlight-indigo font-bold">(খাতভিত্তিক খরচ)</span>
          </h3>
          <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
            Interactive visual expense distribution
          </span>
        </div>

        {selectedCategoryFilter ? (
          <button
            onClick={() => setSelectedCategoryFilter(null)}
            className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-bold flex items-center gap-1"
          >
            <Filter className="w-3 h-3" /> Clear Filter
          </button>
        ) : (
          <span className="text-[10px] text-slate-400 font-medium">Tap category to filter</span>
        )}
      </div>

      {/* Visual Content */}
      <div className="my-3 flex-1">
        {categoryBreakdown.length === 0 ? (
          <div className="text-center py-6 px-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800/60 flex flex-col items-center justify-center space-y-2">
            <Layers className="w-7 h-7 text-slate-400" />
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              No expenses recorded yet in this account.
            </p>
            <button
              onClick={() => openQuickAdd()}
              className="mt-1 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all hover:scale-105"
            >
              + Log Your First Expense
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Multi-segment stacked bar */}
            <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-950 flex overflow-hidden border border-slate-200 dark:border-slate-800 p-0.5">
              {categoryBreakdown.map((cat) => (
                <div
                  key={cat.id}
                  style={{
                    width: `${Math.max(2, cat.percentage)}%`,
                    backgroundColor: cat.color,
                  }}
                  className="h-full rounded-sm first:rounded-l-full last:rounded-r-full transition-all duration-300 hover:opacity-80"
                  title={`${cat.label}: ${cat.percentage}% (${formatCurrency(cat.total, settings.currency, isPrivacyMasked)})`}
                />
              ))}
            </div>

            {/* Category Rows with Progress Bars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {categoryBreakdown.slice(0, 6).map((cat) => {
                const isSelected = selectedCategoryFilter === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between group cursor-pointer hover:scale-[1.02] ${
                      isSelected
                        ? 'bg-slate-100 dark:bg-slate-800 border-emerald-500 ring-1 ring-emerald-500 shadow-sm'
                        : 'bg-slate-50/70 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                          {cat.label}
                        </span>
                      </div>
                      <span className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                        {formatCurrency(cat.total, settings.currency, isPrivacyMasked)}
                      </span>
                    </div>

                    {/* Mini progress bar */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-900 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${cat.percentage}%`,
                            backgroundColor: cat.color,
                          }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 font-bold shrink-0">
                        {cat.percentage}%
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
