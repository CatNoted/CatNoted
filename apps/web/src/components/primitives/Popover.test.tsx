import { render, cleanup } from '@testing-library/react';
import { Popover } from './Popover.js';
import { describe, it, expect, vi } from 'vitest';
import { act } from 'react';

describe('Popover Component Tests', () => {
  it('should render trigger, and render content only when isOpen is true', async () => {
    const handleClose = vi.fn();

    const { rerender } = render(
      <Popover
        isOpen={false}
        onClose={handleClose}
        trigger={<button id="trigger-btn">Open Me</button>}
        placement="bottom"
      >
        <div id="popover-content">Popover Content Info</div>
      </Popover>
    );

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(document.body.innerHTML).toContain('Open Me');
    expect(document.body.innerHTML).not.toContain('Popover Content Info');

    // Re-render with isOpen = true
    rerender(
      <Popover
        isOpen={true}
        onClose={handleClose}
        trigger={<button id="trigger-btn">Open Me</button>}
        placement="bottom"
      >
        <div id="popover-content">Popover Content Info</div>
      </Popover>
    );

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(document.body.innerHTML).toContain('Open Me');
    expect(document.body.innerHTML).toContain('Popover Content Info');

    cleanup();
  });

  it('should call onClose when clicking outside of the popover', async () => {
    const handleClose = vi.fn();

    render(
      <Popover
        isOpen={true}
        onClose={handleClose}
        trigger={<button id="trigger-btn">Open Me</button>}
        placement="bottom"
      >
        <div id="popover-content">Popover Content Info</div>
      </Popover>
    );

    await new Promise((resolve) => setTimeout(resolve, 10));

    // Clicking inside the popover should not call onClose
    const contentEl = document.body.querySelector('#popover-content');
    expect(contentEl).not.toBeNull();

    await act(async () => {
      contentEl?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    });
    expect(handleClose).not.toHaveBeenCalled();

    // Clicking outside should call onClose
    await act(async () => {
      document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    });
    expect(handleClose).toHaveBeenCalledTimes(1);

    cleanup();
  });

  it('should apply accurate placement class based on prop', async () => {
    const handleClose = vi.fn();

    render(
      <Popover
        isOpen={true}
        onClose={handleClose}
        trigger={<button>Trigger</button>}
        placement="top-start"
      >
        <div>Content</div>
      </Popover>
    );

    await new Promise((resolve) => setTimeout(resolve, 10));

    // Check classes for top-start: "bottom-full left-0 mb-2"
    const dialog = document.body.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();
    expect(dialog?.className).toContain('bottom-full');
    expect(dialog?.className).toContain('left-0');

    cleanup();
  });
});
