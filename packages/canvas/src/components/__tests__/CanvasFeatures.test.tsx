import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CanvasShape } from '../CanvasShape.js';
import { ConnectorLine } from '../ConnectorLine.js';
import { CanvasElement } from '@catnoted/shared';

describe('CanvasShape component integration tests', () => {
  it('renders a sticky note with customized text content and color', () => {
    const noteElem: CanvasElement = {
      id: 'note-1',
      type: 'note',
      x: 100,
      y: 150,
      width: 200,
      height: 200,
      zIndex: 10,
      rotation: 0,
      text: 'This is a test sticky note!',
      color: '#fbbf24', // Amber
    };

    const handleDragStart = vi.fn();
    const handleChangeText = vi.fn();

    render(
      <CanvasShape
        canvasElem={noteElem}
        isSelected={false}
        onDragStart={handleDragStart}
        onChangeText={handleChangeText}
      />
    );

    // Verify header title
    expect(screen.getByText('Sticky Note')).toBeDefined();

    // Verify textarea content
    const textarea = screen.getByPlaceholderText('Type something...') as HTMLTextAreaElement;
    expect(textarea.value).toBe('This is a test sticky note!');

    // Change text input
    fireEvent.change(textarea, { target: { value: 'Updated note!' } });
    expect(handleChangeText).toHaveBeenCalledWith('note-1', 'Updated note!');
  });

  it('renders a frame with border styles and title editing', () => {
    const frameElem: CanvasElement = {
      id: 'frame-1',
      type: 'frame',
      x: 50,
      y: 50,
      width: 400,
      height: 300,
      zIndex: 2,
      rotation: 15,
      text: 'My Group Frame',
      borderStyle: 'dashed',
      borderColor: '#6366f1',
    };

    const handleDragStart = vi.fn();
    const handleChangeText = vi.fn();

    render(
      <CanvasShape
        canvasElem={frameElem}
        isSelected={true}
        onDragStart={handleDragStart}
        onChangeText={handleChangeText}
      />
    );

    // Verify label and header inputs
    expect(screen.getByText('Frame')).toBeDefined();
    const frameInput = screen.getByPlaceholderText('Frame Title') as HTMLInputElement;
    expect(frameInput.value).toBe('My Group Frame');

    fireEvent.change(frameInput, { target: { value: 'New Frame Title' } });
    expect(handleChangeText).toHaveBeenCalledWith('frame-1', 'New Frame Title');

    // Verify rotation handle exists when selected
    expect(screen.getByTitle('Rotate')).toBeDefined();
  });

  it('renders an SVG circle shape with customized color properties', () => {
    const circleElem: CanvasElement = {
      id: 'shape-circle-1',
      type: 'shape',
      shapeType: 'circle',
      x: 200,
      y: 200,
      width: 150,
      height: 150,
      zIndex: 12,
      rotation: 0,
      text: 'Circle Text',
      color: '#10b981',
    };

    const handleDragStart = vi.fn();

    render(
      <CanvasShape
        canvasElem={circleElem}
        isSelected={false}
        onDragStart={handleDragStart}
      />
    );

    // Check custom text rendering inside shape
    const textarea = screen.getByPlaceholderText('...') as HTMLTextAreaElement;
    expect(textarea.value).toBe('Circle Text');
  });
});

describe('ConnectorLine svg connector tests', () => {
  it('renders connector line with custom connection text label', () => {
    render(
      <ConnectorLine
        startX={100}
        startY={150}
        endX={400}
        endY={350}
        label="Refers To"
      />
    );

    // Verify text label is rendered inside the SVG block
    expect(screen.getByText('Refers To')).toBeDefined();
  });
});
