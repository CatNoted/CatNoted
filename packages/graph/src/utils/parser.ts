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

export function normalizePageName(name: string): string {
  const cleaned = name.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
  return cleaned
    .split(' ')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function parseDocumentGraph(blocks: BlockNode[], pages?: PageMeta[]): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodesMap = new Map<string, Omit<GraphNode, 'label'> & { _rawName: string; count: number }>();
  const edges: GraphEdge[] = [];

  const rootId = 'root-doc-node';

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
  nodesMap.set(rootId, {
    id: rootId,
    type: 'page',
    val: 20,
    _rawName: rootTitle,
    count: 0
  });

  const linkRegex = /\[\[([^[\]]+)\]\]/g;
  const tagRegex = /#([a-zA-Z0-9_\-]+)/g;

  // First pass: register all pages that have blocks
  blocks.forEach(block => {
    const sourceId = block.parentId || rootId;
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

    let linkMatch;
    linkRegex.lastIndex = 0;
    const seenLinksInBlock = new Set<string>();

    while ((linkMatch = linkRegex.exec(block.content)) !== null) {
      // Separate target page from alias if pipe is present
      const rawLink = linkMatch[1].trim();
      if (!rawLink) continue;

      const targetPageRaw = rawLink.split('|')[0].trim();
      if (!targetPageRaw) continue;

      const normalizedName = normalizePageName(targetPageRaw);
      const nodeId = `page-${normalizedName.toLowerCase().replace(/\s+/g, '-')}`;

      // Skip self-references to avoid self-loop edges
      if (nodeId === sourceId) continue;

      // Avoid duplicate edges/counts from the same block for the same target
      if (seenLinksInBlock.has(nodeId)) continue;
      seenLinksInBlock.add(nodeId);

      const existing = nodesMap.get(nodeId);
      if (existing) {
        existing.count++;
      } else {
        nodesMap.set(nodeId, {
          id: nodeId,
          type: 'page',
          val: 12,
          _rawName: normalizedName,
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

  const finalNodes: GraphNode[] = Array.from(nodesMap.values()).map(n => {
    if (n.id === rootId) {
      const rootPage = pages?.find(p => p.id === rootId);
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
    const pageMeta = pages?.find(p => p.id === n.id);
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
