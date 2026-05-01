import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Store database in the root of the project for now
const dbPath = path.resolve(__dirname, '../../singularity.db');

export function initDb() {
  const db = new Database(dbPath);
  
  // Enable Write-Ahead Logging for better performance
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS Projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS Agents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      provider TEXT NOT NULL, -- e.g., 'claude-code', 'codex', etc.
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES Projects(id) ON DELETE CASCADE
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS TaskQueue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agent_id INTEGER,
      task_description TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'running', 'paused', 'completed', 'failed'
      resume_at DATETIME, -- Time to resume if paused due to rate limits
      context_dump_path TEXT, -- Path to the JSON serialization of the agent's context/memory
      pid INTEGER, -- Process ID of the executing agent process
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (agent_id) REFERENCES Agents(id) ON DELETE CASCADE
    );
  `);

  return db;
}

// Singleton export
let dbInstance: Database.Database | null = null;
export function getDb() {
  if (!dbInstance) {
    dbInstance = initDb();
  }
  return dbInstance;
}
