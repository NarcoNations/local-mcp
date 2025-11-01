let createHttpAppFactory;
let bootstrapPromise;
let cachedInstance;

export const config = {
  runtime: "nodejs20.x",
  maxDuration: 300,
  memory: 1024,
};

async function loadFactory() {
  if (!createHttpAppFactory) {
    const mod = await import("../dist/http/app.js").catch(async (error) => {
      if (error && typeof error === "object" && "code" in error && error.code === "ERR_MODULE_NOT_FOUND") {
        return import("../src/http/app.js");
      }
      if (error instanceof Error && error.message.includes("Cannot find module")) {
        return import("../src/http/app.js");
      }
      throw error;
    });
    createHttpAppFactory = mod.createHttpApp ?? mod.default;
    if (typeof createHttpAppFactory !== "function") {
      throw new Error("createHttpApp factory not found in module exports");
    }
  }
  return createHttpAppFactory;
}

async function getInstance() {
  if (!bootstrapPromise) {
    bootstrapPromise = loadFactory().then((factory) => factory({ disableStatic: true })).then((instance) => {
      cachedInstance = instance;
      return instance;
    });
  }
  if (cachedInstance) return cachedInstance;
  return bootstrapPromise;
}

export default async function handler(req, res) {
  const instance = await getInstance();
  req.setTimeout?.(0);
  req.socket?.setKeepAlive?.(true, 1000);
  return instance.app(req, res);
}
