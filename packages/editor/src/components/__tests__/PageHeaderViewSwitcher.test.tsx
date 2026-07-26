import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, it, expect, vi } from 'vitest';
import { PageHeader } from '../PageHeader.js';

describe('PageHeader View Switcher Tests', () => {
  it('renders standard PageHeader without switcher when no viewMode prop is provided', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const onTitleChange = vi.fn();
    const onIconChange = vi.fn();
    const onCoverChange = vi.fn();

    await act(async () => {
      const root = createRoot(container);
      root.render(
        <PageHeader
          title="My Page"
          onTitleChange={onTitleChange}
          onIconChange={onIconChange}
          onCoverChange={onCoverChange}
        />
      );
    });

    const buttons = Array.from(container.querySelectorAll('button'));
    // Should not contain view switcher buttons
    const documentButton = buttons.find(btn => btn.textContent?.includes('Document'));
    expect(documentButton).toBeUndefined();

    document.body.removeChild(container);
  });

  it('renders view switcher tabs and triggers onViewModeChange when viewMode prop is provided', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const onTitleChange = vi.fn();
    const onIconChange = vi.fn();
    const onCoverChange = vi.fn();
    const onViewModeChange = vi.fn();

    await act(async () => {
      const root = createRoot(container);
      root.render(
        <PageHeader
          title="My Page"
          onTitleChange={onTitleChange}
          onIconChange={onIconChange}
          onCoverChange={onCoverChange}
          viewMode="doc"
          onViewModeChange={onViewModeChange}
        />
      );
    });

    const buttons = Array.from(container.querySelectorAll('button'));

    const docButton = buttons.find(btn => btn.textContent === 'Document');
    const kanbanButton = buttons.find(btn => btn.textContent === 'Kanban Board');
    const tableButton = buttons.find(btn => btn.textContent === 'Table View');
    const edgelessButton = buttons.find(btn => btn.textContent === 'Edgeless Canvas');

    expect(docButton).toBeDefined();
    expect(kanbanButton).toBeDefined();
    expect(tableButton).toBeDefined();
    expect(edgelessButton).toBeDefined();

    // Click Kanban Board tab
    await act(async () => {
      kanbanButton?.click();
    });

    expect(onViewModeChange).toHaveBeenCalledWith('kanban');

    document.body.removeChild(container);
  });
});
