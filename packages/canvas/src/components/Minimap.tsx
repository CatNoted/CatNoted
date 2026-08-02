import React, { useRef, useEffect } from 'react';
import { CanvasElement } from '@catnoted/shared';

interface MinimapProps {
  elements: Record<string, CanvasElement>;
  pan: { x: number; y: number };
  scale: number;
  onPanChange: (pan: { x: number; y: number }) => void;
  viewportWidth?: number;
  viewportHeight?: number;
}

export const Minimap: React.FC<MinimapProps> = ({
  elements,
  pan,
  scale,
  onPanChange,
  viewportWidth = 900,
  viewportHeight = 500
}) => {
  const minimapRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  // Constants for minimap container dimensions
  const minimapWidth = 160;
  const minimapHeight = 100;

  // 1. Calculate boundaries of all elements on the canvas
  // ⚡ Bolt Optimization: Memoize filtering to prevent O(N) scans on every frame
  const elementList = React.useMemo(() => Object.values(elements).filter(el => el.type === 'card'), [elements]);

  // ⚡ Bolt Optimization: Memoize boundary calculation using a single-pass iteration
  // rather than multiple map/spread operations to reduce allocations and CPU overhead on every pan/zoom
  const bounds = React.useMemo(() => {
    let minX = -200;
    let maxX = 1200;
    let minY = -200;
    let maxY = 800;

    for (let i = 0; i < elementList.length; i++) {
      const el = elementList[i];
      if (el.x < minX) minX = el.x;
      if (el.x + (el.width || 260) > maxX) maxX = el.x + (el.width || 260);
      if (el.y < minY) minY = el.y;
      if (el.y + (el.height || 120) > maxY) maxY = el.y + (el.height || 120);
    }

    const boundsMinX = minX - 200;
    const boundsMaxX = maxX + 200;
    const boundsMinY = minY - 200;
    const boundsMaxY = maxY + 200;

    return {
      boundsMinX,
      boundsMaxX,
      boundsMinY,
      boundsMaxY,
      boundsWidth: boundsMaxX - boundsMinX,
      boundsHeight: boundsMaxY - boundsMinY
    };
  }, [elementList]);

  const { boundsMinX, boundsMaxX, boundsMinY, boundsMaxY, boundsWidth, boundsHeight } = bounds;

  // Map canvas coordinate to minimap scale
  const scaleX = (x: number) => ((x - boundsMinX) / boundsWidth) * minimapWidth;
  const scaleY = (y: number) => ((y - boundsMinY) / boundsHeight) * minimapHeight;

  // Current viewport bounds in canvas space
  const visibleLeft = -pan.x / scale;
  const visibleTop = -pan.y / scale;
  const visibleWidth = viewportWidth / scale;
  const visibleHeight = viewportHeight / scale;

  // Map viewport to minimap coordinates
  const viewX = Math.max(0, Math.min(minimapWidth, scaleX(visibleLeft)));
  const viewY = Math.max(0, Math.min(minimapHeight, scaleY(visibleTop)));
  const viewWidth = Math.max(10, Math.min(minimapWidth, (visibleWidth / boundsWidth) * minimapWidth));
  const viewHeight = Math.max(10, Math.min(minimapHeight, (visibleHeight / boundsHeight) * minimapHeight));

  const handleDragUpdate = (clientX: number, clientY: number) => {
    if (!minimapRef.current) return;
    const rect = minimapRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, clientY - rect.top));

    // Calculate target center in canvas space
    const targetCenterX = (x / rect.width) * boundsWidth + boundsMinX;
    const targetCenterY = (y / rect.height) * boundsHeight + boundsMinY;

    onPanChange({
      x: viewportWidth / 2 - targetCenterX * scale,
      y: viewportHeight / 2 - targetCenterY * scale
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    isDraggingRef.current = true;
    handleDragUpdate(e.clientX, e.clientY);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      handleDragUpdate(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [pan, scale, boundsMinX, boundsWidth, boundsMinY, boundsHeight, viewportWidth, viewportHeight]);

  return (
    <div className="flex flex-col gap-1.5 items-end">
      <span className="text-[9px] font-mono font-semibold text-muted-foreground/80 uppercase tracking-widest">Minimap navigation</span>
      <div
        ref={minimapRef}
        onMouseDown={handleMouseDown}
        style={{ width: minimapWidth, height: minimapHeight }}
        className="bg-card/70 border border-border rounded-2xl relative overflow-hidden shadow-lg shadow-border/5 cursor-crosshair select-none backdrop-blur-md"
      >
        {/* Dynamic mini representations of cards */}
        {elementList.map(el => {
          const mx = scaleX(el.x);
          const my = scaleY(el.y);
          const mw = ((el.width || 260) / boundsWidth) * minimapWidth;
          const mh = ((el.height || 120) / boundsHeight) * minimapHeight;

          return (
            <div
              key={`mini-${el.id}`}
              style={{
                left: mx,
                top: my,
                width: Math.max(6, mw),
                height: Math.max(4, mh),
              }}
              className="absolute bg-primary/10 border border-primary/20 rounded-sm"
            />
          );
        })}

        {/* Viewport Overlay Box */}
        <div
          style={{
            left: viewX,
            top: viewY,
            width: viewWidth,
            height: viewHeight,
          }}
          className="absolute border-2 border-primary/80 bg-primary/10 rounded-md pointer-events-none transition-[left,top,width,height] duration-75 shadow-[0_0_0_9999px_rgba(0,0,0,0.1)] dark:shadow-[0_0_0_9999px_rgba(0,0,0,0.3)]"
        />
      </div>
    </div>
  );
};
