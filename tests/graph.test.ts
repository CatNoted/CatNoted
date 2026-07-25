import { describe, it, expect } from 'vitest';
import { parseDocumentGraph } from '@catnoted/graph';
import { BlockNode } from '@catnoted/shared';

describe('Graph Parser (parseDocumentGraph)', () => {
  it('should parse simple blocks into root node', () => {
    const blocks: BlockNode[] = [
      { id: 'b1', type: 'text', content: 'Hello', parentId: 'root-doc-node' }
    ];

    const { nodes, edges } = parseDocumentGraph(blocks);
    expect(nodes.find(n => n.id === 'root-doc-node')).toBeDefined();
    expect(edges).toHaveLength(0);
  });

  it('should parse page links into nodes and edges', () => {
    const blocks: BlockNode[] = [
      { id: 'b1', type: 'text', content: 'Check out [[Page 2]]', parentId: 'root-doc-node' }
    ];

    const { nodes, edges } = parseDocumentGraph(blocks);

    const targetNode = nodes.find(n => n.id === 'page-page-2');
    expect(targetNode).toBeDefined();
    expect(targetNode?.label).toBe('📄 Page 2 (1)');

    expect(edges).toHaveLength(1);
    expect(edges[0].source).toBe('root-doc-node');
    expect(edges[0].target).toBe('page-page-2');
    expect(edges[0].type).toBe('link');
  });

  it('should parse tags into nodes and edges', () => {
    const blocks: BlockNode[] = [
      { id: 'b1', type: 'text', content: 'Important #urgent', parentId: 'root-doc-node' }
    ];

    const { nodes, edges } = parseDocumentGraph(blocks);

    const targetNode = nodes.find(n => n.id === 'tag-urgent');
    expect(targetNode).toBeDefined();
    expect(targetNode?.label).toBe('# urgent (1)');

    expect(edges).toHaveLength(1);
    expect(edges[0].source).toBe('root-doc-node');
    expect(edges[0].target).toBe('tag-urgent');
    expect(edges[0].type).toBe('tag');
  });

  it('should handle sub-pages and cross-linking', () => {
    const blocks: BlockNode[] = [
      { id: 'b1', type: 'text', content: 'Content', parentId: 'page-subpage' },
      { id: 'b2', type: 'text', content: 'Link to [[Another Page]]', parentId: 'page-subpage' }
    ];

    const { nodes, edges } = parseDocumentGraph(blocks);

    expect(nodes.find(n => n.id === 'page-subpage')).toBeDefined();
    expect(nodes.find(n => n.id === 'page-another-page')).toBeDefined();

    expect(edges).toHaveLength(1);
    expect(edges[0].source).toBe('page-subpage');
    expect(edges[0].target).toBe('page-another-page');
  });
});
