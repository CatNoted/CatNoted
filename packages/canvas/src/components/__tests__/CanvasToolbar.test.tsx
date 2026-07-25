import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';
import { CanvasToolbar } from '../CanvasToolbar.js';

describe('CanvasToolbar', () => {
  it('renders toolbar buttons', () => {
    render(
      <CanvasToolbar
        onAddElement={vi.fn()}
      />
    );

    expect(screen.getByTitle('Add Card')).toBeInTheDocument();
    expect(screen.getByTitle('Add Shape')).toBeInTheDocument();
  });

  it('calls onAddElement when Add Card button is clicked', () => {
    const onAddElementMock = vi.fn();
    render(
      <CanvasToolbar
        onAddElement={onAddElementMock}
      />
    );

    fireEvent.click(screen.getByTitle('Add Card'));
    expect(onAddElementMock).toHaveBeenCalledTimes(1);
    expect(onAddElementMock).toHaveBeenCalledWith('card');
  });
});
