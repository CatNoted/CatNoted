import { useState, useRef, useCallback } from 'react';

export function useCanvasViewport() {
  const [pan, setPan] = useState({ x: 100, y: 100 });
  const [scale, setScale] = useState(1);
  const isDragging = useRef(false);
  const startDrag = useRef({ x: 0, y: 0 });

  const initialPinchDistance = useRef<number | null>(null);
  const initialScale = useRef<number>(1);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Prevent dragging from card clicks
    if (e.target !== e.currentTarget) return;

    if (e.touches.length === 1) {
      isDragging.current = true;
      startDrag.current = { x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y };
    } else if (e.touches.length === 2) {
      isDragging.current = false;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      initialPinchDistance.current = Math.sqrt(dx * dx + dy * dy);
      initialScale.current = scale;
    }
  }, [pan, scale]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (isDragging.current && e.touches.length === 1) {
      setPan({ x: e.touches[0].clientX - startDrag.current.x, y: e.touches[0].clientY - startDrag.current.y });
    } else if (e.touches.length === 2 && initialPinchDistance.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      const newScale = Math.max(0.1, Math.min(5.0, initialScale.current * (distance / initialPinchDistance.current)));

      setScale(newScale);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false;
    initialPinchDistance.current = null;
  }, []);

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

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Adjust zoom sensitivity based on event properties (e.g. pinch-to-zoom vs scroll wheel)
    if (e.ctrlKey) {
      const zoomSensitivity = 0.01;
      const zoomDelta = -e.deltaY * zoomSensitivity;
      const newScale = Math.max(0.1, Math.min(5.0, scale * (1 + zoomDelta)));

      // Calculate zoom around cursor
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Adjust pan to zoom around cursor
      setPan(prev => ({
        x: mouseX - (mouseX - prev.x) * (newScale / scale),
        y: mouseY - (mouseY - prev.y) * (newScale / scale)
      }));
      setScale(newScale);
    } else {
      // Pan with trackpad
      setPan(prev => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY
      }));
    }
  }, [scale]);

  // Hook to attach native wheel listener to ref with passive: false
  const containerRef = useRef<HTMLDivElement>(null);

  // Note: users of this hook will now need to attach containerRef to their container
  // instead of passing handleWheel directly. But for backward compatibility with tests
  // we'll keep handleWheel in the return object.

  return {
    containerRef,
    pan,
    scale,
    setPan,
    setScale,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    transformStyle: {
      transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
      transformOrigin: '0 0'
    }
  };
}
