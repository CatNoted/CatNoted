import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';
import { GraphView } from '../GraphView.js';

vi.mock('@catnoted/editor', () => ({
  useDocumentStore: vi.fn(() => ({
    blocks: []
  }))
}));

describe('GraphView', () => {
  it('renders graph view container', () => {
    const { container } = render(
      <GraphView
        onNavigateToNode={vi.fn()}
      />
    );
    expect(container).toBeInTheDocument();
  });
});
