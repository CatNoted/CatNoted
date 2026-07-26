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
      icon: '📁',
    });
    expect(result.edges).toHaveLength(0);
  });

  it('should parse page custom metadata when provided', () => {
    const blocks: BlockNode[] = [
      {
        id: 'b1',
        type: 'text',
        content: 'Check out [[System Design]] for details.',
      },
    ];
    const pages = [
      {
        id: 'root-doc-node',
        title: 'Custom Root Title',
        icon: 'lucide:Sparkles',
      },
      {
        id: 'page-system-design',
        title: 'System Design Spec',
        icon: 'lucide:Heart',
      }
    ];

    const result = parseDocumentGraph(blocks, pages);
    expect(result.nodes).toHaveLength(2);

    const rootNode = result.nodes.find(n => n.id === 'root-doc-node');
    expect(rootNode?.label).toBe('✨ Custom Root Title');
    expect(rootNode?.rawName).toBe('Custom Root Title');

    const pageNode = result.nodes.find(n => n.id === 'page-system-design');
    expect(pageNode?.label).toBe('❤️ System Design Spec (1)');
    expect(pageNode?.icon).toBe('lucide:Heart');
  });

  it('should derive root document title from level-1 heading block if page metadata is absent', () => {
    const blocks: BlockNode[] = [
      {
        id: 'b1',
        type: 'heading',
        content: 'My Awesome Root Document Title',
        properties: { level: 1 },
      },
      {
        id: 'b2',
        type: 'text',
        content: 'Check out [[System Design]] for details.',
        parentId: 'root-doc-node',
      },
    ];

    const result = parseDocumentGraph(blocks);
    const rootNode = result.nodes.find(n => n.id === 'root-doc-node');
    expect(rootNode?.label).toBe('📁 My Awesome Root Document Title');
    expect(rootNode?.rawName).toBe('My Awesome Root Document Title');
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

  it('should support alias wiki-links and map to normalized target page', () => {
    const blocks: BlockNode[] = [
      {
        id: 'b1',
        type: 'text',
        content: 'Check out [[System Design|Our Design Specs]] or [[System Design|Alternative Design]]',
      },
    ];

    const result = parseDocumentGraph(blocks);
    expect(result.nodes).toHaveLength(2); // root + page-system-design
    const pageNode = result.nodes.find((n) => n.id === 'page-system-design');
    expect(pageNode).toBeDefined();
    expect(pageNode?.label).toBe('📄 System Design (1)'); // Since they link to the same page, only counted once per block!
  });

  it('should normalize multiword and dashed page names in wiki-links', () => {
    const blocks: BlockNode[] = [
      {
        id: 'b1',
        type: 'text',
        content: 'Links with [[system-design]] and [[system    design_spec]]',
      },
    ];

    const result = parseDocumentGraph(blocks);
    expect(result.nodes).toHaveLength(3); // root + page-system-design + page-system-design-spec
    const designNode = result.nodes.find((n) => n.id === 'page-system-design');
    expect(designNode?.label).toBe('📄 System Design (1)');

    const specNode = result.nodes.find((n) => n.id === 'page-system-design-spec');
    expect(specNode?.label).toBe('📄 System Design Spec (1)');
  });

  it('should avoid duplicate edges or counts from nested brackets', () => {
    const blocks: BlockNode[] = [
      {
        id: 'b1',
        type: 'text',
        content: 'Let us try [[nested [[link]]]] in text.',
      },
    ];

    const result = parseDocumentGraph(blocks);
    expect(result.nodes).toHaveLength(2); // root + page-link
    const linkNode = result.nodes.find((n) => n.id === 'page-link');
    expect(linkNode?.label).toBe('📄 Link (1)');
    expect(result.edges).toHaveLength(1);
    expect(result.edges[0].target).toBe('page-link');
  });

  it('should skip self-references to avoid self-loop edges', () => {
    const blocks: BlockNode[] = [
      {
        id: 'b1',
        parentId: 'page-system-design',
        type: 'text',
        content: 'Linking [[System Design]] inside itself.',
      },
    ];

    const result = parseDocumentGraph(blocks);
    expect(result.nodes).toHaveLength(2); // page-system-design + root (defaulted)
    expect(result.edges).toHaveLength(0); // no self loops!
  });

});
