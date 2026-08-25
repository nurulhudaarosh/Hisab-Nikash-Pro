import Dexie, { type Table } from 'dexie';
import { Transaction, Ledger, UserSettings, Category } from '../types';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'daily_normal', label: 'Daily Normal', color: '#10B981', icon: 'ShoppingBag' },
  { id: 'food', label: 'Food & Meals', color: '#F59E0B', icon: 'Utensils' },
  { id: 'tea_snacks', label: 'Tea & Snacks', color: '#EC4899', icon: 'Coffee' },
  { id: 'commute', label: 'Commute / Ride', color: '#3B82F6', icon: 'Bus' },
  { id: 'shop_due', label: 'Shop Due', color: '#8B5CF6', icon: 'Store' },
  { id: 'general', label: 'General / Utility', color: '#64748B', icon: 'Layers' },
  { id: 'bills', label: 'Bills & Rent', color: '#EF4444', icon: 'Receipt' },
  { id: 'health', label: 'Health & Meds', color: '#14B8A6', icon: 'Activity' },
  { id: 'salary', label: 'Salary / Income', color: '#22C55E', icon: 'ArrowDownLeft' },
  { id: 'freelance', label: 'Freelance / Extra', color: '#06B6D4', icon: 'Sparkles' },
];

export const DEFAULT_SETTINGS: UserSettings = {
  userId: 'local_user',
  dailyExpenseLimit: 150,
  enableRollover: false,
  currency: '৳',
  categories: DEFAULT_CATEGORIES,
  synced: true,
  updatedAt: new Date().toISOString(),
};

export class HisabDatabase extends Dexie {
  transactions!: Table<Transaction, string>;
  ledgers!: Table<Ledger, string>;
  settings!: Table<UserSettings, string>;

  constructor() {
    super('HisabLocalDB');
    this.version(1).stores({
      transactions: 'id, userId, type, category, date, synced, affectsDailyLimit, isBusiness, deleted, updatedAt',
      ledgers: 'id, userId, contactType, ledgerType, status, synced, deleted, updatedAt',
      settings: 'userId, updatedAt, synced',
    });
  }
}

export const db = new HisabDatabase();

// Seed initial demo data if database is empty (ONLY for offline guest mode, NEVER for authenticated users)
let isSeeding = false;

