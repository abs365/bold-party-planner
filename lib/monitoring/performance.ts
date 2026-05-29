export class Timer {
  private readonly start: number;

  constructor() {
    this.start = performance.now();
  }

  elapsedMs(): number {
    return Math.round(performance.now() - this.start);
  }
}

export async function timeAsync<T>(
  fn: () => Promise<T>
): Promise<{ result: T; durationMs: number }> {
  const t = new Timer();
  const result = await fn();
  return { result, durationMs: t.elapsedMs() };
}
