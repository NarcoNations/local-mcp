import type { VercelRequest, VercelResponse } from "@vercel/node";

import { createHttpApp, type HttpApp } from "../src/http/app.js";
import { logger } from "../src/utils/logger.js";

let appPromise: Promise<HttpApp> | null = null;

async function ensureHttpApp(): Promise<HttpApp> {
  if (!appPromise) {
    appPromise = createHttpApp({ includeStaticFallback: false })
      .then((context) => {
        logger.info("vercel-http-app-initialized", { staticRoot: context.staticInfo?.root ?? null });
        context.pushLog("info", "vercel-http-app-initialized", { staticRoot: context.staticInfo?.root ?? null });
        return context;
      })
      .catch((error) => {
        appPromise = null;
        throw error;
      });
  }
  return appPromise;
}

export const config = {
  runtime: "nodejs20.x",
  maxDuration: 60,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { app } = await ensureHttpApp();
  await new Promise<void>((resolve, reject) => {
    res.on("finish", resolve);
    res.on("close", resolve);
    res.on("error", reject);
    app(req as any, res as any, (err?: unknown) => {
      if (err) {
        reject(err);
      }
    });
  });
}