export async function seedInitialDataIfNeeded(userId: string = 'local_user') {
  // If user is authenticated, strictly do NOT seed demo data
  if (userId !== 'local_user') {
    return;
  }

  if (isSeeding) return;
  isSeeding = true;

  try {
    const count = await db.transactions.where('userId').equals('local_user').count();
    if (count === 0) {
      const now = new Date();
      const todayStr = now.toISOString();

      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);

      const twoDaysAgo = new Date(now);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const initialTransactions: Transaction[] = [
        {
          id: 'tx_seed_1',
          userId,
          type: 'income',
          amount: 25000,
          category: 'salary',
          affectsDailyLimit: false,
          isBusiness: false,
          note: 'Monthly Salary Deposit 💼',
          date: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
          synced: true,
          updatedAt: todayStr,
        },
        {
          id: 'tx_seed_2',
          userId,
          type: 'expense',
          amount: 40,
          category: 'tea_snacks',
          affectsDailyLimit: true,
          isBusiness: false,
          note: 'Morning Cha & Toast with Karim ☕',
          date: todayStr,
          synced: true,
          updatedAt: todayStr,
        },
        {
          id: 'tx_seed_3',
          userId,
          type: 'expense',
          amount: 65,
          category: 'food',
          affectsDailyLimit: true,
          isBusiness: false,
          note: 'Lunch: Khichuri & Egg',
          date: todayStr,
          synced: true,
          updatedAt: todayStr,
        },
        {
          id: 'tx_seed_4',
          userId,
          type: 'expense',
          amount: 180,
          category: 'food',
          affectsDailyLimit: true,
          isBusiness: false,
          note: 'Dinner & Snacks with team',
          date: yesterday.toISOString(),
          synced: true,
          updatedAt: yesterday.toISOString(),
        },
        {
          id: 'tx_seed_5',
          userId,
          type: 'expense',
          amount: 35,
          category: 'commute',
          affectsDailyLimit: true,
          isBusiness: false,
          note: 'Rickshaw fare to office',
          date: twoDaysAgo.toISOString(),
          synced: true,
          updatedAt: twoDaysAgo.toISOString(),
        },
        {
          id: 'tx_seed_6',
          userId,
          type: 'note',
          amount: 0,
          category: 'general',
          affectsDailyLimit: false,
          isBusiness: false,
          note: '📌 **Monthly Savings Target**: Save ৳5,000 this month. Keep daily lunch/snack under ৳150 limit.',
          date: todayStr,
          synced: true,
          updatedAt: todayStr,
        }
      ];

      const initialLedgers: Ledger[] = [
        {
          id: 'ldg_seed_1',
          userId,
          name: 'Bhai Bhai Grocery Store',
          contactType: 'shop',
          ledgerType: 'i_owe', // Dena/Baki
          originalAmount: 1200,
          paidAmount: 500,
          remainingBalance: 700,
          history: [
            {
              date: yesterday.toISOString(),
              amount: 500,
              note: 'Paid via bKash / Cash partial payment',
            },
          ],
          status: 'active',
          synced: true,
          updatedAt: todayStr,
        },
        {
          id: 'ldg_seed_2',
          userId,
          name: 'Rahim (Colleague)',
          contactType: 'friend',
          ledgerType: 'they_owe', // Paona
          originalAmount: 1500,
          paidAmount: 0,
          remainingBalance: 1500,
          history: [],
          status: 'active',
          synced: true,
          updatedAt: todayStr,
        },
        {
          id: 'ldg_seed_3',
          userId,
          name: 'Anis Bhai',
          contactType: 'friend',
          ledgerType: 'they_owe', // Paona
          originalAmount: 800,
          paidAmount: 800,
          remainingBalance: 0,
          history: [
            {
              date: twoDaysAgo.toISOString(),
              amount: 800,
              note: 'Returned in full at coffee shop 🎉',
            },
          ],
          status: 'settled',
          synced: true,
          updatedAt: todayStr,
        },
      ];

      await db.transactions.bulkPut(initialTransactions);
      await db.ledgers.bulkPut(initialLedgers);
      await db.settings.put({ ...DEFAULT_SETTINGS, userId });
    }
  } catch (err) {
    console.log('Initial seed completed or records already exist:', err);
  } finally {
    isSeeding = false;
  }
}

// --- LOCAL DATA ACCESS OPERATIONS (Zero-latency writes) ---

export async function addTransactionLocal(
  tx: Omit<Transaction, 'id' | 'synced' | 'updatedAt'>
): Promise<Transaction> {
  const newTx: Transaction = {
    ...tx,
    id: 'tx_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
    synced: false,
    deleted: false,
    updatedAt: new Date().toISOString(),
  };
  await db.transactions.put(newTx);
  return newTx;
}

export async function updateTransactionLocal(
  id: string,
  patch: Partial<Transaction>
): Promise<Transaction | null> {
  const existing = await db.transactions.get(id);
  if (!existing) return null;
  const updated: Transaction = {
    ...existing,
    ...patch,
    synced: false,
    updatedAt: new Date().toISOString(),
  };
  await db.transactions.put(updated);
  return updated;
}

export async function deleteTransactionLocal(id: string): Promise<boolean> {
  const existing = await db.transactions.get(id);
  if (!existing) return false;
  // Soft-delete so outbox can propagate deletion to server
  const deletedTx: Transaction = {
    ...existing,
    deleted: true,
    synced: false,
    updatedAt: new Date().toISOString(),
  };
  await db.transactions.put(deletedTx);
  return true;
}

