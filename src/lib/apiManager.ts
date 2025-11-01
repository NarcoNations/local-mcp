import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  ApiManager,
  DefaultApiManagerOptions,
  createDefaultApiManager,
} from "@vibelabz/api-manager";
import { logger } from "../utils/logger.js";

export type ApiManagerFactory = (
  options: DefaultApiManagerOptions
) => Promise<ApiManager> | ApiManager;

export async function resolveApiManager(
  overrides: Partial<DefaultApiManagerOptions> = {}
): Promise<ApiManager> {
  const baseOptions: DefaultApiManagerOptions = {
    ...overrides,
    logger: createManagerLogger(overrides.logger),
  };

  const hookModule = process.env.MCP_API_MANAGER_MODULE;
  if (hookModule) {
    const factory = await loadFactory(hookModule);
    if (factory) {
      const manager = await factory(baseOptions);
      if (manager instanceof ApiManager) return manager;
      if (manager && typeof (manager as ApiManager).runLLM === "function") {
        return manager as ApiManager;
      }
      throw new Error("createApiManager hook must return an ApiManager instance");
    }
  }

  return createDefaultApiManager(baseOptions);
}

async function loadFactory(modulePath: string): Promise<ApiManagerFactory | null> {
  const resolved = path.isAbsolute(modulePath)
    ? modulePath
    : path.resolve(process.cwd(), modulePath);
  try {
    const mod = await import(pathToFileURL(resolved).href);
    const factory =
      (mod?.default as ApiManagerFactory | undefined) ??
      (mod?.createApiManager as ApiManagerFactory | undefined);
    return typeof factory === "function" ? factory : null;
  } catch (error) {
    logger.warn("api-manager-factory-load-failed", {
      modulePath: resolved,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

function createManagerLogger(
  override?: Pick<Console, "debug" | "info" | "warn" | "error">
): Pick<Console, "debug" | "info" | "warn" | "error"> {
  if (override) return override;
  return {
    debug(message: string, meta?: Record<string, unknown>) {
      logger.debug(message, meta);
    },
    info(message: string, meta?: Record<string, unknown>) {
      logger.info(message, meta);
    },
    warn(message: string, meta?: Record<string, unknown>) {
      logger.warn(message, meta);
    },
    error(message: string, meta?: Record<string, unknown>) {
      logger.error(message, meta);
    },
  };
}
