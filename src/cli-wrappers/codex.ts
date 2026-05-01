import { execa } from 'execa';
import { ProviderWrapper } from './base.js';
import { RateLimitError } from './errors.js';

export class CodexCliWrapper extends ProviderWrapper {
  private currentProcess: any | null = null;
  private isPaused: boolean = false;

  async ask(prompt: string): Promise<string> {
    if (this.isPaused) {
      throw new Error('Provider is currently paused due to rate limits.');
    }

    try {
      this.currentProcess = execa('codex', ['exec', prompt], { reject: false });
      const { stdout, stderr } = await this.currentProcess;
      const output = stdout || stderr || '';
      
      this.checkRateLimit(output);

      return output;
    } catch (error: any) {
      if (error instanceof RateLimitError) throw error;
      const output = error.stdout || error.stderr || error.message || '';
      this.checkRateLimit(output);
      throw error;
    } finally {
      this.currentProcess = null;
    }
  }

  private checkRateLimit(output: string) {
    const limitRegex = /limit reached.*?try again at (\d{1,2}):(\d{2})/i;
    const match = output.match(limitRegex);
    if (match) {
        const [_, hours, minutes] = match;
        const now = new Date();
        const targetTime = new Date(now);
        targetTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
        
        let waitMs = targetTime.getTime() - now.getTime();
        if (waitMs < 0) {
            waitMs += 24 * 60 * 60 * 1000;
        }
        this.pause();
        throw new RateLimitError(waitMs, `Rate limit reached. Try again at ${hours}:${minutes}`);
    } else if (output.toLowerCase().includes('rate limit') || output.toLowerCase().includes('limit reached')) {
        this.pause();
        throw new RateLimitError(5 * 60 * 1000, 'Rate limit detected without specific time.');
    }
  }

  pause(): void {
    this.isPaused = true;
    if (this.currentProcess && typeof this.currentProcess.kill === 'function') {
      this.currentProcess.kill('SIGSTOP');
    }
    console.log('CodexCliWrapper: Paused due to rate limit');
  }

  resume(): void {
    this.isPaused = false;
    if (this.currentProcess && typeof this.currentProcess.kill === 'function') {
      this.currentProcess.kill('SIGCONT');
    }
    console.log('CodexCliWrapper: Resumed');
  }
}
