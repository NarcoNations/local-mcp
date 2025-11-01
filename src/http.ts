import { createHttpApp } from "./http/app.js";
import { logger } from "./utils/logger.js";

async function main() {
  const instance = await createHttpApp();
  const port = Number(process.env.HTTP_PORT ?? process.env.PORT ?? 3030);
  const host = process.env.HOST ?? "0.0.0.0";

  const server = instance.app.listen(port, host, () => {
    logger.info("http-listening", { port, host, staticRoot: instance.staticInfo?.root });
    instance.pushLog("info", "http-listening", { port, host, staticRoot: instance.staticInfo?.root });
  });

  const shutdown = async () => {
    logger.info("http-shutdown", { reason: "signal" });
    await instance.dispose().catch(() => {});
    await new Promise<void>((resolve) => server.close(() => resolve()));
    process.exit(0);
  };

  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.on(signal, () => {
      shutdown().catch((error) => {
        logger.error("http-shutdown-failed", { err: error instanceof Error ? error.message : String(error) });
        process.exit(1);
      });
    });
  }
}

main().catch((err) => {
  logger.error("http-startup-failed", { err: String(err) });
  process.exit(1);
});
