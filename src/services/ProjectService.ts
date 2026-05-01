import { getDb } from '../db/index.js';

export interface Project {
  id: string;
  name: string;
  description: string;
}

export class ProjectService {
  static getProjects(): Project[] {
    const db = getDb();
    return db.prepare('SELECT * FROM Projects').all() as Project[];
  }

  static createProject(id: string, name: string, description: string): void {
    const db = getDb();
    db.prepare('INSERT INTO Projects (id, name, description) VALUES (?, ?, ?)')
      .run(id, name, description);
  }
}
