import { useState, useRef, useCallback, useEffect } from 'react';

export function useCanvasViewport(containerRef?: React.RefObject<HTMLElement | null>) {
  const [pan, setPan] = useState({ x: 100, y: 100 });
  const [scale, setScale] = useState(1);
  const isDragging = useRef(false);
  const startDrag = useRef({ x: 0, y: 0 });

  const scaleRef = useRef(scale);
  const panRef = useRef(pan);

  useEffect(() => {
    scaleRef.current = scale;
    panRef.current = pan;
  }, [scale, pan]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Prevent dragging from card clicks (we only want workspace background drag)
    if (e.target !== e.currentTarget) return;

    if (e.button === 0 || e.button === 1 || e.button === 2) { // Allow right click pan too
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

  const handleWheel = useCallback((e: WheelEvent | React.WheelEvent) => {
    // Stop React from complaining about event.preventDefault() not being a function on synthetic events if passive
    if ('preventDefault' in e && typeof e.preventDefault === 'function') {
      try {
        e.preventDefault();
      } catch (err) {
        // Ignore synthetic passive errors
      }
    }

    if (e.ctrlKey || e.metaKey || (e as any).pinch) {
      // Zoom
      // Pinch-to-zoom or Ctrl+Scroll
      const zoomFactor = -e.deltaY * 0.01;
      const newScale = Math.max(0.1, Math.min(5, scaleRef.current * Math.exp(zoomFactor)));

      const mouseX = e.clientX;
      const mouseY = e.clientY;

      // Calculate pan adjustment for zoom-to-mouse
      const ratio = 1 - newScale / scaleRef.current;

      setPan(prevPan => ({
        x: prevPan.x + (mouseX - prevPan.x) * ratio,
        y: prevPan.y + (mouseY - prevPan.y) * ratio
      }));
      setScale(newScale);
    } else {
      // Pan
      setPan(prevPan => ({
        x: prevPan.x - e.deltaX,
        y: prevPan.y - e.deltaY
      }));
    }
  }, []);

  useEffect(() => {
    const el = containerRef?.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      handleWheel(e);
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
    };
  }, [containerRef, handleWheel]);

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
