export function now(): number {
  return Date.now();
}

export function hrtime(): number {
  const [sec, nano] = process.hrtime();
  return sec * 1000 + nano / 1e6;
}
