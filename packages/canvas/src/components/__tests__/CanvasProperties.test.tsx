import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';
import { CanvasProperties } from '../CanvasProperties.js';
import { CanvasElement } from '@catnoted/shared';

describe('CanvasProperties', () => {
  const mockSelection: CanvasElement[] = [{
    id: 'shape-1',
    x: 100,
    y: 100,
    width: 200,
    height: 100,
    type: 'shape',
    zIndex: 1,
    rotation: 0,
    shapeType: 'rectangle',
    color: '#ffffff'
  }];

  it('renders nothing when no selection', () => {
    const { container } = render(
      <CanvasProperties
        selectedElements={[]}
        onUpdateElement={vi.fn()}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders properties panel when there is selection', () => {
    render(
      <CanvasProperties
        selectedElements={mockSelection}
        onUpdateElement={vi.fn()}
      />
    );

    expect(screen.getByText(/Properties/i)).toBeInTheDocument();
  });
});
