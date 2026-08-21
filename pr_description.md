💡 What:
- Standardized interactive focus rings by replacing `focus-visible:ring-accent` with `focus-visible:ring-border` across `SettingsModal.tsx`, `Sidebar.tsx`, `AuthModal.tsx`, `App.tsx`, `BlockRow.tsx`, `KanbanBlock.tsx`, `DocumentEditor.tsx`, and `PageHeader.tsx`.
- Standardized arbitrary token combinations by replacing `border-accent` with `border-border` in `App.tsx`.
- Fixed a WCAG contrast bug on hardcoded dark backgrounds in `PageHeader.tsx` by converting `hover:text-destructive-foreground` to `hover:text-white`.

🎯 Why:
- To adhere to the semantic design system where `--accent` is exclusively reserved for soft hover backgrounds.
- To prevent focus rings and borders from showing poor contrast or failing visual expectations in light/dark theme toggles.
- To guarantee readable hover text over hardcoded alpha-black UI overlays (`bg-black/60`).

📊 Before/After:
Before, navigating the UI via keyboard flashed hue-shifted focus rings, and hovering the page header's delete icon produced unreadable red text against a dark background. After, all interactive inputs use standard scalable borders for focus rings, and hover affordances maintain high native contrast.

♿ Accessibility:
Resolves multiple WCAG contrast failures in focus states for screen reader and keyboard navigators.
