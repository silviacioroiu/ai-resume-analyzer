import "dotenv/config";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import express from "express";
import { createServer } from "http";
import authRouter from "../authRouter";
import { appRouter } from "../routers";
import { uploadRouter } from "../uploadHandler";
import { createContext } from "./context";
import { ENV } from "./env";
import { serveStatic, setupVite } from "./vite";

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });
  app.use("/api/auth", authRouter);
  app.use("/api", uploadRouter);
  app.use(
    "/api/trpc",
    createExpressMiddleware({ router: appRouter, createContext })
  );

  if (ENV.isProduction) {
    serveStatic(app);
  } else {
    await setupVite(app, server);
  }

  const port = Number(process.env.PORT) || 3000;
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(error => {
  console.error(error);
  process.exit(1);
});
