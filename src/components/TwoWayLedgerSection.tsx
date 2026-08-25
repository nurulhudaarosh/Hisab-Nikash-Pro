import React, { useState } from 'react';
import {
  Users,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Store,
  User,
  Share2,
  CheckCircle2,
  Clock,
  Trash2,
  ChevronDown,
  ChevronUp,
  Search,
  Receipt,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ContactType, LedgerType, Ledger } from '../types';
import { formatCurrency, formatRelativeDate } from '../utils/parser';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

export const TwoWayLedgerSection: React.FC = () => {
  const {
    ledgers,
    settings,
    isPrivacyMasked,
    openRepaymentModal,
    openShareModal,
    createLedger,
    addDueToLedger,
    removeLedger,
  } = useApp();

  const [filterType, setFilterType] = useState<'all' | 'they_owe' | 'i_owe' | 'settled'>('all');
  const [searchContact, setSearchContact] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [expandedLedgerId, setExpandedLedgerId] = useState<string | null>(null);
  const [ledgerToDelete, setLedgerToDelete] = useState<Ledger | null>(null);

  // New Ledger or Existing Contact selection
  const [targetContactMode, setTargetContactMode] = useState<'new' | 'existing'>('new');
  const [selectedExistingId, setSelectedExistingId] = useState<string>('');
  const [newName, setNewName] = useState('');
  const [newContactType, setNewContactType] = useState<ContactType>('friend');
  const [newLedgerType, setNewLedgerType] = useState<LedgerType>('i_owe');
  const [newAmount, setNewAmount] = useState('');
  const [newPaidAmount, setNewPaidAmount] = useState('');
  const [newNote, setNewNote] = useState('');
  // Default to true for cash in hand for loans/borrows
  const [newIsCashHandled, setNewIsCashHandled] = useState(true);

  const filteredLedgers = ledgers.filter((ldg) => {
    if (searchContact.trim() && !ldg.name.toLowerCase().includes(searchContact.toLowerCase())) {
      return false;
    }
    if (filterType === 'all') return true;
    if (filterType === 'settled') return ldg.status === 'settled';
    if (filterType === 'they_owe') return ldg.ledgerType === 'they_owe' && ldg.status !== 'settled';
    if (filterType === 'i_owe') return ldg.ledgerType === 'i_owe' && ldg.status !== 'settled';
    return true;
  });

  const handleCreateLedgerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAmount || Number(newAmount) <= 0) return;

    if (targetContactMode === 'existing' && selectedExistingId) {
      // Add due/borrow to existing contact
      await addDueToLedger(
        selectedExistingId,
        Number(newAmount),
        newNote.trim() || undefined,
        newIsCashHandled
      );
    } else {
      if (!newName.trim()) return;
      await createLedger({
        name: newName.trim(),
        contactType: newContactType,
        ledgerType: newLedgerType,
        originalAmount: Number(newAmount),
        paidAmount: Number(newPaidAmount || 0),
        status: Number(newPaidAmount || 0) >= Number(newAmount) ? 'settled' : 'active',
        initialHistoryNote: newNote.trim() || undefined,
        isCashHandled: newIsCashHandled,
      });
    }

    // Reset form
    setNewName('');
    setNewAmount('');
    setNewPaidAmount('');
    setNewNote('');
    setSelectedExistingId('');
    setIsAddModalOpen(false);
  };

  const toggleExpand = (id: string) => {
    setExpandedLedgerId((prev) => (prev === id ? null : id));
  };

  return (
    <section id="two-way-ledger-section" className="space-y-4">
      {/* Main Ledger Bento Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm dark:shadow-xl space-y-4 hover:border-slate-300 dark:hover:border-slate-700/80 transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/80">
          <div>
            <h3 className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              Bilateral Dena-Paona (দোকান ও বন্ধুদের দেনা-পাওনা খাতা)
            </h3>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Multi-transaction customer, shop baki & personal loan ledger
            </span>
          </div>

          {/* Add New Ledger Contact Button */}
          <button
            id="add-ledger-btn"
            onClick={() => {
              setTargetContactMode(ledgers.length > 0 ? 'existing' : 'new');
              if (ledgers.length > 0) setSelectedExistingId(ledgers[0].id);
              setIsAddModalOpen(true);
            }}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-sm shadow-emerald-500/20 hover:scale-105 active:scale-95 self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Add Due / Contact (নতুন বাকী/খাতা)</span>
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search shop or person name..."
              value={searchContact}
              onChange={(e) => setSearchContact(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                filterType === 'all'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              All ({ledgers.length})
            </button>
            <button
              onClick={() => setFilterType('i_owe')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 border cursor-pointer ${
                filterType === 'i_owe'
                  ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-500/30'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-300'
              }`}
            >
              <ArrowDownLeft className="w-3 h-3 text-rose-600 dark:text-rose-400" />
              Dena / Baki ({ledgers.filter((l) => l.ledgerType === 'i_owe' && l.status !== 'settled').length})
            </button>
            <button
              onClick={() => setFilterType('they_owe')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 border cursor-pointer ${
                filterType === 'they_owe'
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-300'
              }`}
            >
              <ArrowUpRight className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              Paona ({ledgers.filter((l) => l.ledgerType === 'they_owe' && l.status !== 'settled').length})
            </button>
            <button
              onClick={() => setFilterType('settled')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 border cursor-pointer ${
                filterType === 'settled'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              Settled ({ledgers.filter((l) => l.status === 'settled').length})
            </button>
          </div>
        </div>

        {/* Ledger Contact Cards List */}
        {filteredLedgers.length === 0 ? (
          <div className="text-center py-10 px-4 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-200 dark:border-slate-800/60 flex flex-col items-center justify-center space-y-2">
            <Users className="w-8 h-8 text-slate-400 opacity-60" />
            <p className="text-xs font-medium">No records found for this view.</p>
            <button
              onClick={() => {
                setTargetContactMode('new');
                setIsAddModalOpen(true);
              }}
              className="mt-1 px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all hover:scale-105 cursor-pointer"
            >
              + Create First Ledger Account
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3.5">
            {filteredLedgers.map((ledger) => {
              const isTheyOwe = ledger.ledgerType === 'they_owe';
              const isSettled = ledger.status === 'settled';
              const isShop = ledger.contactType === 'shop';
              const isExpanded = expandedLedgerId === ledger.id;
              const percentPaid = ledger.originalAmount > 0
                ? Math.min(100, Math.round((ledger.paidAmount / ledger.originalAmount) * 100))
                : 100;

              return (
                <div
                  key={ledger.id}
                  id={`ledger-card-${ledger.id}`}
                  className={`bg-white dark:bg-slate-950/70 border rounded-2xl p-3.5 sm:p-4 transition-all duration-200 hover:shadow-md flex flex-col justify-between group ${
                    isSettled
                      ? 'border-slate-200 dark:border-slate-800/60 opacity-85'
                      : isTheyOwe
                      ? 'border-emerald-200/80 dark:border-emerald-900/40 hover:border-emerald-400 dark:hover:border-emerald-600/70 hover:shadow-emerald-950/10'
                      : 'border-rose-200/80 dark:border-rose-900/40 hover:border-rose-400 dark:hover:border-rose-600/70 hover:shadow-rose-950/10'
                  }`}
                >
                  <div>
                    {/* Top Row: Name, Contact Badge, Type Badge & Amount */}
                    <div className="flex items-start justify-between gap-2.5 mb-2">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div
                          className={`p-2 rounded-xl shrink-0 ${
                            isShop
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20'
                              : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20'
                          }`}
                        >
                          {isShop ? (
                            <Store className="w-4 h-4" />
                          ) : (
                            <User className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate max-w-[130px] xs:max-w-[180px] sm:max-w-none">
                              {ledger.name}
                            </h4>
                            {isSettled ? (
                              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-100 dark:bg-emerald-500/15 border border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-mono shrink-0">
                                Settled
                              </span>
                            ) : (
                              <span
                                className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold font-mono border shrink-0 ${
                                  isTheyOwe
                                    ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                                    : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400'
                                }`}
                              >
                                {isTheyOwe ? 'Paona' : 'Dena'}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium capitalize block mt-0.5 truncate">
                            {isShop ? '🏪 Store' : '👤 Contact'} • {ledger.history?.length || 0} entries
                          </span>
                        </div>
                      </div>

                      {/* Remaining Amount */}
                      <div className="text-right shrink-0">
                        <div
                          className={`text-sm sm:text-base font-black font-mono tracking-tight whitespace-nowrap ${
                            isSettled
                              ? 'text-slate-400 dark:text-slate-500 line-through'
                              : isTheyOwe
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {formatCurrency(ledger.remainingBalance, settings.currency, isPrivacyMasked)}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono font-medium whitespace-nowrap">
                          Total: {formatCurrency(ledger.originalAmount, settings.currency, isPrivacyMasked)}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-1.5 overflow-hidden my-2 border border-slate-200/50 dark:border-slate-800">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isSettled
                            ? 'bg-emerald-500'
                            : isTheyOwe
                            ? 'bg-emerald-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${percentPaid}%` }}
                      />
                    </div>
                  </div>

                  {/* Action Buttons Row */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 mt-1 flex items-center justify-between gap-1.5 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-1 min-w-[170px]">
                      {/* Add More Due / Borrow Button */}
                      <button
                        onClick={() => openRepaymentModal(ledger)}
                        className="flex-1 xs:flex-none px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all hover:scale-102 active:scale-95 cursor-pointer flex items-center justify-center gap-1"
                        title="Add more due or record payment"
                      >
                        <Receipt className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span className="whitespace-nowrap">Manage</span>
                      </button>

                      {/* WhatsApp Share Button */}
                      <button
                        onClick={() => openShareModal(ledger)}
                        className="px-2 py-1.5 rounded-xl bg-emerald-50 dark:bg-slate-900 hover:bg-emerald-100 dark:hover:bg-slate-800 border border-emerald-200 dark:border-slate-800 text-emerald-700 dark:text-emerald-400 text-xs transition-all flex items-center justify-center gap-1 cursor-pointer shrink-0"
                        title="Share WhatsApp Summary"
                      >
                        <Share2 className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-[10px] font-bold">Share</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 ml-auto">
                      {/* Expand / Multi-transaction History Toggle */}
                      {ledger.history && ledger.history.length > 0 && (
                        <button
                          onClick={() => toggleExpand(ledger.id)}
                          className="px-2 py-1 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 flex items-center gap-0.5 cursor-pointer font-semibold rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800"
                        >
                          <span className="text-[10px] font-mono">{ledger.history.length} logs</span>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}

                      {/* Delete */}
                      <button
                        onClick={() => setLedgerToDelete(ledger)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50"
                        title="Delete ledger"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Transaction Timeline */}
                  {isExpanded && ledger.history && ledger.history.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" /> Timeline (লেনদেন হিস্ট্রি):
                      </span>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {ledger.history.map((h, idx) => {
                          const isRepay = h.type === 'repayment';
                          return (
                            <div
                              key={h.id || idx}
                              className="flex flex-col xs:flex-row xs:items-center justify-between gap-1 text-xs bg-slate-50 dark:bg-slate-900 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-800"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span
                                  className={`w-2 h-2 rounded-full shrink-0 ${
                                    isRepay ? 'bg-emerald-500' : 'bg-rose-500'
                                  }`}
                                />
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span
                                      className={`font-black font-mono ${
                                        isRepay
                                          ? 'text-emerald-600 dark:text-emerald-400'
                                          : 'text-rose-600 dark:text-rose-400'
                                      }`}
                                    >
                                      {isRepay ? '−' : '+'}
                                      {formatCurrency(h.amount, settings.currency, isPrivacyMasked)}
                                    </span>
                                    <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                                      {isRepay ? 'পরিশোধ' : 'বাকী/ধার'}
                                    </span>
                                    {h.isCashHandled && (
                                      <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-mono shrink-0">
                                        (নগদ)
                                      </span>
                                    )}
                                  </div>
                                  {h.note && (
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                      {h.note}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono shrink-0 self-end xs:self-center">
                                {formatRelativeDate(h.date)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add New Ledger / Due Entry Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm">
          <div
            id="add-ledger-modal"
            className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Add Due / Ledger Entry (খাতায় বাকী/ধার যোগ)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Record new shop baki, loan borrow or receivable
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>

            {/* Existing Contact vs New Contact Switcher */}
            {ledgers.length > 0 && (
              <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-950 p-1 rounded-2xl border border-slate-200 dark:border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setTargetContactMode('existing')}
                  className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    targetContactMode === 'existing'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  Existing Contact (বিদ্যমান দোকান/ব্যক্তি)
                </button>
                <button
                  type="button"
                  onClick={() => setTargetContactMode('new')}
                  className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    targetContactMode === 'new'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Contact (নতুন খাতা)
                </button>
              </div>
            )}

            <form onSubmit={handleCreateLedgerSubmit} className="space-y-3.5">
              {targetContactMode === 'existing' && ledgers.length > 0 ? (
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Select Contact / Shop *
                  </label>
                  <select
                    value={selectedExistingId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setSelectedExistingId(id);
                      const target = ledgers.find((l) => l.id === id);
                      if (target) {
                        setNewIsCashHandled(target.contactType !== 'shop');
                      }
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-semibold"
                  >
                    {ledgers.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name} ({l.contactType === 'shop' ? 'Shop' : 'Person'} - {l.ledgerType === 'i_owe' ? 'Dena' : 'Paona'} : {formatCurrency(l.remainingBalance, settings.currency, isPrivacyMasked)})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <>
                  {/* Type Switcher: Paona vs Dena */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                      Ledger Type
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setNewLedgerType('i_owe');
                          setNewIsCashHandled(true);
                        }}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          newLedgerType === 'i_owe'
                            ? 'bg-rose-50 dark:bg-rose-950/80 border-rose-500 text-rose-700 dark:text-rose-300 ring-1 ring-rose-500'
                            : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <ArrowDownLeft className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                        Dena / Baki (আমি দেনাদার)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNewLedgerType('they_owe');
                          setNewIsCashHandled(true);
                        }}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          newLedgerType === 'they_owe'
                            ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500'
                            : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        Paona (আমি পাওনাদার)
                      </button>
                    </div>
                  </div>

                  {/* Contact Name */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Contact / Shop Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Bhai Bhai Grocery, Rahim, Kabir Store"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>

                  {/* Contact Type: Friend vs Shop */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Contact Category
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setNewContactType('shop');
                          setNewIsCashHandled(false);
                        }}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                          newContactType === 'shop'
                            ? 'bg-slate-200 dark:bg-slate-800 border-slate-400 dark:border-slate-600 text-slate-900 dark:text-white'
                            : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <Store className="w-3.5 h-3.5" />
                        Shop / Store (দোকান)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNewContactType('friend');
                          setNewIsCashHandled(true);
                        }}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                          newContactType === 'friend'
                            ? 'bg-slate-200 dark:bg-slate-800 border-slate-400 dark:border-slate-600 text-slate-900 dark:text-white'
                            : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <User className="w-3.5 h-3.5" />
                        Friend / Person (ব্যক্তি)
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Amount */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Amount ({settings.currency}) *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  min="1"
                  placeholder="500"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-base font-bold font-mono text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Cash in Hand Handling Checkbox & Positive Cash Explainer */}
              {(() => {
                const activeLedger = targetContactMode === 'existing' ? ledgers.find((l) => l.id === selectedExistingId) : null;
                const activeType = activeLedger ? activeLedger.ledgerType : newLedgerType;
                const activeContact = activeLedger ? activeLedger.contactType : newContactType;

                return (
                  <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200 dark:border-emerald-900/50">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newIsCashHandled}
                        onChange={(e) => setNewIsCashHandled(e.target.checked)}
                        className="w-4 h-4 mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 cursor-pointer shrink-0"
                      />
                      <div className="text-xs space-y-0.5">
                        <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                          <Wallet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          Physical Cash in Hand (হাতে নগদ টাকা এসেছে কি না?)
                        </span>
                        <span className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug block">
                          {newIsCashHandled ? (
                            activeType === 'i_owe' ? (
                              <span className="text-emerald-700 dark:text-emerald-300 font-medium">
                                ✓ ধার বাবদ নগদ টাকা আপনার হাতে এসেছে — ড্যাশবোর্ডে <strong>'In-Hand Cash' (নগদ টাকা) বৃদ্ধি পাবে</strong> (+ক্যাশ)। পরবর্তীতে এই টাকা থেকে খরচ করলে মানিব্যাগ থেকে কমবে।
                              </span>
                            ) : (
                              <span className="text-indigo-700 dark:text-indigo-300 font-medium">
                                ✓ নিজের পকেট/ক্যাশ থেকে ধার দেওয়া হয়েছে — আপনার নগদ ক্যাশ ব্যালেন্স থেকে কর্তন হবে।
                              </span>
                            )
                          ) : (
                            <span className="text-slate-600 dark:text-slate-300 font-medium">
                              ✓ দোকান থেকে বাকীতে সওদা নেওয়া হয়েছে — <strong>পকেটের নগদ ক্যাশ ব্যালেন্স পরিবর্তন হবে না</strong>, শুধুমাত্র দেনা (Have to Pay) হিসেবে হিসাব থাকবে।
                            </span>
                          )}
                        </span>
                      </div>
                    </label>
                  </div>
                );
              })()}

              {/* Optional Note */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Note / Reason
                </label>
                <input
                  type="text"
                  placeholder="e.g. Grocery items purchase, Emergency personal loan"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm transition-all shadow-md shadow-indigo-600/20 hover:scale-[1.01] active:scale-98 mt-2 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                {targetContactMode === 'existing' ? 'Add Due to Account' : 'Create & Save Account'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Ledger Deletion */}
      <ConfirmDeleteModal
        isOpen={!!ledgerToDelete}
        title="Delete Ledger Account (খাতা ডিলিট করবেন?)"
        description="Are you sure you want to delete this ledger account? All bilateral transaction history and balance for this person/shop will be removed."
        itemDetails={
          ledgerToDelete
            ? `${ledgerToDelete.name} (${ledgerToDelete.ledgerType === 'i_owe' ? 'Dena' : 'Paona'}: ${formatCurrency(ledgerToDelete.remainingBalance, settings.currency, isPrivacyMasked)})`
            : undefined
        }
        confirmText="Yes, Delete (খাতা মুছে ফেলুন)"
        cancelText="Cancel (বাতিল)"
        onConfirm={() => {
          if (ledgerToDelete) {
            removeLedger(ledgerToDelete.id);
            setLedgerToDelete(null);
          }
        }}
        onClose={() => setLedgerToDelete(null)}
      />
    </section>
  );
};

