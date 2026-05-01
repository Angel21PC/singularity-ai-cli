import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RateLimitError } from '../src/cli-wrappers/errors.js';

vi.mock('../src/core/EventBus.js', () => ({
  eventBus: { emitEvent: vi.fn() }
}));

vi.mock('../src/db/repositories/AgentRepository.js', () => ({
  AgentRepository: { getAgentByNameOrRole: vi.fn() }
}));

vi.mock('../src/db/repositories/TaskQueueRepository.js', () => ({
  TaskQueueRepository: {
    createTask: vi.fn(),
    updateTaskStatus: vi.fn(),
  }
}));

vi.mock('../src/cli-wrappers/ProviderRegistry.js', () => ({
  ProviderRegistry: { getWrapper: vi.fn() }
}));

vi.mock('../src/services/MemoryStore.js', () => ({
  MemoryStore: {
    getHandoffContext: vi.fn().mockReturnValue(''),
    saveTaskResult: vi.fn(),
    updateHandoff: vi.fn(),
    getWorkspaceDir: vi.fn().mockReturnValue('/tmp/workspace'),
  }
}));

import { Orchestrator } from '../src/core/Orchestrator.js';
import { AgentRepository } from '../src/db/repositories/AgentRepository.js';
import { ProviderRegistry } from '../src/cli-wrappers/ProviderRegistry.js';
import { eventBus } from '../src/core/EventBus.js';

describe('Orchestrator', () => {
  const mockWrapper = { ask: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ProviderRegistry.getWrapper).mockReturnValue(mockWrapper as any);
  });

  it('emits TaskCompleted when orchestrator handles prompt directly', async () => {
    mockWrapper.ask.mockResolvedValue('Here is my direct answer.');

    await Orchestrator.handlePrompt('proj1', 'hello', 'task1');

    expect(eventBus.emitEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'TaskCompleted', payload: 'Here is my direct answer.' })
    );
  });

  it('delegates to a sub-agent when delegation pattern is detected', async () => {
    mockWrapper.ask
      .mockResolvedValueOnce('Let me delegate.\n>>>DELEGATE @Specialist<<<\nDo the work.')
      .mockResolvedValueOnce('Sub-agent result.')
      .mockResolvedValueOnce('Final synthesized answer.');

    vi.mocked(AgentRepository.getAgentByNameOrRole).mockReturnValue({
      id: 'agent1', project_id: 'proj1', name: 'Specialist',
      role: 'specialist', provider: 'claude-code', model: 'claude-3'
    });

    await Orchestrator.handlePrompt('proj1', 'complex task', 'task1');

    expect(mockWrapper.ask).toHaveBeenCalledTimes(3);
    expect(eventBus.emitEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'Delegating' })
    );
    expect(eventBus.emitEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'TaskCompleted', payload: 'Final synthesized answer.' })
    );
  });

  it('emits TaskFailed on a generic error', async () => {
    mockWrapper.ask.mockRejectedValue(new Error('Connection refused'));

    await Orchestrator.handlePrompt('proj1', 'test', 'task1');

    expect(eventBus.emitEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'TaskFailed', payload: 'Connection refused' })
    );
  });

  it('emits RateLimited and does not mark task as failed on rate limit error', async () => {
    mockWrapper.ask.mockRejectedValue(new RateLimitError(60_000, 'Rate limited'));

    await Orchestrator.handlePrompt('proj1', 'test', 'task1');

    const calls = vi.mocked(eventBus.emitEvent).mock.calls.map(c => c[0].type);
    expect(calls).toContain('RateLimited');
    expect(calls).not.toContain('TaskFailed');
  });
});
