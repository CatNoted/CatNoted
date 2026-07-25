import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCanvasViewport } from '@catnoted/canvas';

describe('Canvas Viewport (useCanvasViewport)', () => {
  it('should initialize with default pan and scale', () => {
    const { result } = renderHook(() => useCanvasViewport());
    expect(result.current.pan).toEqual({ x: 100, y: 100 });
    expect(result.current.scale).toBe(1);
  });

  it('should handle dragging', () => {
    const { result } = renderHook(() => useCanvasViewport());
    const mockTarget = {};

    act(() => {
      result.current.handleMouseDown({
        clientX: 200,
        clientY: 200,
        button: 0,
        target: mockTarget,
        currentTarget: mockTarget
      } as unknown as React.MouseEvent);
    });

    act(() => {
      result.current.handleMouseMove({
        clientX: 250,
        clientY: 300
      } as unknown as React.MouseEvent);
    });

    expect(result.current.pan).toEqual({ x: 150, y: 200 });

    act(() => {
      result.current.handleMouseUp();
    });

    act(() => {
      result.current.handleMouseMove({
        clientX: 400,
        clientY: 400
      } as unknown as React.MouseEvent);
    });

    // Pan should not change after mouse up
    expect(result.current.pan).toEqual({ x: 150, y: 200 });
  });

  it('should handle zooming', () => {
    const { result } = renderHook(() => useCanvasViewport());

    const mockEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      ctrlKey: true,
      deltaY: 100, // Zoom out
      clientX: 150,
      clientY: 150,
      currentTarget: {
        getBoundingClientRect: () => ({ left: 0, top: 0 })
      }
    } as unknown as WheelEvent;

    act(() => {
      result.current.handleWheel(mockEvent);
    });

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    expect(result.current.scale).toBeLessThan(1);
  });
});
