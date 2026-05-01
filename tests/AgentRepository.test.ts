import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AgentRepository } from '../src/db/repositories/AgentRepository.js';

vi.mock('../src/db/index.js', () => {
  return {
    getDb: () => ({
      prepare: (sql: string) => ({
        all: (...params: any[]) => {
          if (sql.includes('SELECT * FROM Agents')) {
            return [{ id: '1', project_id: 'p1', name: 'Bot', role: 'helper' }];
          }
          return [];
        },
        run: (...params: any[]) => {}
      })
    })
  };
});

describe('AgentRepository', () => {
  it('should fetch agents by project', () => {
    const agents = AgentRepository.getAgentsByProject('p1');
    expect(agents).toHaveLength(1);
    expect(agents[0].name).toBe('Bot');
  });
});
