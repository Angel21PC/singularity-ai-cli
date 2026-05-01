export class RateLimitError extends Error {
  waitMs: number;
  constructor(waitMs: number, message?: string) {
    super(message || `Rate limit hit, wait ${waitMs}ms`);
    this.name = 'RateLimitError';
    this.waitMs = waitMs;
  }
}
