export class RateLimitError extends Error {
    waitMs;
    constructor(waitMs, message) {
        super(message || `Rate limit hit, wait ${waitMs}ms`);
        this.name = 'RateLimitError';
        this.waitMs = waitMs;
    }
}
