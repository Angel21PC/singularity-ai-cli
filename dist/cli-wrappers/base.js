import { RateLimitError } from './errors.js';
export class ProviderWrapper {
    isPaused = false;
    pausedUntil = null;
    /**
     * Check if paused
     */
    checkPaused() {
        if (this.isPaused && this.pausedUntil && new Date() < this.pausedUntil) {
            const waitMs = this.pausedUntil.getTime() - new Date().getTime();
            throw new RateLimitError(waitMs, `Rate limit active. Try again at ${this.pausedUntil.toLocaleTimeString()}`);
        }
        else if (this.isPaused && (!this.pausedUntil || new Date() >= this.pausedUntil)) {
            this.resume();
        }
    }
    /**
     * Pauses the provider execution (e.g. if rate limited)
     */
    pause(waitMs) {
        this.isPaused = true;
        this.pausedUntil = new Date(Date.now() + waitMs);
    }
    /**
     * Resumes the provider execution
     */
    resume() {
        this.isPaused = false;
        this.pausedUntil = null;
    }
}
