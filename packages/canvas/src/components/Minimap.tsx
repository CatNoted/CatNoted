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
  const elementList = Object.values(elements).filter(el => el.type === 'card');

  const boundsMinX = Math.min(-200, ...elementList.map(el => el.x)) - 200;
  const boundsMaxX = Math.max(1200, ...elementList.map(el => el.x + (el.width || 260))) + 200;
  const boundsMinY = Math.min(-200, ...elementList.map(el => el.y)) - 200;
  const boundsMaxY = Math.max(800, ...elementList.map(el => el.y + (el.height || 120))) + 200;

  const boundsWidth = boundsMaxX - boundsMinX;
  const boundsHeight = boundsMaxY - boundsMinY;

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
    <div className="flex flex-col gap-1 items-end">
      <span className="text-[8px] font-mono font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Navigation Minimap</span>
      <div
        ref={minimapRef}
        onMouseDown={handleMouseDown}
        style={{ width: minimapWidth, height: minimapHeight }}
        className="bg-white/60 dark:bg-zinc-950/60 border border-slate-200/40 dark:border-zinc-800/60 rounded-2xl relative overflow-hidden shadow-sm cursor-crosshair select-none backdrop-blur-md transition-shadow hover:shadow-md"
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
                width: Math.max(4, mw),
                height: Math.max(3, mh),
              }}
              className="absolute bg-slate-200 dark:bg-zinc-800/50 border border-slate-300/20 dark:border-zinc-700/30 rounded-md"
            />
          );
        })}

        {/* Viewport Overlay Box (Premium Indigo styling) */}
        <div
          style={{
            left: viewX,
            top: viewY,
            width: viewWidth,
            height: viewHeight,
          }}
          className="absolute border border-indigo-500 bg-indigo-500/10 rounded-lg pointer-events-none transition-[left,top,width,height] duration-75"
        />
      </div>
    </div>
  );
};
