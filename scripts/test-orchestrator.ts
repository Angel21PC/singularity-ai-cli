/**
 * Diagnostic script: tests the full orchestrator flow against the test-singularity DB.
 * Run from singularity-ai-cli/: npx tsx scripts/test-orchestrator.ts
 */
import { chdir } from 'process';
import path from 'path';
import { fileURLToPath } from 'url';

// Point the app at the test-singularity workspace so the relative DB path resolves there
const testDir = path.resolve('C:/Users/utril/Desktop/test-singularity');
chdir(testDir);
console.log('CWD set to:', process.cwd());

import { getDb } from '../src/db/init.js';
import { eventBus } from '../src/core/EventBus.js';
import { Orchestrator } from '../src/core/Orchestrator.js';

// Init DB
const db = getDb();
console.log('DB opened OK');

// Show current state
const projects = db.prepare('SELECT * FROM Projects').all();
const agents = db.prepare('SELECT * FROM Agents').all();
console.log('Projects:', projects);
console.log('Agents:', agents);

if (projects.length === 0) {
  console.error('No projects in DB. Create one first via npm start.');
  process.exit(1);
}

const projectId = (projects[0] as any).id;
console.log(`\nUsing project: ${projectId}`);

// Listen for all events
eventBus.onEvent((event) => {
  console.log(`[${event.type}]`, event.payload);
  if (event.type === 'TaskCompleted' || event.type === 'TaskFailed' || event.type === 'RateLimited') {
    console.log('\n--- DONE ---');
    process.exit(event.type === 'TaskFailed' ? 1 : 0);
  }
});

const taskId = crypto.randomUUID();
console.log('\nCalling Orchestrator.handlePrompt...\n');
Orchestrator.handlePrompt(projectId, 'Say hello in one sentence.', taskId).catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(1);
});

// Timeout safety
setTimeout(() => {
  console.error('Timeout after 60s');
  process.exit(1);
}, 60_000);
