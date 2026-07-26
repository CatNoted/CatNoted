import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { InfiniteCanvas } from '../InfiniteCanvas.js';

describe('InfiniteCanvas Component Tests', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('renders correctly and displays toolbar buttons', async () => {
    await act(async () => {
      const root = createRoot(container);
      root.render(<InfiniteCanvas />);
    });

    // Check that help button is rendered
    const helpBtn = container.querySelector('button[title="Help & Shortcuts (?)"]');
    expect(helpBtn).not.toBeNull();
  });

  it('can toggle help overlay panel when help button is clicked', async () => {
    await act(async () => {
      const root = createRoot(container);
      root.render(<InfiniteCanvas />);
    });

    const helpBtn = container.querySelector('button[title="Help & Shortcuts (?)"]');
    expect(helpBtn).not.toBeNull();

    await act(async () => {
      helpBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    // Panel should now be visible
    const helpPanel = container.querySelector('h3');
    expect(helpPanel).not.toBeNull();
    expect(helpPanel?.textContent).toContain('Help & Shortcuts');
  });
});
