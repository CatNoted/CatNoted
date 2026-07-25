import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EmbedBlock } from '../EmbedBlock.js';
import { ydoc, ypages } from '../../store.js';
import * as Y from 'yjs';

// Get yblocks array
const yblocks = ydoc.getArray('blocks');

describe('EmbedBlock Component Tests', () => {
  beforeEach(async () => {
    // Clean up Yjs structures before each test
    ydoc.transact(() => {
      yblocks.delete(0, yblocks.length);
      ypages.clear();
    });
    await new Promise(resolve => setTimeout(resolve, 0));
  });

  it('renders selector when refPageId is not provided', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const onUpdateProps = vi.fn();
    const onDelete = vi.fn();

    // Setup mock pages
    ydoc.transact(() => {
      ypages.set('page-1', {
        id: 'page-1',
        title: 'Project Roadmap',
        icon: '🚀',
        createdAt: Date.now()
      });
      ypages.set('page-2', {
        id: 'page-2',
        title: 'Meeting Notes',
        icon: '📝',
        createdAt: Date.now()
      });
    });

    await act(async () => {
      const root = createRoot(container);
      root.render(
        <EmbedBlock
          id="block-embed"
          activePage="root-doc-node"
          onUpdateProps={onUpdateProps}
          onDelete={onDelete}
        />
      );
      // Let effects settle
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    // Check if the placeholder headers are displayed
    expect(container.textContent).toContain('Page Embed Reference');
    expect(container.textContent).toContain('Choose Page');

    // Simulate clicking "Choose Page"
    const button = container.querySelector('button');
    expect(button).not.toBeNull();

    await act(async () => {
      button?.click();
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    // It should render dropdown choices
    expect(container.textContent).toContain('Project Roadmap');
    expect(container.textContent).toContain('Meeting Notes');

    // Simulate clicking first item
    const options = container.querySelectorAll('button');
    // Search for option with text "Project Roadmap"
    let roadmapOption: HTMLButtonElement | null = null;
    options.forEach(opt => {
      if (opt.textContent?.includes('Project Roadmap')) {
        roadmapOption = opt as HTMLButtonElement;
      }
    });

    expect(roadmapOption).not.toBeNull();
    await act(async () => {
      roadmapOption?.click();
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    expect(onUpdateProps).toHaveBeenCalledWith({ refPageId: 'page-1' });

    document.body.removeChild(container);
  });

  it('renders target page heading and content blocks when refPageId is provided', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    // Setup page metadata
    ydoc.transact(() => {
      ypages.set('page-1', {
        id: 'page-1',
        title: 'Project Roadmap',
        icon: '🚀',
        createdAt: Date.now()
      });

      // Insert target page blocks
      yblocks.insert(0, [
        {
          id: 'b-h1',
          type: 'heading',
          content: 'Project Roadmap',
          properties: { level: 1 },
          parentId: 'page-1'
        },
        {
          id: 'b-t1',
          type: 'text',
          content: 'This is the main roadmap paragraph.',
          parentId: 'page-1'
        },
        {
          id: 'b-ul1',
          type: 'bullet',
          content: 'Milestone 1 completed',
          parentId: 'page-1'
        }
      ]);
    });

    await act(async () => {
      const root = createRoot(container);
      root.render(
        <EmbedBlock
          id="block-embed"
          refPageId="page-1"
          activePage="root-doc-node"
          onUpdateProps={vi.fn()}
          onDelete={vi.fn()}
        />
      );
      // Let effects settle
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    // Verify Title and Icons are rendered
    expect(container.textContent).toContain('🚀');
    expect(container.textContent).toContain('Project Roadmap');
    expect(container.textContent).toContain('Synced Block');

    // Verify content blocks are rendered (excluding the main heading H1 block)
    expect(container.textContent).toContain('This is the main roadmap paragraph.');
    expect(container.textContent).toContain('Milestone 1 completed');

    document.body.removeChild(container);
  });
});
