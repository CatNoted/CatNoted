import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, it, expect, vi } from 'vitest';
import { PageHeader } from '../PageHeader.js';

describe('PageHeader Component Tests', () => {
  it('renders title, metadata, and handles title change', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const onTitleChange = vi.fn();
    const onIconChange = vi.fn();
    const onCoverChange = vi.fn();

    await act(async () => {
      const root = createRoot(container);
      root.render(
        <PageHeader
          title="AFFiNE Title"
          onTitleChange={onTitleChange}
          onIconChange={onIconChange}
          onCoverChange={onCoverChange}
          wordCount={150}
          blocksCount={5}
          createdAt={1620000000000}
        />
      );
    });

    const input = container.querySelector('input[type="text"]') as HTMLInputElement;
    expect(input).not.toBeNull();
    expect(input.value).toBe('AFFiNE Title');

    // Trigger title change
    await act(async () => {
      input.value = 'New Title';
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    // Check metadata text elements exist (Words, Read, Blocks, Created)
    const textContent = container.textContent || '';
    expect(textContent).toContain('Words');
    expect(textContent).toContain('150');
    expect(textContent).toContain('Read');
    expect(textContent).toContain('1 min');
    expect(textContent).toContain('Blocks');
    expect(textContent).toContain('5');
    expect(textContent).toContain('Created');

    document.body.removeChild(container);
  });

  it('toggles cover picker and icon picker when no icon/cover is provided', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    await act(async () => {
      const root = createRoot(container);
      root.render(
        <PageHeader
          title="Testing Pickers"
          onTitleChange={vi.fn()}
          onIconChange={vi.fn()}
          onCoverChange={vi.fn()}
        />
      );
    });

    // Find the Add icon and Add cover buttons
    const buttons = Array.from(container.querySelectorAll('button'));
    const addIconBtn = buttons.find(b => b.textContent?.includes('Add icon'));
    const addCoverBtn = buttons.find(b => b.textContent?.includes('Add cover'));

    expect(addIconBtn).toBeDefined();
    expect(addCoverBtn).toBeDefined();

    // Click Add Icon
    await act(async () => {
      addIconBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    // Verify emoji picker dropdown appears
    const emojiDropdownHeader = document.body.textContent || '';
    expect(emojiDropdownHeader).toContain('Choose Icon or Emoji');

    // Click Add Cover
    await act(async () => {
      addCoverBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    // Verify cover picker dropdown appears
    const coverDropdownHeader = document.body.textContent || '';
    expect(coverDropdownHeader).toContain('Page Cover Settings');

    document.body.removeChild(container);
  });

  it('supports collapsible page info block toggling', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const onInfoExpandedChange = vi.fn();

    let root: any;
    await act(async () => {
      root = createRoot(container);
      root.render(
        <PageHeader
          title="Collapsible Testing"
          onTitleChange={vi.fn()}
          onIconChange={vi.fn()}
          onCoverChange={vi.fn()}
          isInfoExpanded={true}
          onInfoExpandedChange={onInfoExpandedChange}
          wordCount={120}
          blocksCount={4}
          createdAt={1620000000000}
        />
      );
    });

    // Verify metadata block is visible
    let textContent = container.textContent || '';
    expect(textContent).toContain('Words');
    expect(textContent).toContain('120');

    // Find "Hide info" or "Page info" button
    const buttons = Array.from(container.querySelectorAll('button'));
    const toggleInfoBtn = buttons.find(b => b.textContent?.includes('Hide info') || b.textContent?.includes('Page info'));
    expect(toggleInfoBtn).toBeDefined();

    // Click toggle info button
    await act(async () => {
      toggleInfoBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    // Verify the callback onInfoExpandedChange was called with false
    expect(onInfoExpandedChange).toHaveBeenCalledWith(false);

    // Re-render with isInfoExpanded={false} on same container using same root
    await act(async () => {
      root.render(
        <PageHeader
          title="Collapsible Testing"
          onTitleChange={vi.fn()}
          onIconChange={vi.fn()}
          onCoverChange={vi.fn()}
          isInfoExpanded={false}
          onInfoExpandedChange={onInfoExpandedChange}
          wordCount={120}
          blocksCount={4}
          createdAt={1620000000000}
        />
      );
    });

    // Verify metadata block is hidden
    textContent = container.textContent || '';
    expect(textContent).not.toContain('Words');
    expect(textContent).not.toContain('120');

    document.body.removeChild(container);
  });
});
