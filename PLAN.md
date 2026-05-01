# Singularity AI CLI - Plan de Implementación

## Fase 1: Setup Core y Arquitectura Base
1. Inicializar proyecto Node.js con TypeScript (`npm init -y`, `tsc --init`).
2. Configurar dependencias clave:
   - `ink` y `ink-text-input` (UI reactiva en terminal, estilo Claude CLI).
   - `execa` (Para ejecución y parseo asíncrono de subprocesos CLI de Claude/Codex).
   - `better-sqlite3` (Persistencia de estado de agentes y proyectos).
   - `zod` (Validación de esquemas de configuración).
3. Diseñar esquema de Base de Datos local:
   - Tablas: `Projects`, `Agents` (con roles y asignación de proveedor CLI), `Tasks`, `TaskQueue` (estado de ejecución, pausas, reanudaciones).

## Fase 2: Wrappers de CLI (Los "Titiriteros")
1. Crear interfaz abstracta `ProviderWrapper` que exponga métodos: `ask(prompt)`, `pause(time)`, `resume()`.
2. Implementar `ClaudeCliWrapper`:
   - Lanza proceso `claude "prompt"`.
   - Lee `stdout` para obtener la respuesta o código.
   - Lee `stderr`/`stdout` para interceptar mensajes de "Límite alcanzado" usando Regex.
   - Lanza evento `RateLimitExceeded` con la hora de reanudación.
3. Implementar `CodexCliWrapper` (misma lógica de abstracción, parseando sus propios errores de límite de uso).

## Fase 3: Framework de Agentes (El Staff)
1. Sistema de Configuración por Proyecto:
   - Leer archivo `singularity.json` en el directorio de cada proyecto.
   - Definir roles: Orquestador (PM), Frontend, Backend, UX/UI.
2. Motor de Enrutamiento (Orquestador):
   - Sistema de parseo de intenciones para permitir delegación entre agentes (ej: Si el Agente Backend dice "Necesito frontend", el Orquestador pausa y deriva al agente correspondiente).
3. Motor de Estado y Reanudación (El core de la tarifa plana):
   - Loop asíncrono (Task Manager).
   - Si un agente entra en `RateLimitExceeded`, marcar tarea como `SLEEPING` en SQLite.
   - Cron interno revisa cada minuto. Si la hora de reanudación ha pasado, reinyecta el contexto en el CLI y cambia estado a `RUNNING`.

## Fase 4: Interfaz Gráfica de Terminal (TUI)
1. Crear el dashboard principal con `Ink`:
   - Selector de Proyecto activo.
   - Panel lateral con el "Staff" y su estado en tiempo real (🟢 Running, 🟡 Sleeping [regenerando límite], ⚪ Idle).
   - Panel principal de logs: "Claude (Backend) está escribiendo...", "Codex (Frontend) pausado hasta las 14:00".
2. Menú de configuración para asignar qué CLI por defecto usa cada Agente.

## Fase 5: Web UI Local (Futuro)
1. Integrar un servidor Express/Fastify ligero en el CLI.
2. Sincronizar eventos de CLI a través de WebSockets hacia un frontend React en `localhost`.