export async function addLedgerLocal(
  ledger: Omit<Ledger, 'id' | 'remainingBalance' | 'synced' | 'updatedAt' | 'history'> & {
    initialHistoryNote?: string;
    isCashHandled?: boolean;
  }
): Promise<Ledger> {
  const remainingBalance = Math.max(0, ledger.originalAmount - (ledger.paidAmount || 0));
  const newLedger: Ledger = {
    id: 'ldg_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
    userId: ledger.userId,
    name: ledger.name,
    contactType: ledger.contactType,
    ledgerType: ledger.ledgerType,
    originalAmount: Number(ledger.originalAmount),
    paidAmount: Number(ledger.paidAmount || 0),
    remainingBalance,
    history: [
      {
        id: 'lh_' + Math.random().toString(36).substring(2, 7),
        type: 'initial',
        date: new Date().toISOString(),
        amount: Number(ledger.originalAmount),
        note: ledger.initialHistoryNote || (ledger.ledgerType === 'i_owe' ? 'Initial Due/Borrow recorded' : 'Initial Credit/Paona recorded'),
        isCashHandled: ledger.isCashHandled ?? (ledger.contactType === 'friend'),
      },
      ...(ledger.paidAmount && ledger.paidAmount > 0
        ? [
            {
              id: 'lh_init_pay_' + Math.random().toString(36).substring(2, 7),
              type: 'repayment' as const,
              date: new Date().toISOString(),
              amount: Number(ledger.paidAmount),
              note: 'Initial payment recorded',
              isCashHandled: true,
            },
          ]
        : []),
    ],
    status: remainingBalance <= 0 ? 'settled' : 'active',
    synced: false,
    deleted: false,
    updatedAt: new Date().toISOString(),
  };
  await db.ledgers.put(newLedger);
  return newLedger;
}

export async function addDueToLedgerLocal(
  ledgerId: string,
  additionalAmount: number,
  note: string = '',
  isCashHandled?: boolean
): Promise<Ledger | null> {
  const existing = await db.ledgers.get(ledgerId);
  if (!existing) return null;

  const validAmount = Math.max(0, Number(additionalAmount));
  const newOriginalAmount = (existing.originalAmount || 0) + validAmount;
  const newRemainingBalance = Math.max(0, newOriginalAmount - (existing.paidAmount || 0));
  const newStatus = newRemainingBalance <= 0 ? 'settled' : 'active';

  const newHistory = [
    ...(existing.history || []),
    {
      id: 'lh_' + Math.random().toString(36).substring(2, 7),
      type: 'due_added' as const,
      date: new Date().toISOString(),
      amount: validAmount,
      note: note || (existing.ledgerType === 'i_owe' ? 'Additional due/borrow added (বাকী/ধার যোগ)' : 'Additional credit given (পাওনা যোগ)'),
      isCashHandled: isCashHandled ?? (existing.contactType === 'friend'),
    },
  ];

  const updatedLedger: Ledger = {
    ...existing,
    originalAmount: newOriginalAmount,
    remainingBalance: newRemainingBalance,
    history: newHistory,
    status: newStatus,
    synced: false,
    updatedAt: new Date().toISOString(),
  };

  await db.ledgers.put(updatedLedger);
  return updatedLedger;
}

export async function recordRepaymentLocal(
  ledgerId: string,
  amount: number,
  note: string = '',
  isCashHandled: boolean = true
): Promise<Ledger | null> {
  const existing = await db.ledgers.get(ledgerId);
  if (!existing) return null;

  const validAmount = Math.max(0, Number(amount));
  const newPaidAmount = (existing.paidAmount || 0) + validAmount;
  const newRemainingBalance = Math.max(0, existing.originalAmount - newPaidAmount);
  const newStatus = newRemainingBalance <= 0 ? 'settled' : 'active';

  const newHistory = [
    ...(existing.history || []),
    {
      id: 'lh_' + Math.random().toString(36).substring(2, 7),
      type: 'repayment' as const,
      date: new Date().toISOString(),
      amount: validAmount,
      note: note || 'Repayment recorded (পরিশোধ সম্পন্ন)',
      isCashHandled,
    },
  ];

  const updatedLedger: Ledger = {
    ...existing,
    paidAmount: newPaidAmount,
    remainingBalance: newRemainingBalance,
    history: newHistory,
    status: newStatus,
    synced: false,
    updatedAt: new Date().toISOString(),
  };

  await db.ledgers.put(updatedLedger);
  return updatedLedger;
}

