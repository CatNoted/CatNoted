💡 What:
1. Replaced the remaining `bg-accent-soft` and `text-accent` hardcoded semantic active/hover states with the standard `bg-muted text-foreground` in `AuthModal`, `JournalsView`, `AppLayout`, `CalloutBlock`, and `FloatingBubbleMenu`.
2. Removed `hover:text-destructive-foreground` on the cover action button that rests over a hardcoded `bg-black/60` dark overlay in `PageHeader`, replacing it with `text-white hover:bg-destructive text-white`.
3. Fixed `flex-col` + `flex-1 min-w-0` truncation anti-patterns in `AppLayout` and `KanbanBlock` by removing the `flex-1` constraint that was causing unwanted vertical stretching.

🎯 Why: To standardize active/selected UI affordances natively across both light and dark mode contexts, preventing WCAG contrast ratio violations and visual inconsistencies. Resolving `flex-col` layout bugs ensures content truncates correctly without breaking parent containers.

📊 Before/After: Before, buttons using `bg-accent-soft text-accent` frequently had low contrast, and `PageHeader` buttons disappeared on hover in light mode. Sidebar and Kanban lists stretched vertically incorrectly. After, semantic design tokens enforce perfect contrast naturally, and `flex-col` layouts collapse tightly.

♿ Accessibility: Native WCAG contrast preservation through proper semantic structural classes (like `bg-muted` and `text-white` on dark backgrounds).
💡 What:
- Fixed `flex` truncation anti-patterns in `BookmarkBlock.tsx` and `SlashCommandMenu.tsx` by setting the inner wrapper to `flex-col` so that the `truncate` class on the text nodes behaves correctly.
- Added `hover:text-white` to the destructive button in `PageHeader.tsx` to maintain contrast when hovered on a dark overlay.
- Added safety check to `.filter` in `deduplicateYBlocks` (in `store.ts` and `DocumentEditor.tsx`) to prevent React duplicate renders from undefined blocks without breaking existing array reference logic.

🎯 Why:
- To correct layout overflows where text breaks container bounds instead of gracefully truncating.
- To prevent WCAG contrast failures in light mode.
- To prevent CRDT observer noise from crashing React rendering sequences.

📊 Before/After:
Before, bookmark and command palette descriptions overflowed container boundaries. Hovering the remove cover button lost readability. After, they properly shrink, truncate, and preserve readability.

♿ Accessibility:
Maintains contrast ratios for destructive actions and structural integrity for textual elements.
