import { execa } from 'execa';
import { ProviderWrapper } from './base.js';
import { RateLimitError } from './errors.js';
import { parseRateLimit } from './rateLimitParser.js';

export class CodexCliWrapper extends ProviderWrapper {
  async ask(prompt: string, abortSignal?: AbortSignal): Promise<string> {
    this.checkPaused();

    const controller = new AbortController();
    if (abortSignal) {
      abortSignal.addEventListener('abort', () => controller.abort());
    }

    try {
      const process = execa('codex', ['exec', prompt], {
        all: true,
        reject: false,
        timeout: 5 * 60 * 1000,
        signal: controller.signal
      });

      const { all } = await process;
      const output = all || '';
      
      this.handleRateLimitOrThrow(output);
      return output;
    } catch (error: any) {
      if (error instanceof RateLimitError) throw error;
      if (error.name === 'AbortError') throw new Error('Task was aborted');
      
      const output = error.all || error.message || '';
      this.handleRateLimitOrThrow(output);
      
      throw error;
    }
  }

  private handleRateLimitOrThrow(output: string) {
    const waitMs = parseRateLimit(output);
    if (waitMs !== null) {
      this.pause(waitMs);
      throw new RateLimitError(waitMs, 'Rate limit hit. Pausing provider execution.');
    }
  }
}
