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
      project_id TEXT,
      agent_id TEXT,
      prompt TEXT,
      status TEXT NOT NULL,
      resume_at DATETIME,
      result TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(agent_id) REFERENCES Agents(id),
      FOREIGN KEY(project_id) REFERENCES Projects(id)
    );
    
    CREATE INDEX IF NOT EXISTS idx_taskqueue_project_id ON TaskQueue(project_id);
    CREATE INDEX IF NOT EXISTS idx_taskqueue_status ON TaskQueue(status);
    CREATE INDEX IF NOT EXISTS idx_taskqueue_resume_at ON TaskQueue(resume_at);
  `);

  // Lightweight migrations for existing DBs
  try {
    const cols = (db.prepare('PRAGMA table_info(TaskQueue)').all() as any[]).map(c => c.name);
    if (!cols.includes('project_id')) db.exec('ALTER TABLE TaskQueue ADD COLUMN project_id TEXT');
    if (!cols.includes('prompt')) db.exec('ALTER TABLE TaskQueue ADD COLUMN prompt TEXT');
    if (!cols.includes('result')) db.exec('ALTER TABLE TaskQueue ADD COLUMN result TEXT');
    if (!cols.includes('created_at')) db.exec('ALTER TABLE TaskQueue ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP');
    if (!cols.includes('updated_at')) db.exec('ALTER TABLE TaskQueue ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP');
  } catch (e) {
    // non-fatal
  }

  dbInstance = db;
  return db;
}

export function getDb() {
  if (!dbInstance) {
    return initDb();
  }
  return dbInstance;
}
