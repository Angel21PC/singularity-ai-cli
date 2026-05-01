import { getDb } from '../../db/index.js';

export interface Agent {
  id: string;
  project_id: string;
  name: string;
  role: string;
  provider: string;
  model: string;
  created_at?: string;
}

export class AgentRepository {
  static getAgentsByProject(projectId: string): Agent[] {
    const db = getDb();
    return db.prepare('SELECT * FROM Agents WHERE project_id = ?').all(projectId) as Agent[];
  }

  static getAgentByNameOrRole(nameOrRole: string, projectId: string): Agent | undefined {
    const db = getDb();
    return db.prepare('SELECT * FROM Agents WHERE (name = ? OR role LIKE ?) AND project_id = ?')
      .get(nameOrRole, `%${nameOrRole}%`, projectId) as Agent | undefined;
  }

  static createAgent(agent: Agent): void {
    const db = getDb();
    db.prepare(`
      INSERT INTO Agents (id, project_id, name, role, provider, model)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(agent.id, agent.project_id, agent.name, agent.role, agent.provider, agent.model);
  }

  static deleteAgent(id: string): void {
    const db = getDb();
    db.prepare('DELETE FROM Agents WHERE id = ?').run(id);
  }
}
