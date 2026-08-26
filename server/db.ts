import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { TransactionModel, LedgerModel, UserSettingsModel, UserModel } from './models.js';

dotenv.config();

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

let lastMongoError: string | null = null;

export async function initDatabase(): Promise<{ isConnected: boolean; type: string; error?: string }> {
  // If already connected in warm serverless container or active server, reuse connection
  if ((mongoose.connection.readyState as number) === 1) {
    return { isConnected: true, type: 'mongodb' };
  }

  // If connection is already in progress, await the existing promise
  if (mongoConnectingPromise) {
    try {
      await mongoConnectingPromise;
      if ((mongoose.connection.readyState as number) === 1) {
        return { isConnected: true, type: 'mongodb' };
      }
    } catch (e: any) {
      lastMongoError = e?.message || String(e);
    }
  }

  const uri =
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    process.env.DATABASE_URL ||
    process.env.MONGODB_URL;

  if (uri && uri.trim() !== '' && !uri.includes('MY_MONGODB_URI')) {
    try {
      mongoose.set('strictQuery', false);

      mongoConnectingPromise = mongoose.connect(uri.trim(), {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
      });

      await mongoConnectingPromise;
      mongoConnectingPromise = null;

      const isConnected = (mongoose.connection.readyState as number) === 1;
      if (isConnected) {
        lastMongoError = null;
        console.log('✅ Successfully connected to MongoDB database');
        return { isConnected: true, type: 'mongodb' };
      }
    } catch (err: any) {
      mongoConnectingPromise = null;
      lastMongoError = err?.message || String(err);
      console.error('❌ MongoDB connection error:', lastMongoError);
      return { isConnected: false, type: 'fallback_storage', error: lastMongoError };
    }
  } else {
    lastMongoError = 'MONGODB_URI environment variable is missing or empty in Vercel settings';
  }

  return {
    isConnected: (mongoose.connection.readyState as number) === 1,
    type: 'fallback_storage',
    error: lastMongoError || undefined,
  };
}

export const dbService = {
  isMongo: () => (mongoose.connection.readyState as number) === 1,
  getLastError: () => lastMongoError,

  // User operations
  async findUserByEmail(email: string): Promise<any | null> {
    const cleanEmail = email.toLowerCase().trim();
    if (this.isMongo()) {
      try {
        const userDoc = await (UserModel as any).findOne({ email: cleanEmail }).lean();
        if (userDoc) return userDoc;
      } catch (e) {
        console.warn('Error querying MongoDB for user by email:', e);
      }
    }
    for (const user of memoryStore.users.values()) {
      if (user.email.toLowerCase() === cleanEmail) return user;
    }
    return null;
  },

  async findUserById(id: string): Promise<any | null> {
    if (this.isMongo()) {
      try {
        const userDoc = await (UserModel as any).findOne({ id }).lean();
        if (userDoc) return userDoc;
      } catch (e) {
        console.warn('Error querying MongoDB for user by id:', e);
      }
    }
    return memoryStore.users.get(id) || null;
  },

  async createUser(user: { id: string; email: string; passwordHash: string; name: string }): Promise<any> {
    const createdAt = new Date().toISOString();
    const userPayload = {
      ...user,
      email: user.email.toLowerCase().trim(),
      name: user.name.trim(),
      createdAt,
      updatedAt: createdAt,
    };

    if (this.isMongo()) {
      try {
        const created = await (UserModel as any).create(userPayload);
        const result = created.toObject ? created.toObject() : created;
        
        // Also keep memoryStore backup updated
        memoryStore.users.set(user.id, userPayload);
        persistMemoryStore();
        
        return result;
      } catch (mongoErr: any) {
        console.error('Error creating user in MongoDB:', mongoErr);
        if (mongoErr.code === 11000 || mongoErr.message?.includes('E11000')) {
          throw new Error('An account with this email already exists');
        }
        throw mongoErr;
      }
    }

    memoryStore.users.set(user.id, userPayload);
    persistMemoryStore();
    return userPayload;
  },

  // Sync Transactions
  async upsertTransactions(userId: string, transactions: any[]): Promise<any[]> {
    const results: any[] = [];
    const isMongo = this.isMongo();

    for (const t of transactions) {
      const payload = {
        ...t,
        userId,
        updatedAt: t.updatedAt || new Date().toISOString(),
      };

      if (isMongo) {
        try {
          const updated = await (TransactionModel as any).findOneAndUpdate(
            { id: t.id, userId },
            { $set: payload },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          ).lean();
          results.push(updated || payload);
        } catch (e) {
          console.warn('Error upserting transaction to MongoDB:', e);
          results.push(payload);
        }
      } else {
        const key = `${userId}:${t.id}`;
        memoryStore.transactions.set(key, payload);
        results.push(payload);
      }
    }
    if (!isMongo) persistMemoryStore();
    return results;
  },

  async getTransactionsSince(userId: string, sinceIso?: string): Promise<any[]> {
    if (this.isMongo()) {
      try {
        const query: any = { userId };
        if (sinceIso) {
          query.updatedAt = { $gt: sinceIso };
        }
        return await (TransactionModel as any).find(query).lean();
      } catch (e) {
        console.warn('Error fetching transactions from MongoDB:', e);
      }
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
    const isMongo = this.isMongo();

    for (const l of ledgers) {
      const payload = {
        ...l,
        userId,
        updatedAt: l.updatedAt || new Date().toISOString(),
      };

      if (isMongo) {
        try {
          const updated = await (LedgerModel as any).findOneAndUpdate(
            { id: l.id, userId },
            { $set: payload },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          ).lean();
          results.push(updated || payload);
        } catch (e) {
          console.warn('Error upserting ledger to MongoDB:', e);
          results.push(payload);
        }
      } else {
        const key = `${userId}:${l.id}`;
        memoryStore.ledgers.set(key, payload);
        results.push(payload);
      }
    }
    if (!isMongo) persistMemoryStore();
    return results;
  },

  async getLedgersSince(userId: string, sinceIso?: string): Promise<any[]> {
    if (this.isMongo()) {
      try {
        const query: any = { userId };
        if (sinceIso) {
          query.updatedAt = { $gt: sinceIso };
        }
        return await (LedgerModel as any).find(query).lean();
      } catch (e) {
        console.warn('Error fetching ledgers from MongoDB:', e);
      }
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

    if (this.isMongo()) {
      try {
        const updated = await (UserSettingsModel as any).findOneAndUpdate(
          { userId },
          { $set: payload },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        ).lean();
        return updated || payload;
      } catch (e) {
        console.warn('Error upserting settings to MongoDB:', e);
      }
    }
    
    memoryStore.settings.set(userId, payload);
    persistMemoryStore();
    return payload;
  },

  async getSettings(userId: string): Promise<any | null> {
    if (this.isMongo()) {
      try {
        return await (UserSettingsModel as any).findOne({ userId }).lean();
      } catch (e) {
        console.warn('Error fetching settings from MongoDB:', e);
      }
    }
    return memoryStore.settings.get(userId) || null;
  }
};

