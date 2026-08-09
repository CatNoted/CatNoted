import { BlockNode, GraphNode, GraphEdge, PageMeta } from '@catnoted/shared';

const lucideToEmoji: Record<string, string> = {
  Sparkles: '✨',
  Heart: '❤️',
  Star: '⭐',
  Settings: '⚙️',
  FileText: '📄',
  Trash2: '🗑️',
  RefreshCw: '🔄',
  Image: '🖼️',
  Smile: '😊',
  Plus: '➕',
  Search: '🔍',
  Info: 'ℹ️',
  Download: '📥',
  Filter: '🔍',
  Check: '✔️',
};

function getDisplayIcon(iconStr: string | undefined): string {
  if (!iconStr) return '📄';
  if (iconStr.startsWith('lucide:')) {
    const name = iconStr.slice(7);
    return lucideToEmoji[name] || '✨';
  }
  return iconStr;
}

export function parseDocumentGraph(
  blocks: BlockNode[],
  pages?: PageMeta[],
  deletedPageIds?: Set<string>
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodesMap = new Map<string, Omit<GraphNode, 'label'> & { _rawName: string; count: number }>();
  const edges: GraphEdge[] = [];

  const rootId = 'root-doc-node';

  // Build a set of deleted page IDs from the pages metadata if any have isDeleted === true,
  // or merge with the provided deletedPageIds Set.
  const resolvedDeletedPageIds = new Set<string>(deletedPageIds);
  if (pages) {
    pages.forEach(p => {
      if (p.isDeleted) {
        resolvedDeletedPageIds.add(p.id);
      }
    });
  }

  // Determine root document title
  const rootPageMeta = pages?.find(p => p.id === rootId);
  let rootTitle = rootPageMeta?.title;
  if (!rootTitle) {
    const rootHeadingBlock = blocks.find(
      b => b.type === 'heading' && b.properties?.level === 1 && (!b.parentId || b.parentId === rootId)
    );
    rootTitle = rootHeadingBlock?.content || 'Untitled Note';
  }

  // Make sure we have a node for the root note
  if (!resolvedDeletedPageIds.has(rootId)) {
    nodesMap.set(rootId, {
      id: rootId,
      type: 'page',
      val: 20,
      _rawName: rootTitle,
      count: 0
    });
  }

  // Register all non-deleted pages from the pages metadata list to avoid overfiltering empty or unlinked pages.
  if (pages) {
    pages.forEach(p => {
      if (resolvedDeletedPageIds.has(p.id)) return;
      if (!nodesMap.has(p.id)) {
        nodesMap.set(p.id, {
          id: p.id,
          type: 'page',
          val: p.id === rootId ? 20 : 15,
          _rawName: p.title || p.id,
          count: 0
        });
      }
    });
  }

  const linkRegex = /\[\[(.*?)\]\]/g;
  const tagRegex = /#([a-zA-Z0-9_\-]+)/g;

  // First pass: register all pages that have blocks
  blocks.forEach(block => {
    const sourceId = block.parentId || rootId;
    if (resolvedDeletedPageIds.has(sourceId)) return; // Skip deleted page as source
    if (!nodesMap.has(sourceId)) {
      const pageName = sourceId.replace(/^page-/, '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      nodesMap.set(sourceId, {
        id: sourceId,
        type: 'page',
        val: 15,
        _rawName: pageName,
        count: 0
      });
    }
  });

  // Second pass: extract links and tags
  blocks.forEach(block => {
    const sourceId = block.parentId || rootId;
    if (resolvedDeletedPageIds.has(sourceId)) return; // Skip deleted page as source

    let linkMatch;
    linkRegex.lastIndex = 0;
    while ((linkMatch = linkRegex.exec(block.content)) !== null) {
      // Remove any internal brackets which shouldn't be part of page name
      const pageName = linkMatch[1].replace(/[\[\]]/g, '').trim();
      if (!pageName) continue;
      const nodeId = `page-${pageName.toLowerCase().replace(/\s+/g, '-')}`;
      if (resolvedDeletedPageIds.has(nodeId)) continue; // Skip deleted page as link target
      
      const existing = nodesMap.get(nodeId);
      if (existing) {
        existing.count++;
      } else {
        nodesMap.set(nodeId, {
          id: nodeId,
          type: 'page',
          val: 12,
          _rawName: pageName,
          count: 1
        });
      }

      const edgeId = `edge-${sourceId}-${nodeId}`;
      if (!edges.some(e => e.id === edgeId)) {
        edges.push({
          id: edgeId,
          source: sourceId,
          target: nodeId,
          type: 'link'
        });
      }
    }

    let tagMatch;
    tagRegex.lastIndex = 0;
    while ((tagMatch = tagRegex.exec(block.content)) !== null) {
      const tagName = tagMatch[1].trim();
      if (!tagName) continue;
      const nodeId = `tag-${tagName.toLowerCase()}`;

      const existing = nodesMap.get(nodeId);
      if (existing) {
        existing.count++;
      } else {
        nodesMap.set(nodeId, {
          id: nodeId,
          type: 'tag',
          val: 10,
          _rawName: tagName,
          count: 1
        });
      }

      const edgeId = `edge-${sourceId}-${nodeId}`;
      if (!edges.some(e => e.id === edgeId)) {
        edges.push({
          id: edgeId,
          source: sourceId,
          target: nodeId,
          type: 'tag'
        });
      }
    }
  });

  // ⚡ Bolt Optimization: Precompute Map of pages to avoid O(N) lookup repeatedly inside `.map()` array scan loop
  // Expected Impact: Eliminates O(N*M) time complexity bottleneck resulting in significantly faster graph compilation.
  const pagesMap = new Map(pages?.map(p => [p.id, p] as const) || []);

  const finalNodes: GraphNode[] = Array.from(nodesMap.values()).map(n => {
    if (n.id === rootId) {
      const rootPage = pagesMap.get(rootId);
      const rootIcon = getDisplayIcon(rootPage?.icon || '📁');
      return {
        id: n.id,
        label: `${rootIcon} ${n._rawName}`,
        type: n.type,
        val: n.val,
        rawName: n._rawName,
        icon: rootPage?.icon || '📁'
      };
    }
    const pageMeta = pagesMap.get(n.id);
    const rawTitle = pageMeta?.title || n._rawName;
    const pageIcon = pageMeta?.icon || '📄';
    const displayIcon = getDisplayIcon(pageIcon);
    const prefix = n.type === 'page' ? `${displayIcon} ` : '# ';
    // Backlink count included in label
    const label = `${prefix}${rawTitle} (${n.count})`;
    return {
      id: n.id,
      label,
      type: n.type,
      val: n.val,
      rawName: rawTitle,
      icon: pageIcon
    };
  });

  return {
    nodes: finalNodes,
    edges
  };
}
