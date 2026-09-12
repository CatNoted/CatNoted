🎨 Palette: [UX improvement] Fix semantic contrast patterns and hover focus traps

**What:**
1. Replaced hardcoded semantic UI states containing combinations like `bg-danger-soft text-danger`, `hover:bg-danger-soft`, `bg-warning-soft`, and `bg-success-soft` across `AppLayout`, `Sidebar`, `AuthModal`, `SettingsModal`, `JournalsView`, and `App.tsx` with standard native semantic tokens mapping robustly across themes (`bg-muted text-destructive`, `text-success`, `hover:bg-muted text-destructive`, etc.).
2. Added `focus-visible:opacity-100` and `tabIndex={0}` to the bottom-left resize handle in `AppLayout` to prevent it from becoming an invisible focus trap via `opacity-0 hover:opacity-100` hiding.

**Why:**
1. Hardcoded semantic tokens containing `-soft` utility suffixes combined with semantic colors frequently bypass automatic CSS custom property resolution in `dark` themes, leading to contrast failures when theme swapping. Relying on default semantic pairs (like `bg-muted` and `text-foreground` or `text-destructive`) ensures mathematically sound scaling.
2. The resize handle in the bottom-left of the split view relied purely on `hover` mechanics, creating an invisible, non-navigable trap for assistive keyboard users. Adding `tabIndex` natively exposes it.

**Accessibility:**
Added `focus-visible` states to invisible hover elements and increased native WGAC contrast ratios by restoring semantic design variable scaling across structural UI components.

**Verification Checklist:**
- [x] `pnpm test` passed
- [x] `pnpm typecheck` passed
- [x] No `bg-danger-soft` or `bg-warning-soft` combinations remain.
