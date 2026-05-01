# Singularity AI CLI

Una capa orquestadora para manejar múltiples suscripciones de IA (Claude, Codex) a través de sus CLIs locales. Permite delegación entre agentes, control de límites de uso (Rate Limits) y reanudación asíncrona de tareas mediante hilos secundarios y SQLite.

## Requisitos
- Node.js (v18 o superior)
- Tener instalados los CLIs de los proveedores que vayas a usar:
  - `npm install -g @anthropic-ai/claude-code`
  - `npm install -g @openai/codex` (Opcional por ahora)
- Tener la sesión iniciada en tu terminal (`claude login`).

## Instalación rápida para pruebas locales

```bash
# 1. Clona el repositorio (Sustituye <URL> cuando lo subas a tu cuenta)
git clone https://github.com/angel-utrillas/singularity-ai-cli.git
cd singularity-ai-cli

# 2. Instala las dependencias
npm install

# 3. Ejecuta la prueba de concepto (El Titiritero)
npx tsx src/test-claude.ts
```
