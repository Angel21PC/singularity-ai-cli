import { execa } from 'execa';
import { ProviderWrapper } from './base.js';
import { RateLimitError } from './errors.js';
import { parseRateLimit } from './rateLimitParser.js';

export class ClaudeCliWrapper extends ProviderWrapper {
  async ask(prompt: string, abortSignal?: AbortSignal): Promise<string> {
    this.checkPaused();

    const controller = new AbortController();
    if (abortSignal) {
      abortSignal.addEventListener('abort', () => controller.abort());
    }

    try {
      const process = execa('claude', ['-p', prompt, '--permission-mode', 'dontAsk'], {
        input: '',       // prevent "no stdin data received" warning
        stdout: 'pipe',
        stderr: 'pipe',
        reject: false,
        timeout: 5 * 60 * 1000,
        cancelSignal: controller.signal
      });

      const { stdout, stderr } = await process;
      // Check stderr for rate limit signals, use stdout as the actual response
      const output = stdout || '';
      const errText = stderr || '';
      this.handleRateLimitOrThrow(errText);

      this.handleRateLimitOrThrow(output);
      return output;
    } catch (error) {
      if (error instanceof RateLimitError) throw error;

      const execaError = error as { name?: string; all?: string; message?: string };
      if (execaError.name === 'AbortError') throw new Error('Task was aborted');

      const output = execaError.all ?? execaError.message ?? '';
      this.handleRateLimitOrThrow(output);

      throw error;
    }
  }

  private handleRateLimitOrThrow(output: string) {
    // Custom check for claude specific output "try again at HH:MM"
    const limitRegex = /limit reached.*?try again at (\d{1,2}):(\d{2})/i;
    const match = output.match(limitRegex);
    if (match) {
        const [, hours, minutes] = match;
        const now = new Date();
        const targetTime = new Date(now);
        targetTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
        
        let waitMs = targetTime.getTime() - now.getTime();
        if (waitMs < 0) waitMs += 24 * 60 * 60 * 1000;
        
        this.pause(waitMs);
        throw new RateLimitError(waitMs, `Rate limit reached. Try again at ${hours}:${minutes}`);
    }
    
    // Generic check
    const waitMs = parseRateLimit(output);
    if (waitMs !== null) {
      this.pause(waitMs);
      throw new RateLimitError(waitMs, 'Rate limit hit. Pausing provider execution.');
    }
  }
}
