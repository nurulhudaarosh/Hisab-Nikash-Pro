import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  Transaction,
  Ledger,
  UserSettings,
  UserProfile,
  SyncStatusInfo,
  ActiveTab,
  Category,
} from '../types';
import {
  db,
  seedInitialDataIfNeeded,
  addTransactionLocal,
  updateTransactionLocal,
  deleteTransactionLocal,
  addLedgerLocal,
  addDueToLedgerLocal,
  recordRepaymentLocal,
  updateLedgerLocal,
  deleteLedgerLocal,
  saveSettingsLocal,
  getSettingsLocal,
  migrateLocalGuestDataToUser,
  DEFAULT_SETTINGS,
} from '../db/indexedDB';
import { syncEngine } from '../services/syncEngine';

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
}

interface AppContextType {
  // Navigation & View
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;

  // Data
  transactions: Transaction[];
  ledgers: Ledger[];
  settings: UserSettings;
  categories: Category[];
  isPrivacyMasked: boolean;
  togglePrivacyMask: () => void;

  // Financial Computations
  availableCash: number;
  totalIncome: number;
  totalExpense: number;
  totalPaona: number; // They owe me
  totalDena: number; // I owe them
  netPosition: number;
  todayExpense: number;
  todayBudgetRemaining: number;
  isOverLimitToday: boolean;
  todayLimitExceededBy: number;
  sevenDaysHistory: Array<{
    dateStr: string;
    dayLabel: string;
    spent: number;
    limit: number;
    isExceeded: boolean;
    isToday: boolean;
    isoDate: string;
  }>;

  // Filters & Search
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategoryFilter: string | null;
  setSelectedCategoryFilter: (cat: string | null) => void;
  selectedDateFilter: string | null;
  setSelectedDateFilter: (date: string | null) => void;

  // Operations
  createTransaction: (tx: Omit<Transaction, 'id' | 'synced' | 'updatedAt' | 'userId'>) => Promise<Transaction>;
  editTransaction: (id: string, patch: Partial<Transaction>) => Promise<Transaction | null>;
  removeTransaction: (id: string) => Promise<boolean>;

  createLedger: (ldg: Omit<Ledger, 'id' | 'remainingBalance' | 'synced' | 'updatedAt' | 'history' | 'userId'> & { initialHistoryNote?: string; isCashHandled?: boolean }) => Promise<Ledger>;
  addDueToLedger: (ledgerId: string, additionalAmount: number, note?: string, isCashHandled?: boolean) => Promise<Ledger | null>;
  recordRepayment: (ledgerId: string, amount: number, note?: string, isCashHandled?: boolean) => Promise<Ledger | null>;
  editLedger: (id: string, patch: Partial<Ledger>) => Promise<Ledger | null>;
  removeLedger: (id: string) => Promise<boolean>;

  updateUserSettings: (newSettings: Partial<UserSettings>) => Promise<void>;

  // Theme & Appearance
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  setTheme: (theme: 'dark' | 'light') => void;

  // Sync & Auth
  syncStatus: SyncStatusInfo;
  syncNow: () => Promise<void>;
  user: UserProfile | null;
  setUserProfile: (user: UserProfile | null) => void;
  logout: () => void;

  // Modals & Bottom Sheets
  isQuickAddOpen: boolean;
  openQuickAdd: (initialText?: string) => void;
  closeQuickAdd: () => void;
  quickAddInitialText: string;

  repaymentTargetLedger: Ledger | null;
  openRepaymentModal: (ledger: Ledger) => void;
  closeRepaymentModal: () => void;

  shareTargetLedger: Ledger | null;
  openShareModal: (ledger: Ledger) => void;
  closeShareModal: () => void;

  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'register';
  openAuthModal: (mode?: 'login' | 'register') => void;
  closeAuthModal: () => void;

  isSettingsModalOpen: boolean;
  openSettingsModal: () => void;
  closeSettingsModal: () => void;

