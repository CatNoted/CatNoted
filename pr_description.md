1. **Fix layout break**: Removed `flex-1 min-w-0` from the text node in `DocumentEditor.tsx` inside a `flex-col` container to fix vertical stretching and correctly apply truncation.
2. **Performance optimization**: Combined multiple `O(N)` filtering passes over `Object.values(elements)` in `InfiniteCanvas.tsx` into a single `useMemo` block, improving render performance.
3. **Contrast and semantic fixes**: Replaced hardcoded `*-soft` tokens (`bg-warning-soft`, `bg-success-soft`, `bg-danger-soft`) in `GenericShape`, `FloatingBubbleMenu`, `CalloutBlock`, and `Toast` with standard semantic colors (e.g., `bg-muted` and tinted borders like `border-success/30`) to fix contrast and dark mode inconsistencies.
4. Updated tests to match the new container classes.

- [x] No `*-soft` token combinations remain in interactive components.
- [x] Verified by running `pnpm typecheck` and `pnpm test`.
