import Database from 'better-sqlite3';

try {
  require('better-sqlite3');
} catch (e) {
  console.error('\n⚠️  CRITICAL: better-sqlite3 needs to be rebuilt for your OS.');
  console.error('Run: npm run rebuild\n');
}

let dbInstance: ReturnType<typeof Database> | null = null;

export function initDb() {
  if (dbInstance) return dbInstance;
  
  const db = new Database('singularity.sqlite');
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS Projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS Agents (
      id TEXT PRIMARY KEY,
      project_id TEXT,
      name TEXT NOT NULL,
      role TEXT,
      provider TEXT NOT NULL,
      model TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(project_id) REFERENCES Projects(id)
    );

    CREATE TABLE IF NOT EXISTS TaskQueue (
      id TEXT PRIMARY KEY,
      agent_id TEXT,
      status TEXT NOT NULL,
      resume_at DATETIME,
      context_dump_path TEXT,
      pid INTEGER,
      FOREIGN KEY(agent_id) REFERENCES Agents(id)
    );
  `);

  dbInstance = db;
  return db;
}

export function getDb() {
  if (!dbInstance) {
    return initDb();
  }
  return dbInstance;
}
