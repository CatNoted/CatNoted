import { describe, it, expect, beforeEach } from 'vitest';
import { yblocks, ydoc } from '../store.js';
import { BlockNode } from '@catnoted/shared';

describe('Whitebox Test: Editor Block Store & Yjs CRDT Invariants', () => {
  beforeEach(() => {
    // Clear yblocks array for isolation
    ydoc.transact(() => {
      yblocks.delete(0, yblocks.length);
    });
  });

  it('should insert initial blocks into Yjs array correctly', () => {
    ydoc.transact(() => {
      yblocks.insert(0, [
        { id: 'b1', type: 'heading', content: 'Doc Title', properties: { level: 1 } },
        { id: 'b2', type: 'text', content: 'First paragraph' },
      ]);
    });

    expect(yblocks.length).toBe(2);
    expect(yblocks.get(0).content).toBe('Doc Title');
    expect(yblocks.get(1).type).toBe('text');
  });

  it('should update block content via CRDT transaction', () => {
    ydoc.transact(() => {
      yblocks.insert(0, [{ id: 'b1', type: 'text', content: 'Original text' }]);
    });

    ydoc.transact(() => {
      const current = yblocks.get(0);
      const updated: BlockNode = { ...current, content: 'Updated content' };
      yblocks.delete(0, 1);
      yblocks.insert(0, [updated]);
    });

    expect(yblocks.get(0).content).toBe('Updated content');
  });

  it('should update block type and properties (text -> heading h2)', () => {
    ydoc.transact(() => {
      yblocks.insert(0, [{ id: 'b1', type: 'text', content: 'Section Header' }]);
    });

    ydoc.transact(() => {
      const current = yblocks.get(0);
      const updated: BlockNode = {
        ...current,
        type: 'heading',
        properties: { level: 2 },
      };
      yblocks.delete(0, 1);
      yblocks.insert(0, [updated]);
    });

    expect(yblocks.get(0).type).toBe('heading');
    expect(yblocks.get(0).properties?.level).toBe(2);
  });

  it('should delete blocks by index maintaining array structure', () => {
    ydoc.transact(() => {
      yblocks.insert(0, [
        { id: 'b1', type: 'text', content: 'Block 1' },
        { id: 'b2', type: 'text', content: 'Block 2' },
        { id: 'b3', type: 'text', content: 'Block 3' },
      ]);
    });

    expect(yblocks.length).toBe(3);

    ydoc.transact(() => {
      yblocks.delete(1, 1); // Delete block 2
    });

    expect(yblocks.length).toBe(2);
    expect(yblocks.get(0).id).toBe('b1');
    expect(yblocks.get(1).id).toBe('b3');
  });
});
