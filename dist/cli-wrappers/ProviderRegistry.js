import { ClaudeCliWrapper } from './claude.js';
import { CodexCliWrapper } from './codex.js';
class Registry {
    instances = new Map();
    getWrapper(providerName) {
        if (this.instances.has(providerName)) {
            return this.instances.get(providerName);
        }
        let wrapper;
        if (providerName === 'claude-code') {
            wrapper = new ClaudeCliWrapper();
        }
        else if (providerName === 'codex') {
            wrapper = new CodexCliWrapper();
        }
        else {
            throw new Error(`Unknown provider: ${providerName}`);
        }
        this.instances.set(providerName, wrapper);
        return wrapper;
    }
}
export const ProviderRegistry = new Registry();
