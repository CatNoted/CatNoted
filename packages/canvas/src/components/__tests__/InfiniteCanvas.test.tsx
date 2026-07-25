import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';
import { InfiniteCanvas } from '../InfiniteCanvas.js';

vi.mock('@catnoted/editor', () => ({
  useDocumentStore: vi.fn(() => ({
    blocks: [],
    addBlock: vi.fn(),
    updateBlockContent: vi.fn(),
  })),
  ydoc: {
    transact: vi.fn((cb) => cb()),
    getMap: vi.fn(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      get: vi.fn(),
      set: vi.fn(),
      has: vi.fn(() => true),
      delete: vi.fn(),
      keys: vi.fn(() => []),
      values: vi.fn(() => []),
      entries: vi.fn(() => []),
      toJSON: vi.fn(() => ({})),
      forEach: vi.fn(),
    }))
  }
}));

describe('InfiniteCanvas', () => {
  it('renders correctly', () => {
    // Minimal render test for complex component
    const { container } = render(<InfiniteCanvas />);
    expect(container).toBeInTheDocument();
  });
});
