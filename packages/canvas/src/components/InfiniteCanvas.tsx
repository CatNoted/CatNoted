import React, { useState, useEffect, useRef } from 'react';
import { useDocumentStore, ydoc } from '@catnoted/editor';
import { CanvasElement } from '@catnoted/shared';
import { useCanvasViewport } from '../hooks/useCanvasViewport.js';
import { CanvasCard } from './CanvasCard.js';
import { ConnectorLine } from './ConnectorLine.js';

// Sync layout with the same shared Y.Doc
export const ycanvas = ydoc.getMap<CanvasElement>('canvas');

export const InfiniteCanvas: React.FC = () => {
  const { blocks } = useDocumentStore();
  const [elements, setElements] = useState<Record<string, CanvasElement>>({});
  const activeDragId = useRef<string | null>(null);
  const dragStartOffset = useRef({ x: 0, y: 0 });

  const {
    pan,
    scale,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    transformStyle
  } = useCanvasViewport();

  // Sync elements map from Yjs
  useEffect(() => {
    const updateElements = () => {
      const currentMap: Record<string, CanvasElement> = {};
      Array.from(ycanvas.keys()).forEach(key => {
        const val = ycanvas.get(key);
        if (val) currentMap[key] = val;
      });
      setElements(currentMap);
    };

    updateElements();
    ycanvas.observe(updateElements);
    return () => {
      ycanvas.unobserve(updateElements);
    };
  }, []);

  // Prepopulate coordinates for blocks that don't have position elements in Yjs
  useEffect(() => {
    ydoc.transact(() => {
      blocks.forEach((block, index) => {
        if (!ycanvas.has(block.id)) {
          ycanvas.set(block.id, {
            id: block.id,
            type: 'card',
            x: 80 + index * 120,
            y: 80 + (index % 2) * 160,
            width: 240,
            height: 120,
            zIndex: 10,
            rotation: 0,
            blockId: block.id
          });
        }
      });
    });
  }, [blocks]);

  const handleCardDragStart = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    activeDragId.current = id;
    const elem = elements[id] || { x: 0, y: 0 };
    // Adjust drag initial offset considering zoom scale
    dragStartOffset.current = {
      x: e.clientX - elem.x * scale,
      y: e.clientY - elem.y * scale
    };
  };

  const handleGlobalMouseMove = (e: React.MouseEvent) => {
    // If panning canvas
    handleMouseMove(e);

    // If dragging card
    if (activeDragId.current) {
      const id = activeDragId.current;
      const newX = (e.clientX - dragStartOffset.current.x) / scale;
      const newY = (e.clientY - dragStartOffset.current.y) / scale;

      const current = ycanvas.get(id);
      if (current) {
        ycanvas.set(id, {
          ...current,
          x: Math.round(newX),
          y: Math.round(newY)
        });
      }
    }
  };

  const handleGlobalMouseUp = () => {
    handleMouseUp();
    activeDragId.current = null;
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseMove={handleGlobalMouseMove}
      onMouseUp={handleGlobalMouseUp}
      onWheel={handleWheel}
      className="h-[75vh] w-full border border-slate-200 dark:border-zinc-800 rounded-3xl overflow-hidden bg-slate-50 dark:bg-zinc-950 shadow-inner relative cursor-grab active:cursor-grabbing select-none"
    >
      {/* Dynamic Dot Grid Background */}
      <div 
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px)`,
          backgroundSize: `${24 * scale}px ${24 * scale}px`,
          backgroundImage: 'radial-gradient(#cbd5e1 1.5px, transparent 1.5px)',
        }}
        className="absolute inset-0 dark:opacity-30 pointer-events-none opacity-60 bg-repeat"
      />
      <div 
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px)`,
          backgroundSize: `${24 * scale}px ${24 * scale}px`,
          backgroundImage: 'radial-gradient(#27272a 1.5px, transparent 1.5px)',
        }}
        className="absolute inset-0 hidden dark:block pointer-events-none opacity-50 bg-repeat"
      />

      {/* Infinite Canvas Content Viewport */}
      <div style={transformStyle} className="absolute inset-0 pointer-events-none">
        
        {/* Draw SVG Connectors between sequential cards */}
        {blocks.map((block, index) => {
          if (index === 0) return null;
          const prevBlock = blocks[index - 1];
          const startElem = elements[prevBlock.id];
          const endElem = elements[block.id];

          if (!startElem || !endElem) return null;

          return (
            <ConnectorLine
              key={`conn-${prevBlock.id}-${block.id}`}
              startX={startElem.x + 120}
              startY={startElem.y + 60}
              endX={endElem.x + 120}
              endY={endElem.y}
              label={`Next Block`}
            />
          );
        })}

        {/* Draw Draggable Cards */}
        {blocks.map(block => {
          const elem = elements[block.id];
          if (!elem) return null;

          return (
            <div key={block.id} className="pointer-events-auto">
              <CanvasCard
                block={block}
                canvasElem={elem}
                onDragStart={handleCardDragStart}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
