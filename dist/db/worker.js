import { parentPort } from 'worker_threads';
import { initDb } from './init.js';
const db = initDb();
if (parentPort) {
    parentPort.on('message', (msg) => {
        try {
            const { id, type, sql, params } = msg;
            if (type === 'run') {
                const stmt = db.prepare(sql);
                const result = stmt.run(...(params || []));
                parentPort?.postMessage({ id, result });
            }
            else if (type === 'all') {
                const stmt = db.prepare(sql);
                const result = stmt.all(...(params || []));
                parentPort?.postMessage({ id, result });
            }
            else if (type === 'get') {
                const stmt = db.prepare(sql);
                const result = stmt.get(...(params || []));
                parentPort?.postMessage({ id, result });
            }
        }
        catch (error) {
            parentPort?.postMessage({ id: msg.id, error: error.message });
        }
    });
}
