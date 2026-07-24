import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, it, expect, vi } from 'vitest';
import { TextBlock } from '../TextBlock.js';

describe('TextBlock Bullet Enter Behavior Tests', () => {
  it('should call onEnter on standard text block when Enter is pressed', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const onEnter = vi.fn();
    const onChange = vi.fn();
    const onBackspace = vi.fn();
    const onSetType = vi.fn();
    const onAddWidget = vi.fn();

    await act(async () => {
      const root = createRoot(container);
      root.render(
        <TextBlock
          id="test-id"
          content="Hello"
          onChange={onChange}
          onEnter={onEnter}
          onBackspace={onBackspace}
          onSetType={onSetType}
          onAddWidget={onAddWidget}
          blockType="text"
        />
      );
    });

    const textarea = container.querySelector('textarea');
    expect(textarea).not.toBeNull();

    // Trigger Enter key down event
    await act(async () => {
      textarea?.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Enter',
          bubbles: true,
          cancelable: true,
        })
      );
    });

    expect(onEnter).toHaveBeenCalledTimes(1);
    expect(onChange).not.toHaveBeenCalled();

    document.body.removeChild(container);
  });

  it('should insert newline in the same block on the first Enter in a bullet block', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const onEnter = vi.fn();
    const onChange = vi.fn();

    await act(async () => {
      const root = createRoot(container);
      root.render(
        <TextBlock
          id="test-id"
          content="First bullet text"
          onChange={onChange}
          onEnter={onEnter}
          onBackspace={vi.fn()}
          onSetType={vi.fn()}
          onAddWidget={vi.fn()}
          blockType="bullet"
        />
      );
    });

    const textarea = container.querySelector('textarea');
    expect(textarea).not.toBeNull();

    if (textarea) {
      // Simulate cursor at the end of the text
      textarea.selectionStart = 17;
      textarea.selectionEnd = 17;

      await act(async () => {
        textarea.dispatchEvent(
          new KeyboardEvent('keydown', {
            key: 'Enter',
            bubbles: true,
            cancelable: true,
          })
        );
      });
    }

    // Should NOT trigger onEnter yet
    expect(onEnter).not.toHaveBeenCalled();
    // Should trigger onChange with the updated content containing newline
    expect(onChange).toHaveBeenCalledWith('First bullet text\n');

    document.body.removeChild(container);
  });

  it('should remove the empty line and breakout on a second Enter in a bullet block', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const onEnter = vi.fn();
    const onChange = vi.fn();

    await act(async () => {
      const root = createRoot(container);
      root.render(
        <TextBlock
          id="test-id"
          content={"First bullet text\n"}
          onChange={onChange}
          onEnter={onEnter}
          onBackspace={vi.fn()}
          onSetType={vi.fn()}
          onAddWidget={vi.fn()}
          blockType="bullet"
        />
      );
    });

    const textarea = container.querySelector('textarea');
    expect(textarea).not.toBeNull();

    if (textarea) {
      // Simulate cursor on the second line (which is empty)
      textarea.selectionStart = 18;
      textarea.selectionEnd = 18;

      await act(async () => {
        textarea.dispatchEvent(
          new KeyboardEvent('keydown', {
            key: 'Enter',
            bubbles: true,
            cancelable: true,
          })
        );
      });
    }

    // Should trigger onChange with the cleaned content (empty line removed)
    expect(onChange).toHaveBeenCalledWith('First bullet text');
    // Should trigger onEnter (breakout)
    expect(onEnter).toHaveBeenCalledTimes(1);

    document.body.removeChild(container);
  });
});
