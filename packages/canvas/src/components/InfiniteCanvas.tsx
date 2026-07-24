import React, { useState, useEffect, useRef } from 'react';
import { useDocumentStore, ydoc } from '@catnoted/editor';
import { CanvasElement } from '@catnoted/shared';
import { useCanvasViewport } from '../hooks/useCanvasViewport.js';
import { CanvasCard } from './CanvasCard.js';
import { ConnectorLine } from './ConnectorLine.js';
import { Minimap } from './Minimap.js';
import { Trash2 } from 'lucide-react';

export const ycanvas = ydoc.getMap<CanvasElement>('canvas');

export const InfiniteCanvas: React.FC = () => {
  const { blocks } = useDocumentStore();
  const [elements, setElements] = useState<Record<string, CanvasElement>>({});

  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Custom connector drawing states
  const [activeConnectorStart, setActiveConnectorStart] = useState<string | null>(null);
  const [connectorMousePos, setConnectorMousePos] = useState<{ x: number; y: number } | null>(null);

  // Marquee selection states
  const [marqueeStart, setMarqueeStart] = useState<{ x: number; y: number } | null>(null);
  const [marqueeEnd, setMarqueeEnd] = useState<{ x: number; y: number } | null>(null);

  // Drag states
  const activeDragId = useRef<string | null>(null);
  const dragStartCoords = useRef<Record<string, { x: number; y: number }>>({});
  const dragStartMouse = useRef({ x: 0, y: 0 });

  const {
    pan,
    scale,
    setPan,
    setScale,
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

  // Handle keyboard Delete / Backspace to remove selected elements or custom connectors
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const activeElement = document.activeElement;
        if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.getAttribute('contenteditable') === 'true')) {
          return;
        }
        if (selectedIds.length > 0) {
          ydoc.transact(() => {
            selectedIds.forEach(id => {
              if (ycanvas.has(id)) {
                const elem = ycanvas.get(id);
                if (elem && elem.type === 'connector') {
                  ycanvas.delete(id);
                }
              }
            });
          });
          setSelectedIds([]);
        }
      } else if (e.key === 'Escape') {
        setSelectedIds([]);
        setActiveConnectorStart(null);
        setConnectorMousePos(null);
        setMarqueeStart(null);
        setMarqueeEnd(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds]);

  // Handle starting a connection drag
  const handleStartConnector = (e: React.MouseEvent, fromId: string) => {
    e.stopPropagation();
    setActiveConnectorStart(fromId);

    // Convert client coordinates to canvas coordinates
    const canvasX = (e.clientX - pan.x) / scale;
    const canvasY = (e.clientY - pan.y) / scale;
    setConnectorMousePos({ x: canvasX, y: canvasY });
  };

  // Drag select toggle
  const handleSelectToggle = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (e.shiftKey) {
      setSelectedIds(prev => {
        if (prev.includes(id)) {
          return prev.filter(item => item !== id);
        } else {
          return [...prev, id];
        }
      });
    } else {
      if (!selectedIds.includes(id)) {
        setSelectedIds([id]);
      }
    }
  };

  const handleCardDragStart = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    activeDragId.current = id;

    let targetDragIds = [...selectedIds];
    if (!targetDragIds.includes(id)) {
      if (e.shiftKey) {
        targetDragIds = [...targetDragIds, id];
        setSelectedIds(targetDragIds);
      } else {
        targetDragIds = [id];
        setSelectedIds(targetDragIds);
      }
    }

    dragStartMouse.current = { x: e.clientX, y: e.clientY };
    const coords: Record<string, { x: number; y: number }> = {};
    targetDragIds.forEach(dragId => {
      const elem = elements[dragId];
      if (elem) {
        coords[dragId] = { x: elem.x, y: elem.y };
      }
    });
    dragStartCoords.current = coords;
  };

  const handleGlobalMouseMove = (e: React.MouseEvent) => {
    // If drawing custom connector
    if (activeConnectorStart) {
      const canvasX = (e.clientX - pan.x) / scale;
      const canvasY = (e.clientY - pan.y) / scale;
      setConnectorMousePos({ x: canvasX, y: canvasY });
      return;
    }

    // If drawing marquee selection
    if (marqueeStart) {
      const canvasX = (e.clientX - pan.x) / scale;
      const canvasY = (e.clientY - pan.y) / scale;
      setMarqueeEnd({ x: canvasX, y: canvasY });
      return;
    }

    // If dragging card(s)
    if (activeDragId.current) {
      const deltaX = (e.clientX - dragStartMouse.current.x) / scale;
      const deltaY = (e.clientY - dragStartMouse.current.y) / scale;

      ydoc.transact(() => {
        Object.keys(dragStartCoords.current).forEach(id => {
          const start = dragStartCoords.current[id];
          const current = ycanvas.get(id);
          if (current && start) {
            ycanvas.set(id, {
              ...current,
              x: Math.round(start.x + deltaX),
              y: Math.round(start.y + deltaY)
            });
          }
        });
      });
      return;
    }

    // Otherwise, pan canvas
    handleMouseMove(e);
  };

  const handleGlobalMouseUp = (e: React.MouseEvent) => {
    // 1. If drawing custom connector
    if (activeConnectorStart) {
      const canvasX = (e.clientX - pan.x) / scale;
      const canvasY = (e.clientY - pan.y) / scale;

      // Find if we dropped onto any other card
      let targetCardId: string | null = null;
      blocks.forEach(block => {
        const elem = elements[block.id];
        if (elem && block.id !== activeConnectorStart) {
          const w = elem.width || 260;
          const h = elem.height || 120;
          if (
            canvasX >= elem.x &&
            canvasX <= elem.x + w &&
            canvasY >= elem.y &&
            canvasY <= elem.y + h
          ) {
            targetCardId = block.id;
          }
        }
      });

      if (targetCardId) {
        const connId = `connector-${activeConnectorStart}-${targetCardId}`;
        ydoc.transact(() => {
          ycanvas.set(connId, {
            id: connId,
            type: 'connector',
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            zIndex: 1,
            rotation: 0,
            connector: {
              id: connId,
              from: activeConnectorStart,
              to: targetCardId as string,
              type: 'bezier'
            }
          });
        });
      }

      setActiveConnectorStart(null);
      setConnectorMousePos(null);
      return;
    }

    // 2. If marquee selection
    if (marqueeStart && marqueeEnd) {
      const left = Math.min(marqueeStart.x, marqueeEnd.x);
      const right = Math.max(marqueeStart.x, marqueeEnd.x);
      const top = Math.min(marqueeStart.y, marqueeEnd.y);
      const bottom = Math.max(marqueeStart.y, marqueeEnd.y);

      const newlySelected: string[] = [];
      blocks.forEach(block => {
        const elem = elements[block.id];
        if (elem) {
          const w = elem.width || 260;
          const h = elem.height || 120;
          const cardLeft = elem.x;
          const cardRight = elem.x + w;
          const cardTop = elem.y;
          const cardBottom = elem.y + h;

          const isIntersecting = !(
            cardLeft > right ||
            cardRight < left ||
            cardTop > bottom ||
            cardBottom < top
          );

          if (isIntersecting) {
            newlySelected.push(block.id);
          }
        }
      });

      if (e.shiftKey) {
        setSelectedIds(prev => {
          const combined = new Set([...prev, ...newlySelected]);
          return Array.from(combined);
        });
      } else {
        setSelectedIds(newlySelected);
      }

      setMarqueeStart(null);
      setMarqueeEnd(null);
      return;
    }

    // 3. Normal mouse up
    handleMouseUp();
    activeDragId.current = null;
  };

  const handleBackgroundMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('bg-repeat')) {
      if (e.shiftKey) {
        const canvasX = (e.clientX - pan.x) / scale;
        const canvasY = (e.clientY - pan.y) / scale;
        setMarqueeStart({ x: canvasX, y: canvasY });
        setMarqueeEnd({ x: canvasX, y: canvasY });
      } else {
        setSelectedIds([]);
        handleMouseDown(e);
      }
    }
  };

  const deleteConnector = (id: string) => {
    ydoc.transact(() => {
      if (ycanvas.has(id)) {
        ycanvas.delete(id);
      }
    });
  };

  const customConnectors = Object.values(elements).filter(
    el => el.type === 'connector' && el.connector
  );

  return (
    <div
      onMouseDown={handleBackgroundMouseDown}
      onMouseMove={handleGlobalMouseMove}
      onMouseUp={handleGlobalMouseUp}
      onWheel={handleWheel}
      className="h-[75vh] w-full border border-slate-200/60 dark:border-zinc-800 rounded-3xl overflow-hidden bg-slate-50 dark:bg-zinc-950 shadow-inner relative cursor-grab active:cursor-grabbing select-none"
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
        
        {/* Draw SVG Connectors between sequential cards (Default Mindmap skeleton) */}
        {blocks.map((block, index) => {
          if (index === 0) return null;
          const prevBlock = blocks[index - 1];
          const startElem = elements[prevBlock.id];
          const endElem = elements[block.id];

          if (!startElem || !endElem) return null;

          return (
            <ConnectorLine
              key={`conn-${prevBlock.id}-${block.id}`}
              startX={startElem.x + (startElem.width || 240)}
              startY={startElem.y + (startElem.height || 120) / 2}
              endX={endElem.x}
              endY={endElem.y + (endElem.height || 120) / 2}
              label={`Next Block`}
            />
          );
        })}

        {/* Draw Custom User-dragged Connectors */}
        {customConnectors.map(elem => {
          const conn = elem.connector;
          if (!conn) return null;
          const sourceElem = elements[conn.from];
          const targetElem = elements[conn.to];

          if (!sourceElem || !targetElem) return null;

          const startX = sourceElem.x + (sourceElem.width || 260);
          const startY = sourceElem.y + (sourceElem.height || 120) / 2;
          const endX = targetElem.x;
          const endY = targetElem.y + (targetElem.height || 120) / 2;

          const midX = (startX + endX) / 2;
          const midY = (startY + endY) / 2;

          return (
            <React.Fragment key={elem.id}>
              <ConnectorLine
                startX={startX}
                startY={startY}
                endX={endX}
                endY={endY}
                label={conn.label}
              />
              {/* Floating connector delete trigger */}
              <div
                style={{
                  left: midX,
                  top: midY,
                  transform: 'translate(-50%, -50%)',
                }}
                className="absolute pointer-events-auto z-30"
              >
                <button
                  onClick={() => deleteConnector(elem.id)}
                  className="w-5 h-5 rounded-full bg-red-500 hover:bg-red-600 border border-white dark:border-zinc-950 flex items-center justify-center text-white text-[10px] shadow-sm cursor-pointer transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                  title="Delete Connection"
                  aria-label="Delete this connection line"
                  type="button"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </React.Fragment>
          );
        })}

        {/* Temporary connector being drawn by the user */}
        {activeConnectorStart && connectorMousePos && (() => {
          const sourceElem = elements[activeConnectorStart];
          if (!sourceElem) return null;
          const startX = sourceElem.x + (sourceElem.width || 260);
          const startY = sourceElem.y + (sourceElem.height || 120) / 2;

          return (
            <ConnectorLine
              startX={startX}
              startY={startY}
              endX={connectorMousePos.x}
              endY={connectorMousePos.y}
              label="Connecting..."
            />
          );
        })()}

        {/* Selection Marquee Box */}
        {marqueeStart && marqueeEnd && (
          <div
            style={{
              left: Math.min(marqueeStart.x, marqueeEnd.x),
              top: Math.min(marqueeStart.y, marqueeEnd.y),
              width: Math.abs(marqueeEnd.x - marqueeStart.x),
              height: Math.abs(marqueeEnd.y - marqueeStart.y),
            }}
            className="absolute border-2 border-dashed border-amber-500 bg-amber-500/10 rounded-sm pointer-events-none z-50"
          />
        )}

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
                onStartConnector={handleStartConnector}
                isSelected={selectedIds.includes(block.id)}
                onSelectToggle={handleSelectToggle}
              />
            </div>
          );
        })}
      </div>

      {/* Minimap Navigation Widget */}
      <div className="absolute bottom-6 right-6 z-40">
        <Minimap
          elements={elements}
          pan={pan}
          scale={scale}
          onPanChange={setPan}
        />
      </div>

      {/* Floating Zoom Controls (Premium sliding glassmorphism panel) */}
      <div className="absolute bottom-6 left-6 z-40 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md border border-slate-200/50 dark:border-zinc-800/80 rounded-2xl px-3 py-1.5 flex items-center gap-2.5 shadow-sm transition-shadow hover:shadow-md">
        <button
          onClick={() => setScale((s: number) => Math.max(0.3, s - 0.1))}
          className="p-1 hover:bg-slate-100/80 dark:hover:bg-zinc-800/60 rounded-lg text-slate-500 dark:text-zinc-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 transition-colors flex items-center justify-center"
          title="Zoom Out"
          aria-label="Zoom Out"
          type="button"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" /></svg>
        </button>
        <span className="text-[11px] font-mono font-semibold text-slate-600 dark:text-zinc-300 min-w-[3.2rem] text-center">
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={() => setScale((s: number) => Math.min(2.5, s + 0.1))}
          className="p-1 hover:bg-slate-100/80 dark:hover:bg-zinc-800/60 rounded-lg text-slate-500 dark:text-zinc-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 transition-colors flex items-center justify-center"
          title="Zoom In"
          aria-label="Zoom In"
          type="button"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
        </button>
        <div className="w-[1px] h-3.5 bg-slate-200/80 dark:bg-zinc-800/80 mx-0.5" />
        <button
          onClick={() => {
            setPan({ x: 100, y: 100 });
            setScale(1);
          }}
          className="px-2 py-1 hover:bg-slate-100/80 dark:hover:bg-zinc-800/60 rounded-lg text-slate-500 dark:text-zinc-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 transition-colors text-[10px] font-mono font-bold"
          title="Reset Viewport"
          aria-label="Reset Viewport"
          type="button"
        >
          RESET
        </button>
      </div>
    </div>
  );
};
