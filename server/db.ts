import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { TransactionModel, LedgerModel, UserSettingsModel, UserModel } from './models.js';

let isMongoConnected = false;
let mongoConnectingPromise: Promise<any> | null = null;

// Fallback in-memory storage for offline / sandbox mode
interface MemoryStore {
  users: Map<string, any>;
  transactions: Map<string, any>;
  ledgers: Map<string, any>;
  settings: Map<string, any>;
}

const memoryStore: MemoryStore = {
  users: new Map(),
  transactions: new Map(),
  ledgers: new Map(),
  settings: new Map(),
};

// Safe backup file path that works in container, local dev, and serverless /tmp
const getBackupFilePath = () => {
  const tmpDir = process.env.TMPDIR || '/tmp';
  if (fs.existsSync(tmpDir)) {
    return path.join(tmpDir, '.server_storage_backup.json');
  }
  return path.join(process.cwd(), '.server_storage_backup.json');
};

const BACKUP_FILE = getBackupFilePath();

// Load fallback backup from disk if exists
try {
  if (fs.existsSync(BACKUP_FILE)) {
    const raw = fs.readFileSync(BACKUP_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (parsed.users) Object.entries(parsed.users).forEach(([k, v]) => memoryStore.users.set(k, v));
    if (parsed.transactions) Object.entries(parsed.transactions).forEach(([k, v]) => memoryStore.transactions.set(k, v));
    if (parsed.ledgers) Object.entries(parsed.ledgers).forEach(([k, v]) => memoryStore.ledgers.set(k, v));
    if (parsed.settings) Object.entries(parsed.settings).forEach(([k, v]) => memoryStore.settings.set(k, v));
  }
} catch (e) {
  // Silent fallback
}

function persistMemoryStore() {
  try {
    const serialized = {
      users: Object.fromEntries(memoryStore.users),
      transactions: Object.fromEntries(memoryStore.transactions),
      ledgers: Object.fromEntries(memoryStore.ledgers),
      settings: Object.fromEntries(memoryStore.settings),
    };
    fs.writeFileSync(BACKUP_FILE, JSON.stringify(serialized, null, 2), 'utf-8');
  } catch (e) {
    // Non-fatal if filesystem is read-only
  }
}

export async function initDatabase(): Promise<{ isConnected: boolean; type: string }> {
  // If already connected in warm serverless container or active server, reuse connection
  if ((mongoose.connection.readyState as number) === 1) {
    isMongoConnected = true;
    return { isConnected: true, type: 'mongodb' };
  }

  // If connection is already in progress, await the existing promise
  if (mongoConnectingPromise) {
    try {
      await mongoConnectingPromise;
      if ((mongoose.connection.readyState as number) === 1) {
        isMongoConnected = true;
        return { isConnected: true, type: 'mongodb' };
      }
    } catch {
      // Fall through to fallback
    }
  }

  const uri = process.env.MONGODB_URI;
  if (uri && uri.trim() !== '' && !uri.includes('MY_MONGODB_URI')) {
    try {
      mongoose.set('strictQuery', false);
      mongoose.connection.on('error', () => {
        isMongoConnected = false;
      });
      mongoose.connection.on('disconnected', () => {
        isMongoConnected = false;
      });

      mongoConnectingPromise = mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
        bufferCommands: false,
      });

      await mongoConnectingPromise;
      mongoConnectingPromise = null;
      isMongoConnected = (mongoose.connection.readyState as number) === 1;

      if (isMongoConnected) {
        console.log('Connected to MongoDB database');
        return { isConnected: true, type: 'mongodb' };
      }
    } catch (err: any) {
      mongoConnectingPromise = null;
      isMongoConnected = false;
      console.warn('MongoDB connection issue, using resilient storage engine:', err?.message || err);
      return { isConnected: false, type: 'fallback_storage' };
    }
  }

  return { isConnected: true, type: 'fallback_storage' };
}

