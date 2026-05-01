import { AgentRepository, Agent } from '../db/repositories/AgentRepository.js';

export class AgentService {
  static getAgentsByProject(projectId: string): Agent[] {
    return AgentRepository.getAgentsByProject(projectId);
  }

  static createAgent(agent: Agent): void {
    AgentRepository.createAgent(agent);
  }

  static deleteAgent(id: string): void {
    AgentRepository.deleteAgent(id);
  }
}
