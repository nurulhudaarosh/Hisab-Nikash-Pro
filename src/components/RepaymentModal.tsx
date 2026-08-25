import React, { useState } from 'react';
import { X, CheckCircle2, Plus, ArrowDownLeft, ArrowUpRight, DollarSign, Wallet } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/parser';

export const RepaymentModal: React.FC = () => {
  const {
    repaymentTargetLedger,
    closeRepaymentModal,
    recordRepayment,
    addDueToLedger,
    settings,
    isPrivacyMasked,
    showToast,
  } = useApp();

  const [mode, setMode] = useState<'repay' | 'add_due'>('repay');
  const [amount, setAmount] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [isCashHandled, setIsCashHandled] = useState<boolean>(true);

  if (!repaymentTargetLedger) return null;

  const remaining = repaymentTargetLedger.remainingBalance;
  const isTheyOwe = repaymentTargetLedger.ledgerType === 'they_owe';
  const isShop = repaymentTargetLedger.contactType === 'shop';

  const handleQuickPercent = (pct: number) => {
    const calculated = Math.round(remaining * (pct / 100));
    setAmount(String(calculated));
  };

  const handleQuickIncrement = (inc: number) => {
    const cur = parseFloat(amount) || 0;
    setAmount(String(cur + inc));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      showToast('Please enter a valid amount / সঠিক পরিমাণ লিখুন', 'error');
      return;
    }

    if (mode === 'repay') {
      const updated = await recordRepayment(
        repaymentTargetLedger.id,
        val,
        note.trim() || (isTheyOwe ? 'Payment received from contact' : 'Payment paid to contact'),
        isCashHandled
      );

      if (updated && updated.status === 'settled') {
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {
          // Safe fallback
        }
      }
    } else {
      // Add more due / borrow / credit
      await addDueToLedger(
        repaymentTargetLedger.id,
        val,
        note.trim() || (isTheyOwe ? 'Additional loan given' : isShop ? 'Daily grocery taken on credit (দোকানের বাকী)' : 'Additional cash borrowed'),
        isCashHandled
      );
    }

    closeRepaymentModal();
  };

  const parsedAmount = parseFloat(amount) || 0;
  const simulatedRemaining =
    mode === 'repay'
      ? Math.max(0, remaining - parsedAmount)
      : remaining + parsedAmount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm">
      <div
        id="repayment-modal"
        className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {repaymentTargetLedger.name}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isShop ? '🏪 Shop / Store' : '👤 Friend / Person'} • {isTheyOwe ? 'Paona (পাওনা)' : 'Dena (দেনা)'}
            </p>
          </div>
          <button
            onClick={closeRepaymentModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-950 p-1 rounded-2xl border border-slate-200 dark:border-slate-800/80">
          <button
            type="button"
            onClick={() => {
              setMode('repay');
              setAmount('');
            }}
            className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'repay'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Payment / Repay (পরিশোধ)
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('add_due');
              setAmount('');
              // If it's a shop, default to goods on credit; if friend, default to cash
              setIsCashHandled(!isShop);
            }}
            className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'add_due'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            Add More Due (বাকী/ধার যোগ)
          </button>
        </div>

        {/* Due Summary Card */}
        <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Current {isTheyOwe ? 'Paona (পাওনা)' : 'Dena (দেনা)'}
            </span>
            <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">
              {formatCurrency(remaining, settings.currency, isPrivacyMasked)}
            </span>
            {parsedAmount > 0 && (
              <div className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                ➜ New: {formatCurrency(simulatedRemaining, settings.currency, isPrivacyMasked)}
              </div>
            )}
          </div>
          <div className="text-right text-xs text-slate-500 dark:text-slate-400 font-mono">
            <div>Original: {formatCurrency(repaymentTargetLedger.originalAmount, settings.currency, isPrivacyMasked)}</div>
            <div>Paid: {formatCurrency(repaymentTargetLedger.paidAmount, settings.currency, isPrivacyMasked)}</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Quick Presets or Increments */}
          {mode === 'repay' ? (
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Quick Repayment %
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickPercent(25)}
                  className="py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-slate-300 text-xs font-bold text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
                >
                  25% ({settings.currency}{Math.round(remaining * 0.25)})
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPercent(50)}
                  className="py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-slate-300 text-xs font-bold text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
                >
                  50% ({settings.currency}{Math.round(remaining * 0.5)})
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPercent(100)}
                  className="py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 text-xs font-bold text-emerald-700 dark:text-emerald-300 transition-all cursor-pointer"
                >
                  Full Settle ({settings.currency}{remaining})
                </button>
              </div>
            </div>
          ) : (
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Quick Amount Increments
              </label>
              <div className="flex items-center gap-1.5">
                {[50, 100, 200, 500, 1000].map((inc) => (
                  <button
                    key={inc}
                    type="button"
                    onClick={() => handleQuickIncrement(inc)}
                    className="flex-1 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold font-mono text-slate-800 dark:text-slate-200 hover:border-indigo-500 transition-all cursor-pointer"
                  >
                    +{inc}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Amount Input */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              {mode === 'repay' ? 'Repayment Amount' : 'Additional Due Amount'} ({settings.currency}) *
            </label>
            <input
              type="number"
              step="any"
              min="1"
              required
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xl font-bold font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Cash Handling Toggle Option */}
          <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800/80">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isCashHandled}
                onChange={(e) => setIsCashHandled(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded text-emerald-500 focus:ring-emerald-500 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 cursor-pointer shrink-0"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200 block">
                  {mode === 'repay'
                    ? 'Transacted with Liquid Cash (হাতে নগদ টাকা লেনদেন)'
                    : isTheyOwe
                    ? 'Gave physical cash to person (নগদ টাকা ধার দিয়েছি)'
                    : isShop
                    ? 'Received Cash (নগদ ধার) — Uncheck if shop goods on credit (বাকী পণ্য)'
                    : 'Received Physical Cash into hand (নগদ টাকা হাতে পেয়েছি)'}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight block mt-0.5">
                  {isCashHandled
                    ? 'Updates your available Liquid Cash balance in dashboard (no double negative).'
                    : 'Keeps cash unchanged; only updates shop ledger payable/due.'}
                </span>
              </div>
            </label>
          </div>

          {/* Note Input */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Note / Description
            </label>
            <input
              type="text"
              placeholder={
                mode === 'repay'
                  ? 'e.g. Paid in Cash, bKash'
                  : isShop
                  ? 'e.g. Rice, oil, eggs (চাল, ডাল, তেল)'
                  : 'e.g. Emergency loan, medical help'
              }
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className={`w-full py-3.5 rounded-2xl font-extrabold text-sm transition-all shadow-md hover:scale-[1.01] active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'repay'
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
            }`}
          >
            {mode === 'repay' ? (
              <>
                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                Confirm Payment & Settle
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 stroke-[2.5]" />
                Add Due to {repaymentTargetLedger.name}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
