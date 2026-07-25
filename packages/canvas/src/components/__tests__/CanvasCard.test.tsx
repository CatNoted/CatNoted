import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';
import { CanvasCard } from '../CanvasCard.js';
import { useDocumentStore } from '@catnoted/editor';

vi.mock('@catnoted/editor', () => ({
  useDocumentStore: vi.fn()
}));

describe('CanvasCard', () => {
  const mockBlock = {
    id: 'block-1',
    type: 'text',
    content: 'Card content',
    level: 1,
    properties: {}
  };

  const mockCanvasElem = {
    id: 'block-1',
    x: 100,
    y: 200,
    width: 300,
    zIndex: 1
  };

  it('renders correctly with default props', () => {
    (useDocumentStore as any).mockReturnValue({
      updateBlockContent: vi.fn()
    });

    render(
      <CanvasCard
        block={mockBlock as any}
        canvasElem={mockCanvasElem as any}
        onDragStart={vi.fn()}
        onStartConnector={vi.fn()}
      />
    );

    expect(screen.getByText('text')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Card content')).toBeInTheDocument();
  });

  it('calls onDragStart when drag handle is clicked', () => {
    (useDocumentStore as any).mockReturnValue({
      updateBlockContent: vi.fn()
    });
    const onDragStartMock = vi.fn();

    render(
      <CanvasCard
        block={mockBlock as any}
        canvasElem={mockCanvasElem as any}
        onDragStart={onDragStartMock}
        onStartConnector={vi.fn()}
      />
    );

    const handle = screen.getByText('text');
    fireEvent.mouseDown(handle);
    expect(onDragStartMock).toHaveBeenCalledTimes(1);
  });

  it('calls onStartConnector when connector port is clicked', () => {
    (useDocumentStore as any).mockReturnValue({
      updateBlockContent: vi.fn()
    });
    const onStartConnectorMock = vi.fn();

    render(
      <CanvasCard
        block={mockBlock as any}
        canvasElem={mockCanvasElem as any}
        onDragStart={vi.fn()}
        onStartConnector={onStartConnectorMock}
      />
    );

    const connectorBtn = screen.getByTitle('Drag to connect');
    fireEvent.mouseDown(connectorBtn);
    expect(onStartConnectorMock).toHaveBeenCalledTimes(1);
  });
});
