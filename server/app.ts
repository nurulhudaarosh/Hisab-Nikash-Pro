import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { initDatabase, dbService } from "./db.js";

dotenv.config();

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || "hisab_offline_first_pwa_secret_2026";

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// CORS & Request Headers Middleware
app.use((req, res, next) => {
  res.setHeader("X-App-Name", "Hisab-PWA");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-user-id");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Middleware to ensure DB connection is ready on serverless / Vercel
app.use(async (req, res, next) => {
  try {
    await initDatabase();
  } catch (e) {
    console.warn("DB init warning:", e);
  }
  next();
});

// Authentication middleware
export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
}

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid authorization token" });
    return;
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    next();
  } catch (err) {
    res.status(401).json({ error: "Expired or invalid session token. Please sign in again." });
    return;
  }
};

// Optional auth middleware (falls back to guest / local user if not provided)
export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
      req.userId = decoded.userId;
      req.userEmail = decoded.email;
    } catch {
      // Ignore token parse failure for optional auth
    }
  }
  if (!req.userId) {
    const headerUserId = req.headers["x-user-id"] as string;
    req.userId = headerUserId || "local_user";
  }
  next();
};

const apiRouter = express.Router();

// Health & Status
apiRouter.get("/health", (req, res) => {
  res.json({
    status: "ok",
    appName: "Hisab",
    time: new Date().toISOString(),
    isMongo: dbService.isMongo(),
    mongoError: dbService.getLastError(),
  });
});

apiRouter.get("/status", (req, res) => {
  res.json({
    status: "ok",
    appName: "Hisab",
    time: new Date().toISOString(),
    isMongo: dbService.isMongo(),
    mongoError: dbService.getLastError(),
  });
});

// User Registration
apiRouter.post("/auth/register", async (req, res) => {
  try {
    await initDatabase();

    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: "Name, email, and password are required" });
    }

    if (!dbService.isMongo()) {
      const errDetail = dbService.getLastError();
      return res.status(503).json({
        error: `Cloud database is not connected on Vercel. Please configure MONGODB_URI in Vercel Environment Variables and ensure MongoDB Atlas IP Access is set to 0.0.0.0/0. Details: ${errDetail || 'No active connection'}`,
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const existing = await dbService.findUserByEmail(cleanEmail);
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists. Please Sign In." });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const userId = "usr_" + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

    const user = await dbService.createUser({
      id: userId,
      email: cleanEmail,
      passwordHash,
      name: String(name).trim(),
    });

    const token = jwt.sign({ userId, email: cleanEmail }, JWT_SECRET, { expiresIn: "90d" });

    return res.status(201).json({
      message: "Account created successfully",
      user: { id: userId, email: cleanEmail, name: user.name },
      token,
    });
  } catch (err: any) {
    console.error("Register error:", err);
    return res.status(500).json({ error: "Failed to register user: " + (err.message || String(err)) });
  }
});

// User Login
apiRouter.post("/auth/login", async (req, res) => {
  try {
    await initDatabase();

    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    if (!dbService.isMongo()) {
      const errDetail = dbService.getLastError();
      return res.status(503).json({
        error: `Cloud database is not connected on Vercel. Please check MONGODB_URI in Vercel Environment Variables. Details: ${errDetail || 'No active connection'}`,
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const user = await dbService.findUserByEmail(cleanEmail);
    
    if (!user) {
      return res.status(401).json({ error: "No account found with this email in the database. Please click 'Create Account' to register." });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid password / ভুল পাসওয়ার্ড। অনুগ্রহ করে সঠিক পাসওয়ার্ড দিন।" });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "90d" });

    return res.json({
      message: "Signed in successfully",
      user: { id: user.id, email: user.email, name: user.name },
      token,
    });
  } catch (err: any) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Failed to sign in: " + (err.message || String(err)) });
  }
});

// Get Current User Profile
apiRouter.get("/auth/me", requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await dbService.findUserById(req.userId!);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.json({
      user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Sync Status & Ping
apiRouter.get("/sync/status", optionalAuth, async (req: AuthRequest, res) => {
  return res.json({
    status: "ok",
    userId: req.userId,
    serverTime: new Date().toISOString(),
    connected: true,
    isMongo: dbService.isMongo(),
  });
});

// --- SYNC API ROUTES (IDEMPOTENT & ROBUST) ---

// 1. Batch Push (Transactions + Ledgers + Settings)
apiRouter.post("/sync/push", optionalAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { transactions = [], ledgers = [], settings } = req.body;

    const syncedTransactions = await dbService.upsertTransactions(userId, transactions);
    const syncedLedgers = await dbService.upsertLedgers(userId, ledgers);

    let syncedSettings = null;
    if (settings) {
      syncedSettings = await dbService.upsertSettings(userId, settings);
    }

    return res.json({
      success: true,
      syncedAt: new Date().toISOString(),
      counts: {
        transactions: syncedTransactions.length,
        ledgers: syncedLedgers.length,
        settings: syncedSettings ? 1 : 0,
      },
    });
  } catch (err: any) {
    console.error("Sync push error:", err);
    return res.status(500).json({ error: "Sync push failed: " + err.message });
  }
});

// 2. Individual Sync Endpoint for Transactions
apiRouter.post("/sync/transactions", optionalAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { transactions = [] } = req.body;
    const synced = await dbService.upsertTransactions(userId, transactions);
    return res.json({ success: true, count: synced.length, syncedAt: new Date().toISOString() });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 3. Individual Sync Endpoint for Ledgers
apiRouter.post("/sync/ledgers", optionalAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { ledgers = [] } = req.body;
    const synced = await dbService.upsertLedgers(userId, ledgers);
    return res.json({ success: true, count: synced.length, syncedAt: new Date().toISOString() });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 4. Batch Pull (Get updates from Cloud since timestamp)
apiRouter.post("/sync/pull", optionalAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { since } = req.body;

    const transactions = await dbService.getTransactionsSince(userId, since);
    const ledgers = await dbService.getLedgersSince(userId, since);
    const settings = await dbService.getSettings(userId);

    return res.json({
      success: true,
      serverTime: new Date().toISOString(),
      transactions,
      ledgers,
      settings,
    });
  } catch (err: any) {
    console.error("Sync pull error:", err);
    return res.status(500).json({ error: "Sync pull failed: " + err.message });
  }
});

// 5. Update / Fetch Settings
apiRouter.post("/sync/settings", optionalAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const settings = await dbService.upsertSettings(userId, req.body);
    return res.json({ success: true, settings });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Mount router on BOTH "/api" and "/" so Vercel rewrites and standard Express work seamlessly
app.use("/api", apiRouter);
app.use("/", apiRouter);

export default app;
