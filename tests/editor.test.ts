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

    // Duplicate blocks should be immediately deduplicated inside yblocks CRDT as well!
    const allCrdtBlocks = yblocks.toArray();
    const matches = allCrdtBlocks.filter(b => b.id === 'dup-block-id');
    expect(matches).toHaveLength(1);
    expect(matches[0].content).toBe('I am duplicate 1'); // Keeps the first occurrence

    // Should only show 1 block due to deduplication in React state
    expect(result.current.blocks).toHaveLength(1);
    expect(result.current.blocks[0].id).toBe('dup-block-id');

    // Updating duplicate blocks should work fine
    act(() => {
      result.current.updateBlockContent('dup-block-id', 'I am updated!');
    });

    expect(yblocks.toArray().filter(b => b.id === 'dup-block-id')[0].content).toBe('I am updated!');

    // Deleting the block should delete all matching instances
    act(() => {
      result.current.deleteBlock('dup-block-id');
    });

    expect(result.current.blocks).toHaveLength(0);
    expect(yblocks.toArray().filter(b => b.id === 'dup-block-id')).toHaveLength(0);
  });

  it('should support soft-delete, restore, and permanent deletion of pages and blocks under a transaction', () => {
    // 1. Setup page metadata in ypages Map
    act(() => {
      ypages.set('page-test', {
        id: 'page-test',
        title: 'Test Page',
        icon: '📄',
        fontStyle: 'sans',
        fullWidth: false,
        isFavorite: true,
        createdAt: Date.now(),
        isDeleted: false
      });
    });

    // 2. Setup blocks in yblocks Array
    act(() => {
      yblocks.insert(0, [
        {
          id: 'block-test-1',
          type: 'text',
          content: 'Some page block content',
          parentId: 'page-test'
        }
      ]);
    });

    const { result } = renderHook(() => useDocumentStore('page-test'));

    // Soft-delete page
    act(() => {
      result.current.deletePage('page-test');
    });

    // The page metadata is marked deleted and favorite is cleared
    const softDeletedPage = ypages.get('page-test');
    expect(softDeletedPage?.isDeleted).toBe(true);
    expect(softDeletedPage?.isFavorite).toBe(false);

    // The pages state returned from useDocumentStore excludes deleted pages
    expect(result.current.pages.find(p => p.id === 'page-test')).toBeUndefined();
    // Exposes deletedPages
    expect(result.current.deletedPages.find(p => p.id === 'page-test')).toBeDefined();

    // Restore page
    act(() => {
      result.current.restorePage('page-test');
    });

    const restoredPage = ypages.get('page-test');
    expect(restoredPage?.isDeleted).toBe(false);
    expect(result.current.pages.find(p => p.id === 'page-test')).toBeDefined();

    // Permanent delete page
    act(() => {
      result.current.permanentlyDeletePage('page-test');
    });

    expect(ypages.get('page-test')).toBeUndefined();
    // Associated blocks should be purged from yblocks
    expect(yblocks.toArray().filter(b => b.parentId === 'page-test')).toHaveLength(0);
  });

  it('should consistently update block parent IDs and wiki-link references case-insensitively on renamePage', () => {
    // 1. Setup page metadata in ypages Map
    act(() => {
      ypages.set('page-old-title', {
        id: 'page-old-title',
        title: 'Old Title',
        icon: '📄',
        fontStyle: 'sans',
        fullWidth: false,
        isFavorite: false,
        createdAt: Date.now(),
        isDeleted: false
      });
    });

    // 2. Setup blocks in yblocks Array
    act(() => {
      yblocks.insert(0, [
        {
          id: 'block-to-move',
          type: 'text',
          content: 'This block is inside Old Title',
          parentId: 'page-old-title'
        },
        {
          id: 'block-with-link',
          type: 'text',
          content: 'Check [[Old Title]] and [[old title]] references.',
          parentId: 'root-doc-node'
        }
      ]);
    });

    const { result } = renderHook(() => useDocumentStore('page-old-title'));

    let newPageId: string;
    act(() => {
      newPageId = result.current.renamePage('page-old-title', 'New Title');
    });

    expect(newPageId).toBe('page-new-title');

    // Page entry should be renamed in ypages Map: old key deleted, new key added
    expect(ypages.get('page-old-title')).toBeUndefined();
    const newPageMeta = ypages.get('page-new-title');
    expect(newPageMeta).toBeDefined();
    expect(newPageMeta?.title).toBe('New Title');

    // All blocks belonging to old page should have parentId updated to page-new-title
    const movedBlock = yblocks.toArray().find(b => b.id === 'block-to-move');
    expect(movedBlock?.parentId).toBe('page-new-title');

    // All matching wiki-links (case-insensitive) should be replaced with New Title
    const linkedBlock = yblocks.toArray().find(b => b.id === 'block-with-link');
    expect(linkedBlock?.content).toBe('Check [[New Title]] and [[New Title]] references.');
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
