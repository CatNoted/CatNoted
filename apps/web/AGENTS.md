# Web App Shell — Agent Workspace Guidelines

This directory contains the main React client entrypoint (`apps/web`) of the CatNoted workspace.

---

## 1. Responsibilities

- **Application Shell**: Manages the 3-Pane Layout (Sidebar, Workspace Viewport, Right Panel Chat).
- **Global Contexts**: Theme state (Dark/Light), Supabase Active Authentication, and Crypto Session Keys.
- **Unified Command Palette**: Orchestrates Global shortcuts (`Cmd+K` / `Ctrl+K`) for switching layouts, changing themes, searching documents, or triggering widget builders.

---

## 2. Technical Stack & Constraints

- **Framework**: React 18 (Vite SPA template) with strict TypeScript mode.
- **Styling**: Tailwind CSS + CSS Variables (`index.css` design system). Do not write custom raw style sheets.
- **Database Connection**: Bring Your Own Key (BYOK) for LLMs and E2EE local sync via Supabase WebSockets.

---

## 3. Communication & Data Protection

- **Local-First E2EE**: Modutations MUST go through the encryption utility `src/utils/crypto.ts` before being broadcasted over Supabase Realtime channels.
- **Secrets Management**: Plaintext API keys or passphrases must NEVER be leaked to network logs or Supabase servers.
