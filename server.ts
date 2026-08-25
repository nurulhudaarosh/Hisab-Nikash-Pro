import express, { Request, Response, NextFunction } from "express";
import path from "path";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { initDatabase, dbService } from "./server/db.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "hisab_offline_first_pwa_secret_2026";

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logging middleware
app.use((req, res, next) => {
  res.setHeader("X-App-Name", "Hisab-PWA");
  next();
});

// Authentication middleware
export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
}

const requireAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
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

// Optional auth middleware (falls back to guest user if not provided)
const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
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
    // If no token or invalid, use guest user or custom client-provided userId
    const headerUserId = req.headers["x-user-id"] as string;
    req.userId = headerUserId || "guest_offline_user";
  }
  next();
};

// --- AUTH API ROUTES ---

// Health & Status
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    appName: "Hisab",
    time: new Date().toISOString(),
    isMongo: dbService.isMongo(),
  });
});

// User Registration
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: "Name, email, and password are required" });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const existing = await dbService.findUserByEmail(cleanEmail);
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists" });
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
    return res.status(500).json({ error: "Failed to register user: " + err.message });
  }
});

// User Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const user = await dbService.findUserByEmail(cleanEmail);
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "90d" });

    return res.json({
      message: "Signed in successfully",
      user: { id: user.id, email: user.email, name: user.name },
      token,
    });
  } catch (err: any) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Failed to sign in: " + err.message });
  }
});

// Get Current User Profile
app.get("/api/auth/me", requireAuth, async (req: AuthRequest, res) => {
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

// --- SYNC API ROUTES (IDEMPOTENT & ROBUST) ---

// 1. Batch Push (Transactions + Ledgers + Settings)
app.post("/api/sync/push", optionalAuth, async (req: AuthRequest, res) => {
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
app.post("/api/sync/transactions", optionalAuth, async (req: AuthRequest, res) => {
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
app.post("/api/sync/ledgers", optionalAuth, async (req: AuthRequest, res) => {
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
app.post("/api/sync/pull", optionalAuth, async (req: AuthRequest, res) => {
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
app.post("/api/sync/settings", optionalAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const settings = await dbService.upsertSettings(userId, req.body);
    return res.json({ success: true, settings });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Start Server and mount Vite
async function start() {
  await initDatabase();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: "0.0.0.0" },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Hisab Full-Stack PWA Server listening on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
});