export async function updateLedgerLocal(id: string, patch: Partial<Ledger>): Promise<Ledger | null> {
  const existing = await db.ledgers.get(id);
  if (!existing) return null;
  const updated: Ledger = {
    ...existing,
    ...patch,
    synced: false,
    updatedAt: new Date().toISOString(),
  };
  if (patch.originalAmount !== undefined || patch.paidAmount !== undefined) {
    const orig = patch.originalAmount !== undefined ? patch.originalAmount : existing.originalAmount;
    const paid = patch.paidAmount !== undefined ? patch.paidAmount : existing.paidAmount;
    updated.remainingBalance = Math.max(0, orig - paid);
    updated.status = updated.remainingBalance <= 0 ? 'settled' : 'active';
  }
  await db.ledgers.put(updated);
  return updated;
}

export async function deleteLedgerLocal(id: string): Promise<boolean> {
  const existing = await db.ledgers.get(id);
  if (!existing) return false;
  const deletedLedger: Ledger = {
    ...existing,
    deleted: true,
    synced: false,
    updatedAt: new Date().toISOString(),
  };
  await db.ledgers.put(deletedLedger);
  return true;
}

export async function saveSettingsLocal(settings: UserSettings): Promise<UserSettings> {
  const updated: UserSettings = {
    ...settings,
    synced: false,
    updatedAt: new Date().toISOString(),
  };
  await db.settings.put(updated);
  return updated;
}

export async function getSettingsLocal(userId: string = 'local_user'): Promise<UserSettings> {
  const existing = await db.settings.get(userId);
  if (existing) return existing;
  const defaultSetting = { ...DEFAULT_SETTINGS, userId };
  await db.settings.put(defaultSetting);
  return defaultSetting;
}

// --- SYNC ENGINE UTILS ---

export async function getUnsyncedData(userId?: string) {
  let txQuery = db.transactions.filter((t) => t.synced === false);
  let ldgQuery = db.ledgers.filter((l) => l.synced === false);
  let setQuery = db.settings.filter((s) => s.synced === false);

  if (userId) {
    txQuery = txQuery.and((t) => t.userId === userId);
    ldgQuery = ldgQuery.and((l) => l.userId === userId);
    setQuery = setQuery.and((s) => s.userId === userId);
  }

  const [unsyncedTransactions, unsyncedLedgers, unsyncedSettings] = await Promise.all([
    txQuery.toArray(),
    ldgQuery.toArray(),
    setQuery.toArray(),
  ]);

  return {
    transactions: unsyncedTransactions,
    ledgers: unsyncedLedgers,
    settings: unsyncedSettings[0] || null,
  };
}

export async function markAsSynced(
  txIds: string[],
  ledgerIds: string[],
  settingsUserId?: string
) {
  if (txIds.length > 0) {
    await db.transactions.where('id').anyOf(txIds).modify({ synced: true });
  }
  if (ledgerIds.length > 0) {
    await db.ledgers.where('id').anyOf(ledgerIds).modify({ synced: true });
  }
  if (settingsUserId) {
    await db.settings.where('userId').equals(settingsUserId).modify({ synced: true });
  }
}

