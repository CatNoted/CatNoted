import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useDocumentStore, ydoc, yblocks } from '@catnoted/editor';
import { CanvasElement } from '@catnoted/shared';
import { useCanvasViewport } from '../hooks/useCanvasViewport.js';
import { CanvasCard } from './CanvasCard.js';
import { ConnectorLine } from './ConnectorLine.js';
import { Minimap } from './Minimap.js';
import { Trash2 } from 'lucide-react';
import { GenericShape } from './GenericShape.js';
import { CanvasToolbar } from './CanvasToolbar.js';
import { CanvasProperties } from './CanvasProperties.js';

export const ycanvas = ydoc.getMap<CanvasElement>('canvas');

function getIntersectionPoint(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  rectX: number,
  rectY: number,
  rectW: number,
  rectH: number
): { x: number; y: number } {
  const cx = rectX + rectW / 2;
  const cy = rectY + rectH / 2;
  const dx = toX - fromX;
  const dy = toY - fromY;

  if (dx === 0 && dy === 0) return { x: fromX, y: fromY };

  const hW = rectW / 2;
  const hH = rectH / 2;

  const rectRatio = hH / hW;
  const lineRatio = Math.abs(dy / dx);

  if (lineRatio <= rectRatio) {
    const signX = dx > 0 ? 1 : -1;
    const x = cx + signX * hW;
    const y = cy + (signX * hW * dy) / dx;
    return { x, y };
  } else {
    const signY = dy > 0 ? 1 : -1;
    const y = cy + signY * hH;
    const x = cx + (signY * hH * dx) / dy;
    return { x, y };
  }
}

