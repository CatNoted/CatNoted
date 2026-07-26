# CatNoted Realtime Sync Status & Online/Offline Indicator Audit

This document presents a comprehensive audit of the realtime sync status and online/offline indicators across the CatNoted monorepo (specifically `apps/web` and packages `packages/editor`, `packages/canvas`, and `packages/graph`).

---

## 1. Executive Summary

- **Current Status:** The sync status indicator is implemented centrally inside `apps/web/src/App.tsx` and `apps/web/src/layouts/AppLayout.tsx` using state from the local-first synchronization module (`usePersistence`).
- **Audit Objective:** Assess if the indicators are visible, consistent, and responsive across various viewports, modes (Doc, Canvas, Graph, Journals, and Settings), and dark/light themes. Additionally, determine if sub-packages (`packages/editor`, `packages/canvas`, `packages/graph`) need local/independent status displays.
- **Findings:**
  - The centralized application shell implementation is highly robust, consistent, and cleanly designed.
  - Sub-views (editor, canvas, graph) do not need their own individual indicators. The outer layout provides constant, persistent visual feedback of the synchronization state, satisfying the **Single Source of Truth** principle and avoiding UI/UX clutter.
  - Minor redundancy exists in conflict handling, but overall the implementation behaves correctly and scales gracefully.

---

## 2. Core Architecture & Integration Points

Synchronization status is managed in a client-first manner and flows cleanly through the system:

```text
       +-----------------------+
       |   usePersistence()    |  <-- Tracks local sync queue, network status,
       +-----------------------+      conflicts, and error states
                   |
                   v (status)
       +-----------------------+
       |        App.tsx        |  -- renders TopBar text-based pill (Saving, Saved, Offline)
       +-----------------------+
                   |
                   v (syncStatus prop)
       +-----------------------+
       |     AppLayout.tsx     |  -- renders Left Sidebar Rail icon & tooltip
       +-----------------------+
                   |
        +----------+----------+
        |                     |
        v                     v
+---------------+     +---------------+
|   Sidebar     |     |   Viewport    |  <-- Renders current view:
+---------------+     +---------------+      - DocumentEditor (packages/editor)
                                             - InfiniteCanvas (packages/canvas)
                                             - GraphView (packages/graph)
```

### Integration Flow
1. **State Hook:** `usePersistence` (in `apps/web/src/utils/sync/persistence.ts`) evaluates the state of the offline queue, connectivity (via `navigator.onLine` and `online`/`offline` window events), and API responses. It outputs `status` values: `'saved' | 'saving' | 'offline' | 'error' | 'conflict'`.
2. **Propagating State:** `App.tsx` captures this `status` and propagates it:
   - Locally, to render a text pill in `renderTopBar()`.
   - As a `syncStatus` prop to `AppLayout` (the main shell component).
3. **AppLayout Rendering:** `AppLayout` renders a corresponding status icon inside the Left Navigation Rail (Pane 1) with precise colors and tooltips matching each state. It also triggers full-page modal dialogs if a `'conflict'` state is detected.

---

## 3. Indicator Visibility & Styling Audit

### A. TopBar Text Pill Indicator (`App.tsx`)
Located on the right-hand side of the main header, displaying contextual background colors, text, and pulse icons:
- **`saving`**: Amber background/foreground `bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20` with a pulsing dot indicator.
- **`saved`**: Emerald green background/foreground `bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20`.
- **`offline`**: Neutral muted background/foreground `bg-muted/10 text-muted-foreground border border-muted-foreground/20`.
- **`conflict` / `error`**: Resolves to `null` to avoid crowding the TopBar, deferring to more prominent visual modal triggers.

### B. Left Sidebar Rail Icon Indicator (`AppLayout.tsx`)
Injected directly below the workspace switcher and active mode menus:
- **`saving`**: Rotating `RefreshCw` icon in `text-amber-500 hover:text-amber-600` (tooltip: "Syncing / Saving updates").
- **`saved`**: Stable `Cloud` icon in `text-emerald-500 hover:text-emerald-600` (tooltip: "All changes synced").
- **`offline`**: Muted `CloudOff` icon in `text-slate-400 dark:text-zinc-500 hover:text-slate-500` (tooltip: "Offline mode").
- **`conflict`**: Pulsing `AlertTriangle` in `text-rose-500 hover:text-rose-600` (tooltip: "Sync Version Conflict").
- **`error`**: Static `AlertCircle` in `text-rose-500 hover:text-rose-600` (tooltip: "Sync Error").

---

## 4. Screen Size & Theme Responsiveness

- **Dark & Light Themes:** The styling utilizes semantic Tailwind token classes (`text-slate-400 dark:text-zinc-500`, `text-indigo-600 dark:text-indigo-400`) rather than hardcoded raw hexes. This guarantees beautiful, low-contrast, legible rendering in both light and dark modes.
- **Mobile/Tablet Layouts:** The TopBar text-based indicator is hidden on smaller screens (`hidden sm:inline-flex`) to prevent layout/overflow bugs. However, the sidebar rail icon remains fully visible on all viewports, ensuring continuous status awareness for mobile users without cluttering the screen.
- **Zen Mode Behavior:** If the user toggles Zen Mode, layout rails are collapsed to maximize focus. While this hides status indicators, it is the expected behavior of Zen Mode (prioritizing writing space over status feeds). When a conflict occurs, the central modal will still overlay correctly to block operations until resolved.

---

## 5. Scope Analysis: Do Packages Need Individual Indicators?

**Question:** Do `@catnoted/editor` (Document Editor), `@catnoted/canvas` (Infinite Canvas), or `@catnoted/graph` (Force Graph) need local sync indicators?

**Answer: No.**

### Reasoning:
1. **Shared Workspace Shell:** All three packages are always rendered inside the parent `AppLayout` shell viewport. The global Left Navigation Rail and TopBar are persistent fixtures on the screen. Any independent indicator inside the editor/canvas/graph canvas would be redundant.
2. **Avoid Visual Noise:** Multiple status indicator widgets across the screen create visual clutter, distracting users from their primary spatial content.
3. **Single Source of Truth:** Syncing is executed globally by applying changes to the root `ydoc` CRDT database and syncing via local-first `crdt_updates` queues. Because synchronization isn't scoped to a single block/editor but to the entire shared workspace, status indicators should only be rendered at the global workspace layout level.
4. **Consistency:** Keeping state handling at the root `App.tsx` prevents potential visual glitches where a package might report "saved" while the backing sync queue is still offline or executing client retries.

---

## 6. Recommendations & Best Practices

- **Keep Centralized Strategy:** Continue using the `AppLayout` shell and `App` header indicators for all main views. Do not implement local indicators in individual sub-packages.
- **Consolidate Conflict UI:** `App.tsx` renders a floating bottom-right `Sync Conflict` banner, while `AppLayout.tsx` simultaneously overlays an inset `Version Divergence Detected` modal. Consider consolidating these into a single beautiful layout modal (preferably the modal inside `AppLayout.tsx` as it includes direct CTA controls for "Keep Local" / "Accept Remote").
- **Retain Accessible Tooltips:** Ensure the screen-reader and hovering user experience remains complete by keeping `title` attributes on icons up to date, which also act as light-weight tooltip elements.
