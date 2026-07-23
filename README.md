# CatNoted

**CatNoted** is an AI‑native, spatial knowledge workspace that brings together AFFiNE‑style hybrid document/canvas editing, Obsidian‑style knowledge graphs, and a client‑side Space Agent runtime. It enables users to write, visualise and interact with notes as live, programmable widgets, all while keeping data local‑first and end‑to‑end encrypted.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Packages](#packages)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Development Server](#development-server)
  - [Building for Production](#building-for-production)
  - [Environment Variables](#environment-variables)
- [Security & Privacy](#security--privacy)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgements](#acknowledgements)

---

## Overview

CatNoted transforms static note‑taking into a **living, programmable workspace**:

- **Hybrid Document & Canvas** – Switch seamlessly between linear documents and an infinite, spatial canvas without losing context.
- **Knowledge Graph** – Visualise backlinks, tags and relationships in a force‑directed graph.
- **Space Agent Runtime** – Run AI‑generated JavaScript/HTML/CSS widgets safely inside a sandboxed iframe, powered by a client‑side virtual file system (VFS) and LLM integration.
- **Local‑First & E2EE** – All data lives in the browser (IndexedDB) and is encrypted with AES‑GCM before any sync.
- **Modular Monorepo** – Built with `pnpm` workspaces, `turborepo` pipelines and TypeScript strict mode.

---

## Key Features

- **3‑Pane UI Shell** – Sidebar navigation, central workspace, and right‑hand AI panel.
- **Real‑time Collaboration** – CRDT‑based Yjs sync across documents, canvas cards and graph nodes.
- **AI‑Generated Widgets** – Write or generate interactive widgets on‑the‑fly; sandboxed for safety.
- **Dark / Light Theme** – CSS‑variable design tokens used across all packages.
- **Supabase Cloud Sync** – Encrypted realtime syncing of VFS and Yjs updates.
- **Extensible Plugin System** – Add new skills or agents via Markdown‑based `skills/`.

---

## Architecture

```
catnoted/
├─ apps/web                # Vite + React SPA (entry point)
├─ packages/
│  ├─ agent-runtime       # VFS, sandbox iframe, LLM client
│  ├─ editor               # Block‑based document editor (Yjs)
│  ├─ canvas               # Infinite canvas viewport & cards
│  ├─ graph                # Knowledge‑graph visualiser (D3 / force‑graph)
│  └─ shared               # TypeScript types & utilities
└─ turbo.json              # Turborepo pipelines
```

- **Client‑Side First** – All execution (including AI widget rendering) occurs inside the browser; no server‑side code is required for core features.
- **Privacy‑First** – Secrets never leave the client; encryption keys are supplied by the user via UI.
- **Agent Communication** – `packages/agent-runtime` exposes `WidgetSpec` and `AgentMessage` types (see `packages/shared/src/agent.ts`). UI widgets are rendered through the `<SandboxFrame>` component.

---

## Packages

| Package | Description | Entry Point |
|---------|-------------|-------------|
| `@catnoted/web` | Vite‑powered React SPA, UI shell, routing, Tailwind config. | `apps/web/src/main.tsx` |
| `@catnoted/shared` | Central TypeScript types (`BlockNode`, `CanvasElement`, `GraphNode`, `WidgetSpec`, …). | `packages/shared/src/index.ts` |
| `@catnoted/editor` | Block‑suite editor, Yjs document store, CRUD hooks. | `packages/editor/src/index.ts` |
| `@catnoted/canvas` | 2D canvas viewport, spatial cards, connector lines. | `packages/canvas/src/index.ts` |
| `@catnoted/graph` | Knowledge‑graph parser & force‑graph renderer. | `packages/graph/src/index.ts` |
| `@catnoted/agent-runtime` | VFS, sandboxed iframe, LLM client, widget lifecycle. | `packages/agent-runtime/src/index.ts` |

---

## Getting Started

### Prerequisites

- **Node.js** >= 18
- **pnpm** (recommended) – `npm i -g pnpm`
- **Git**
- Optional: **Supabase** project for cloud sync (free tier works).

### Installation

```bash
# Clone the repository
git clone https://github.com/CatNoted/CatNoted.git
cd CatNoted

# Install dependencies (pnpm workspace)
pnpm install

# Copy environment example and edit values
cp .env.example .env.local
# Edit .env.local with your Supabase URL / ANON_KEY etc.
```

### Development Server

```bash
# Run the monorepo dev server (Turbo + Vite)
pnpm dev
```

The web app will be available at `http://localhost:5173`.

### Building for Production

```bash
pnpm build   # Runs tsc type‑check then Vite build for apps/web
```

The compiled assets are emitted to `apps/web/dist`.

### Environment Variables

All required env vars are documented in `.env.example`. The most common ones are:

- `VITE_SUPABASE_URL` & `VITE_SUPABASE_ANON_KEY` – Supabase client config.
- `VITE_OLLAMA_BASE_URL` – Local Ollama endpoint (for offline LLM).
- `VITE_APP_ENV` – `development` | `production`.

---

## Security & Privacy

CatNoted follows the **SecureCoder** guidelines (see `AGENTS.md` → *Agent Execution Guidelines*). Highlights:

- **Zero unnecessary server calls** – All widget code runs in an isolated iframe sandbox (`allow‑scripts`).
- **E2EE** – Payloads are encrypted with AES‑GCM before any network sync.
- **Mandatory Secure‑Web Rules** – All new code generation must pass the `mandatory-secure-web-skills` skill, ensuring safe handling of file I/O, DOM manipulation and external dependencies.
- **Dependency Scanning** – Run `run-security-scanner` and `scan_dependencies` before adding any new package.

---

## Contributing

1. Fork the repository and clone your fork.
2. Create a feature branch: `git checkout -b feat/awesome-feature`.
3. Follow the coding conventions in `AGENTS.md` – use existing types from `@catnoted/shared` and keep Tailwind utility classes consistent.
4. Run lint and type‑check before submitting a PR:
   ```bash
   pnpm lint
   pnpm typecheck
   ```
5. Open a Pull Request against the `main` branch.

Please read the **Code of Conduct** and **Contributing Guidelines** (TODO) before contributing.

---

## License

CatNoted is released under the **MIT License**. See the `LICENSE` file for full details.

---

## Acknowledgements

- **AFFiNE** – inspiration for the hybrid document/canvas model.
- **Obsidian** – knowledge‑graph concepts.
- **Space Agent** – client‑side AI runtime design.
- **Supabase** – realtime sync & auth backend.
- **OpenAI / Anthropic / Gemini / Ollama** – LLM providers supported via BYOK.

---
