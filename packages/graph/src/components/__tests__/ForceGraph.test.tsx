import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';
import { ForceGraph } from '../ForceGraph.js';

describe('ForceGraph', () => {
  const mockNodes = [
    { id: '1', type: 'page', title: 'Node 1', group: 1 }
  ];

  const mockEdges: any[] = [];

  it('renders force graph container', () => {
    const { container } = render(
      <ForceGraph
        nodes={mockNodes as any}
        edges={mockEdges as any}
        onNodeClick={vi.fn()}
      />
    );
    expect(container).toBeInTheDocument();
  });
});
