import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RateLimitError } from '../src/cli-wrappers/errors.js';

vi.mock('../src/db/repositories/TaskQueueRepository.js', () => ({
  TaskQueueRepository: {
    getSleepingTasksToWake: vi.fn(),
    updateTaskStatus: vi.fn(),
  }
}));

vi.mock('../src/db/index.js', () => ({
  getDb: () => ({
    prepare: () => ({ get: () => ({ provider: 'claude-code' }) })
  })
}));

vi.mock('../src/cli-wrappers/ProviderRegistry.js', () => ({
  ProviderRegistry: { getWrapper: vi.fn() }
}));

vi.mock('../src/services/MemoryStore.js', () => ({
  MemoryStore: { saveTaskResult: vi.fn() }
}));

vi.mock('../src/core/EventBus.js', () => ({
  eventBus: { emitEvent: vi.fn() }
}));

import { Scheduler } from '../src/core/Scheduler.js';
import { TaskQueueRepository } from '../src/db/repositories/TaskQueueRepository.js';
import { ProviderRegistry } from '../src/cli-wrappers/ProviderRegistry.js';

const makeTask = (overrides = {}) => ({
  id: 'task1',
  project_id: 'proj1',
  agent_id: 'agent1',
  prompt: 'do something',
  status: 'SLEEPING' as const,
  ...overrides
});

describe('Scheduler', () => {
  let scheduler: Scheduler;
  const mockWrapper = { ask: vi.fn() };

  beforeEach(() => {
    scheduler = new Scheduler();
    vi.clearAllMocks();
    vi.mocked(ProviderRegistry.getWrapper).mockReturnValue(mockWrapper as any);
  });

  it('completes a sleeping task that is ready to wake', async () => {
    vi.mocked(TaskQueueRepository.getSleepingTasksToWake).mockReturnValue([makeTask()]);
    mockWrapper.ask.mockResolvedValue('done');

    await scheduler.doTick();

    expect(mockWrapper.ask).toHaveBeenCalledWith('do something');
    expect(TaskQueueRepository.updateTaskStatus).toHaveBeenCalledWith('task1', 'COMPLETED', 'done');
  });

  it('re-sleeps a task when rate limit is hit on wake', async () => {
    vi.mocked(TaskQueueRepository.getSleepingTasksToWake).mockReturnValue([makeTask()]);
    mockWrapper.ask.mockRejectedValue(new RateLimitError(60_000));

    await scheduler.doTick();

    expect(TaskQueueRepository.updateTaskStatus).toHaveBeenCalledWith(
      'task1', 'SLEEPING', undefined, expect.stringMatching(/^\d{4}-/)
    );
  });

  it('marks a task as FAILED on generic error', async () => {
    vi.mocked(TaskQueueRepository.getSleepingTasksToWake).mockReturnValue([makeTask()]);
    mockWrapper.ask.mockRejectedValue(new Error('connection refused'));

    await scheduler.doTick();

    expect(TaskQueueRepository.updateTaskStatus).toHaveBeenCalledWith('task1', 'FAILED', 'connection refused');
  });

  it('processes multiple tasks in a single tick', async () => {
    const tasks = [makeTask({ id: 'task1' }), makeTask({ id: 'task2' })];
    vi.mocked(TaskQueueRepository.getSleepingTasksToWake).mockReturnValue(tasks);
    mockWrapper.ask.mockResolvedValue('ok');

    await scheduler.doTick();

    expect(mockWrapper.ask).toHaveBeenCalledTimes(2);
    expect(TaskQueueRepository.updateTaskStatus).toHaveBeenCalledWith('task1', 'COMPLETED', 'ok');
    expect(TaskQueueRepository.updateTaskStatus).toHaveBeenCalledWith('task2', 'COMPLETED', 'ok');
  });

  it('does nothing when no tasks are sleeping', async () => {
    vi.mocked(TaskQueueRepository.getSleepingTasksToWake).mockReturnValue([]);

    await scheduler.doTick();

    expect(mockWrapper.ask).not.toHaveBeenCalled();
  });
});
