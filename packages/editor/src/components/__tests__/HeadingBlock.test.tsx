import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, it, expect, vi } from 'vitest';
import { HeadingBlock } from '../HeadingBlock.js';

describe('HeadingBlock Unit Tests', () => {
  it('renders correct CSS classes for different heading levels', async () => {
    const onChange = vi.fn();

    // Test Level 1 (H1)
    const container1 = document.createElement('div');
    document.body.appendChild(container1);
    await act(async () => {
      const root = createRoot(container1);
      root.render(
        <HeadingBlock
          id="h1"
          content="Heading 1"
          level={1}
          onChange={onChange}
          onEnter={vi.fn()}
          onBackspace={vi.fn()}
        />
      );
    });

    const textarea1 = container1.querySelector('textarea');
    expect(textarea1).not.toBeNull();
    expect(textarea1?.className).toContain('text-3xl');
    expect(textarea1?.className).toContain('font-semibold');
    expect(textarea1?.placeholder).toBe('Heading 1');

    const div1 = container1.firstElementChild;
    expect(div1?.className).toContain('pb-3');
    document.body.removeChild(container1);

    // Test Level 2 (H2)
    const container2 = document.createElement('div');
    document.body.appendChild(container2);
    await act(async () => {
      const root = createRoot(container2);
      root.render(
        <HeadingBlock
          id="h2"
          content="Heading 2"
          level={2}
          onChange={onChange}
          onEnter={vi.fn()}
          onBackspace={vi.fn()}
        />
      );
    });

    const textarea2 = container2.querySelector('textarea');
    expect(textarea2?.className).toContain('text-2xl');
    expect(textarea2?.className).toContain('font-semibold');

    const div2 = container2.firstElementChild;
    expect(div2?.className).toContain('pb-2');
    document.body.removeChild(container2);

    // Test Level 3 (H3)
    const container3 = document.createElement('div');
    document.body.appendChild(container3);
    await act(async () => {
      const root = createRoot(container3);
      root.render(
        <HeadingBlock
          id="h3"
          content="Heading 3"
          level={3}
          onChange={onChange}
          onEnter={vi.fn()}
          onBackspace={vi.fn()}
        />
      );
    });

    const textarea3 = container3.querySelector('textarea');
    expect(textarea3?.className).toContain('text-xl');
    expect(textarea3?.className).toContain('font-semibold');

    const div3 = container3.firstElementChild;
    expect(div3?.className).toContain('pb-1.5');
    document.body.removeChild(container3);

    // Test Level 4 (Default)
    const container4 = document.createElement('div');
    document.body.appendChild(container4);
    await act(async () => {
      const root = createRoot(container4);
      root.render(
        <HeadingBlock
          id="h4"
          content="Heading 4"
          level={4}
          onChange={onChange}
          onEnter={vi.fn()}
          onBackspace={vi.fn()}
        />
      );
    });

    const textarea4 = container4.querySelector('textarea');
    expect(textarea4?.className).toContain('text-lg');
    expect(textarea4?.className).toContain('font-semibold');

    const div4 = container4.firstElementChild;
    expect(div4?.className).toContain('pb-1');
    document.body.removeChild(container4);
  });

  it('triggers Enter keydown event correctly', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const onEnter = vi.fn();

    await act(async () => {
      const root = createRoot(container);
      root.render(
        <HeadingBlock
          id="h1"
          content="Heading 1"
          level={1}
          onChange={vi.fn()}
          onEnter={onEnter}
          onBackspace={vi.fn()}
        />
      );
    });

    const textarea = container.querySelector('textarea');
    expect(textarea).not.toBeNull();

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

    document.body.removeChild(container);
  });

  it('triggers Backspace keydown event correctly when content is empty', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const onBackspace = vi.fn();

    await act(async () => {
      const root = createRoot(container);
      root.render(
        <HeadingBlock
          id="h1"
          content=""
          level={1}
          onChange={vi.fn()}
          onEnter={vi.fn()}
          onBackspace={onBackspace}
        />
      );
    });

    const textarea = container.querySelector('textarea');
    expect(textarea).not.toBeNull();

    await act(async () => {
      textarea?.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Backspace',
          bubbles: true,
          cancelable: true,
        })
      );
    });

    expect(onBackspace).toHaveBeenCalledTimes(1);

    document.body.removeChild(container);
  });
});
