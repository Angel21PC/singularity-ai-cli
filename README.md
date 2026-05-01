# Singularity AI CLI 🌌

Singularity AI CLI is a powerful multi-agent orchestration layer that sits on top of official AI provider CLIs (like `claude-code` and `codex`). It enables seamless delegation of tasks between specialized agents while maintaining shared context across long-running projects, completely isolated within their own environments.

By operating as an invisible "puppeteer" over your existing CLIs, Singularity maximizes your flat-rate monthly AI subscriptions (like Claude Pro or ChatGPT Plus) without incurring per-token API charges.

---

## 📸 Key Features & Use Cases

### 1. Project Isolation & Workspace Mapping
Create distinct projects (e.g., "Rick and Morty React App" vs. "Enterprise CRM"). Agents and memory are strictly isolated per project, preventing context leakage.

<!-- TODO: Add actual screenshot of the project selection menu -->

### 2. Specialized Agent Staffing
Define your team of agents per project. Create a `Master_Orchestrator`, a `UX_Designer` using Claude 3.5 Sonnet, and a `Frontend_React` expert using Codex.

<!-- TODO: Add actual screenshot of the agent creation menu -->

### 3. Asynchronous "Handoff" Context Memory
When the UX Designer finishes a color palette, Singularity writes the output to physical disk (`memory_dumps/`). When the Frontend agent wakes up, this file is automatically injected as prefix context, ensuring flawless continuity between agents even across PC reboots.

<!-- TODO: Add actual screenshot of memory dumps folder -->

### 4. Live Global Chat & Autonomous Delegation Loop
You talk only to the Orchestrator. The Orchestrator automatically delegates tasks using `@AgentName`. The TUI truncates massive code outputs to keep the console clean while saving the full code to disk.

<!-- TODO: Add actual screenshot of the Global Chat orchestration in action -->

### 5. Rate Limit Resilience (Burn Limits)
If an agent hits a flat-rate limit (e.g., "Try again at 14:00"), the system pauses the specific agent, saves its state to SQLite, and uses background Cron/Worker threads to automatically wake it up at the exact time to resume work.

---

## 🛠️ Architecture

- **UI:** React for the Terminal via `ink` and `ink-select-input`.
- **Database:** Non-blocking secondary threads using `better-sqlite3` and Node.js `worker_threads` to prevent UI stuttering.
- **Execution:** `execa` to spawn hidden shell processes of `claude` and `codex`, injecting prompts via `-p` flags and capturing `stdout`.

## 🚀 Getting Started

### Requirements
- Node.js 18+ (Node 22+ recommended for `ink v7`)
- Install provider CLIs globally:
  ```bash
  npm install -g @anthropic-ai/claude-code
  npm install -g @openai/codex
  ```
- Authenticate your CLIs in your terminal (`claude login`, `codex login`).

### Installation
```bash
git clone https://github.com/Angel21PC/singularity-ai-cli.git
cd singularity-ai-cli

# Install dependencies
npm install

# Rebuild SQLite bindings for your OS (Fixes EBUSY/EPERM on Windows)
npm run rebuild

# Compile TypeScript
npm run build

# Start the interactive UI
npm start
```
