import { execa } from 'execa';
import { ProviderWrapper } from './base.js';

export class ClaudeCliWrapper extends ProviderWrapper {
  private currentProcess: any | null = null;
  private isPaused: boolean = false;

  async ask(prompt: string): Promise<string> {
    if (this.isPaused) {
      throw new Error('Provider is currently paused due to rate limits.');
    }

    try {
      this.currentProcess = execa('claude', ['-p', prompt, '--dangerously-skip-permissions'], {
        all: true,
      });

      const { all } = await this.currentProcess;

      const output = all || '';
      
      // Basic rate limit detection logic
      if (output.toLowerCase().includes('rate limit') || output.includes('429')) {
        this.pause();
        throw new Error('Rate limit hit. Pausing provider execution.');
      }

      return output;
    } catch (error: any) {
      const output = error.all || error.message || '';
      
      // Also check for rate limits in error output
      if (output.toLowerCase().includes('rate limit') || output.includes('429')) {
        this.pause();
        throw new Error('Rate limit hit. Pausing provider execution.');
      }
      
      throw error;
    } finally {
      this.currentProcess = null;
    }
  }

  pause(): void {
    this.isPaused = true;
    if (this.currentProcess) {
      // Attempt to pause/kill the process if it's running
      this.currentProcess.kill('SIGSTOP');
    }
    console.log('ClaudeCliWrapper: Paused due to rate limit');
  }

  resume(): void {
    this.isPaused = false;
    if (this.currentProcess) {
      this.currentProcess.kill('SIGCONT');
    }
    console.log('ClaudeCliWrapper: Resumed');
  }
}
