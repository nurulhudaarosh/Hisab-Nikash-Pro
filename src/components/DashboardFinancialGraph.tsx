import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import {
  TrendingUp,
  BarChart3,
  PieChart as PieIcon,
  Activity,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/parser';

export const DashboardFinancialGraph: React.FC = () => {
  const {
    transactions,
    ledgers,
    settings,
    isPrivacyMasked,
    sevenDaysHistory,
    totalIncome,
    totalExpense,
    totalPaona,
    totalDena,
    availableCash,
    categories,
  } = useApp();

  const [activeChartTab, setActiveChartTab] = useState<'cashflow' | 'breakdown' | 'categories'>('cashflow');

  // Prepare 7-day data with Income, Expense, and Net
  const chartDaysData = sevenDaysHistory.map((day) => {
    // find income & expense for that day
    const dayTransactions = transactions.filter((t) => {
      const d = new Date(t.date);
      const dayStr = d.toISOString().split('T')[0];
      return dayStr === day.date;
    });

    const income = dayTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    const expense = dayTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    return {
      day: day.dayName,
      date: day.date,
      Income: income,
      Expense: expense,
      Net: income - expense,
    };
  });

  // Prepare Category Pie chart data
  const expenseTransactions = transactions.filter((t) => t.type === 'expense');
  const totalExp = expenseTransactions.reduce((s, t) => s + (t.amount || 0), 0);

  const categoryPieData = categories
    .map((cat) => {
      const items = expenseTransactions.filter((t) => t.category === cat.id);
      const value = items.reduce((s, t) => s + (t.amount || 0), 0);
      return {
        name: cat.label,
        value,
        color: cat.color,
      };
    })
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value);

  // Financial Health Stack Data
  const financialHealthData = [
    { name: 'Available Cash', amount: Math.max(0, availableCash), fill: '#10B981' },
    { name: 'Paona (Receivable)', amount: totalPaona, fill: '#06B6D4' },
    { name: 'Dena (Payable)', amount: totalDena, fill: '#F43F5E' },
    { name: 'Total Expenses', amount: totalExpense, fill: '#8B5CF6' },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 dark:bg-slate-900/95 border border-slate-700/80 rounded-xl p-3 shadow-xl backdrop-blur-md text-xs space-y-1 z-50">
          <p className="font-bold text-slate-200 border-b border-slate-800 pb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
                {entry.name}:
              </span>
              <span className="font-bold font-mono text-white">
                {formatCurrency(entry.value, settings.currency, isPrivacyMasked)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <section
      id="dashboard-financial-graph"
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm dark:shadow-xl space-y-4 hover:border-slate-300 dark:hover:border-slate-700/80 transition-all"
    >
      {/* Top Header & Chart Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/80">
        <div>
          <h3 className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Financial Analytics & Graphs (গ্রাফ ও বিশ্লেষণ)
          </h3>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Visual trends across cashflow, daily expenses, & bilateral ledger
          </span>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-2xl border border-slate-200 dark:border-slate-800/80 self-start sm:self-auto">
          <button
            onClick={() => setActiveChartTab('cashflow')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeChartTab === 'cashflow'
                ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>7-Day Cashflow</span>
          </button>

          <button
            onClick={() => setActiveChartTab('breakdown')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeChartTab === 'breakdown'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Net Distribution</span>
          </button>

          <button
            onClick={() => setActiveChartTab('categories')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeChartTab === 'categories'
                ? 'bg-white dark:bg-slate-800 text-violet-600 dark:text-violet-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <PieIcon className="w-3.5 h-3.5" />
            <span>Categories</span>
          </button>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="w-full h-64 sm:h-72 pt-2">
        {activeChartTab === 'cashflow' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartDaysData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={{ stroke: '#475569', opacity: 0.3 }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => `${settings.currency}${val}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                formatter={(val) => <span className="text-slate-700 dark:text-slate-300 font-semibold">{val}</span>}
              />
              <Bar dataKey="Income" fill="#10B981" radius={[6, 6, 0, 0]} maxBarSize={28} />
              <Bar dataKey="Expense" fill="#F43F5E" radius={[6, 6, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        )}

        {activeChartTab === 'breakdown' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={financialHealthData}
              layout="vertical"
              margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => `${settings.currency}${val}`}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
                width={110}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="amount" radius={[0, 8, 8, 0]} maxBarSize={24}>
                {financialHealthData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}

        {activeChartTab === 'categories' && (
          categoryPieData.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 space-y-2">
              <Layers className="w-8 h-8 opacity-40" />
              <p className="text-xs">No categorized expense data logged yet.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }}
                  formatter={(val) => (
                    <span className="text-slate-700 dark:text-slate-300 font-semibold">{val}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )
        )}
      </div>

      {/* Metric Quick Glance Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800/80">
        <div className="p-2.5 rounded-2xl bg-emerald-50/60 dark:bg-slate-950/60 border border-emerald-200/70 dark:border-emerald-900/30">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
            Liquid Cash
          </span>
          <span className="text-sm font-black font-mono text-slate-900 dark:text-white">
            {formatCurrency(availableCash, settings.currency, isPrivacyMasked)}
          </span>
        </div>

        <div className="p-2.5 rounded-2xl bg-cyan-50/60 dark:bg-slate-950/60 border border-cyan-200/70 dark:border-cyan-900/30">
          <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 block">
            Paona (Receivable)
          </span>
          <span className="text-sm font-black font-mono text-cyan-700 dark:text-cyan-300">
            +{formatCurrency(totalPaona, settings.currency, isPrivacyMasked)}
          </span>
        </div>

        <div className="p-2.5 rounded-2xl bg-rose-50/60 dark:bg-slate-950/60 border border-rose-200/70 dark:border-rose-900/30">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 block">
            Dena (Payable)
          </span>
          <span className="text-sm font-black font-mono text-rose-700 dark:text-rose-300">
            −{formatCurrency(totalDena, settings.currency, isPrivacyMasked)}
          </span>
        </div>

        <div className="p-2.5 rounded-2xl bg-purple-50/60 dark:bg-slate-950/60 border border-purple-200/70 dark:border-purple-900/30">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 block">
            Total Expense
          </span>
          <span className="text-sm font-black font-mono text-purple-700 dark:text-purple-300">
            {formatCurrency(totalExpense, settings.currency, isPrivacyMasked)}
          </span>
        </div>
      </div>
    </section>
  );
};