export const dbService = {
  isMongo: () => isMongoConnected,

  // User operations
  async findUserByEmail(email: string): Promise<any | null> {
    if (isMongoConnected) {
      return await (UserModel as any).findOne({ email: email.toLowerCase() }).lean();
    }
    for (const user of memoryStore.users.values()) {
      if (user.email.toLowerCase() === email.toLowerCase()) return user;
    }
    return null;
  },

  async findUserById(id: string): Promise<any | null> {
    if (isMongoConnected) {
      return await (UserModel as any).findOne({ id }).lean();
    }
    return memoryStore.users.get(id) || null;
  },

  async createUser(user: { id: string; email: string; passwordHash: string; name: string }): Promise<any> {
    if (isMongoConnected) {
      const doc = new UserModel(user);
      return await doc.save();
    }
    memoryStore.users.set(user.id, { ...user, createdAt: new Date().toISOString() });
    persistMemoryStore();
    return memoryStore.users.get(user.id);
  },

  // Sync Transactions
  async upsertTransactions(userId: string, transactions: any[]): Promise<any[]> {
    const results: any[] = [];
    for (const t of transactions) {
      const payload = {
        ...t,
        userId,
        updatedAt: t.updatedAt || new Date().toISOString(),
      };

      if (isMongoConnected) {
        const updated = await (TransactionModel as any).findOneAndUpdate(
          { id: t.id, userId },
          { $set: payload },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        ).lean();
        results.push(updated);
      } else {
        const key = `${userId}:${t.id}`;
        memoryStore.transactions.set(key, payload);
        results.push(payload);
      }
    }
    if (!isMongoConnected) persistMemoryStore();
    return results;
  },

  async getTransactionsSince(userId: string, sinceIso?: string): Promise<any[]> {
    if (isMongoConnected) {
      const query: any = { userId };
      if (sinceIso) {
        query.updatedAt = { $gt: sinceIso };
      }
      return await (TransactionModel as any).find(query).lean();
    }
    const list: any[] = [];
    for (const [, t] of memoryStore.transactions.entries()) {
      if (t.userId === userId) {
        if (!sinceIso || t.updatedAt > sinceIso) {
          list.push(t);
        }
      }
    }
    return list;
  },

  // Sync Ledgers
  async upsertLedgers(userId: string, ledgers: any[]): Promise<any[]> {
    const results: any[] = [];
    for (const l of ledgers) {
      const payload = {
        ...l,
        userId,
        updatedAt: l.updatedAt || new Date().toISOString(),
      };

      if (isMongoConnected) {
        const updated = await (LedgerModel as any).findOneAndUpdate(
          { id: l.id, userId },
          { $set: payload },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        ).lean();
        results.push(updated);
      } else {
        const key = `${userId}:${l.id}`;
        memoryStore.ledgers.set(key, payload);
        results.push(payload);
      }
    }
    if (!isMongoConnected) persistMemoryStore();
    return results;
  },

  async getLedgersSince(userId: string, sinceIso?: string): Promise<any[]> {
    if (isMongoConnected) {
      const query: any = { userId };
      if (sinceIso) {
        query.updatedAt = { $gt: sinceIso };
      }
      return await (LedgerModel as any).find(query).lean();
    }
    const list: any[] = [];
    for (const [, l] of memoryStore.ledgers.entries()) {
      if (l.userId === userId) {
        if (!sinceIso || l.updatedAt > sinceIso) {
          list.push(l);
        }
      }
    }
    return list;
  },

  // User Settings
  async upsertSettings(userId: string, settings: any): Promise<any> {
    const payload = {
      ...settings,
      userId,
      updatedAt: settings.updatedAt || new Date().toISOString(),
    };

    if (isMongoConnected) {
      return await (UserSettingsModel as any).findOneAndUpdate(
        { userId },
        { $set: payload },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ).lean();
    } else {
      memoryStore.settings.set(userId, payload);
      persistMemoryStore();
      return payload;
    }
  },

  async getSettings(userId: string): Promise<any | null> {
    if (isMongoConnected) {
      return await (UserSettingsModel as any).findOne({ userId }).lean();
    }
    return memoryStore.settings.get(userId) || null;
  }
};
