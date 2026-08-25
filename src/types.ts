export type TransactionType = 'expense' | 'income' | 'note';
export type ContactType = 'shop' | 'friend';
export type LedgerType = 'i_owe' | 'they_owe';
export type LedgerStatus = 'active' | 'settled';

export interface LedgerHistoryEntry {
  id?: string;
  type?: 'due_added' | 'repayment' | 'initial';
  date: string; // ISO string
  amount: number;
  note: string;
  isCashHandled?: boolean; // If true, affects cash in hand
}

export type RepaymentHistory = LedgerHistoryEntry;

export interface Transaction {
  id: string; // UUID v4
  userId: string;
  type: TransactionType;
  amount: number;
  category: string;
  affectsDailyLimit: boolean;
  isBusiness: boolean;
  note: string;
  date: string; // ISO string
  synced?: boolean;
  deleted?: boolean;
  updatedAt: string; // ISO string
}

export interface Ledger {
  id: string; // UUID v4
  userId: string;
  name: string;
  contactType: ContactType;
  ledgerType: LedgerType;
  originalAmount: number;
  paidAmount: number;
  remainingBalance: number;
  history: LedgerHistoryEntry[];
  status: LedgerStatus;
  synced?: boolean;
  deleted?: boolean;
  updatedAt: string; // ISO string
}

export interface Category {
  id: string;
  label: string;
  color: string;
  icon: string;
  type?: 'expense' | 'income' | 'both';
}

export interface UserSettings {
  userId: string;
  dailyExpenseLimit: number;
  enableRollover: boolean;
  currency: string;
  theme?: 'dark' | 'light';
  categories: Category[];
  synced?: boolean;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  token?: string;
}

export interface SyncStatusInfo {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  pendingOutboxCount: number;
  syncError: string | null;
  isCloudConnected: boolean;
}

export interface ParsedShorthand {
  amount: number | null;
  category: string;
  type: TransactionType;
  cleanedNote: string;
  affectsDailyLimit: boolean;
  isBusiness: boolean;
  detectedContact?: {
    name: string;
    ledgerType: LedgerType;
  };
}

export type ActiveTab = 'dashboard' | 'ledgers' | 'activity' | 'notes' | 'settings';
