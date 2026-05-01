import { execa } from 'execa';
import { ProviderWrapper } from './base.js';
import { RateLimitError } from './errors.js';
export class CodexCliWrapper extends ProviderWrapper {
    async ask(prompt) {
        this.checkPaused();
        try {
            const process = execa('codex', ['exec', prompt], { reject: false });
            const { stdout, stderr } = await process;
            const output = stdout || stderr || '';
            this.checkRateLimit(output);
            return output;
        }
        catch (error) {
            if (error instanceof RateLimitError)
                throw error;
            const err = error;
            const output = err.stdout || err.stderr || err.message || '';
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
        else if (output.toLowerCase().includes('rate limit') || output.toLowerCase().includes('limit reached')) {
            this.pause(5 * 60 * 1000);
            throw new RateLimitError(5 * 60 * 1000, 'Rate limit detected without specific time.');
        }
    }
}
