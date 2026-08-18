💡 What:
- Fixed `flex` truncation anti-patterns in `BookmarkBlock.tsx` and `SlashCommandMenu.tsx` by setting the inner wrapper to `flex-col` so that the `truncate` class on the text nodes behaves correctly.
- Added `hover:text-white` to the destructive button in `PageHeader.tsx` to maintain contrast when hovered on a dark overlay.
- Added safety check to `.filter` in `deduplicateYBlocks` (in `store.ts`) to prevent React duplicate renders from undefined blocks without breaking existing array reference logic.

🎯 Why:
- To correct layout overflows where text breaks container bounds instead of gracefully truncating.
- To prevent WCAG contrast failures in light mode.
- To prevent CRDT observer noise from crashing React rendering sequences.

📊 Before/After:
Before, bookmark and command palette descriptions overflowed container boundaries. Hovering the remove cover button lost readability. After, they properly shrink, truncate, and preserve readability.

♿ Accessibility:
Maintains contrast ratios for destructive actions and structural integrity for textual elements.
