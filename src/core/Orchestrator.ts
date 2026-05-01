import { eventBus } from './EventBus.js';
import { AgentRepository } from '../db/repositories/AgentRepository.js';
import { TaskQueueRepository } from '../db/repositories/TaskQueueRepository.js';
import { ProviderRegistry } from '../cli-wrappers/ProviderRegistry.js';
import { MemoryStore } from '../services/MemoryStore.js';
import { parseDelegation } from './OrchestratorUtils.js';
import { logger } from './Logger.js';
import crypto from 'crypto';

export class Orchestrator {
  static async runAgent(projectId: string, agentName: string, prompt: string, rootTaskId?: string): Promise<string> {
    const taskId = crypto.randomUUID();
    let agentProvider = 'codex';
    let agentId: string = 'orchestrator';
    let systemRole = "You are a helpful Orchestrator. When needed, delegate to other agents by outputting '>>>DELEGATE @AgentName<<<\n<task>'.";

    if (agentName !== 'Orchestrator') {
      const result = AgentRepository.getAgentByNameOrRole(agentName, projectId);
      if (result) {
        agentProvider = result.provider;
        agentId = result.id;
        systemRole = `You are playing the role: ${result.role}.`;
        eventBus.emitEvent({ type: 'SystemLog', projectId, taskId: rootTaskId, payload: `Delegating task to agent: ${result.name} (${result.provider})` });
      } else {
        eventBus.emitEvent({ type: 'SystemLog', projectId, taskId: rootTaskId, payload: `Warning: Agent '${agentName}' not found in this project. Executing task directly.` });
      }
    }

    TaskQueueRepository.createTask({
      id: taskId,
      project_id: projectId,
      agent_id: agentId,
      prompt,
      status: 'RUNNING'
    });

    const previousContext = MemoryStore.getHandoffContext(projectId);
    const fullPrompt = `${systemRole}${previousContext}\nUser request: ${prompt}`;
    
    try {
      const wrapper = ProviderRegistry.getWrapper(agentProvider);
      const outputText = await wrapper.ask(fullPrompt);

      MemoryStore.saveTaskResult(projectId, taskId, outputText);
      TaskQueueRepository.updateTaskStatus(taskId, 'COMPLETED', outputText);
      return outputText;
    } catch (err: any) {
      if (err.name === 'RateLimitError') {
        const resumeAt = new Date(Date.now() + err.waitMs).toISOString();
        TaskQueueRepository.updateTaskStatus(taskId, 'SLEEPING', undefined, resumeAt);
        throw err;
      } else {
        TaskQueueRepository.updateTaskStatus(taskId, 'FAILED', err.message);
        throw err;
      }
    }
  }

  static async handlePrompt(projectId: string, input: string, rootTaskId: string): Promise<void> {
    try {
      eventBus.emitEvent({ type: 'OrchestratorThinking', projectId, taskId: rootTaskId, payload: 'Analyzing request...' });
      
      const orchOutput = await this.runAgent(projectId, 'Orchestrator', input, rootTaskId);
      let finalOutput = orchOutput;

      const delegationMatch = parseDelegation(orchOutput);
      if (delegationMatch) {
         const { subAgentName, subTask } = delegationMatch;
         
         eventBus.emitEvent({ type: 'Delegating', projectId, taskId: rootTaskId, payload: `Delegating to @${subAgentName}...` });
         const subOutput = await this.runAgent(projectId, subAgentName, subTask, rootTaskId);
         
         MemoryStore.updateHandoff(projectId, subAgentName, subTask, subOutput);
         
         eventBus.emitEvent({ type: 'OrchestratorThinking', projectId, taskId: rootTaskId, payload: 'Analyzing subagent result...' });
         const dumpDir = MemoryStore.getWorkspaceDir(projectId);
         const dumpPath = `${dumpDir}/latest_handoff.txt`;
         const feedbackPrompt = `The subagent @${subAgentName} executed your delegation. Its full output is saved at ${dumpPath}.\nHere is a snippet: ${subOutput.substring(0, 8000)}\n\nPlease provide the final response to the user based on this result.`;
         
         finalOutput = await this.runAgent(projectId, 'Orchestrator', feedbackPrompt, rootTaskId);
      }

      eventBus.emitEvent({ type: 'TaskCompleted', projectId, taskId: rootTaskId, payload: finalOutput });

    } catch (err: any) {
      logger.error({ err, projectId }, 'Task failed');
      if (err.name === 'RateLimitError') {
        eventBus.emitEvent({ type: 'RateLimited', projectId, taskId: rootTaskId, payload: 'Agent paused. Task queued for later.' });
      } else {
        eventBus.emitEvent({ type: 'TaskFailed', projectId, taskId: rootTaskId, payload: err.message });
      }
    }
  }
}
