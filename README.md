# Singularity AI CLI 🌌

Singularity AI CLI is a powerful multi-agent orchestration layer that sits on top of official AI provider CLIs (like `claude-code` and `codex`). It enables seamless delegation of tasks between specialized agents while maintaining shared context across isolated projects.

---

## 📸 Key Features & Use Cases

### 1. Project Isolation & Workspace Mapping
Create distinct projects (e.g., "Rick and Morty React App" vs. "Enterprise CRM"). Agents and memory are strictly isolated per project, preventing context leakage.

### 2. Specialized Agent Staffing
Define your team of agents per project. Create a `Master_Orchestrator`, a `UX_Designer` using Claude 3.5 Sonnet, and a `Frontend_React` expert using Codex.

### 3. Asynchronous "Handoff" Context Memory
When the UX Designer finishes a color palette, Singularity writes the output to physical disk (`memory_dumps/`). When the Frontend agent wakes up, this file is automatically injected as prefix context, ensuring flawless continuity between agents even across PC reboots.

### 4. Live Global Chat & Autonomous Delegation Loop
You talk only to the Orchestrator. The Orchestrator automatically delegates tasks using `@AgentName`. The TUI truncates massive code outputs to keep the console clean while saving the full code to disk.

---

## 🛠️ Architecture

- **UI:** React for the Terminal via `ink` and `ink-select-input`.
- **Database:** SQLite3 for persistent project, agent, and task state.
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
