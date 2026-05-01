import { getDb } from '../../db/index.js';

export interface Task {
  id: string;
  project_id: string;
  agent_id: string;
  prompt: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SLEEPING';
  resume_at?: string | null;
  result?: string | null;
  created_at?: string;
  updated_at?: string;
}

export class TaskQueueRepository {
  static createTask(task: Task): void {
    const db = getDb();
    db.prepare(`
      INSERT INTO TaskQueue (id, project_id, agent_id, prompt, status) 
      VALUES (?, ?, ?, ?, ?)
    `).run(task.id, task.project_id, task.agent_id, task.prompt, task.status);
  }

  static updateTaskStatus(id: string, status: string, result?: string, resumeAt?: string): void {
    const db = getDb();
    if (resumeAt) {
      db.prepare(`
        UPDATE TaskQueue 
        SET status = ?, resume_at = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).run(status, resumeAt, id);
    } else if (result) {
      db.prepare(`
        UPDATE TaskQueue 
        SET status = ?, result = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).run(status, result, id);
    } else {
      db.prepare(`
        UPDATE TaskQueue 
        SET status = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).run(status, id);
    }
  }

  static getSleepingTasksToWake(nowISO: string): Task[] {
    const db = getDb();
    return db.prepare(`
      SELECT * FROM TaskQueue 
      WHERE status = 'SLEEPING' AND resume_at <= ?
    `).all(nowISO) as Task[];
  }
}
