import { EventEmitter } from 'events';
import { logger } from './Logger.js';

export type OrchestratorEventType = 
  | 'OrchestratorThinking'
  | 'Delegating'
  | 'RateLimited'
  | 'TaskCompleted'
  | 'TaskFailed'
  | 'AgentLog'
  | 'SystemLog';

export interface OrchestratorEvent {
  type: OrchestratorEventType;
  projectId: string;
  taskId?: string;
  payload: any;
}

class OrchestratorEventBus extends EventEmitter {
  emitEvent(event: OrchestratorEvent) {
    logger.info({ event: event.type, projectId: event.projectId, payload: event.payload }, 'Event emitted');
    this.emit('event', event);
    this.emit(event.type, event);
  }

  onEvent(listener: (event: OrchestratorEvent) => void) {
    this.on('event', listener);
  }

  offEvent(listener: (event: OrchestratorEvent) => void) {
    this.off('event', listener);
  }
}

export const eventBus = new OrchestratorEventBus();
