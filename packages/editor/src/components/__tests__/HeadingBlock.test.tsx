import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';
import { HeadingBlock } from '../HeadingBlock.js';

describe('HeadingBlock', () => {
  it('renders correctly with default props', () => {
    render(
      <HeadingBlock
        id="block-1"
        content="Test Heading"
        level={1}
        onChange={vi.fn()}
        onEnter={vi.fn()}
        onBackspace={vi.fn()}
      />
    );

    expect(screen.getByDisplayValue('Test Heading')).toBeInTheDocument();
  });

  it('calls onChange when input changes', () => {
    const onChangeMock = vi.fn();
    render(
      <HeadingBlock
        id="block-1"
        content=""
        level={1}
        onChange={onChangeMock}
        onEnter={vi.fn()}
        onBackspace={vi.fn()}
      />
    );

    const input = screen.getByPlaceholderText('Heading 1');
    fireEvent.change(input, { target: { value: 'New text' } });

    expect(onChangeMock).toHaveBeenCalledWith('New text');
  });

  it('calls onEnter on Enter key down without shift', () => {
    const onEnterMock = vi.fn();
    render(
      <HeadingBlock
        id="block-1"
        content=""
        level={1}
        onChange={vi.fn()}
        onEnter={onEnterMock}
        onBackspace={vi.fn()}
      />
    );

    const input = screen.getByPlaceholderText('Heading 1');
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: false });

    expect(onEnterMock).toHaveBeenCalledTimes(1);
  });

  it('calls onBackspace on Backspace key down when content is empty', () => {
    const onBackspaceMock = vi.fn();
    render(
      <HeadingBlock
        id="block-1"
        content=""
        level={1}
        onChange={vi.fn()}
        onEnter={vi.fn()}
        onBackspace={onBackspaceMock}
      />
    );

    const input = screen.getByPlaceholderText('Heading 1');
    fireEvent.keyDown(input, { key: 'Backspace' });

    expect(onBackspaceMock).toHaveBeenCalledTimes(1);
  });

  it('does not call onBackspace on Backspace key down when content is not empty', () => {
    const onBackspaceMock = vi.fn();
    render(
      <HeadingBlock
        id="block-1"
        content="not empty"
        level={1}
        onChange={vi.fn()}
        onEnter={vi.fn()}
        onBackspace={onBackspaceMock}
      />
    );

    const input = screen.getByPlaceholderText('Heading 1');
    fireEvent.keyDown(input, { key: 'Backspace' });

    expect(onBackspaceMock).not.toHaveBeenCalled();
  });
});
