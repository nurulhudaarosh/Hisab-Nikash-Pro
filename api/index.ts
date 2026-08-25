import app from "../server/app.js";
import { initDatabase } from "../server/db.js";

// Vercel Serverless Function entrypoint
export default async function handler(req: any, res: any) {
  try {
    await initDatabase();
  } catch (err) {
    console.warn("Database initialization in serverless handler:", err);
  }
  return app(req, res);
}
