1. **Goal:** Identify and implement one performance optimization.
2. **Current Finding:** In `apps/web/src/App.tsx`, the variables `activeHeading` and `activePageNode` are calculated directly inside the component render body, leading to an $O(N)$ find operation on `activeBlocks` and `graphData.nodes` on every render.
3. **Plan:** Wrap `activeHeading` and `activePageNode` in `React.useMemo` to memoize the result.

```tsx
  // apps/web/src/App.tsx
<<<<<<< SEARCH
  const activeHeading = activeBlocks.find(b => b.type === 'heading' && b.properties?.level === 1);
  const docTitle = activeHeading?.content || 'Untitled Document';

  const activePageNode = graphData.nodes.find((n: any) => n.id === activePage);
=======
  const activeHeading = React.useMemo(
    () => activeBlocks.find(b => b.type === 'heading' && b.properties?.level === 1),
    [activeBlocks]
  );
  const docTitle = activeHeading?.content || 'Untitled Document';

  const activePageNode = React.useMemo(
    () => graphData.nodes.find((n: any) => n.id === activePage),
    [graphData.nodes, activePage]
  );
>>>>>>> REPLACE
```
