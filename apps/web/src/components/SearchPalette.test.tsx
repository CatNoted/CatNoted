import { createRoot } from 'react-dom/client';
import { SearchPalette } from './SearchPalette.js';
import { describe, it, expect, vi } from 'vitest';
import { act } from 'react';

// Mock Yjs maps/arrays to avoid throwing during initialization
vi.mock('@catnoted/editor', () => {
  return {
    yblocks: {
      toArray: () => [],
      observe: () => {},
      unobserve: () => {}
    },
    ypages: {
      toJSON: () => ({}),
      observe: () => {},
      unobserve: () => {}
    },
    renderPageIcon: (icon: string) => icon
  };
});

describe('SearchPalette Component Tests', () => {
  it('should render nothing when isOpen is false', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const onClose = vi.fn();
    const onPageSelect = vi.fn();
    const onModeChange = vi.fn();

    await act(async () => {
      const root = createRoot(container);
      root.render(
        <SearchPalette
          isOpen={false}
          onClose={onClose}
          onPageSelect={onPageSelect}
          onModeChange={onModeChange}
        />
      );
    });

    expect(container.innerHTML).toBe('');
    document.body.removeChild(container);
  });

  it('should render correct search elements when isOpen is true', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const onClose = vi.fn();
    const onPageSelect = vi.fn();
    const onModeChange = vi.fn();

    await act(async () => {
      const root = createRoot(container);
      root.render(
        <SearchPalette
          isOpen={true}
          onClose={onClose}
          onPageSelect={onPageSelect}
          onModeChange={onModeChange}
        />
      );
    });

    // Wait for async rendering and focus timeout to complete
    await new Promise(resolve => setTimeout(resolve, 60));

    expect(container.innerHTML).toContain('Workspace Search');
    expect(container.innerHTML).toContain('Search pages, blocks, tags...');

    document.body.removeChild(container);
  });
});
