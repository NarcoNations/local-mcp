export function now(): number {
  return Date.now();
}

export function durationMs(start: number): number {
  return now() - start;
}
