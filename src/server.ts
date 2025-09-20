import 'source-map-support/register';

function log(level: string, msg: string, meta: Record<string, unknown> = {}) {
  process.stdout.write(JSON.stringify({ level, msg, ...meta }) + '\n');
}

async function main() {
  log('info', 'mcp-nn skeleton ready', { mode: 'dev', transport: 'stdio' });
  // Codex will replace this with the real MCP stdio server and tool registrations.
  process.stdin.resume();
}

main().catch((err) => {
  log('error', 'startup-failed', { err: String(err) });
  process.exit(1);
});
