#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import { App } from './ui/App.js';
import { getDb } from './db/init.js';
import { execa } from 'execa';
import { scheduler } from './core/Scheduler.js';
import { Orchestrator } from './core/Orchestrator.js';
import { eventBus } from './core/EventBus.js';

async function checkBinaries() {
  try {
    await execa('claude', ['--version'], { reject: false });
  } catch (err) {
    console.error("⚠️ Warning: 'claude' CLI not found in PATH.");
  }
  
  try {
    await execa('codex', ['--version'], { reject: false });
  } catch (err) {
    console.warn("⚠️ Warning: 'codex' CLI not found in PATH.");
  }
}

async function main() {
  try {
    getDb();
  } catch (error) {
    console.error("Failed to initialize database", error);
    process.exit(1);
  }

  await checkBinaries();

  scheduler.start();

  const args = process.argv.slice(2);
  const runIndex = args.indexOf('run');
  
  if (runIndex !== -1) {
    const projectIndex = args.indexOf('--project');
    const promptIndex = args.indexOf('--prompt');
    
    if (projectIndex === -1 || promptIndex === -1) {
      console.error("Usage: singularity run --project <id> --prompt <text>");
      process.exit(1);
    }
    
    const projectId = args[projectIndex + 1];
    const prompt = args[promptIndex + 1];
    
    if (!projectId || !prompt) {
       console.error("Missing values for --project or --prompt");
       process.exit(1);
    }

    console.log(`Running in headless mode. Project: ${projectId}, Prompt: "${prompt}"`);
    
    // Subscribe to events for headless output
    eventBus.onEvent((event) => {
      if (event.projectId !== projectId) return;
      if (event.type === 'SystemLog' || event.type === 'OrchestratorThinking' || event.type === 'Delegating') {
        console.log(`[${event.type}] ${event.payload}`);
      } else if (event.type === 'RateLimited') {
        console.log(`[RateLimited] ${event.payload}`);
        process.exit(0); // Exiting cleanly, scheduler will handle it later if started again
      } else if (event.type === 'TaskCompleted') {
        console.log(`\n--- RESULT ---\n${event.payload}\n`);
        process.exit(0);
      } else if (event.type === 'TaskFailed') {
        console.error(`\n[ERROR] ${event.payload}\n`);
        process.exit(1);
      }
    });

    const crypto = require('crypto');
    Orchestrator.handlePrompt(projectId, prompt, crypto.randomUUID()).catch((err) => {
      console.error(err);
      process.exit(1);
    });
    
  } else {
    // Interactive mode
    render(<App />);
  }
}

main().catch(console.error);
