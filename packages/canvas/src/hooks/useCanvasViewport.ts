import { useState, useRef, useCallback } from 'react';

export function useCanvasViewport() {
  const [pan, setPan] = useState({ x: 100, y: 100 });
  const [scale, setScale] = useState(1);
  const isDragging = useRef(false);
  const startDrag = useRef({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Prevent dragging from card clicks (we only want workspace background drag)
    if (e.target !== e.currentTarget) return;

    if (e.button === 0 || e.button === 1) {
      isDragging.current = true;
      startDrag.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    setPan({
      x: e.clientX - startDrag.current.x,
      y: e.clientY - startDrag.current.y
    });
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    const zoomFactor = 0.05;
    const direction = e.deltaY < 0 ? 1 : -1;
    const newScale = Math.max(0.3, Math.min(2.5, scale + direction * zoomFactor));
    setScale(newScale);
  }, [scale]);

  return {
    pan,
    scale,
    setPan,
    setScale,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    transformStyle: {
      transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
      transformOrigin: '0 0'
    }
  };
}
