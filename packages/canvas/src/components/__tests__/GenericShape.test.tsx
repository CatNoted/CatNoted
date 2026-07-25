import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';
import { GenericShape } from '../GenericShape.js';

describe('GenericShape', () => {
  const mockShapeElem = {
    id: 'shape-1',
    x: 100,
    y: 100,
    width: 200,
    height: 100,
    type: 'shape',
    zIndex: 1,
    rotation: 0,
    shapeType: 'rectangle',
    text: 'Hello Shape'
  };

  it('renders a generic shape correctly', () => {
    const { container } = render(
      <GenericShape
        element={mockShapeElem as any}
        isSelected={false}
        onDragStart={vi.fn()}
        onSelectToggle={vi.fn()}
        onResizeStart={vi.fn()}
        onTextChange={vi.fn()}
      />
    );

    const textarea = container.querySelector('textarea');
    expect(textarea).toBeInTheDocument();
  });

  it('calls onTextChange when text changes', () => {
    const onTextChangeMock = vi.fn();
    const { container } = render(
      <GenericShape
        element={mockShapeElem as any}
        isSelected={false}
        onDragStart={vi.fn()}
        onSelectToggle={vi.fn()}
        onResizeStart={vi.fn()}
        onTextChange={onTextChangeMock}
      />
    );

    const textarea = container.querySelector('textarea');
    fireEvent.change(textarea!, { target: { value: 'New text' } });

    expect(onTextChangeMock).toHaveBeenCalledWith('shape-1', 'New text');
  });
});
