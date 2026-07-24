import { renderHook, act } from '@testing-library/react';
import { useCanvasViewport } from './useCanvasViewport.js';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';

describe('useCanvasViewport', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useCanvasViewport());
    expect(result.current.pan).toEqual({ x: 100, y: 100 });
    expect(result.current.scale).toBe(1);
    expect(result.current.transformStyle).toEqual({
      transform: 'translate(100px, 100px) scale(1)',
      transformOrigin: '0 0'
    });
  });

  it('should update pan state via setPan', () => {
    const { result } = renderHook(() => useCanvasViewport());
    act(() => {
      result.current.setPan({ x: 200, y: 300 });
    });
    expect(result.current.pan).toEqual({ x: 200, y: 300 });
  });

  it('should update scale state via setScale', () => {
    const { result } = renderHook(() => useCanvasViewport());
    act(() => {
      result.current.setScale(1.5);
    });
    expect(result.current.scale).toBe(1.5);
  });

  it('should handle dragging', () => {
    const { result } = renderHook(() => useCanvasViewport());

    // Mouse down
    act(() => {
      const mouseDownEvent = {
        button: 0,
        clientX: 150,
        clientY: 150,
        target: document.createElement('div'),
        currentTarget: document.createElement('div'),
      } as unknown as React.MouseEvent;
      // Mock same target to bypass target check
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      mouseDownEvent.currentTarget = mouseDownEvent.target;

      result.current.handleMouseDown(mouseDownEvent);
    });

    // Mouse move
    act(() => {
      const mouseMoveEvent = {
        clientX: 200,
        clientY: 250,
      } as unknown as React.MouseEvent;

      result.current.handleMouseMove(mouseMoveEvent);
    });

    expect(result.current.pan).toEqual({ x: 150, y: 200 });

    // Mouse up
    act(() => {
      result.current.handleMouseUp();
    });

    // Subsequent move should be ignored
    act(() => {
      const mouseMoveEvent2 = {
        clientX: 300,
        clientY: 300,
      } as unknown as React.MouseEvent;
      result.current.handleMouseMove(mouseMoveEvent2);
    });

    expect(result.current.pan).toEqual({ x: 150, y: 200 });
  });

  it('should handle panning via wheel when ctrl/meta is not pressed', () => {
    const { result } = renderHook(() => useCanvasViewport());

    act(() => {
      const wheelEvent = {
        deltaX: 50,
        deltaY: 20,
        ctrlKey: false,
        metaKey: false,
        clientX: 0,
        clientY: 0,
        preventDefault: vi.fn(),
      } as unknown as WheelEvent;

      result.current.handleWheel(wheelEvent);
    });

    // 100 - 50 = 50, 100 - 20 = 80
    expect(result.current.pan).toEqual({ x: 50, y: 80 });
    expect(result.current.scale).toBe(1);
  });

  it('should handle zooming via wheel when ctrlKey is pressed', () => {
    const { result } = renderHook(() => useCanvasViewport());

    act(() => {
      const wheelEvent = {
        deltaX: 0,
        deltaY: -100, // scrolling up, should zoom in
        ctrlKey: true,
        metaKey: false,
        clientX: 100,
        clientY: 100,
        preventDefault: vi.fn(),
      } as unknown as WheelEvent;

      result.current.handleWheel(wheelEvent);
    });

    expect(result.current.scale).toBeGreaterThan(1);
  });
});
