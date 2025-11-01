import type { VercelRequest, VercelResponse } from "@vercel/node";
import type express from "express";

import { getHttpApp } from "../dist/src/http.js";

let cachedApp: Promise<express.Express> | null = null;

async function getApp(): Promise<express.Express> {
  if (!cachedApp) {
    cachedApp = getHttpApp();
  }
  return cachedApp;
}

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
  runtime: "nodejs20.x",
  maxDuration: 60,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const app = await getApp();
  return app(req as unknown as express.Request, res as unknown as express.Response);
}
