import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import app from "./server/app.js";
import { initDatabase } from "./server/db.js";

const PORT = 3000;

// Start Server and mount Vite for container dev and production
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
