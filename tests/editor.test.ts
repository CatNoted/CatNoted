import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { createRoot } from 'react-dom/client';
import React from 'react';
import { useDocumentStore, yblocks, ypages, DocumentEditor } from '@catnoted/editor';

describe('Editor Store (useDocumentStore)', () => {
  beforeEach(() => {
    yblocks.delete(0, yblocks.length);
    ypages.clear();
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

  it('should deduplicate duplicate blocks by ID and robustly delete/update them', () => {
    // Manually insert duplicate block IDs into yblocks
    act(() => {
      yblocks.insert(0, [
        {
          id: 'dup-block-id',
          type: 'text',
          content: 'I am duplicate 1',
          parentId: 'root-doc-node'
        },
        {
          id: 'dup-block-id',
          type: 'text',
          content: 'I am duplicate 2',
          parentId: 'root-doc-node'
        }
      ]);
    });

    const { result } = renderHook(() => useDocumentStore('root-doc-node'));

    // Should only show 1 block due to deduplication in React state
    expect(result.current.blocks).toHaveLength(1);
    expect(result.current.blocks[0].id).toBe('dup-block-id');

    // Updating duplicate blocks should update all instances in CRDT
    act(() => {
      result.current.updateBlockContent('dup-block-id', 'I am updated!');
    });

    // Both instances in yblocks should be updated
    const allCrdtBlocks = yblocks.toArray();
    const matches = allCrdtBlocks.filter(b => b.id === 'dup-block-id');
    expect(matches).toHaveLength(2);
    expect(matches[0].content).toBe('I am updated!');
    expect(matches[1].content).toBe('I am updated!');

    // Deleting the block should delete all matching instances
    act(() => {
      result.current.deleteBlock('dup-block-id');
    });

    expect(result.current.blocks).toHaveLength(0);
    expect(yblocks.toArray().filter(b => b.id === 'dup-block-id')).toHaveLength(0);
  });

  it('should render the backlinks list and counts correctly for referenced pages', async () => {
    // 1. Setup page metadata in ypages Map
    act(() => {
      ypages.set('page-target-page', {
        id: 'page-target-page',
        title: 'Target Page',
        icon: '🎯',
        fontStyle: 'sans',
        fullWidth: false,
        isFavorite: false,
        createdAt: Date.now()
      });
      ypages.set('page-source', {
        id: 'page-source',
        title: 'Source Page',
        icon: '📄',
        fontStyle: 'sans',
        fullWidth: false,
        isFavorite: false,
        createdAt: Date.now()
      });
    });

    // 2. Setup blocks in yblocks Array
    act(() => {
      yblocks.insert(0, [
        {
          id: 'block-source-1',
          type: 'text',
          content: 'This links to [[Target Page]]',
          parentId: 'page-source'
        },
        {
          id: 'block-target-1',
          type: 'heading',
          properties: { level: 1 },
          content: 'Target Page',
          parentId: 'page-target-page'
        }
      ]);
    });

    const container = document.createElement('div');
    document.body.appendChild(container);

    await act(async () => {
      const root = createRoot(container);
      root.render(
        React.createElement(DocumentEditor, { activePage: 'page-target-page' })
      );
      // Wait for effects and states to settle
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    // 3. Verify that the Backlinks section is rendered with correct count and details
    expect(container.textContent).toContain('1 Backlinks');
    expect(container.textContent).toContain('Source Page');
    expect(container.textContent).toContain('This links to [[Target Page]]');

    document.body.removeChild(container);
  });
});
