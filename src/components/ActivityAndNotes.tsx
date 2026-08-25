import React, { useState } from 'react';
import {
  Search,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  FileText,
  Calendar,
  Trash2,
  Edit2,
  Copy,
  Tag,
  Briefcase,
  Layers,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Transaction, TransactionType } from '../types';
import { formatCurrency, formatRelativeDate } from '../utils/parser';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

export const ActivityAndNotes: React.FC = () => {
  const {
    transactions,
    settings,
    categories,
    isPrivacyMasked,
    searchQuery,
    setSearchQuery,
    selectedCategoryFilter,
    setSelectedCategoryFilter,
    selectedDateFilter,
    setSelectedDateFilter,
    editTransaction,
    removeTransaction,
    openQuickAdd,
    showToast,
  } = useApp();

  const [selectedType, setSelectedType] = useState<string>('all');
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);

  // Edit Modal State
  const [editAmount, setEditAmount] = useState<string>('');
  const [editNote, setEditNote] = useState<string>('');
  const [editCategory, setEditCategory] = useState<string>('');
  const [editType, setEditType] = useState<TransactionType>('expense');

  // Filter transactions
  const filtered = transactions.filter((tx) => {
    // Type filter
    if (selectedType === 'expense' && tx.type !== 'expense') return false;
    if (selectedType === 'income' && tx.type !== 'income') return false;
    if (selectedType === 'note' && tx.type !== 'note') return false;
    if (selectedType === 'business' && !tx.isBusiness) return false;

    // Category filter
    if (selectedCategoryFilter && tx.category !== selectedCategoryFilter) return false;

    // Date filter
    if (selectedDateFilter) {
      const txDateStr = tx.date.split('T')[0];
      if (txDateStr !== selectedDateFilter) return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNote = (tx.note || '').toLowerCase().includes(q);
      const matchCat = (tx.category || '').toLowerCase().includes(q);
      const matchAmount = String(tx.amount || '').includes(q);
      if (!matchNote && !matchCat && !matchAmount) return false;
    }

    return true;
  });

  const startEdit = (tx: Transaction) => {
    setEditingTx(tx);
    setEditAmount(String(tx.amount || ''));
    setEditNote(tx.note || '');
    setEditCategory(tx.category || 'general');
    setEditType(tx.type);
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx) return;

    await editTransaction(editingTx.id, {
      amount: editType === 'note' ? 0 : Number(editAmount || 0),
      note: editNote.trim(),
      category: editCategory,
      type: editType,
    });

    setEditingTx(null);
  };

  const copyNoteToClipboard = (text: string) => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(text);
      showToast('Copied note to clipboard', 'info');
    }
  };

  return (
    <section id="activity-and-notes-section" className="space-y-4">
      {/* Search & Filter Controls Bento Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm dark:shadow-xl space-y-4 hover:border-slate-300 dark:hover:border-slate-700/80 transition-all">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
          <div>
            <h3 className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1.5 font-bangla">
              <span className="w-2 h-2 rounded-full bg-cyan-500" />
              Activity & Notes Log <span className="bangla-highlight-cyan font-bold">(দৈনিক খরচ ও নোট)</span>
            </h3>
            <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium font-bangla">
              Live transaction records, voice notes & tags
            </span>
          </div>
          <button
            onClick={() => openQuickAdd()}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-sm shadow-emerald-500/20 hover:scale-105 active:scale-95 cursor-pointer"
          >
            + New Log
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search expenses, notes, categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedType('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedType === 'all'
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            All Logs ({transactions.length})
          </button>
          <button
            onClick={() => setSelectedType('expense')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 border cursor-pointer ${
              selectedType === 'expense'
                ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-500/30'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-300'
            }`}
          >
            <ArrowDownLeft className="w-3 h-3 text-rose-600 dark:text-rose-400" />
            Expenses
          </button>
          <button
            onClick={() => setSelectedType('income')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 border cursor-pointer ${
              selectedType === 'income'
                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-300'
            }`}
          >
            <ArrowUpRight className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            Income
          </button>
          <button
            onClick={() => setSelectedType('note')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 border cursor-pointer ${
              selectedType === 'note'
                ? 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-300 dark:border-cyan-500/30'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-300'
            }`}
          >
            <FileText className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
            Notes
          </button>
          <button
            onClick={() => setSelectedType('business')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 border cursor-pointer ${
              selectedType === 'business'
                ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-300 dark:border-purple-500/30'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-300'
            }`}
          >
            <Briefcase className="w-3 h-3 text-purple-600 dark:text-purple-400" />
            Business
          </button>
        </div>

        {/* Active Filter Tags */}
        {(selectedDateFilter || selectedCategoryFilter) && (
          <div className="flex items-center gap-2 pt-1">
            {selectedDateFilter && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-medium">
                <Calendar className="w-3 h-3" /> Date: {selectedDateFilter}
                <button
                  onClick={() => setSelectedDateFilter(null)}
                  className="hover:text-emerald-900 dark:hover:text-white ml-1 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedCategoryFilter && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium">
                <Tag className="w-3 h-3" /> Category: {selectedCategoryFilter}
                <button
                  onClick={() => setSelectedCategoryFilter(null)}
                  className="hover:text-slate-900 dark:hover:text-white ml-1 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}

        {/* Transactions & Notes List within Bento Card */}
        {filtered.length === 0 ? (
          <div className="text-center py-8 px-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/60 rounded-xl">
            <Layers className="w-7 h-7 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">No activity matching your filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
            {filtered.map((tx) => {
              const isExpense = tx.type === 'expense';
              const isIncome = tx.type === 'income';
              const isNote = tx.type === 'note';
              const catObj = categories.find((c) => c.id === tx.category);

              return (
                <div
                  key={tx.id}
                  id={`activity-item-${tx.id}`}
                  className="bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 rounded-xl p-3 transition-all flex items-start justify-between gap-3 group hover:shadow-sm"
                >
                  {/* Left: Icon & Note/Category */}
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div
                      className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                        isExpense
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20'
                          : isIncome
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                          : 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/20'
                      }`}
                    >
                      {isExpense ? (
                        <ArrowDownLeft className="w-3.5 h-3.5" />
                      ) : isIncome ? (
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      ) : (
                        <FileText className="w-3.5 h-3.5" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                        <span
                          className="text-[9px] px-1.5 py-0.2 rounded font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-transparent"
                          style={{ backgroundColor: `${catObj?.color || '#64748b'}25` }}
                        >
                          {catObj?.label || tx.category || 'General'}
                        </span>

                        {tx.isBusiness && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950 border border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300 font-bold">
                            Business
                          </span>
                        )}

                        {isExpense && !tx.affectsDailyLimit && (
                          <span className="text-[9px] text-slate-400 font-medium">
                            (Fixed)
                          </span>
                        )}
                      </div>

                      <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 break-words line-clamp-2">
                        {tx.note || (isNote ? 'Quick Note' : 'Expense recorded')}
                      </p>

                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                        <span>{formatRelativeDate(tx.date)}</span>
                        {!tx.synced && (
                          <span className="text-[9px] text-cyan-600 dark:text-cyan-400 font-sans font-medium">• Local (pending sync)</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount & Action Buttons */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {!isNote && (
                      <span
                        className={`text-sm sm:text-base font-bold font-mono ${
                          isExpense ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {isExpense ? '−' : '+'}
                        {formatCurrency(tx.amount, settings.currency, isPrivacyMasked)}
                      </span>
                    )}

                    {/* Action Icons */}
                    <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      {isNote && (
                        <button
                          onClick={() => copyNoteToClipboard(tx.note)}
                          className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                          title="Copy note"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => startEdit(tx)}
                        className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setTxToDelete(tx)}
                        className="p-1 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer rounded hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        title="Delete record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirmation Modal for Delete */}
      <ConfirmDeleteModal
        isOpen={!!txToDelete}
        title="Delete Record (রেকর্ড মুছে ফেলবেন?)"
        description="Are you sure you want to delete this record? It will be removed from your activity logs and balance calculations."
        itemDetails={
          txToDelete
            ? `${txToDelete.type.toUpperCase()}: ${txToDelete.note || txToDelete.category} (${settings.currency}${txToDelete.amount})`
            : undefined
        }
        confirmText="Yes, Delete (মুছে ফেলুন)"
        cancelText="Cancel (বাতিল)"
        onConfirm={() => {
          if (txToDelete) {
            removeTransaction(txToDelete.id);
            setTxToDelete(null);
          }
        }}
        onClose={() => setTxToDelete(null)}
      />

      {/* Edit Transaction Modal */}
      {editingTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Edit Record (হিসাব সংশোধন)</h3>
              <button
                onClick={() => setEditingTx(null)}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={saveEdit} className="space-y-3.5">
              {editType !== 'note' && (
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Amount ({settings.currency})
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-base font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Note / Description
                </label>
                <input
                  type="text"
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Category</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all shadow-md shadow-emerald-500/20 hover:scale-[1.01] active:scale-98 mt-2 cursor-pointer"
              >
                Update Record
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

