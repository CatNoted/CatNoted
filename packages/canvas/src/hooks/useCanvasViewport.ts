import { useState, useRef, useCallback, useEffect } from 'react';

export function useCanvasViewport() {
  const [pan, setPan] = useState({ x: 100, y: 100 });
  const [scale, setScale] = useState(1);
  const isDragging = useRef(false);
  const startDrag = useRef({ x: 0, y: 0 });
  const [isSpacePan, setIsSpacePan] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        setIsSpacePan(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePan(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Prevent dragging from card clicks unless space panning
    if (!isSpacePan && e.target !== e.currentTarget) return;

    if (e.button === 0 || e.button === 1 || isSpacePan) {
      isDragging.current = true;
      startDrag.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  }, [pan, isSpacePan]);

  const handleMouseMove = useCallback((e: React.MouseEvent | MouseEvent) => {
    if (!isDragging.current) return;
    setPan({
      x: e.clientX - startDrag.current.x,
      y: e.clientY - startDrag.current.y
    });
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  // For testing purposes since we removed the returned handleWheel
  const handleWheel = useCallback((e: React.WheelEvent) => {
    const zoomFactor = -e.deltaY * 0.01;
    setScale((prevScale) => Math.max(0.1, Math.min(5, prevScale * Math.exp(zoomFactor))));
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheelNative = (e: WheelEvent) => {
      e.preventDefault();

      if (e.ctrlKey || e.metaKey) {
        // Pinch-zoom feel (centered)
        const zoomFactor = -e.deltaY * 0.01;

        setScale((prevScale) => {
          const newScale = Math.max(0.1, Math.min(5, prevScale * Math.exp(zoomFactor)));

          if (container) {
            const rect = container.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            setPan((prevPan) => {
              const dx = mouseX - prevPan.x;
              const dy = mouseY - prevPan.y;
              return {
                x: mouseX - dx * (newScale / prevScale),
                y: mouseY - dy * (newScale / prevScale)
              };
            });
          }
          return newScale;
        });
      } else {
        // Spacebar / Trackpad pan
        setPan((prevPan) => ({
          x: prevPan.x - e.deltaX,
          y: prevPan.y - e.deltaY
        }));
      }
    };

    container.addEventListener('wheel', handleWheelNative, { passive: false });
    return () => container.removeEventListener('wheel', handleWheelNative);
  }, []);

  return {
    pan,
    scale,
    setPan,
    setScale,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    containerRef,
    isSpacePan,
    transformStyle: {
      transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
      transformOrigin: '0 0'
    }
  };
}
