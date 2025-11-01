import { createHttpApp } from "./http/app.js";
import { logger } from "./utils/logger.js";

async function main() {
  const { app, pushLog, staticDir } = await createHttpApp();

  const port = Number(process.env.HTTP_PORT ?? process.env.PORT ?? 3030);
  const host = process.env.HOST ?? "0.0.0.0";

  app.listen(port, host, () => {
    logger.info("http-listening", { port, host, staticRoot: staticDir?.root });
    pushLog("info", "http-listening", { port, host, staticRoot: staticDir?.root });
  });
}

main().catch((err) => {
  logger.error("http-startup-failed", { err: String(err) });
  process.exit(1);
});