  // Toasts
  toasts: ToastMessage[];
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void;
  dismissToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isPrivacyMasked, setIsPrivacyMasked] = useState<boolean>(() => {
    return localStorage.getItem('hisab_privacy_masked') === 'true';
  });

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(null);

  // Theme state
  const [theme, setThemeState] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('hisab_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'dark';
  });

  const applyThemeToDOM = useCallback((newTheme: 'dark' | 'light') => {
    if (typeof document === 'undefined') return;
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      document.documentElement.style.colorScheme = 'dark';
      const meta = document.getElementById('theme-color-meta');
      if (meta) meta.setAttribute('content', '#020617');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      document.documentElement.style.colorScheme = 'light';
      const meta = document.getElementById('theme-color-meta');
      if (meta) meta.setAttribute('content', '#f8fafc');
    }
  }, []);

  const setTheme = useCallback(
    (newTheme: 'dark' | 'light') => {
      setThemeState(newTheme);
      localStorage.setItem('hisab_theme', newTheme);
      applyThemeToDOM(newTheme);
    },
    [applyThemeToDOM]
  );

  const toggleTheme = useCallback(() => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  }, [theme, setTheme]);

  useEffect(() => {
    applyThemeToDOM(theme);
  }, [theme, applyThemeToDOM]);

  // Modal states
  const [isQuickAddOpen, setIsQuickAddOpen] = useState<boolean>(false);
  const [quickAddInitialText, setQuickAddInitialText] = useState<string>('');
  const [repaymentTargetLedger, setRepaymentTargetLedger] = useState<Ledger | null>(null);
  const [shareTargetLedger, setShareTargetLedger] = useState<Ledger | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);

  // Auth & Sync
  const [user, setUser] = useState<UserProfile | null>(() => syncEngine.getCachedUser());
  const [syncStatus, setSyncStatus] = useState<SyncStatusInfo>(syncEngine.getStatus());
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((text: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const togglePrivacyMask = useCallback(() => {
    setIsPrivacyMasked((prev) => {
      const next = !prev;
      localStorage.setItem('hisab_privacy_masked', String(next));
      return next;
    });
  }, []);

  // Reload local Dexie database into memory state (strictly for the active user)
  const refreshLocalData = useCallback(async () => {
    try {
      const currentUserId = user?.id || 'local_user';
      // Load ONLY records belonging to the current user (never mix demo guest records with authenticated user data)
      const allTx = await db.transactions.where('userId').equals(currentUserId).toArray();
      const allLdg = await db.ledgers.where('userId').equals(currentUserId).toArray();
      const userSettings = await getSettingsLocal(currentUserId);

      // Filter out soft deleted records for the UI view
      const activeTx = allTx.filter((t) => !t.deleted);
      const activeLdg = allLdg.filter((l) => !l.deleted);

      // Sort tx newest first
      activeTx.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      // Sort ledgers active first, then highest remaining balance
      activeLdg.sort((a, b) => {
        if (a.status === 'active' && b.status === 'settled') return -1;
        if (a.status === 'settled' && b.status === 'active') return 1;
        return b.remainingBalance - a.remainingBalance;
      });

      setTransactions(activeTx);
      setLedgers(activeLdg);
      setSettings(userSettings);

      // Count unsynced records
      const unsyncedTx = allTx.filter((t) => t.synced === false).length;
      const unsyncedLdg = allLdg.filter((l) => l.synced === false).length;
      const unsyncedSet = userSettings.synced === false ? 1 : 0;
      const pendingCount = unsyncedTx + unsyncedLdg + unsyncedSet;

      setSyncStatus((prev) => ({
        ...prev,
        pendingOutboxCount: pendingCount,
      }));
    } catch (e) {
      console.error('Failed to load local Dexie data:', e);
    }
  }, [user]);

  // Initial Boot & Sync Engine setup
  useEffect(() => {
    let unsubscribeSync: (() => void) | undefined;

    const init = async () => {
      await seedInitialDataIfNeeded(user?.id || 'local_user');
      await refreshLocalData();

      syncEngine.setUser(user);

      if (user) {
        // Automatically sync & restore all user records on boot
        await syncEngine.performFullSync(user);
        await refreshLocalData();
      }

      unsubscribeSync = syncEngine.subscribe((status) => {
        setSyncStatus(status);
        // Refresh local data whenever sync status shifts
        refreshLocalData();
      });

      // Schedule initial outbox sync
      syncEngine.scheduleSync(1000);
    };

    init();

    return () => {
      if (unsubscribeSync) unsubscribeSync();
    };
  }, [user, refreshLocalData]);

  // Financial Calculations
  const {
    availableCash,
    totalIncome,
    totalExpense,
    totalPaona,
    totalDena,
    netPosition,
    todayExpense,
    todayBudgetRemaining,
    isOverLimitToday,
    todayLimitExceededBy,
    sevenDaysHistory,
  } = useMemo(() => {
    let incomeSum = 0;
    let expenseSum = 0;
    let todayExp = 0;

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const todayEnd = todayStart + 24 * 60 * 60 * 1000;

    transactions.forEach((tx) => {
      const txTime = new Date(tx.date).getTime();
      const isToday = txTime >= todayStart && txTime < todayEnd;

      if (tx.type === 'income') {
        incomeSum += Number(tx.amount || 0);
      } else if (tx.type === 'expense') {
        expenseSum += Number(tx.amount || 0);
        if (isToday && tx.affectsDailyLimit !== false) {
          todayExp += Number(tx.amount || 0);
        }
      }
    });

    // Ledgers calculation & Cash movement tracking
    let paonaSum = 0; // Total active receivables they owe me
    let denaSum = 0; // Total active payables I owe them
    let cashBorrowsReceived = 0; // Cash borrowed from friends/contacts (+cash in hand)
    let cashRepaymentsPaid = 0; // Cash paid back for Dena (-cash from hand)
    let cashLentOut = 0; // Cash lent out to others (-cash from hand)
    let cashRepaymentsCollected = 0; // Cash collected from Paona (+cash into hand)

    ledgers.forEach((ldg) => {
      if (ldg.status === 'active') {
        if (ldg.ledgerType === 'they_owe') {
          paonaSum += Number(ldg.remainingBalance || 0);
        } else if (ldg.ledgerType === 'i_owe') {
          denaSum += Number(ldg.remainingBalance || 0);
        }
      }

      // Compute liquid cash impact from ledger entries
      if (ldg.history && Array.isArray(ldg.history) && ldg.history.length > 0) {
        ldg.history.forEach((h) => {
          const amt = Number(h.amount || 0);
          if (amt <= 0) return;

          const isFriendOrGeneral = ldg.contactType === 'friend' || !ldg.contactType;
          // For friend/general contact, default is cash handled unless explicitly marked false.
          // For shop, default is non-cash (store credit/due) unless explicitly marked true.
          const wasCashReceivedOrLent =
            h.isCashHandled === true || (h.isCashHandled === undefined && isFriendOrGeneral);

          if (ldg.ledgerType === 'i_owe') {
            // I owe them (Dena / Loan taken)
            if (h.type === 'initial' || h.type === 'due_added') {
              if (wasCashReceivedOrLent) {
                cashBorrowsReceived += amt; // Money entered my pocket from friend/person
              }
            } else if (h.type === 'repayment') {
              if (h.isCashHandled !== false) {
                cashRepaymentsPaid += amt; // Money left my pocket to pay back friend OR shop
              }
            }
          } else if (ldg.ledgerType === 'they_owe') {
            // They owe me (Paona / Loan given)
            if (h.type === 'initial' || h.type === 'due_added') {
              if (wasCashReceivedOrLent) {
                cashLentOut += amt; // Money left my pocket as a loan to them
              }
            } else if (h.type === 'repayment') {
              if (h.isCashHandled !== false) {
                cashRepaymentsCollected += amt; // Money returned back into my pocket
              }
            }
          }
        });
      } else {
        // Fallback for legacy or imported ledgers without granular history logs
        const isFriendOrGeneral = ldg.contactType === 'friend' || !ldg.contactType;
        const orig = Number(ldg.originalAmount || 0);
        const paid = Number(ldg.paidAmount || 0);

        if (ldg.ledgerType === 'i_owe') {
          if (isFriendOrGeneral) {
            cashBorrowsReceived += orig; // Initial cash borrow from friend
          }
          if (paid > 0) {
            cashRepaymentsPaid += paid; // Repayments paid in cash
          }
        } else if (ldg.ledgerType === 'they_owe') {
          cashLentOut += orig;
          if (paid > 0) {
            cashRepaymentsCollected += paid;
          }
        }
      }
    });

    // Available Liquid Cash in Hand:
    // (Income + Cash Borrows + Paona Collections) - (Expenses + Dena Repayments + Cash Lent Out)
    const cash = (incomeSum + cashBorrowsReceived + cashRepaymentsCollected) - (expenseSum + cashRepaymentsPaid + cashLentOut);
    
    // Overall Net Position (Net Worth) = Available Liquid Cash + Total Paona - Total Dena
    const netPos = cash + paonaSum - denaSum;

    const dailyLimit = settings.dailyExpenseLimit || 150;
    const remaining = dailyLimit - todayExp;
    const isExceeded = todayExp > dailyLimit;
    const exceededBy = Math.max(0, todayExp - dailyLimit);

    // 7-day history array
    const historyList = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const dEnd = dStart + 24 * 60 * 60 * 1000;

      let dSpent = 0;
      transactions.forEach((tx) => {
        if (tx.type === 'expense' && tx.affectsDailyLimit !== false) {
          const tTime = new Date(tx.date).getTime();
          if (tTime >= dStart && tTime < dEnd) {
            dSpent += Number(tx.amount || 0);
          }
        }
      });

      const isCurrentDay = i === 0;
      const dayLabel = isCurrentDay ? 'Today' : dayNames[d.getDay()];
      const dateStr = d.toISOString().split('T')[0];

      historyList.push({
        dateStr,
        dayLabel,
        spent: dSpent,
        limit: dailyLimit,
        isExceeded: dSpent > dailyLimit,
        isToday: isCurrentDay,
        isoDate: d.toISOString(),
      });
    }

    return {
      availableCash: cash,
      totalIncome: incomeSum,
      totalExpense: expenseSum,
      totalPaona: paonaSum,
      totalDena: denaSum,
      netPosition: netPos,
      todayExpense: todayExp,
      todayBudgetRemaining: remaining,
      isOverLimitToday: isExceeded,
      todayLimitExceededBy: exceededBy,
      sevenDaysHistory: historyList,
    };
  }, [transactions, ledgers, settings.dailyExpenseLimit]);

  // Actions
  const createTransaction = useCallback(
    async (txData: Omit<Transaction, 'id' | 'synced' | 'updatedAt' | 'userId'>) => {
      const userId = user?.id || 'local_user';
      const created = await addTransactionLocal({ ...txData, userId });
      await refreshLocalData();
      syncEngine.scheduleSync();
      showToast(
        created.type === 'expense'
          ? `Added expense of ${settings.currency}${created.amount}`
          : created.type === 'income'
          ? `Added income of ${settings.currency}${created.amount}`
          : 'Note saved locally',
        'success'
      );
      return created;
    },
    [user, settings.currency, refreshLocalData, showToast]
  );

  const editTransaction = useCallback(
    async (id: string, patch: Partial<Transaction>) => {
      const updated = await updateTransactionLocal(id, patch);
      await refreshLocalData();
      syncEngine.scheduleSync();
      if (updated) showToast('Transaction updated', 'info');
      return updated;
    },
    [refreshLocalData, showToast]
  );

  const removeTransaction = useCallback(
    async (id: string) => {
      const ok = await deleteTransactionLocal(id);
      await refreshLocalData();
      syncEngine.scheduleSync();
      if (ok) showToast('Deleted record', 'info');
      return ok;
    },
    [refreshLocalData, showToast]
  );

  const createLedger = useCallback(
    async (
      ldgData: Omit<Ledger, 'id' | 'remainingBalance' | 'synced' | 'updatedAt' | 'history' | 'userId'> & {
        initialHistoryNote?: string;
        isCashHandled?: boolean;
      }
    ) => {
      const userId = user?.id || 'local_user';
      const created = await addLedgerLocal({ ...ldgData, userId });
      await refreshLocalData();
      syncEngine.scheduleSync();
      showToast(
        `Added ${created.name} (${created.ledgerType === 'they_owe' ? 'Paona' : 'Dena'})`,
        'success'
      );
      return created;
    },
    [user, refreshLocalData, showToast]
  );

  const addDueToLedger = useCallback(
    async (ledgerId: string, additionalAmount: number, note: string = '', isCashHandled?: boolean) => {
      const updated = await addDueToLedgerLocal(ledgerId, additionalAmount, note, isCashHandled);
      await refreshLocalData();
      syncEngine.scheduleSync();
      if (updated) {
        showToast(
          `Added ${settings.currency}${additionalAmount} to ${updated.name}`,
          'success'
        );
      }
      return updated;
    },
    [settings.currency, refreshLocalData, showToast]
  );

  const recordRepayment = useCallback(
    async (ledgerId: string, amount: number, note: string = '', isCashHandled: boolean = true) => {
      const updated = await recordRepaymentLocal(ledgerId, amount, note, isCashHandled);
      await refreshLocalData();
      syncEngine.scheduleSync();
      if (updated) {
        showToast(
          updated.status === 'settled'
            ? `🎉 Fully settled ledger for ${updated.name}!`
            : `Recorded payment of ${settings.currency}${amount} for ${updated.name}`,
          'success'
        );
      }
      return updated;
    },
    [settings.currency, refreshLocalData, showToast]
  );

  const editLedger = useCallback(
    async (id: string, patch: Partial<Ledger>) => {
      const updated = await updateLedgerLocal(id, patch);
      await refreshLocalData();
      syncEngine.scheduleSync();
      if (updated) showToast('Ledger contact updated', 'info');
      return updated;
    },
    [refreshLocalData, showToast]
  );

  const removeLedger = useCallback(
    async (id: string) => {
      const ok = await deleteLedgerLocal(id);
      await refreshLocalData();
      syncEngine.scheduleSync();
      if (ok) showToast('Ledger entry removed', 'info');
      return ok;
    },
    [refreshLocalData, showToast]
  );

  const updateUserSettings = useCallback(
    async (newSettings: Partial<UserSettings>) => {
      const updated = await saveSettingsLocal({
        ...settings,
        ...newSettings,
        userId: user?.id || 'local_user',
      });
      setSettings(updated);
      syncEngine.scheduleSync();
      showToast('Settings saved', 'success');
    },
    [settings, user, showToast]
  );

  const syncNow = useCallback(async () => {
    showToast('Syncing outbox with cloud...', 'info');
    const res = await syncEngine.triggerSync();
    if (res.success) {
      showToast('Synced successfully with cloud!', 'success');
    } else {
      showToast(res.error || 'Sync failed. Local data preserved.', 'error');
    }
    await refreshLocalData();
  }, [refreshLocalData, showToast]);

  const setUserProfile = useCallback(
    async (u: UserProfile | null) => {
      setUser(u);
      syncEngine.setUser(u);
      if (u) {
        // 1. Migrate any guest data created locally to this user
        await migrateLocalGuestDataToUser(u.id);
        // 2. Perform full sync and pull all cloud records
        const result = await syncEngine.performFullSync(u);
        await refreshLocalData();
        const total = (result.pulledTxCount || 0) + (result.pulledLdgCount || 0);
        if (total > 0) {
          showToast(`Welcome back, ${u.name}! Restored ${total} records from cloud.`, 'success');
        } else {
          showToast(`Welcome, ${u.name}! Connected to cloud database.`, 'success');
        }
      } else {
        await refreshLocalData();
      }
    },
    [refreshLocalData, showToast]
  );

  const logout = useCallback(async () => {
    setUser(null);
    syncEngine.setUser(null);
    await refreshLocalData();
    showToast('Logged out of cloud account (local offline mode)', 'info');
  }, [refreshLocalData, showToast]);

  const openQuickAdd = useCallback((initialText: string = '') => {
    setQuickAddInitialText(initialText);
    setIsQuickAddOpen(true);
  }, []);

  const closeQuickAdd = useCallback(() => {
    setIsQuickAddOpen(false);
    setQuickAddInitialText('');
  }, []);

  const openRepaymentModal = useCallback((ldg: Ledger) => {
    setRepaymentTargetLedger(ldg);
  }, []);

  const closeRepaymentModal = useCallback(() => {
    setRepaymentTargetLedger(null);
  }, []);

  const openShareModal = useCallback((ldg: Ledger) => {
    setShareTargetLedger(ldg);
  }, []);

  const closeShareModal = useCallback(() => {
    setShareTargetLedger(null);
  }, []);

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        transactions,
        ledgers,
        settings,
        categories: settings.categories || DEFAULT_SETTINGS.categories,
        isPrivacyMasked,
        togglePrivacyMask,

        availableCash,
        totalIncome,
        totalExpense,
        totalPaona,
        totalDena,
        netPosition,
        todayExpense,
        todayBudgetRemaining,
        isOverLimitToday,
        todayLimitExceededBy,
        sevenDaysHistory,

        searchQuery,
        setSearchQuery,
        selectedCategoryFilter,
        setSelectedCategoryFilter,
        selectedDateFilter,
        setSelectedDateFilter,

        createTransaction,
        editTransaction,
        removeTransaction,

        createLedger,
        addDueToLedger,
        recordRepayment,
        editLedger,
        removeLedger,

        updateUserSettings,

        // Theme & Appearance
        theme,
        toggleTheme,
        setTheme,

        syncStatus,
        syncNow,
        user,
        setUserProfile,
        logout,

        isQuickAddOpen,
        openQuickAdd,
        closeQuickAdd,
        quickAddInitialText,

        repaymentTargetLedger,
        openRepaymentModal,
        closeRepaymentModal,

        shareTargetLedger,
        openShareModal,
        closeShareModal,

        isAuthModalOpen,
        authModalMode,
        openAuthModal: (mode: 'login' | 'register' = 'login') => {
          setAuthModalMode(mode);
          setIsAuthModalOpen(true);
        },
        closeAuthModal: () => setIsAuthModalOpen(false),

        isSettingsModalOpen,
        openSettingsModal: () => setIsSettingsModalOpen(true),
        closeSettingsModal: () => setIsSettingsModalOpen(false),

        toasts,
        showToast,
        dismissToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
