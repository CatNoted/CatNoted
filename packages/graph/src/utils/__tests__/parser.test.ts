import { describe, it, expect } from 'vitest';
import { parseDocumentGraph } from '../parser.js';
import { BlockNode } from '@catnoted/shared';

describe('Whitebox Test: parseDocumentGraph (Graph Parsing Logic)', () => {
  it('should create root document node by default', () => {
    const blocks: BlockNode[] = [];
    const result = parseDocumentGraph(blocks);

    expect(result.nodes).toHaveLength(1);
    expect(result.nodes[0]).toEqual({
      id: 'root-doc-node',
      label: '📁 Untitled Note',
      rawName: 'Untitled Note',
      type: 'page',
      val: 20,
    });
    expect(result.edges).toHaveLength(0);
  });

  it('should parse single wiki-link [[Target Page]] correctly', () => {
    const blocks: BlockNode[] = [
      {
        id: 'b1',
        type: 'text',
        content: 'Check out [[System Design]] for details.',
      },
    ];

    const result = parseDocumentGraph(blocks);
    expect(result.nodes).toHaveLength(2); // root + page-system-design
    const pageNode = result.nodes.find((n) => n.id === 'page-system-design');
    expect(pageNode).toBeDefined();
    expect(pageNode?.label).toBe('📄 System Design (1)');

    expect(result.edges).toHaveLength(1);
    expect(result.edges[0]).toEqual({
      id: 'edge-root-doc-node-page-system-design',
      source: 'root-doc-node',
      target: 'page-system-design',
      type: 'link',
    });
  });

  it('should parse multiple wiki-links and hashtags in same and separate blocks', () => {
    const blocks: BlockNode[] = [
      {
        id: 'b1',
        type: 'text',
        content: 'Refer to [[Project Roadmap]] and #architecture in our sprint.',
      },
      {
        id: 'b2',
        type: 'text',
        content: 'Also see [[System Design]] and #frontend tag.',
      },
    ];

    const result = parseDocumentGraph(blocks);
    const nodeIds = result.nodes.map((n) => n.id);

    expect(nodeIds).toContain('root-doc-node');
    expect(nodeIds).toContain('page-project-roadmap');
    expect(nodeIds).toContain('page-system-design');
    expect(nodeIds).toContain('tag-architecture');
    expect(nodeIds).toContain('tag-frontend');

    expect(result.edges.length).toBe(4);
  });

  it('should deduplicate repeated links and tags across blocks but accumulate count', () => {
    const blocks: BlockNode[] = [
      {
        id: 'b1',
        type: 'text',
        content: 'Link [[Architecture]] and tag #important.',
      },
      {
        id: 'b2',
        type: 'text',
        content: 'Duplicate [[Architecture]] and repeated #important.',
      },
    ];

    const result = parseDocumentGraph(blocks);

    // Root + 1 page node + 1 tag node = 3 total nodes
    expect(result.nodes).toHaveLength(3);
    // 1 link edge + 1 tag edge = 2 total edges
    expect(result.edges).toHaveLength(2);

    const archNode = result.nodes.find(n => n.id === 'page-architecture');
    expect(archNode?.label).toBe('📄 Architecture (2)');

    const impNode = result.nodes.find(n => n.id === 'tag-important');
    expect(impNode?.label).toBe('# important (2)');
  });

  it('should handle empty or whitespace-only wiki-links safely', () => {
    const blocks: BlockNode[] = [
      {
        id: 'b1',
        type: 'text',
        content: 'Invalid empty [[  ]] link test with completely empty [[]].',
      },
      {
        id: 'b2',
        type: 'text',
        content: 'Tabs and newlines [[\n\t\r]] and multiple [[ ]] [[   ]] and nested/malformed [[[ ]]] or [[ ] or [[',
      }
    ];

    const result = parseDocumentGraph(blocks);
    expect(result.nodes).toHaveLength(1); // root node only
    expect(result.edges).toHaveLength(0);
  });

});
