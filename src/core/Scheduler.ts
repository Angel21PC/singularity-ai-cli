import { TaskQueueRepository } from '../db/repositories/TaskQueueRepository.js';
import { ProviderRegistry } from '../cli-wrappers/ProviderRegistry.js';
import { RateLimitError } from '../cli-wrappers/errors.js';
import { MemoryStore } from '../services/MemoryStore.js';
import { eventBus } from './EventBus.js';
import { getDb } from '../db/index.js';

export class Scheduler {
  private timer: NodeJS.Timeout | null = null;
  // Promise chain ensures ticks never overlap even if one takes longer than the interval
  private tickLock: Promise<void> = Promise.resolve();

  start() {
    if (this.timer) return;
    this.timer = setInterval(() => this.tick(), 5000);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private tick() {
    this.tickLock = this.tickLock.then(() => this.doTick()).catch(() => {});
  }

  async doTick() {
    const now = new Date().toISOString();
    const tasks = TaskQueueRepository.getSleepingTasksToWake(now);

    for (const task of tasks) {
      eventBus.emitEvent({
        type: 'SystemLog',
        projectId: task.project_id,
        payload: `[Scheduler] Waking up task ${task.id}...`
      });

      try {
        const db = getDb();
        let agentProvider = 'claude-code';

        if (task.agent_id && task.agent_id !== 'orchestrator') {
          const row = db.prepare('SELECT provider FROM Agents WHERE id = ?').get(task.agent_id) as { provider: string } | undefined;
          if (row) agentProvider = row.provider;
        }

        const wrapper = ProviderRegistry.getWrapper(agentProvider);
        const outputText = await wrapper.ask(task.prompt);

        MemoryStore.saveTaskResult(task.project_id, task.id, outputText);
        TaskQueueRepository.updateTaskStatus(task.id, 'COMPLETED', outputText);

        eventBus.emitEvent({
          type: 'SystemLog',
          projectId: task.project_id,
          payload: `[Scheduler] Task ${task.id} completed.`
        });
      } catch (err) {
        if (err instanceof RateLimitError) {
          const resumeAt = new Date(Date.now() + err.waitMs).toISOString();
          TaskQueueRepository.updateTaskStatus(task.id, 'SLEEPING', undefined, resumeAt);
          eventBus.emitEvent({ type: 'RateLimited', projectId: task.project_id, payload: `Rate limit hit again. Waking at ${resumeAt}` });
        } else {
          const message = err instanceof Error ? err.message : String(err);
          TaskQueueRepository.updateTaskStatus(task.id, 'FAILED', message);
          eventBus.emitEvent({ type: 'TaskFailed', projectId: task.project_id, payload: message });
        }
      }
    }
  }
}

export const scheduler = new Scheduler();
