import { getUnsyncedData, markAsSynced, mergeIncomingData, getSettingsLocal } from '../db/indexedDB';
import { SyncStatusInfo, UserProfile } from '../types';

type SyncListener = (status: SyncStatusInfo) => void;

class SyncEngine {
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private isSyncing: boolean = false;
  private lastSyncedAt: string | null = null;
  private syncError: string | null = null;
  private listeners: Set<SyncListener> = new Set();
  private currentUser: UserProfile | null = null;
  private syncDebounceTimer: any = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.isOnline = navigator.onLine;

      window.addEventListener('online', () => {
        this.isOnline = true;
        this.notify();
        this.triggerSync();
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.notify();
      });

      // Load cached last sync time from localStorage
      this.lastSyncedAt = localStorage.getItem('hisab_last_synced_at');
    }
  }

  public setUser(user: UserProfile | null) {
    this.currentUser = user;
    if (user?.token) {
      localStorage.setItem('hisab_auth_token', user.token);
      localStorage.setItem('hisab_auth_user', JSON.stringify(user));
    } else if (!user) {
      localStorage.removeItem('hisab_auth_token');
      localStorage.removeItem('hisab_auth_user');
    }
    this.notify();
  }

  public getCachedUser(): UserProfile | null {
    try {
      const raw = localStorage.getItem('hisab_auth_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.getStatus());
    return () => this.listeners.delete(listener);
  }

  public getStatus(): SyncStatusInfo {
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      lastSyncedAt: this.lastSyncedAt,
      pendingOutboxCount: 0, // dynamic compute
      syncError: this.syncError,
      isCloudConnected: !!this.currentUser?.token,
    };
  }

  private notify() {
    const status = this.getStatus();
    this.listeners.forEach((l) => l(status));
  }

  public scheduleSync(delayMs: number = 600) {
    if (this.syncDebounceTimer) clearTimeout(this.syncDebounceTimer);
    this.syncDebounceTimer = setTimeout(() => {
      this.triggerSync();
    }, delayMs);
  }

  public async triggerSync(): Promise<{ success: boolean; pushedCount: number; error?: string }> {
    if (!this.isOnline) {
      this.syncError = 'Offline mode (will sync automatically when reconnected)';
      this.notify();
      return { success: false, pushedCount: 0, error: 'Offline' };
    }

    if (this.isSyncing) {
      return { success: true, pushedCount: 0 };
    }

    this.isSyncing = true;
    this.syncError = null;
    this.notify();

    try {
      const userId = this.currentUser?.id || 'guest_offline_user';
      const token = this.currentUser?.token || localStorage.getItem('hisab_auth_token');

      // 1. Gather all unsynced local data
      const unsynced = await getUnsyncedData();
      const txCount = unsynced.transactions.length;
      const ldgCount = unsynced.ledgers.length;
      const totalToPush = txCount + ldgCount + (unsynced.settings ? 1 : 0);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // 2. Batch Push to Backend API
      if (totalToPush > 0) {
        const pushRes = await fetch('/api/sync/push', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            transactions: unsynced.transactions,
            ledgers: unsynced.ledgers,
            settings: unsynced.settings,
          }),
        });

        if (!pushRes.ok) {
          const errData = await pushRes.json().catch(() => ({}));
          throw new Error(errData.error || `Server responded with ${pushRes.status}`);
        }

        // Mark local records as synced
        const txIds = unsynced.transactions.map((t) => t.id);
        const ldgIds = unsynced.ledgers.map((l) => l.id);
        await markAsSynced(txIds, ldgIds, unsynced.settings?.userId);
      }

      // 3. Bidirectional Pull: Fetch updates from cloud since lastSync
      const pullRes = await fetch('/api/sync/pull', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          since: this.lastSyncedAt || undefined,
        }),
      });

      if (pullRes.ok) {
        const pullData = await pullRes.json();
        if (pullData.success) {
          await mergeIncomingData(pullData.transactions, pullData.ledgers, pullData.settings);
        }
      }

      const nowIso = new Date().toISOString();
      this.lastSyncedAt = nowIso;
      if (typeof window !== 'undefined') {
        localStorage.setItem('hisab_last_synced_at', nowIso);
      }

      this.isSyncing = false;
      this.syncError = null;
      this.notify();

      return { success: true, pushedCount: totalToPush };
    } catch (err: any) {
      console.warn('Sync failed:', err);
      this.isSyncing = false;
      this.syncError = err.message || 'Sync failed. Will retry automatically.';
      this.notify();
      return { success: false, pushedCount: 0, error: err.message };
    }
  }
}

export const syncEngine = new SyncEngine();
