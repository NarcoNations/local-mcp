import { createHttpServer } from "./http/app.js";
import { logger } from "./utils/logger.js";

async function main() {
  const server = await createHttpServer();
  await server.start();
}

main().catch((err) => {
  logger.error("http-startup-failed", { err: String(err) });
  process.exit(1);
});
