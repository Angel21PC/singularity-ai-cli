import { ClaudeCliWrapper } from './claude.js';
import { CodexCliWrapper } from './codex.js';
import { ProviderWrapper } from './base.js';
import { getDb } from '../db/init.js';

class Registry {
  private instances = new Map<string, ProviderWrapper>();

  getWrapper(providerName: string): ProviderWrapper {
    if (this.instances.has(providerName)) {
      return this.instances.get(providerName)!;
    }

    let wrapper: ProviderWrapper;
    if (providerName === 'claude-code') {
      wrapper = new ClaudeCliWrapper();
    } else if (providerName === 'codex') {
      wrapper = new CodexCliWrapper();
    } else {
      throw new Error(`Unknown provider: ${providerName}`);
    }

    const db = getDb();
    
    // Check DB on init
    const row = db.prepare('SELECT paused_until FROM ProviderState WHERE provider_name = ?').get(providerName) as { paused_until: string } | undefined;
    if (row && row.paused_until) {
      const waitMs = new Date(row.paused_until).getTime() - Date.now();
      if (waitMs > 0) {
        wrapper.pause(waitMs);
      } else {
        db.prepare('DELETE FROM ProviderState WHERE provider_name = ?').run(providerName);
      }
    }

    // Intercept pause/resume to save to DB
    const originalPause = wrapper.pause.bind(wrapper);
    wrapper.pause = (waitMs: number) => {
      originalPause(waitMs);
      const pausedUntil = new Date(Date.now() + waitMs).toISOString();
      db.prepare(`
        INSERT INTO ProviderState (provider_name, paused_until)
        VALUES (?, ?)
        ON CONFLICT(provider_name) DO UPDATE SET paused_until = excluded.paused_until
      `).run(providerName, pausedUntil);
    };

    const originalResume = wrapper.resume.bind(wrapper);
    wrapper.resume = () => {
      originalResume();
      db.prepare('DELETE FROM ProviderState WHERE provider_name = ?').run(providerName);
    };

    this.instances.set(providerName, wrapper);
    return wrapper;
  }
}

export const ProviderRegistry = new Registry();