export async function mergeIncomingData(
  transactions: Transaction[] = [],
  ledgers: Ledger[] = [],
  settings?: UserSettings | null
) {
  for (const t of transactions) {
    const local = await db.transactions.get(t.id);
    // If local doesn't exist or incoming is strictly newer and local is not un-synced dirty
    if (!local || (!local.synced && local.updatedAt < t.updatedAt) || local.synced) {
      await db.transactions.put({ ...t, synced: true });
    }
  }

  for (const l of ledgers) {
    const local = await db.ledgers.get(l.id);
    if (!local || (!local.synced && local.updatedAt < l.updatedAt) || local.synced) {
      await db.ledgers.put({ ...l, synced: true });
    }
  }

  if (settings) {
    const local = await db.settings.get(settings.userId);
    if (!local || (!local.synced && local.updatedAt < settings.updatedAt) || local.synced) {
      await db.settings.put({ ...settings, synced: true });
    }
  }
}

// Migrate any guest 'local_user' data to the authenticated user account
export async function migrateLocalGuestDataToUser(targetUserId: string): Promise<number> {
  if (!targetUserId || targetUserId === 'local_user') return 0;

  try {
    const guestTx = await db.transactions.where('userId').equals('local_user').toArray();
    const guestLdg = await db.ledgers.where('userId').equals('local_user').toArray();
    const guestSettings = await db.settings.get('local_user');

    // Only non-seed transactions
    const realGuestTx = guestTx.filter((t) => !t.id.startsWith('tx_seed_'));
    const realGuestLdg = guestLdg.filter((l) => !l.id.startsWith('ldg_seed_'));

    let migratedCount = 0;

    if (realGuestTx.length > 0) {
      const updatedTx = realGuestTx.map((t) => ({
        ...t,
        userId: targetUserId,
        synced: false,
        updatedAt: new Date().toISOString(),
      }));
      await db.transactions.bulkPut(updatedTx);
      migratedCount += updatedTx.length;
    }

    if (realGuestLdg.length > 0) {
      const updatedLdg = realGuestLdg.map((l) => ({
        ...l,
        userId: targetUserId,
        synced: false,
        updatedAt: new Date().toISOString(),
      }));
      await db.ledgers.bulkPut(updatedLdg);
      migratedCount += updatedLdg.length;
    }

    if (guestSettings) {
      await db.settings.put({
        ...guestSettings,
        userId: targetUserId,
        synced: false,
        updatedAt: new Date().toISOString(),
      });
    }

    // Clean up local_user entries
    await db.transactions.where('userId').equals('local_user').delete();
    await db.ledgers.where('userId').equals('local_user').delete();

    return migratedCount;
  } catch (err) {
    console.warn('Migration from local guest data failed:', err);
    return 0;
  }
}

// Backup & Restore
export async function exportDatabaseBackup(): Promise<string> {
  const transactions = await db.transactions.toArray();
  const ledgers = await db.ledgers.toArray();
  const settings = await db.settings.toArray();

  const backupData = {
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    appName: 'Hisab PWA',
    data: {
      transactions,
      ledgers,
      settings,
    },
  };

  return JSON.stringify(backupData, null, 2);
}

export async function importDatabaseBackup(jsonString: string): Promise<{ success: boolean; count: { tx: number; ldg: number }; error?: string }> {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed.data) {
      return { success: false, count: { tx: 0, ldg: 0 }, error: 'Invalid backup file structure' };
    }

    const { transactions = [], ledgers = [], settings = [] } = parsed.data;

    let txCount = 0;
    for (const t of transactions) {
      if (t.id && t.type) {
        await db.transactions.put({ ...t, synced: false, updatedAt: new Date().toISOString() });
        txCount++;
      }
    }

    let ldgCount = 0;
    for (const l of ledgers) {
      if (l.id && l.name && l.ledgerType) {
        await db.ledgers.put({ ...l, synced: false, updatedAt: new Date().toISOString() });
        ldgCount++;
      }
    }

    for (const s of settings) {
      if (s.userId) {
        await db.settings.put({ ...s, synced: false, updatedAt: new Date().toISOString() });
      }
    }

    return { success: true, count: { tx: txCount, ldg: ldgCount } };
  } catch (err: any) {
    return { success: false, count: { tx: 0, ldg: 0 }, error: err.message };
  }
}
