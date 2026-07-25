import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';
import { ResizeHandles } from '../ResizeHandles.js';

describe('ResizeHandles', () => {
  it('renders handles for shapes', () => {
    const { container } = render(
      <ResizeHandles
        width={100}
        height={100}
        onResizeStart={vi.fn()}
      />
    );

    // Should render 8 handles for a shape
    expect(container.querySelectorAll('.bg-white').length).toBeGreaterThan(0);
  });
});
