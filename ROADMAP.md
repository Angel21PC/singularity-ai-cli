# Singularity AI CLI - Roadmap

## Rate Limit Resilience (In Progress)
If an agent hits a flat-rate limit (e.g., "Try again at 14:00"), the system will pause the specific agent, save its state to SQLite, and use background Cron/Worker threads to automatically wake it up at the exact time to resume work.

## Core Refactoring (In Progress)
- Extraction of orchestration logic from React UI components into a dedicated `core/Orchestrator.ts`.
- Proper typed event bus for UI state updates.
- Real SQLite-based scheduling for paused tasks.
