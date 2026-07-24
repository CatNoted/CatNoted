import { renderHook, act } from '@testing-library/react';
import { useCanvasViewport } from './useCanvasViewport.js';
import { describe, it, expect, vi } from 'vitest';

const mockEvent = (overrides = {}) => ({
  preventDefault: vi.fn(),
  stopPropagation: vi.fn(),
  ...overrides
});

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
      // @ts-ignore - circumventing strict readonly for test mock
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

  it('should ignore dragging if event target is not currentTarget', () => {
    const { result } = renderHook(() => useCanvasViewport());

    act(() => {
      const mouseDownEvent = {
        button: 0,
        clientX: 150,
        clientY: 150,
        target: document.createElement('div'),
        currentTarget: document.createElement('div'),
      } as unknown as React.MouseEvent;
      // Different target and currentTarget
      result.current.handleMouseDown(mouseDownEvent);
    });

    act(() => {
      const mouseMoveEvent = {
        clientX: 200,
        clientY: 250,
      } as unknown as React.MouseEvent;

      result.current.handleMouseMove(mouseMoveEvent);
    });

    expect(result.current.pan).toEqual({ x: 100, y: 100 });
  });

  it('should handle zooming', () => {
    const { result } = renderHook(() => useCanvasViewport());

    // Zoom in
    act(() => {
      const wheelEvent = mockEvent({
        deltaY: -100, // scrolling up, should zoom in
        ctrlKey: true, clientX: 0, clientY: 0, currentTarget: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 1000, height: 1000 }) }
      }) as unknown as WheelEvent;

      result.current.handleWheel(wheelEvent);
    });

    expect(result.current.scale).toBe(2.0);

    // Zoom out
    act(() => {
      const wheelEvent = mockEvent({
        deltaY: 100, // scrolling down, should zoom out
        ctrlKey: true, clientX: 0, clientY: 0, currentTarget: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 1000, height: 1000 }) }
      }) as unknown as WheelEvent;

      result.current.handleWheel(wheelEvent);
    });

    expect(result.current.scale).toBe(0.1); // 2.0 * (1 - 100*0.01) = 0
  });

  it('should clamp zoom scale between 0.1 and 5.0', () => {
    const { result } = renderHook(() => useCanvasViewport());

    // Zoom out to minimum
    for (let i = 0; i < 20; i++) {
      act(() => {
        result.current.handleWheel(mockEvent({ deltaY: 100, ctrlKey: true, clientX: 0, clientY: 0, currentTarget: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 1000, height: 1000 }) } }) as any);
      });
    }
    expect(result.current.scale).toBe(0.1);

    // Zoom in to maximum
    for (let i = 0; i < 50; i++) {
      act(() => {
        result.current.handleWheel(mockEvent({ deltaY: -100, ctrlKey: true, clientX: 0, clientY: 0, currentTarget: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 1000, height: 1000 }) } }) as any);
      });
    }
    expect(result.current.scale).toBe(5.0);
  });
});
