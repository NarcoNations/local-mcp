export function now(): number {
  return Date.now();
}

export function hr(): string {
  const diff = process.hrtime.bigint();
  return (Number(diff) / 1_000_000).toFixed(2);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
