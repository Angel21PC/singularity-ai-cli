import { getDb, initDb } from './init.js';

export { getDb, initDb };

// Backwards compatibility layer
export async function executeDb(type: 'run' | 'all' | 'get', sql: string, params: any[] = []): Promise<any> {
  const db = getDb();
  try {
    const stmt = db.prepare(sql);
    if (type === 'run') {
      return stmt.run(params);
    } else if (type === 'all') {
      return stmt.all(params);
    } else if (type === 'get') {
      return stmt.get(params);
    }
  } catch (err) {
    throw err;
  }
}