export const InfiniteCanvas: React.FC = () => {
  const { blocks, deleteBlock } = useDocumentStore();
  const [elements, setElements] = useState<Record<string, CanvasElement>>({});

  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Custom connector drawing states
  const [activeConnectorStart, setActiveConnectorStart] = useState<string | null>(null);
  const [connectorMousePos, setConnectorMousePos] = useState<{ x: number; y: number } | null>(null);

  // Help overlay state
  const [isHelpActive, setIsHelpActive] = useState(false);

  // Undo / Restore states for deleted elements and blocks
  const [undoToast, setUndoToast] = useState<{
    elements: CanvasElement[];
    blocks: any[];
  } | null>(null);

  // Marquee selection states
  const [marqueeStart, setMarqueeStart] = useState<{ x: number; y: number } | null>(null);
  const [marqueeEnd, setMarqueeEnd] = useState<{ x: number; y: number } | null>(null);
  const [snapToGrid, setSnapToGrid] = useState(false);

  // Drag states
  const activeDragId = useRef<string | null>(null);
  const dragStartCoords = useRef<Record<string, { x: number; y: number }>>({});
  const dragStartMouse = useRef({ x: 0, y: 0 });

  // Resize states
  const activeResizeHandle = useRef<{ handle: string, id: string } | null>(null);
  const resizeStartRect = useRef<{ x: number, y: number, w: number, h: number } | null>(null);

  const {
    pan,
    scale,
    setPan,
    setScale,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    transformStyle,
    containerRef,
    isSpacePan
  } = useCanvasViewport();

  // Attach native wheel event for zooming/panning
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel]);

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
      const activeElement = document.activeElement;
      if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.getAttribute('contenteditable') === 'true')) {
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIds.length > 0) {
          // Check if any card is selected
          const containsCard = selectedIds.some(id => {
            const elem = ycanvas.get(id);
            return elem && elem.type === 'card';
          });

          if (containsCard) {
            const confirmDelete = window.confirm('Are you sure you want to delete the selected card(s)? This will also remove their backing document blocks.');
            if (!confirmDelete) return;
          }

          const elementsToSave: CanvasElement[] = [];
          const blocksToSave: any[] = [];

          ydoc.transact(() => {
            selectedIds.forEach(id => {
              if (ycanvas.has(id)) {
                const elem = ycanvas.get(id);
                if (elem) {
                  elementsToSave.push(elem);
                  if (elem.type === 'card') {
                    const blockData = blocks.find(b => b.id === elem.blockId);
                    if (blockData) {
                      blocksToSave.push(blockData);
                    }
                    deleteBlock(elem.id);
                  }
                  ycanvas.delete(id);
                }
              }
            });
          });

          if (elementsToSave.length > 0) {
            setUndoToast({
              elements: elementsToSave,
              blocks: blocksToSave
            });
            // Automatically hide undo toast after 8 seconds
            setTimeout(() => {
              setUndoToast(prev => {
                if (prev && prev.elements === elementsToSave) {
                  return null;
                }
                return prev;
              });
            }, 8000);
          }

          setSelectedIds([]);
        }
      } else if (e.key === 'Escape') {
        setSelectedIds([]);
        setActiveConnectorStart(null);
        setConnectorMousePos(null);
        setMarqueeStart(null);
        setMarqueeEnd(null);
      } else if (e.shiftKey && e.key.toLowerCase() === 'g') {
        setSnapToGrid(prev => !prev);
      } else if (e.ctrlKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        if (selectedIds.length > 0) {
          ydoc.transact(() => {
            selectedIds.forEach(id => {
              const elem = ycanvas.get(id);
              if (elem) {
                ycanvas.set(id, { ...elem, locked: !elem.locked });
              }
            });
          });
        }
      } else if (e.key === '[' || e.key === ']') {
        if (selectedIds.length > 0) {
          ydoc.transact(() => {
            const allZ = Array.from(ycanvas.values()).map(el => el.zIndex || 0);
            const minZ = allZ.length ? Math.min(...allZ) : 0;
            const maxZ = allZ.length ? Math.max(...allZ) : 0;

            selectedIds.forEach(id => {
              const elem = ycanvas.get(id);
              if (elem) {
                ycanvas.set(id, { ...elem, zIndex: e.key === '[' ? minZ - 1 : maxZ + 1 });
              }
            });
          });
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds]);

  const bringToFront = (ids: string[]) => {
    ydoc.transact(() => {
      let maxZ = 10;
      Array.from(ycanvas.values()).forEach(el => {
        if (el.zIndex && el.zIndex > maxZ) {
          maxZ = el.zIndex;
        }
      });

      const nextZ = maxZ + 1;
      ids.forEach(id => {
        const current = ycanvas.get(id);
        if (current) {
          ycanvas.set(id, { ...current, zIndex: nextZ });
        }
      });
    });
  };

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
          bringToFront([...prev, id]);
          return [...prev, id];
        }
      });
    } else {
      if (!selectedIds.includes(id)) {
        bringToFront([id]);
        setSelectedIds([id]);
      } else {
        bringToFront(selectedIds);
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

    bringToFront(targetDragIds);

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

  const handleResizeStart = (e: React.MouseEvent, handle: string, id: string) => {
    e.stopPropagation();
    const elem = elements[id];
    if (elem) {
      activeResizeHandle.current = { handle, id };
      resizeStartRect.current = { x: elem.x, y: elem.y, w: elem.width || 200, h: elem.height || 100 };
      dragStartMouse.current = { x: e.clientX, y: e.clientY };
      if (!selectedIds.includes(id)) {
        setSelectedIds([id]);
        bringToFront([id]);
      }
    }
  };

  const handleGlobalMouseMove = (e: React.MouseEvent) => {
    // If drawing custom connector
    if (activeConnectorStart) {
      const canvasX = (e.clientX - pan.x) / scale;
      const canvasY = (e.clientY - pan.y) / scale;
      setConnectorMousePos({ x: canvasX, y: canvasY });
      return;
    }

    // Resize element
    if (activeResizeHandle.current && resizeStartRect.current) {
      const { handle, id } = activeResizeHandle.current;
      const start = resizeStartRect.current;
      const deltaX = (e.clientX - dragStartMouse.current.x) / scale;
      const deltaY = (e.clientY - dragStartMouse.current.y) / scale;

      let newX = start.x;
      let newY = start.y;
      let newW = start.w;
      let newH = start.h;

      if (handle.includes('e')) newW = Math.max(20, start.w + deltaX);
      if (handle.includes('s')) newH = Math.max(20, start.h + deltaY);
      if (handle.includes('w')) {
        const mw = Math.max(20, start.w - deltaX);
        newX = start.x + (start.w - mw);
        newW = mw;
      }
      if (handle.includes('n')) {
        const mh = Math.max(20, start.h - deltaY);
        newY = start.y + (start.h - mh);
        newH = mh;
      }

      ydoc.transact(() => {
        const current = ycanvas.get(id);
        if (current) {
          ycanvas.set(id, {
            ...current,
            x: Math.round(newX),
            y: Math.round(newY),
            width: Math.round(newW),
            height: Math.round(newH)
          });
        }
      });
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
          if (current && start && !current.locked) {
            let targetX = start.x + deltaX;
            let targetY = start.y + deltaY;
            if (snapToGrid) {
              targetX = Math.round(targetX / 24) * 24;
              targetY = Math.round(targetY / 24) * 24;
            }
            ycanvas.set(id, {
              ...current,
              x: Math.round(targetX),
              y: Math.round(targetY)
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
    activeResizeHandle.current = null;
    resizeStartRect.current = null;

    // 1. If drawing custom connector
    if (activeConnectorStart) {
      const canvasX = (e.clientX - pan.x) / scale;
      const canvasY = (e.clientY - pan.y) / scale;

      // Find if we dropped onto any other card
      let targetId: string | null = null;

      // Check block cards first
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
            targetId = block.id;
          }
        }
      });

      // Check other shapes if not found
      if (!targetId) {
        Object.values(elements).forEach(elem => {
          if (elem && elem.id !== activeConnectorStart && elem.type !== 'connector' && elem.type !== 'frame') {
            const w = elem.width || 200;
            const h = elem.height || 100;
            if (
              canvasX >= elem.x &&
              canvasX <= elem.x + w &&
              canvasY >= elem.y &&
              canvasY <= elem.y + h
            ) {
              targetId = elem.id;
            }
          }
        });
      }

      if (targetId) {
        const connId = `connector-${activeConnectorStart}-${targetId}`;
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
              to: targetId as string,
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

      // Check blocks
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

      // Check non-blocks
      nonBlockElements.forEach(elem => {
        const w = elem.width || 200;
        const h = elem.height || 100;
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
          newlySelected.push(elem.id);
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

  const handleAddElement = (type: CanvasElement['type'], shapeType?: 'rectangle' | 'circle') => {
    ydoc.transact(() => {
      const id = `el-${Date.now()}`;

      // Get container size to accurately find the center
      const rect = containerRef.current?.getBoundingClientRect();
      const containerW = rect ? rect.width : window.innerWidth;
      const containerH = rect ? rect.height : window.innerHeight;

      const cx = (-pan.x + containerW / 2) / scale;
      const cy = (-pan.y + containerH / 2) / scale;

      // Define default dimensions
      let defaultW = 200;
      let defaultH = 100;

      if (type === 'card') {
        defaultW = 240;
        defaultH = 120;
      } else if (type === 'shape') {
        if (shapeType === 'circle') {
          defaultW = 160;
          defaultH = 160;
        } else {
          defaultW = 200;
          defaultH = 120;
        }
      } else if (type === 'note') {
        defaultW = 180;
        defaultH = 180;
      } else if (type === 'frame') {
        defaultW = 480;
        defaultH = 360;
      }

      const spawnX = Math.round(cx - defaultW / 2);
      const spawnY = Math.round(cy - defaultH / 2);

      const el: CanvasElement = {
        id,
        type,
        x: spawnX,
        y: spawnY,
        width: defaultW,
        height: defaultH,
        zIndex: 20,
        rotation: 0
      };

      if (type === 'shape') {
        el.shapeType = shapeType || 'rectangle';
        el.color = 'bg-white';
      }

      ycanvas.set(id, el);
      setSelectedIds([id]);
      bringToFront([id]);
    });
  };

  const handleUpdateElement = (id: string, updates: Partial<CanvasElement>) => {
    ydoc.transact(() => {
      const current = ycanvas.get(id);
      if (current) {
        ycanvas.set(id, { ...current, ...updates });
      }
    });
  };

  // ⚡ Bolt Optimization: Memoize connector filtering to prevent O(N) scans on every frame/render
  const customConnectors = useMemo(() =>
    Object.values(elements).filter(el => el.type === 'connector' && el.connector),
    [elements]
  );

  // ⚡ Bolt Optimization: Memoize selected element resolution
  const selectedElements = useMemo(() =>
    selectedIds.map(id => elements[id]).filter(Boolean),
    [selectedIds, elements]
  );

  // ⚡ Bolt Optimization: Memoize non-block element filtering
  const nonBlockElements = useMemo(() =>
    Object.values(elements).filter(el => el.type !== 'card' && el.type !== 'connector'),
    [elements]
  );

  const hasContent = blocks.length > 0 || nonBlockElements.length > 0 || customConnectors.length > 0;

  return (
    <div
      ref={containerRef}
      onMouseDown={handleBackgroundMouseDown}
      onMouseMove={handleGlobalMouseMove}
      onMouseUp={handleGlobalMouseUp}
      className="h-[75vh] w-full border border-border rounded-3xl overflow-hidden bg-muted/40 shadow-inner relative cursor-grab active:cursor-grabbing select-none"
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

      {!hasContent && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center gap-4 text-muted-foreground/60 opacity-60">
             <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-border flex items-center justify-center">
               <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
             </div>
             <p className="text-sm font-medium tracking-wide">Canvas is empty</p>
          </div>
        </div>
      )}

      {/* Infinite Canvas Content Viewport */}
      <div style={transformStyle} className="absolute inset-0 pointer-events-none">
        
        {/* Draw Custom User-dragged Connectors */}
        {customConnectors.map(elem => {
          const conn = elem.connector;
          if (!conn) return null;
          const sourceElem = elements[conn.from];
          const targetElem = elements[conn.to];

          let startX = 0, startY = 0, endX = 0, endY = 0;
          let isBroken = false;
          let labelText = conn.label || '';

          if (sourceElem && targetElem) {
            const sourceW = sourceElem.width || (sourceElem.type === 'card' ? 240 : (sourceElem.type === 'frame' ? 400 : 200));
            const sourceH = sourceElem.height || (sourceElem.type === 'card' ? 120 : (sourceElem.type === 'frame' ? 300 : 100));
            const targetW = targetElem.width || (targetElem.type === 'card' ? 240 : (targetElem.type === 'frame' ? 400 : 200));
            const targetH = targetElem.height || (targetElem.type === 'card' ? 120 : (targetElem.type === 'frame' ? 300 : 100));

            const sourceCx = sourceElem.x + sourceW / 2;
            const sourceCy = sourceElem.y + sourceH / 2;
            const targetCx = targetElem.x + targetW / 2;
            const targetCy = targetElem.y + targetH / 2;

            const startPt = getIntersectionPoint(sourceCx, sourceCy, targetCx, targetCy, sourceElem.x, sourceElem.y, sourceW, sourceH);
            const endPt = getIntersectionPoint(targetCx, targetCy, sourceCx, sourceCy, targetElem.x, targetElem.y, targetW, targetH);

            startX = startPt.x;
            startY = startPt.y;
            endX = endPt.x;
            endY = endPt.y;
          } else {
            isBroken = true;
            labelText = labelText ? `${labelText} (Broken)` : 'Broken Connection';

            if (sourceElem) {
              const sourceW = sourceElem.width || (sourceElem.type === 'card' ? 240 : (sourceElem.type === 'frame' ? 400 : 200));
              const sourceH = sourceElem.height || (sourceElem.type === 'card' ? 120 : (sourceElem.type === 'frame' ? 300 : 100));
              startX = sourceElem.x + sourceW / 2;
              startY = sourceElem.y + sourceH / 2;
              endX = startX + 150;
              endY = startY + 100;
            } else if (targetElem) {
              const targetW = targetElem.width || (targetElem.type === 'card' ? 240 : (targetElem.type === 'frame' ? 400 : 200));
              const targetH = targetElem.height || (targetElem.type === 'card' ? 120 : (targetElem.type === 'frame' ? 300 : 100));
              endX = targetElem.x + targetW / 2;
              endY = targetElem.y + targetH / 2;
              startX = endX - 150;
              startY = endY - 100;
            } else {
              startX = 200;
              startY = 200;
              endX = 350;
              endY = 300;
            }
          }

          const midX = (startX + endX) / 2;
          const midY = (startY + endY) / 2;

          return (
            <React.Fragment key={elem.id}>
              <ConnectorLine
                startX={startX}
                startY={startY}
                endX={endX}
                endY={endY}
                label={labelText}
                type={conn.type}
                arrowStart={conn.arrowStart}
                arrowEnd={conn.arrowEnd}
                color={conn.color}
                isBroken={isBroken}
                isSelected={selectedIds.includes(elem.id)}
                onClick={(e) => {
                  handleSelectToggle(e, elem.id);
                }}
                forceShowLabel={selectedIds.includes(elem.id) || activeDragId.current !== null}
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
                  className="w-5 h-5 rounded-full bg-destructive hover:bg-destructive/90 border border-background flex items-center justify-center text-destructive-foreground text-[10px] shadow-sm cursor-pointer transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
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
          const sourceW = sourceElem.width || (sourceElem.type === 'card' ? 240 : (sourceElem.type === 'frame' ? 400 : 200));
          const sourceH = sourceElem.height || (sourceElem.type === 'card' ? 120 : (sourceElem.type === 'frame' ? 300 : 100));
          const sourceCx = sourceElem.x + sourceW / 2;
          const sourceCy = sourceElem.y + sourceH / 2;

          const start = getIntersectionPoint(
            sourceCx,
            sourceCy,
            connectorMousePos.x,
            connectorMousePos.y,
            sourceElem.x,
            sourceElem.y,
            sourceW,
            sourceH
          );

          return (
            <ConnectorLine
              startX={start.x}
              startY={start.y}
              endX={connectorMousePos.x}
              endY={connectorMousePos.y}
              label="Connecting..."
              forceShowLabel
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
            className="absolute border border-primary bg-primary/10 rounded-sm pointer-events-none z-50"
          />
        )}

        {/* Draw Non-Block Elements (Notes, Shapes, Frames) */}
        {nonBlockElements.map(elem => (
          <div key={elem.id} className={isSpacePan ? "pointer-events-none" : "pointer-events-auto"}>
            <GenericShape
              element={elem}
              isSelected={selectedIds.includes(elem.id)}
              onSelectToggle={handleSelectToggle}
              onDragStart={handleCardDragStart}
              onResizeStart={handleResizeStart}
              onStartConnector={handleStartConnector}
              onTextChange={(id, text) => handleUpdateElement(id, { text })}
            />
          </div>
        ))}

        {/* Draw Draggable Cards */}
        {blocks.map(block => {
          const elem = elements[block.id];
          if (!elem) return null;

          return (
            <div key={block.id} className={isSpacePan ? "pointer-events-none" : "pointer-events-auto"}>
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

      <CanvasToolbar
        onAddElement={handleAddElement}
        onToggleHelp={() => setIsHelpActive(prev => !prev)}
        isHelpActive={isHelpActive}
      />

      <CanvasProperties
        selectedElements={selectedElements}
        onUpdateElement={handleUpdateElement}
        elements={elements}
      />

      {/* Minimap Navigation Widget */}
      <div className="absolute bottom-6 right-6 z-40">
        <Minimap
          elements={elements}
          pan={pan}
          scale={scale}
          onPanChange={setPan}
        />
      </div>

      {/* Floating Zoom Controls */}
      <div className="absolute bottom-6 left-6 z-40 bg-card/80 backdrop-blur-md border border-border/50 rounded-2xl px-3 py-2 flex items-center gap-2 shadow-lg shadow-black/5">
        <button
          onClick={() => setSnapToGrid(prev => !prev)}
          className={`px-2 py-0.5 rounded-lg transition-colors text-[10px] font-mono font-semibold ${snapToGrid ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-primary hover:bg-muted'}`}
          title="Toggle Grid Snap (Shift+G)"
          aria-label="Toggle Grid Snap"
          type="button"
        >
          Grid Snap
        </button>
        <div className="w-[1px] h-4 bg-border mx-1" />
        <button
          onClick={() => setScale((s: number) => Math.max(0.3, s - 0.1))}
          className="p-1 hover:bg-muted rounded-lg text-muted-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
          title="Zoom Out"
          aria-label="Zoom Out"
          type="button"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" /></svg>
        </button>
        <span className="text-xs font-mono font-semibold text-foreground/80 min-w-[3.5rem] text-center">
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={() => setScale((s: number) => Math.min(2.5, s + 0.1))}
          className="p-1 hover:bg-muted rounded-lg text-muted-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
          title="Zoom In"
          aria-label="Zoom In"
          type="button"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
        </button>
        <div className="w-[1px] h-4 bg-border mx-1" />
        <button
          onClick={() => {
            setPan({ x: 100, y: 100 });
            setScale(1);
          }}
          className="px-2 py-0.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors text-[10px] font-mono font-semibold"
          title="Reset Viewport"
          aria-label="Reset Viewport"
          type="button"
        >
          Reset
        </button>
      </div>

      {/* Help & Shortcuts Overlay */}
      {isHelpActive && (
        <div className="absolute top-6 left-6 z-50 max-w-sm bg-card/95 backdrop-blur-md border border-border rounded-2xl p-5 shadow-2xl animate-in fade-in slide-in-from-left-4 duration-200 select-text">
          <div className="flex items-center justify-between border-b border-border pb-2.5 mb-3.5">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <span>💡</span> Help & Shortcuts
            </h3>
            <button
              onClick={() => setIsHelpActive(false)}
              className="text-muted-foreground hover:text-foreground text-xs transition-colors"
              aria-label="Close Help Panel"
              type="button"
            >
              ✕
            </button>
          </div>
          <div className="flex flex-col gap-3.5 overflow-y-auto max-h-[50vh] text-xs">
            {/* Controls */}
            <div>
              <h4 className="font-semibold text-foreground/90 mb-1.5 uppercase tracking-wider text-[10px]">Controls & Actions</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li className="flex justify-between items-center gap-2">
                  <span>Pan Canvas</span>
                  <span className="font-medium text-muted-foreground/90">Drag Background</span>
                </li>
                <li className="flex justify-between items-center gap-2">
                  <span>Zoom Canvas</span>
                  <span className="font-medium text-muted-foreground/90">Scroll Wheel</span>
                </li>
                <li className="flex justify-between items-center gap-2">
                  <span>Marquee Select</span>
                  <span className="font-medium text-muted-foreground/90">Shift + Drag Background</span>
                </li>
                <li className="flex justify-between items-center gap-2">
                  <span>Draw Connector</span>
                  <span className="font-medium text-muted-foreground/90">Drag right card dot</span>
                </li>
                <li className="flex justify-between items-center gap-2">
                  <span>Lock Element</span>
                  <span className="font-medium text-muted-foreground/90">Ctrl + L</span>
                </li>
                <li className="flex justify-between items-center gap-2">
                  <span>Move Depth</span>
                  <span className="font-medium text-muted-foreground/90">[ or ]</span>
                </li>
              </ul>
            </div>
            {/* Creation Shortcuts */}
            <div>
              <h4 className="font-semibold text-foreground/90 mb-1.5 uppercase tracking-wider text-[10px]">Toolbar Shortcuts</h4>
              <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-[10px] font-mono font-bold text-foreground">C</kbd>
                  <span>Add Card</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-[10px] font-mono font-bold text-foreground">R</kbd>
                  <span>Add Rectangle</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-[10px] font-mono font-bold text-foreground">E / O</kbd>
                  <span>Add Ellipse</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-[10px] font-mono font-bold text-foreground">T</kbd>
                  <span>Add Text Note</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-[10px] font-mono font-bold text-foreground">F</kbd>
                  <span>Add Frame</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-[10px] font-mono font-bold text-foreground">Shift + G</kbd>
                  <span>Grid Snap</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Undo Toast Banner */}
      {undoToast && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 bg-primary text-primary-foreground border border-border/40 rounded-2xl px-4 py-3 flex items-center gap-4 shadow-2xl animate-in slide-in-from-top-4 duration-300 max-w-sm">
          <div className="flex-1 text-xs font-medium">
            Deleted {undoToast.elements.length} element(s).
          </div>
          <button
            onClick={() => {
              ydoc.transact(() => {
                if (undoToast.blocks.length > 0) {
                  yblocks.insert(yblocks.length, undoToast.blocks);
                }
                undoToast.elements.forEach(el => {
                  ycanvas.set(el.id, el);
                });
              });
              setUndoToast(null);
            }}
            className="text-xs font-bold text-primary-foreground/90 hover:text-primary-foreground transition-colors"
            type="button"
          >
            Undo
          </button>
          <button
            onClick={() => setUndoToast(null)}
            className="text-primary-foreground/60 hover:text-primary-foreground transition-colors text-xs"
            aria-label="Dismiss Toast"
            type="button"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};
