import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';
import { Minimap } from '../Minimap.js';

describe('Minimap', () => {
  it('renders minimap wrapper', () => {
    const mockElements = new Map();
    mockElements.set('el-1', { id: 'el-1', x: 0, y: 0, width: 100, height: 100 });

    const { container } = render(
      <Minimap
        elements={mockElements as any}
        pan={{ x: 0, y: 0 }}
        scale={1}
        viewportWidth={800}
        viewportHeight={600}
        onPanChange={vi.fn()}
      />
    );

    expect(container.firstChild).toBeInTheDocument();
  });
});
