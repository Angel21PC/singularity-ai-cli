import { Worker } from 'worker_threads';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Initialize worker (pointing to worker.js or worker.ts)
const isTsNode = __filename.endsWith('.ts');
const workerExtension = isTsNode ? 'ts' : 'js';
const workerPath = path.resolve(__dirname, `worker.${workerExtension}`);
const execArgv = isTsNode ? ['--import', 'tsx'] : [];
const worker = new Worker(workerPath, { execArgv });
let messageId = 0;
const pendingRequests = new Map();
worker.on('message', (msg) => {
    const { id, result, error } = msg;
    const req = pendingRequests.get(id);
    if (req) {
        if (error) {
            req.reject(new Error(error));
        }
        else {
            req.resolve(result);
        }
        pendingRequests.delete(id);
    }
});
worker.on('error', (err) => {
    console.error('Database worker error:', err);
});
export function executeDb(type, sql, params = []) {
    return new Promise((resolve, reject) => {
        const id = messageId++;
        pendingRequests.set(id, { resolve, reject });
        worker.postMessage({ id, type, sql, params });
    });
}
