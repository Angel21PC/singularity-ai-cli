import { execa } from 'execa';
import { ProviderWrapper } from './base.js';
import { RateLimitError } from './errors.js';
export class ClaudeCliWrapper extends ProviderWrapper {
    async ask(prompt) {
        this.checkPaused();
        try {
            const process = execa('claude', ['-p', prompt, '--permission-mode', 'dontAsk'], {
                all: true, reject: false
            });
            const { all } = await process;
            const output = all || '';
            this.checkRateLimit(output);
            return output;
        }
        catch (error) {
            if (error instanceof RateLimitError)
                throw error;
            const err = error;
            const output = err.all || err.message || '';
            this.checkRateLimit(output);
            throw error;
        }
    }
    checkRateLimit(output) {
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
            this.pause(waitMs);
            throw new RateLimitError(waitMs, `Rate limit reached. Try again at ${hours}:${minutes}`);
        }
        else if (output.toLowerCase().includes('rate limit') || output.toLowerCase().includes('limit reached') || output.includes('429')) {
            this.pause(5 * 60 * 1000);
            throw new RateLimitError(5 * 60 * 1000, 'Rate limit hit. Pausing provider execution.');
        }
    }
}
