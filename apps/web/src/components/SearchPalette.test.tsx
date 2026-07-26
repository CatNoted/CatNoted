import { createRoot } from 'react-dom/client';
import { SearchPalette } from './SearchPalette.js';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { yblocks, ypages } from '@catnoted/editor';

describe('SearchPalette Component Tests', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    // Clear actual Yjs stores to have a clean sandbox for each test
    yblocks.delete(0, yblocks.length);
    ypages.clear();

    localStorage.clear();
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should not render anything when isOpen is false', async () => {
    const onClose = vi.fn();
    const onSelectResult = vi.fn();

    await act(async () => {
      const root = createRoot(container);
      root.render(
        <SearchPalette
          isOpen={false}
          onClose={onClose}
          onSelectResult={onSelectResult}
          isDarkMode={false}
        />
      );
    });

    expect(container.innerHTML).toBe('');
  });

  it('should render calm empty state when search query is empty and no last opened item exists', async () => {
    const onClose = vi.fn();
    const onSelectResult = vi.fn();

    await act(async () => {
      const root = createRoot(container);
      root.render(
        <SearchPalette
          isOpen={true}
          onClose={onClose}
          onSelectResult={onSelectResult}
          isDarkMode={false}
        />
      );
    });

    await new Promise((resolve) => setTimeout(resolve, 60));

    expect(container.innerHTML).toContain('Search CatNoted Workspace');
    expect(container.innerHTML).toContain('Type to instantly search');
  });

  it('should render last opened search result under Last Opened when query is empty', async () => {
    const onClose = vi.fn();
    const onSelectResult = vi.fn();

    // Mock last opened search result in localStorage
    const lastResult = {
      id: 'page-1',
      type: 'page',
      title: 'Last Visited Note',
      subtitle: 'Workspace Document',
    };
    localStorage.setItem('catnoted:last-search-result', JSON.stringify(lastResult));

    await act(async () => {
      const root = createRoot(container);
      root.render(
        <SearchPalette
          isOpen={true}
          onClose={onClose}
          onSelectResult={onSelectResult}
          isDarkMode={false}
        />
      );
    });

    await new Promise((resolve) => setTimeout(resolve, 60));

    expect(container.innerHTML).toContain('Last Opened');
    expect(container.innerHTML).toContain('Last Visited Note');
  });

  const changeInputValue = async (input: HTMLInputElement, value: string) => {
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value'
    )?.set;
    await act(async () => {
      nativeInputValueSetter?.call(input, value);
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await new Promise((resolve) => setTimeout(resolve, 60));
  };

  it('should search pages, block contents, and tags matching query', async () => {
    const onClose = vi.fn();
    const onSelectResult = vi.fn();

    // Setup pages and blocks
    ypages.set('page-tech', {
      id: 'page-tech',
      title: 'Technology Trends',
      icon: '🚀',
      createdAt: Date.now(),
    });

    yblocks.insert(0, [
      {
        id: 'block-1',
        type: 'text',
        content: 'This block discusses Artificial Intelligence and neural networks #AI',
        parentId: 'page-tech',
      },
    ]);

    await act(async () => {
      const root = createRoot(container);
      root.render(
        <SearchPalette
          isOpen={true}
          onClose={onClose}
          onSelectResult={onSelectResult}
          isDarkMode={false}
        />
      );
    });

    await new Promise((resolve) => setTimeout(resolve, 60));

    const input = container.querySelector('input') as HTMLInputElement;
    expect(input).toBeTruthy();

    // Type query "Artificial"
    await changeInputValue(input, 'Artificial');

    // Verify block content result is rendered
    expect(container.innerHTML).toContain('Matching Blocks Content');
    expect(container.innerHTML).toContain('Artificial Intelligence');

    // Type query "trends" to match page title
    await changeInputValue(input, 'trends');

    // Verify page result is rendered
    expect(container.textContent).toContain('Pages & Documents');
    expect(container.textContent).toContain('Technology Trends');

    // Type query "ai" to match tag node
    await changeInputValue(input, 'ai');

    // Verify tag result is rendered
    expect(container.textContent).toContain('Tags & Graph Connections');
    expect(container.textContent).toContain('#AI');
  });

  it('should support keyboard arrow navigation, Esc to close, and Enter to select', async () => {
    const onClose = vi.fn();
    const onSelectResult = vi.fn();

    // Setup pages & blocks
    ypages.set('page-1', { id: 'page-1', title: 'Page Alpha', icon: '📄', createdAt: Date.now() });
    ypages.set('page-2', { id: 'page-2', title: 'Page Beta', icon: '📄', createdAt: Date.now() });

    await act(async () => {
      const root = createRoot(container);
      root.render(
        <SearchPalette
          isOpen={true}
          onClose={onClose}
          onSelectResult={onSelectResult}
          isDarkMode={false}
        />
      );
    });

    await new Promise((resolve) => setTimeout(resolve, 60));

    const input = container.querySelector('input') as HTMLInputElement;

    // Type "Page" to list both pages
    await changeInputValue(input, 'Page');

    await new Promise((resolve) => setTimeout(resolve, 60));

    expect(container.innerHTML).toContain('Page Alpha');
    expect(container.innerHTML).toContain('Page Beta');

    // Arrow down keypress event
    const arrowDownEvent = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true });
    await act(async () => {
      window.dispatchEvent(arrowDownEvent);
    });

    // Enter keypress event (should select Page Beta)
    const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
    await act(async () => {
      window.dispatchEvent(enterEvent);
    });

    expect(onSelectResult).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'page-2',
        title: 'Page Beta',
      })
    );
    expect(onClose).toHaveBeenCalled();

    // Escape keypress event
    const escEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    await act(async () => {
      window.dispatchEvent(escEvent);
    });
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
