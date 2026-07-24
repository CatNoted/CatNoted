const fs = require('fs');

// 1. Fix hook for passive event listener warning (preventDefault inside passive)
// We need to attach the listener directly using useEffect so we can pass { passive: false }
let hookContent = fs.readFileSync('packages/canvas/src/hooks/useCanvasViewport.ts', 'utf8');

const hookOld = `  const handleWheel = useCallback((e: React.WheelEvent) => {
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

  return {`;

const hookNew = `  const handleWheel = useCallback((e: WheelEvent) => {
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
    containerRef,`;

hookContent = hookContent.replace(hookOld, hookNew);
hookContent = hookContent.replace(
  `import { useState, useRef, useCallback } from 'react';`,
  `import { useState, useRef, useCallback, useEffect } from 'react';`
);

fs.writeFileSync('packages/canvas/src/hooks/useCanvasViewport.ts', hookContent, 'utf8');

// Update InfiniteCanvas to use containerRef and attach the native wheel event listener
let canvasContent = fs.readFileSync('packages/canvas/src/components/InfiniteCanvas.tsx', 'utf8');
// We need to add the ref to InfiniteCanvas and attach the listener.
const oldCanvasViewportDestructure = `    setPan,
    setScale,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    transformStyle
  } = useCanvasViewport();`;

const newCanvasViewportDestructure = `    setPan,
    setScale,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    transformStyle,
    containerRef
  } = useCanvasViewport();

  // Attach native wheel event for zooming/panning
  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      el.addEventListener('wheel', handleWheel, { passive: false });
      return () => {
        el.removeEventListener('wheel', handleWheel);
      };
    }
  }, [handleWheel]);`;

canvasContent = canvasContent.replace(oldCanvasViewportDestructure, newCanvasViewportDestructure);

// Replace onWheel={handleWheel} with ref={containerRef}
canvasContent = canvasContent.replace(
  `      onMouseUp={handleGlobalMouseUp}\n      onWheel={handleWheel}`,
  `      onMouseUp={handleGlobalMouseUp}\n      ref={containerRef}`
);

fs.writeFileSync('packages/canvas/src/components/InfiniteCanvas.tsx', canvasContent, 'utf8');
