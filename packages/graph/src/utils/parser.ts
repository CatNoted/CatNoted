import { BlockNode, GraphNode, GraphEdge } from '@catnoted/shared';

export function parseDocumentGraph(blocks: BlockNode[]): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodesMap = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];

  const rootId = 'root-doc-node';

  // Make sure we have a node for the root note
  nodesMap.set(rootId, {
    id: rootId,
    label: '📁 Untitled Note',
    type: 'page',
    val: 20
  });

  const linkRegex = /\[\[(.*?)\]\]/g;
  const tagRegex = /#([a-zA-Z0-9_\-]+)/g;

  // First pass: register all pages that have blocks
  blocks.forEach(block => {
    const sourceId = block.parentId || rootId;
    if (!nodesMap.has(sourceId)) {
      const pageName = sourceId.replace(/^page-/, '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      nodesMap.set(sourceId, {
        id: sourceId,
        label: `📄 ${pageName}`,
        type: 'page',
        val: 15
      });
    }
  });

  // Second pass: extract links and tags
  blocks.forEach(block => {
    const sourceId = block.parentId || rootId;

    let linkMatch;
    // Reset index to avoid sticky states on global regex
    linkRegex.lastIndex = 0;
    while ((linkMatch = linkRegex.exec(block.content)) !== null) {
      // Remove any internal brackets which shouldn't be part of page name
      const pageName = linkMatch[1].replace(/[\[\]]/g, '').trim();
      if (!pageName) continue;
      const nodeId = `page-${pageName.toLowerCase().replace(/\s+/g, '-')}`;
      
      if (!nodesMap.has(nodeId)) {
        nodesMap.set(nodeId, {
          id: nodeId,
          label: `📄 ${pageName}`,
          type: 'page',
          val: 12
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

      if (!nodesMap.has(nodeId)) {
        nodesMap.set(nodeId, {
          id: nodeId,
          label: `#${tagName}`,
          type: 'tag',
          val: 10
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

  return {
    nodes: Array.from(nodesMap.values()),
    edges
  };
}
