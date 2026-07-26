import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
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
    await new Promise(resolve => setTimeout(resolve, 10));
  });

  afterEach(() => {
    cleanup();
  });

  it('renders selector when refPageId is not provided', async () => {
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

    let view: any;
    await act(async () => {
      view = render(
        <EmbedBlock
          id="block-embed"
          activePage="root-doc-node"
          onUpdateProps={onUpdateProps}
          onDelete={onDelete}
        />
      );
      // Let effects settle
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    // Check if the placeholder headers are displayed
    expect(view.container.textContent).toContain('Page Embed Reference');
    expect(view.container.textContent).toContain('Choose Page');

    // Simulate clicking "Choose Page"
    const button = view.container.querySelector('button');
    expect(button).not.toBeNull();

    await act(async () => {
      button?.click();
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    // It should render dropdown choices
    expect(view.container.textContent).toContain('Project Roadmap');
    expect(view.container.textContent).toContain('Meeting Notes');

    // Simulate clicking first item
    const options = view.container.querySelectorAll('button');
    // Search for option with text "Project Roadmap"
    let roadmapOption: HTMLButtonElement | null = null;
    options.forEach((opt: any) => {
      if (opt.textContent?.includes('Project Roadmap')) {
        roadmapOption = opt;
      }
    });

    expect(roadmapOption).not.toBeNull();
    await act(async () => {
      roadmapOption?.click();
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    expect(onUpdateProps).toHaveBeenCalledWith({ refPageId: 'page-1' });
  });

  it('renders target page heading and content blocks when refPageId is provided', async () => {
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

    let view: any;
    await act(async () => {
      view = render(
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
    expect(view.container.textContent).toContain('🚀');
    expect(view.container.textContent).toContain('Project Roadmap');
    expect(view.container.textContent).toContain('Synced Block');

    // Verify content blocks are rendered (excluding the main heading H1 block)
    expect(view.container.textContent).toContain('This is the main roadmap paragraph.');
    expect(view.container.textContent).toContain('Milestone 1 completed');
  });
});
