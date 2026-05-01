import { TaskQueueRepository } from '../db/repositories/TaskQueueRepository.js';
import { AgentRepository } from '../db/repositories/AgentRepository.js';
import { ProviderRegistry } from '../cli-wrappers/ProviderRegistry.js';
import { MemoryStore } from '../services/MemoryStore.js';
import { eventBus } from './EventBus.js';
import crypto from 'crypto';
import { getDb } from '../db/index.js';

export class Scheduler {
  private timer: NodeJS.Timeout | null = null;
  private isRunning = false;

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

  private async tick() {
    if (this.isRunning) return;
    this.isRunning = true;
    try {
      const now = new Date().toISOString();
      const tasks = TaskQueueRepository.getSleepingTasksToWake(now);
      
      for (const task of tasks) {
        eventBus.emitEvent({
          type: 'SystemLog',
          projectId: task.project_id,
          payload: `[Scheduler] Waking up task ${task.id}...`
        });

        // Execute task
        try {
          const db = getDb();
          let agentProvider = 'claude-code';
          
          if (task.agent_id && task.agent_id !== 'orchestrator') {
            const agent: any = db.prepare('SELECT * FROM Agents WHERE id = ?').get(task.agent_id);
            if (agent) {
              agentProvider = agent.provider;
            }
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
          
        } catch (err: any) {
           if (err.name === 'RateLimitError') {
             const resumeAt = new Date(Date.now() + err.waitMs).toISOString();
             TaskQueueRepository.updateTaskStatus(task.id, 'SLEEPING', undefined, resumeAt);
             eventBus.emitEvent({ type: 'RateLimited', projectId: task.project_id, payload: `Rate limit hit again. Waking at ${resumeAt}` });
           } else {
             TaskQueueRepository.updateTaskStatus(task.id, 'FAILED', err.message);
             eventBus.emitEvent({ type: 'TaskFailed', projectId: task.project_id, payload: err.message });
           }
        }
      }
    } finally {
      this.isRunning = false;
    }
  }
}

export const scheduler = new Scheduler();
