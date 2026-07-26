import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CanvasToolbar } from '../CanvasToolbar.js';

describe('CanvasToolbar', () => {
  let container: HTMLDivElement;
  const onAddElement = vi.fn();

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    onAddElement.mockClear();
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('renders all five buttons (card, rectangle, ellipse, text note, and frame)', async () => {
    await act(async () => {
      const root = createRoot(container);
      root.render(<CanvasToolbar onAddElement={onAddElement} />);
    });

    const buttons = container.querySelectorAll('button');
    expect(buttons).toHaveLength(5);

    const titles = Array.from(buttons).map(btn => btn.getAttribute('title'));
    expect(titles).toContain('Add Card (C)');
    expect(titles).toContain('Add Rectangle (R)');
    expect(titles).toContain('Add Ellipse (E)');
    expect(titles).toContain('Add Text Note (T)');
    expect(titles).toContain('Add Frame (F)');
  });

  it('triggers onAddElement with correct parameters on mouse click', async () => {
    await act(async () => {
      const root = createRoot(container);
      root.render(<CanvasToolbar onAddElement={onAddElement} />);
    });

    const buttons = container.querySelectorAll('button');

    // Button 0: Card
    await act(async () => {
      buttons[0].click();
    });
    expect(onAddElement).toHaveBeenLastCalledWith('card', undefined);

    // Button 1: Rectangle
    await act(async () => {
      buttons[1].click();
    });
    expect(onAddElement).toHaveBeenLastCalledWith('shape', 'rectangle');

    // Button 2: Ellipse (Circle)
    await act(async () => {
      buttons[2].click();
    });
    expect(onAddElement).toHaveBeenLastCalledWith('shape', 'circle');

    // Button 3: Text Note
    await act(async () => {
      buttons[3].click();
    });
    expect(onAddElement).toHaveBeenLastCalledWith('note', undefined);

    // Button 4: Frame
    await act(async () => {
      buttons[4].click();
    });
    expect(onAddElement).toHaveBeenLastCalledWith('frame', undefined);
  });

  it('triggers onAddElement on keyboard shortcut keydown', async () => {
    await act(async () => {
      const root = createRoot(container);
      root.render(<CanvasToolbar onAddElement={onAddElement} />);
    });

    // C -> Card
    const cEvent = new KeyboardEvent('keydown', { key: 'c', bubbles: true });
    await act(async () => {
      window.dispatchEvent(cEvent);
    });
    expect(onAddElement).toHaveBeenLastCalledWith('card', undefined);

    // R -> Rectangle
    const rEvent = new KeyboardEvent('keydown', { key: 'r', bubbles: true });
    await act(async () => {
      window.dispatchEvent(rEvent);
    });
    expect(onAddElement).toHaveBeenLastCalledWith('shape', 'rectangle');

    // E -> Ellipse
    const eEvent = new KeyboardEvent('keydown', { key: 'e', bubbles: true });
    await act(async () => {
      window.dispatchEvent(eEvent);
    });
    expect(onAddElement).toHaveBeenLastCalledWith('shape', 'circle');

    // T -> Note
    const tEvent = new KeyboardEvent('keydown', { key: 't', bubbles: true });
    await act(async () => {
      window.dispatchEvent(tEvent);
    });
    expect(onAddElement).toHaveBeenLastCalledWith('note', undefined);

    // F -> Frame
    const fEvent = new KeyboardEvent('keydown', { key: 'f', bubbles: true });
    await act(async () => {
      window.dispatchEvent(fEvent);
    });
    expect(onAddElement).toHaveBeenLastCalledWith('frame', undefined);
  });

  it('does not trigger onAddElement when keyboard shortcut is pressed inside a textarea or input', async () => {
    await act(async () => {
      const root = createRoot(container);
      root.render(<CanvasToolbar onAddElement={onAddElement} />);
    });

    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);
    textarea.focus();

    const cEvent = new KeyboardEvent('keydown', { key: 'c', bubbles: true });
    await act(async () => {
      textarea.dispatchEvent(cEvent);
    });
    expect(onAddElement).not.toHaveBeenCalled();

    document.body.removeChild(textarea);
  });

  it('renders 6 buttons and triggers onToggleKanbanPreview when toggle prop is provided', async () => {
    const onToggleKanbanPreview = vi.fn();
    await act(async () => {
      const root = createRoot(container);
      root.render(
        <CanvasToolbar
          onAddElement={onAddElement}
          isKanbanPreviewOpen={false}
          onToggleKanbanPreview={onToggleKanbanPreview}
        />
      );
    });

    const buttons = container.querySelectorAll('button');
    expect(buttons).toHaveLength(6);

    const toggleButton = Array.from(buttons).find(btn => btn.getAttribute('title') === 'Toggle Kanban Board Overview');
    expect(toggleButton).toBeDefined();

    await act(async () => {
      toggleButton?.click();
    });
    expect(onToggleKanbanPreview).toHaveBeenCalledTimes(1);
  });
});
