import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDocumentStore, yblocks } from '@catnoted/editor';

describe('Editor Store (useDocumentStore)', () => {
  beforeEach(() => {
    yblocks.delete(0, yblocks.length);
  });

  it('should initialize empty state correctly and allow adding blocks', () => {
    const { result } = renderHook(() => useDocumentStore('root-doc-node'));

    expect(result.current.blocks).toHaveLength(0);

    let newBlockId: string;
    act(() => {
      newBlockId = result.current.addBlock(null, 'text', 'Hello World');
    });

    expect(result.current.blocks).toHaveLength(1);
    expect(result.current.blocks[0].content).toBe('Hello World');
    expect(result.current.blocks[0].type).toBe('text');

    act(() => {
      result.current.updateBlockContent(newBlockId, 'Updated Text');
    });

    expect(result.current.blocks[0].content).toBe('Updated Text');

    act(() => {
      result.current.updateBlockType(newBlockId, 'heading', { level: 2 });
    });

    expect(result.current.blocks[0].type).toBe('heading');
    expect(result.current.blocks[0].properties).toEqual({ level: 2 });

    act(() => {
      result.current.deleteBlock(newBlockId);
    });

    expect(result.current.blocks).toHaveLength(0);
  });
});
