import { describe, it, expect, beforeEach } from 'vitest';
import { ydoc } from '@catnoted/editor';
import { ycanvas } from '../components/InfiniteCanvas.js';
import { CanvasElement } from '@catnoted/shared';

describe('Whitebox Test: Canvas Element Store & Yjs CRDT Invariants', () => {
  beforeEach(() => {
    // Clear ycanvas map for isolation
    ydoc.transact(() => {
      Array.from(ycanvas.keys()).forEach(key => {
        ycanvas.delete(key);
      });
    });
  });

  it('should insert cards and shape elements correctly', () => {
    ydoc.transact(() => {
      ycanvas.set('test-card-1', {
        id: 'test-card-1',
        type: 'card',
        x: 100,
        y: 100,
        width: 240,
        height: 120,
        zIndex: 10,
        rotation: 0,
        blockId: 'block-init-1',
      });

      ycanvas.set('test-shape-1', {
        id: 'test-shape-1',
        type: 'shape',
        shapeType: 'circle',
        x: 400,
        y: 200,
        width: 150,
        height: 150,
        zIndex: 10,
        rotation: 0,
        color: '#FEF08A',
        text: 'Hello Circle',
      });
    });

    expect(ycanvas.size).toBe(2);

    const card = ycanvas.get('test-card-1');
    expect(card).toBeDefined();
    expect(card?.type).toBe('card');
    expect(card?.blockId).toBe('block-init-1');

    const shape = ycanvas.get('test-shape-1');
    expect(shape).toBeDefined();
    expect(shape?.type).toBe('shape');
    expect(shape?.shapeType).toBe('circle');
    expect(shape?.text).toBe('Hello Circle');
  });

  it('should support updating properties (rotation, color, shapeType, text)', () => {
    ydoc.transact(() => {
      ycanvas.set('test-shape-2', {
        id: 'test-shape-2',
        type: 'shape',
        shapeType: 'rectangle',
        x: 150,
        y: 150,
        width: 150,
        height: 150,
        zIndex: 10,
        rotation: 0,
        color: '#FFFFFF',
        text: 'Initial Text',
      });
    });

    const initial = ycanvas.get('test-shape-2')!;
    expect(initial.text).toBe('Initial Text');

    // Perform updates
    ydoc.transact(() => {
      ycanvas.set('test-shape-2', {
        ...initial,
        shapeType: 'star',
        rotation: 45,
        color: '#FFE4E6',
        text: 'Updated Text',
      });
    });

    const updated = ycanvas.get('test-shape-2')!;
    expect(updated.shapeType).toBe('star');
    expect(updated.rotation).toBe(45);
    expect(updated.color).toBe('#FFE4E6');
    expect(updated.text).toBe('Updated Text');
  });

  it('should support deleting shapes and cards', () => {
    ydoc.transact(() => {
      ycanvas.set('test-shape-3', {
        id: 'test-shape-3',
        type: 'shape',
        shapeType: 'triangle',
        x: 200,
        y: 200,
        width: 100,
        height: 100,
        zIndex: 10,
        rotation: 0,
      });
    });

    expect(ycanvas.has('test-shape-3')).toBe(true);

    ydoc.transact(() => {
      ycanvas.delete('test-shape-3');
    });

    expect(ycanvas.has('test-shape-3')).toBe(false);
    expect(ycanvas.size).toBe(0);
  });
});
