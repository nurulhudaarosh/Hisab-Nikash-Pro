import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Plus,
  Sparkles,
  ArrowDownLeft,
  ArrowUpRight,
  FileText,
  Tag,
  Check,
  Zap,
  HandCoins,
  Wallet,
  User,
  Store,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TransactionType } from '../types';
import { parseQuickInput } from '../utils/parser';

export const QuickAddDrawer: React.FC = () => {
  const {
    isQuickAddOpen,
    closeQuickAdd,
    quickAddInitialText,
    categories,
    settings,
    createTransaction,
    createLedger,
    showToast,
  } = useApp();

  const [activeMode, setActiveMode] = useState<'expense' | 'income' | 'borrow' | 'note'>('expense');
  const [amount, setAmount] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('general');
  const [affectsDailyLimit, setAffectsDailyLimit] = useState<boolean>(true);
  const [isBusiness, setIsBusiness] = useState<boolean>(false);
  const [hasManuallySelectedCategory, setHasManuallySelectedCategory] = useState<boolean>(false);

  // Borrow/Loan specific states
  const [contactName, setContactName] = useState<string>('');
  const [contactType, setContactType] = useState<'friend' | 'shop'>('friend');
  const [isCashHandled, setIsCashHandled] = useState<boolean>(true);

  const amountInputRef = useRef<HTMLInputElement>(null);
  const noteInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus when drawer opens
  useEffect(() => {
    if (isQuickAddOpen) {
      if (quickAddInitialText) {
        setNote(quickAddInitialText);
        const parsed = parseQuickInput(quickAddInitialText);
        if (parsed.amount) setAmount(String(parsed.amount));
        if (parsed.category) setSelectedCategory(parsed.category);
        if (parsed.type) setActiveMode(parsed.type);
        setAffectsDailyLimit(parsed.affectsDailyLimit);
        setIsBusiness(parsed.isBusiness);
      } else {
        // Reset defaults
        setActiveMode('expense');
        setAmount('');
        setNote('');
        setSelectedCategory('general');
        setAffectsDailyLimit(true);
        setIsBusiness(false);
        setHasManuallySelectedCategory(false);
        setContactName('');
        setContactType('friend');
        setIsCashHandled(true);
      }

      setTimeout(() => {
        if (amountInputRef.current && activeMode !== 'note') {
          amountInputRef.current.focus();
        } else if (noteInputRef.current) {
          noteInputRef.current.focus();
        }
      }, 100);
    }
  }, [isQuickAddOpen, quickAddInitialText]);

  // Handle note typing with live shorthand detection
  const handleNoteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNote(val);

    // If user hasn't manually selected category or amount is empty, try parser
    if (!hasManuallySelectedCategory && activeMode !== 'borrow') {
      const parsed = parseQuickInput(val);
      if (parsed.amount !== null && !amount) {
        setAmount(String(parsed.amount));
      }
      if (parsed.category && parsed.category !== 'general') {
        setSelectedCategory(parsed.category);
      }
      if (parsed.type && parsed.type !== activeMode) {
        setActiveMode(parsed.type);
      }
      setAffectsDailyLimit(parsed.affectsDailyLimit);
      setIsBusiness(parsed.isBusiness);
    }
  };

  const handleCategorySelect = (catId: string) => {
    setSelectedCategory(catId);
    setHasManuallySelectedCategory(true);

    if (catId === 'salary' || catId === 'freelance') {
      setActiveMode('income');
      setAffectsDailyLimit(false);
    } else if (catId === 'bills' || catId === 'health' || catId === 'shop_due') {
      setActiveMode('expense');
      setAffectsDailyLimit(false);
    } else {
      setActiveMode('expense');
      setAffectsDailyLimit(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsedNum = parseFloat(amount);
    const validAmount = isNaN(parsedNum) ? 0 : Math.max(0, parsedNum);

    if (activeMode !== 'note' && validAmount <= 0) {
      showToast('Please enter a valid amount / সঠিক পরিমাণ লিখুন', 'error');
      return;
    }

    if (activeMode === 'borrow') {
      if (!contactName.trim()) {
        showToast('Please enter the lender/contact name / ব্যক্তির নাম লিখুন', 'error');
        return;
      }

      await createLedger({
        name: contactName.trim(),
        contactType,
        ledgerType: 'i_owe', // Borrow / Dena
        originalAmount: validAmount,
        paidAmount: 0,
        status: 'active',
        initialHistoryNote: note.trim() || 'Borrowed loan / ধার নেওয়া',
        isCashHandled,
      });

      showToast(
        isCashHandled
          ? `Loan recorded! Added ${settings.currency}${validAmount} to Liquid Cash`
          : `Recorded loan of ${settings.currency}${validAmount} in Dena ledger`,
        'success'
      );
      closeQuickAdd();
      return;
    }

    const finalCategory = selectedCategory || 'general';
    const finalNote = note.trim() || (activeMode === 'note' ? 'Quick Note' : `${finalCategory} expense`);

    await createTransaction({
      type: activeMode as TransactionType,
      amount: validAmount,
      category: finalCategory,
      affectsDailyLimit: activeMode === 'expense' ? affectsDailyLimit : false,
      isBusiness,
      note: finalNote,
      date: new Date().toISOString(),
    });

    closeQuickAdd();
  };

  if (!isQuickAddOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm transition-opacity">
      <div
        id="quick-add-drawer"
        className="w-full max-w-lg bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Smart Quick Entry (দ্রুত হিসাব)</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {activeMode === 'borrow'
                  ? 'Record borrowed money (ধার) with cash in hand (+ক্যাশ)'
                  : 'Type shorthand (e.g., "Tea 30", "Lunch 120", "Salary 25000")'}
              </p>
            </div>
          </div>

          <button
            onClick={closeQuickAdd}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type Selector Tabs (4 Tabs including Borrow) */}
          <div className="grid grid-cols-4 gap-1.5 bg-slate-100 dark:bg-slate-950 p-1 rounded-2xl border border-slate-200 dark:border-slate-800/80">
            <button
              type="button"
              onClick={() => {
                setActiveMode('expense');
                setAffectsDailyLimit(true);
              }}
              className={`py-2 px-1.5 rounded-xl text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1 transition-all cursor-pointer ${
                activeMode === 'expense'
                  ? 'bg-rose-50 dark:bg-rose-950/80 border border-rose-500 text-rose-700 dark:text-rose-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span>Expense (খরচ)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveMode('income');
                setAffectsDailyLimit(false);
              }}
              className={`py-2 px-1.5 rounded-xl text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1 transition-all cursor-pointer ${
                activeMode === 'income'
                  ? 'bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Income (আয়)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveMode('borrow');
                setIsCashHandled(true);
              }}
              className={`py-2 px-1.5 rounded-xl text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1 transition-all cursor-pointer ${
                activeMode === 'borrow'
                  ? 'bg-amber-50 dark:bg-amber-950/80 border border-amber-500 text-amber-700 dark:text-amber-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <HandCoins className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Borrow (ধার)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveMode('note');
                setAmount('0');
                setAffectsDailyLimit(false);
              }}
              className={`py-2 px-1.5 rounded-xl text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1 transition-all cursor-pointer ${
                activeMode === 'note'
                  ? 'bg-cyan-50 dark:bg-cyan-950/80 border border-cyan-500 text-cyan-700 dark:text-cyan-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>Note (নোট)</span>
            </button>
          </div>

          {/* Quick Everyday Presets Strip (Only for Expense/Income) */}
          {activeMode === 'expense' && (
            <div>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1.5 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-500" />
                Quick Presets (এক ক্লিকে খরচ যোগ)
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {[
                  { label: '☕ চা-নাস্তা ৳৩০', amt: 30, cat: 'tea_snacks', note: 'চা ও নাস্তা' },
                  { label: '🍽️ দুপুর খাবার ৳১২০', amt: 120, cat: 'food', note: 'দুপুরের খাবার' },
                  { label: '🛺 রিকশা/ভাড়া ৳৫০', amt: 50, cat: 'commute', note: 'যাতায়াত ভাড়া' },
                  { label: '🛒 বাজার ৳৫০০', amt: 500, cat: 'daily_normal', note: 'দৈনিক বাজার' },
                  { label: '📱 রিচার্জ ৳১০০', amt: 100, cat: 'bills', note: 'মোবাইল রিচার্জ' },
                ].map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setActiveMode('expense');
                      setAmount(String(p.amt));
                      setSelectedCategory(p.cat);
                      setNote(p.note);
                      setAffectsDailyLimit(true);
                    }}
                    className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-800 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-300 transition-all hover:scale-102 shrink-0 cursor-pointer"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* If Borrow Mode: Contact Name & Type */}
          {activeMode === 'borrow' && (
            <div className="space-y-3 p-3.5 bg-amber-50/50 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-900/40">
              <div>
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                  Borrowed From (কার কাছ থেকে ধার নিয়েছেন?) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahim, Kabir, Bhai, Office Colleague"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setContactType('friend');
                    setIsCashHandled(true);
                  }}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                    contactType === 'friend'
                      ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-sm'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  Friend / Person (নগদ ধার)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setContactType('shop');
                    setIsCashHandled(false);
                  }}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                    contactType === 'shop'
                      ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-sm'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Store className="w-3.5 h-3.5" />
                  Shop / Store (দোকানের বাকী)
                </button>
              </div>
            </div>
          )}

          {/* Amount Input & Quick Increment Buttons */}
          {activeMode !== 'note' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Amount ({settings.currency}) *
                </label>
                {/* Quick Add Increment Chips */}
                <div className="flex items-center gap-1">
                  {[50, 100, 500, 1000, 5000].map((inc) => (
                    <button
                      key={inc}
                      type="button"
                      onClick={() => {
                        const cur = parseFloat(amount) || 0;
                        setAmount(String(cur + inc));
                      }}
                      className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 hover:text-emerald-700 dark:hover:text-emerald-300 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                    >
                      +{inc}
                    </button>
                  ))}
                </div>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xl font-bold text-slate-400 font-mono">
                  {settings.currency}
                </span>
                <input
                  ref={amountInputRef}
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-9 pr-4 py-3 text-2xl font-black text-slate-900 dark:text-white font-mono focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>
          )}

          {/* Cash in Hand Toggle (For Borrow Mode) */}
          {activeMode === 'borrow' && (
            <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800/80">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isCashHandled}
                  onChange={(e) => setIsCashHandled(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 cursor-pointer shrink-0"
                />
                <div className="text-xs space-y-0.5">
                  <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                    <Wallet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Physical Cash in Hand (হাতে নগদ টাকা এসেছে)
                  </span>
                  <span className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug block">
                    {isCashHandled ? (
                      <span className="text-emerald-700 dark:text-emerald-300 font-semibold">
                        ✓ ধার বাবদ পাওয়া নগদ টাকা আপনার হাতে এসেছে — ড্যাশবোর্ডে <strong>'Current Balance' (নগদ টাকা) বৃদ্ধি পাবে</strong> (+ক্যাশ)। পরবর্তীতে খরচ করলে ডাবল মাইনাস হবে না।
                      </span>
                    ) : (
                      <span className="text-slate-600 dark:text-slate-300 font-medium">
                        ✓ দোকান থেকে বাকীতে সওদা নেওয়া হয়েছে — <strong>পকেটের নগদ ক্যাশ ব্যালেন্স পরিবর্তন হবে না</strong>, শুধুমাত্র দেনা খাতায় যোগ হবে।
                      </span>
                    )}
                  </span>
                </div>
              </label>
            </div>
          )}

          {/* Note / Description Input */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Note / Description
            </label>
            <input
              ref={noteInputRef}
              type="text"
              placeholder={
                activeMode === 'note'
                  ? 'Write a memo or task list...'
                  : activeMode === 'borrow'
                  ? 'e.g. Personal loan for medical, temporary hand cash'
                  : 'e.g. Tea & Toast with Karim, Rickshaw fare'
              }
              value={note}
              onChange={handleNoteChange}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Horizontal Category Chip Selector (For Expense & Income) */}
          {(activeMode === 'expense' || activeMode === 'income') && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Tag className="w-3 h-3 text-slate-400" />
                  Category
                </label>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  Default: <span className="text-emerald-600 dark:text-emerald-400 font-bold">Daily Normal</span>
                </span>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
                {categories.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleCategorySelect(cat.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border flex items-center gap-1.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-slate-100 dark:bg-slate-800 border-emerald-500 text-slate-900 dark:text-white ring-1 ring-emerald-500 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-950/80 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      {cat.label}
                      {isSelected && <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Option Toggles (Daily Limit & Business) */}
          {activeMode === 'expense' && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
              <label className="flex items-center justify-between cursor-pointer py-1">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Affects Daily Limit ({settings.currency}{settings.dailyExpenseLimit})
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Counts against today's goal budget bar
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={affectsDailyLimit}
                  onChange={(e) => setAffectsDailyLimit(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-slate-100 dark:bg-slate-950 border-slate-300 dark:border-slate-700"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer py-1">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Business Expense
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Tag as official / client expense
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={isBusiness}
                  onChange={(e) => setIsBusiness(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-slate-100 dark:bg-slate-950 border-slate-300 dark:border-slate-700"
                />
              </label>
            </div>
          )}

          {/* Submit Button */}
          <button
            id="submit-quick-add-btn"
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-98 text-slate-950 font-extrabold text-sm transition-all shadow-md shadow-emerald-500/20 hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            {activeMode === 'borrow' ? 'Save Loan & Add Cash' : 'Save Instantly to Local DB'}
          </button>
        </form>
      </div>
    </div>
  );
};
