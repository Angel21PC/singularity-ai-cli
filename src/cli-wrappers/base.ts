import { RateLimitError } from './errors.js';

export abstract class ProviderWrapper {
  protected isPaused: boolean = false;
  protected pausedUntil: Date | null = null;

  /**
   * Asks the provider a question or runs a command
   */
  abstract ask(prompt: string, abortSignal?: AbortSignal): Promise<string>;

  /**
   * Check if paused
   */
  protected checkPaused() {
    if (this.isPaused && this.pausedUntil && new Date() < this.pausedUntil) {
      const waitMs = this.pausedUntil.getTime() - new Date().getTime();
      throw new RateLimitError(waitMs, `Rate limit active. Try again at ${this.pausedUntil.toLocaleTimeString()}`);
    } else if (this.isPaused && (!this.pausedUntil || new Date() >= this.pausedUntil)) {
      this.resume();
    }
  }

  /**
   * Pauses the provider execution (e.g. if rate limited)
   */
  pause(waitMs: number): void {
    this.isPaused = true;
    this.pausedUntil = new Date(Date.now() + waitMs);
  }

  /**
   * Resumes the provider execution
   */
  resume(): void {
    this.isPaused = false;
    this.pausedUntil = null;
  }
}
