import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import path from "path";

/** Development only: serves the client through Vite's dev server with HMR. */
export async function setupVite(app: Express, server: Server) {
  const { createServer: createViteServer } = await import("vite");
  const root = path.resolve(import.meta.dirname, "../..");

  const vite = await createViteServer({
    configFile: path.join(root, "vite.config.ts"),
    server: { middlewareMode: true, hmr: { server } },
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    try {
      const template = await fs.promises.readFile(
        path.join(root, "client", "index.html"),
        "utf-8"
      );
      const page = await vite.transformIndexHtml(req.originalUrl, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

/** Production: serves the built client from dist/public. */
export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}. Run "pnpm build" first.`
    );
  }

  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
