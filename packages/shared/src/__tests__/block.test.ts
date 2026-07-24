import { describe, it, expect } from 'vitest';
import { BlockNode, BlockType, CanvasElement, GraphNode, GraphEdge, WidgetSpec, AgentMessage } from '../index';

describe('Whitebox Test: @catnoted/shared Data Structures & Schemas', () => {
  it('should instantiate a valid BlockNode object with all property fields', () => {
    const block: BlockNode = {
      id: 'block-101',
      type: 'heading',
      content: 'Arquitetura CatNoted',
      properties: {
        level: 1,
        customMeta: 'vfs-root',
      },
      children: ['block-102', 'block-103'],
      parentId: null,
    };

    expect(block.id).toBe('block-101');
    expect(block.type).toBe('heading');
    expect(block.properties?.level).toBe(1);
    expect(block.children).toHaveLength(2);
    expect(block.parentId).toBeNull();
  });

  it('should support all specified BlockTypes', () => {
    const validTypes: BlockType[] = [
      'text', 'heading', 'list', 'image', 'widget',
      'bullet', 'ordered', 'todo', 'quote', 'code', 'divider'
    ];

    validTypes.forEach((type) => {
      const b: BlockNode = { id: `id-${type}`, type, content: `Sample ${type}` };
      expect(b.type).toBe(type);
    });
  });

  it('should instantiate CanvasElement and validate connector specs', () => {
    const element: CanvasElement = {
      id: 'card-1',
      type: 'card',
      x: 150,
      y: 300,
      width: 250,
      height: 180,
      zIndex: 2,
      rotation: 0,
      color: '#4f46e5',
      connector: {
        id: 'conn-1',
        from: 'card-1',
        to: 'card-2',
        type: 'bezier',
        label: 'depends_on',
      },
    };

    expect(element.type).toBe('card');
    expect(element.connector?.type).toBe('bezier');
    expect(element.connector?.label).toBe('depends_on');
  });

  it('should validate GraphNode and GraphEdge relationship structures', () => {
    const node: GraphNode = {
      id: 'page-catnoted',
      label: '📄 CatNoted Overview',
      type: 'page',
      val: 20,
    };

    const edge: GraphEdge = {
      id: 'edge-1',
      source: 'page-catnoted',
      target: 'tag-architecture',
      type: 'tag',
    };

    expect(node.type).toBe('page');
    expect(edge.source).toBe('page-catnoted');
    expect(edge.target).toBe('tag-architecture');
  });

  it('should validate WidgetSpec and AgentMessage schemas', () => {
    const spec: WidgetSpec = {
      id: 'widget-calc',
      srcDoc: '<html><body>Calculator</body></html>',
      state: { count: 42 },
      theme: 'dark',
    };

    const message: AgentMessage = {
      id: 'msg-1',
      type: 'widget_init',
      payload: spec,
      timestamp: 1784860000000,
    };

    expect(spec.theme).toBe('dark');
    expect(message.type).toBe('widget_init');
    expect(message.payload.id).toBe('widget-calc');
  });
});
