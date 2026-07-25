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

const setNativeValue = (element: HTMLTextAreaElement, value: string) => {
  const valueSetter = Object.getOwnPropertyDescriptor(element.constructor.prototype, 'value')?.set;
  const prototype = Object.getPrototypeOf(element);
  const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;

  const setter = valueSetter || prototypeValueSetter;
  if (setter) {
    setter.call(element, value);
  } else {
    element.value = value;
  }
};

describe('TextBlock Slash Command Trigger and Cleaning Tests', () => {
  it('should open slash command menu when typing / at the start of an empty text block', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const onChange = vi.fn();
    let root: any;

    await act(async () => {
      root = createRoot(container);
      root.render(
        <TextBlock
          id="test-id"
          content=""
          onChange={onChange}
          onEnter={vi.fn()}
          onBackspace={vi.fn()}
          onSetType={vi.fn()}
          onAddWidget={vi.fn()}
          blockType="text"
        />
      );
    });

    const textarea = container.querySelector('textarea');
    expect(textarea).not.toBeNull();

    if (textarea) {
      await act(async () => {
        setNativeValue(textarea, '/');
        textarea.selectionStart = 1;
        textarea.selectionEnd = 1;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      });
    }

    // Since the menu is created in document.body via a portal, check if it's rendered
    const menu = document.body.querySelector('.fixed');
    expect(menu).not.toBeNull();
    expect(menu?.textContent).toContain('Block Types');

    await act(async () => {
      root.unmount();
    });
    document.body.removeChild(container);
  });

  it('should open slash command menu when typing / at the start of a non-empty text block', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const onChange = vi.fn();
    let root: any;

    await act(async () => {
      root = createRoot(container);
      root.render(
        <TextBlock
          id="test-id"
          content="/hello"
          onChange={onChange}
          onEnter={vi.fn()}
          onBackspace={vi.fn()}
          onSetType={vi.fn()}
          onAddWidget={vi.fn()}
          blockType="text"
        />
      );
    });

    const textarea = container.querySelector('textarea');
    expect(textarea).not.toBeNull();

    if (textarea) {
      await act(async () => {
        // Simulate typing h after /hello to trigger change with cursor right after /h
        setNativeValue(textarea, '/hhello');
        textarea.selectionStart = 2;
        textarea.selectionEnd = 2;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      });
    }

    const menu = document.body.querySelector('.fixed');
    expect(menu).not.toBeNull();

    await act(async () => {
      root.unmount();
    });
    document.body.removeChild(container);
  });

  it('should NOT open slash command menu when typing / in the middle or end of a text block', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const onChange = vi.fn();
    let root: any;

    await act(async () => {
      root = createRoot(container);
      root.render(
        <TextBlock
          id="test-id"
          content="hello"
          onChange={onChange}
          onEnter={vi.fn()}
          onBackspace={vi.fn()}
          onSetType={vi.fn()}
          onAddWidget={vi.fn()}
          blockType="text"
        />
      );
    });

    const textarea = container.querySelector('textarea');
    expect(textarea).not.toBeNull();

    if (textarea) {
      await act(async () => {
        // Typing '/' at the end of 'hello' -> 'hello /'
        setNativeValue(textarea, 'hello /');
        textarea.selectionStart = 7;
        textarea.selectionEnd = 7;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      });
    }

    const menu = document.body.querySelector('.fixed');
    expect(menu).toBeNull();

    await act(async () => {
      root.unmount();
    });
    document.body.removeChild(container);
  });

  it('should clean the slash trigger and query correctly when transforming block type', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const onSetType = vi.fn();
    let root: any;

    // Stateful wrapper to let TextBlock content propagate correctly as it does in the real app
    const TestBlockWrapper = () => {
      const [content, setContent] = React.useState('');
      return (
        <TextBlock
          id="test-id"
          content={content}
          onChange={setContent}
          onEnter={vi.fn()}
          onBackspace={vi.fn()}
          onSetType={onSetType}
          onAddWidget={vi.fn()}
          blockType="text"
        />
      );
    };

    await act(async () => {
      root = createRoot(container);
      root.render(<TestBlockWrapper />);
    });

    const textarea = container.querySelector('textarea');
    expect(textarea).not.toBeNull();

    if (textarea) {
      await act(async () => {
        // Simulate typing "/h1 rest of text" with the cursor positioned immediately after "/h1"
        setNativeValue(textarea, '/h1 rest of text');
        textarea.selectionStart = 3; // Cursor is right after "/h1"
        textarea.selectionEnd = 3;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      });
    }

    // Find the menu and trigger Heading 1 selection.
    // Since query is "h1", only heading1 matches, rendering at index 0 of the filtered list.
    const menuButton = document.body.querySelector('button[data-index="0"]');
    expect(menuButton).not.toBeNull();

    await act(async () => {
      menuButton?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    });

    // Verify textarea content now has the slash command cleanly stripped out, leaving "rest of text"
    expect(textarea?.value).toBe('rest of text');
    expect(onSetType).toHaveBeenCalledWith('heading', { level: 1 });

    await act(async () => {
      root.unmount();
    });
    document.body.removeChild(container);
  });
});
