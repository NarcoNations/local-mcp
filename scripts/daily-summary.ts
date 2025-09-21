#!/usr/bin/env ts-node
import { formatISO, subDays } from "date-fns";
import { db, queries } from "../src/db/index.js";
import { eq, gte } from "drizzle-orm";

async function main() {
  const since = subDays(new Date(), 1);
  const rows = await db.query.queries.findMany({
    where: gte(queries.createdAt, since),
    orderBy: (fields, operators) => [operators.desc(fields.createdAt)],
  });

  if (rows.length === 0) {
    console.log(`# MCP Daily Summary (no queries since ${formatISO(since)})`);
    return;
  }

  const total = rows.length;
  const avgLatency = rows.reduce((acc, row) => acc + row.latencyMs, 0) / total;
  const topQueries = Object.entries(
    rows.reduce<Record<string, number>>((acc, row) => {
      acc[row.text] = (acc[row.text] ?? 0) + 1;
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const summaryMarkdown = `# MCP Daily Summary\\n\
\\n\
- Window start: ${formatISO(since)}\\n\
- Total queries: ${total}\\n\
- Average latency: ${avgLatency.toFixed(1)} ms\\n\
\\n\
## Top Queries\\n\
${topQueries
  .map(([text, count]) => `- ${text} (${count})`)
  .join("\\n")}\\n`;

  console.log(summaryMarkdown);

  await db.insert(queries).values({
    text: "__summary__",
    filtersJson: { window_start: since.toISOString() },
    resultsJson: { markdown: summaryMarkdown },
    latencyMs: 0,
    topK: 0,
  });
}

main().finally(() => process.exit(0));
