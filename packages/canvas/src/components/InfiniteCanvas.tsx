import React, { useState, useEffect, useRef } from 'react';
import { useDocumentStore, ydoc } from '@catnoted/editor';
import { CanvasElement, CanvasElementType } from '@catnoted/shared';
import { useCanvasViewport } from '../hooks/useCanvasViewport.js';
import { CanvasCard } from './CanvasCard.js';
import { CanvasShape } from './CanvasShape.js';
import { ConnectorLine } from './ConnectorLine.js';
import { Minimap } from './Minimap.js';
import {
  Trash2,
  MousePointer,
  PlusCircle,
  StickyNote,
  Square,
  Box,
  Grid,
  Type,
  Maximize,
  RotateCw,
  Layers,
  Copy,
  AlignCenter,
  AlignLeft,
  AlignRight,
  Settings,
  Palette,
  Check,
  Zap,
  Layout,
  Link,
  ChevronDown
} from 'lucide-react';

export const ycanvas = ydoc.getMap<CanvasElement>('canvas');

// Available pattern background styles
export type BgStylePattern = 'dot' | 'grid' | 'ruled' | 'none';

export const InfiniteCanvas: React.FC = () => {
  const { blocks, addBlock } = useDocumentStore();
  const [elements, setElements] = useState<Record<string, CanvasElement>>({});

  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Tool / Mode state
  const [activeTool, setActiveTool] = useState<'select' | 'card' | 'note' | 'frame' | 'shape' | 'connector'>('select');
  const [selectedShapeType, setSelectedShapeType] = useState<'rectangle' | 'circle' | 'triangle' | 'star'>('rectangle');

  // Background style
  const [bgPattern, setBgPattern] = useState<BgStylePattern>('dot');

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

  // Resize state
  const [activeResize, setActiveResize] = useState<{ id: string; dir: string } | null>(null);
  const resizeStartMouse = useRef({ x: 0, y: 0 });
  const resizeStartDim = useRef({ x: 0, y: 0, w: 0, h: 0 });

  // Rotate state
  const [activeRotateId, setActiveRotateId] = useState<string | null>(null);
  const rotateStartMouse = useRef({ x: 0, y: 0 });
  const rotateStartAngle = useRef(0);

  // Tool palette and UI flags
  const [shapeDropdownOpen, setShapeDropdownOpen] = useState(false);
  const [bgDropdownOpen, setBgDropdownOpen] = useState(false);

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
                ycanvas.delete(id);
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
        setActiveResize(null);
        setActiveRotateId(null);
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

  // Handle Resize triggers from shapes or cards
  const handleResizeStart = (e: React.MouseEvent, id: string, dir: string) => {
    e.stopPropagation();
    e.preventDefault();
    const elem = elements[id];
    if (!elem) return;

    setActiveResize({ id, dir });
    resizeStartMouse.current = { x: e.clientX, y: e.clientY };
    resizeStartDim.current = {
      x: elem.x,
      y: elem.y,
      w: elem.width || 140,
      h: elem.height || 140
    };
  };

  // Handle Rotation triggers from shapes or cards
  const handleRotateStart = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    const elem = elements[id];
    if (!elem) return;

    setActiveRotateId(id);
    rotateStartMouse.current = { x: e.clientX, y: e.clientY };
    rotateStartAngle.current = elem.rotation || 0;
  };

  const handleGlobalMouseMove = (e: React.MouseEvent) => {
    // 1. If drawing custom connector
    if (activeConnectorStart) {
      const canvasX = (e.clientX - pan.x) / scale;
      const canvasY = (e.clientY - pan.y) / scale;
      setConnectorMousePos({ x: canvasX, y: canvasY });
      return;
    }

    // 2. If drawing marquee selection
    if (marqueeStart) {
      const canvasX = (e.clientX - pan.x) / scale;
      const canvasY = (e.clientY - pan.y) / scale;
      setMarqueeEnd({ x: canvasX, y: canvasY });
      return;
    }

    // 3. If Resizing an element
    if (activeResize) {
      const { id, dir } = activeResize;
      const start = resizeStartDim.current;
      const deltaX = (e.clientX - resizeStartMouse.current.x) / scale;
      const deltaY = (e.clientY - resizeStartMouse.current.y) / scale;

      let newX = start.x;
      let newY = start.y;
      let newW = start.w;
      let newH = start.h;

      if (dir.includes('e')) {
        newW = Math.max(50, start.w + deltaX);
      }
      if (dir.includes('s')) {
        newH = Math.max(50, start.h + deltaY);
      }
      if (dir.includes('w')) {
        const potentialW = start.w - deltaX;
        if (potentialW >= 50) {
          newW = potentialW;
          newX = start.x + deltaX;
        }
      }
      if (dir.includes('n')) {
        const potentialH = start.h - deltaY;
        if (potentialH >= 50) {
          newH = potentialH;
          newY = start.y + deltaY;
        }
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

    // 4. If Rotating an element
    if (activeRotateId) {
      const elem = elements[activeRotateId];
      if (elem) {
        // Calculate dynamic rotation angle based on horizontal delta movement
        const deltaX = (e.clientX - rotateStartMouse.current.x) * 0.5;
        const newAngle = (rotateStartAngle.current + deltaX) % 360;

        ydoc.transact(() => {
          const current = ycanvas.get(activeRotateId);
          if (current) {
            ycanvas.set(activeRotateId, {
              ...current,
              rotation: Math.round(newAngle)
            });
          }
        });
      }
      return;
    }

    // 5. If dragging element(s)
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

      // Find if we dropped onto any other card/shape
      let targetElemId: string | null = null;
      Object.keys(elements).forEach(key => {
        const elem = elements[key];
        if (elem && key !== activeConnectorStart) {
          const w = elem.width || 260;
          const h = elem.height || 120;
          if (
            canvasX >= elem.x &&
            canvasX <= elem.x + w &&
            canvasY >= elem.y &&
            canvasY <= elem.y + h
          ) {
            targetElemId = key;
          }
        }
      });

      if (targetElemId) {
        const connId = `connector-${activeConnectorStart}-${targetElemId}`;
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
              to: targetElemId as string,
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
      Object.keys(elements).forEach(key => {
        const elem = elements[key];
        if (elem && elem.type !== 'connector') {
          const w = elem.width || (elem.type === 'card' ? 260 : elem.type === 'note' ? 180 : elem.type === 'frame' ? 400 : 140);
          const h = elem.height || (elem.type === 'card' ? 120 : elem.type === 'note' ? 180 : elem.type === 'frame' ? 300 : 140);
          const elemLeft = elem.x;
          const elemRight = elem.x + w;
          const elemTop = elem.y;
          const elemBottom = elem.y + h;

          const isIntersecting = !(
            elemLeft > right ||
            elemRight < left ||
            elemTop > bottom ||
            elemBottom < top
          );

          if (isIntersecting) {
            newlySelected.push(key);
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
    setActiveResize(null);
    setActiveRotateId(null);
  };

  const handleBackgroundMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('bg-repeat')) {
      const canvasX = (e.clientX - pan.x) / scale;
      const canvasY = (e.clientY - pan.y) / scale;

      // Handle custom insertions on click depending on activeTool
      if (activeTool !== 'select') {
        const id = `elem-${Math.random().toString(36).substring(2, 11)}`;

        if (activeTool === 'card') {
          const newBlockId = addBlock(null, 'text', 'New Card Text');
          ydoc.transact(() => {
            ycanvas.set(newBlockId, {
              id: newBlockId,
              type: 'card',
              x: Math.round(canvasX - 120),
              y: Math.round(canvasY - 60),
              width: 260,
              height: 120,
              zIndex: 10,
              rotation: 0,
              blockId: newBlockId
            });
          });
          setSelectedIds([newBlockId]);
        } else if (activeTool === 'note') {
          ydoc.transact(() => {
            ycanvas.set(id, {
              id,
              type: 'note',
              x: Math.round(canvasX - 90),
              y: Math.round(canvasY - 90),
              width: 180,
              height: 180,
              zIndex: 10,
              rotation: 0,
              text: 'Write some sticky notes...'
            });
          });
          setSelectedIds([id]);
        } else if (activeTool === 'frame') {
          ydoc.transact(() => {
            ycanvas.set(id, {
              id,
              type: 'frame',
              x: Math.round(canvasX - 200),
              y: Math.round(canvasY - 150),
              width: 400,
              height: 300,
              zIndex: 2,
              rotation: 0,
              text: 'Frame Grouping'
            });
          });
          setSelectedIds([id]);
        } else if (activeTool === 'shape') {
          ydoc.transact(() => {
            ycanvas.set(id, {
              id,
              type: 'shape',
              shapeType: selectedShapeType,
              x: Math.round(canvasX - 70),
              y: Math.round(canvasY - 70),
              width: 140,
              height: 140,
              zIndex: 10,
              rotation: 0,
              text: '',
              color: '#6366f1' // default indigo shape fill
            });
          });
          setSelectedIds([id]);
        }

        setActiveTool('select');
        return;
      }

      if (e.shiftKey) {
        setMarqueeStart({ x: canvasX, y: canvasY });
        setMarqueeEnd({ x: canvasX, y: canvasY });
      } else {
        setSelectedIds([]);
        handleMouseDown(e);
      }
    }
  };

  const handleUpdateText = (id: string, text: string) => {
    ydoc.transact(() => {
      const current = ycanvas.get(id);
      if (current) {
        ycanvas.set(id, {
          ...current,
          text
        });
      }
    });
  };

  const deleteConnector = (id: string) => {
    ydoc.transact(() => {
      if (ycanvas.has(id)) {
        ycanvas.delete(id);
      }
    });
  };

  // Property modifier helpers
  const handleUpdateColor = (color: string) => {
    ydoc.transact(() => {
      selectedIds.forEach(id => {
        const current = ycanvas.get(id);
        if (current) {
          ycanvas.set(id, {
            ...current,
            color
          });
        }
      });
    });
  };

  const handleUpdateBorder = (borderColor: string, borderStyle: 'solid' | 'dashed' | 'dotted' | 'none') => {
    ydoc.transact(() => {
      selectedIds.forEach(id => {
        const current = ycanvas.get(id);
        if (current) {
          ycanvas.set(id, {
            ...current,
            borderColor,
            borderStyle
          });
        }
      });
    });
  };

  const handleUpdateOpacity = (opacity: number) => {
    ydoc.transact(() => {
      selectedIds.forEach(id => {
        const current = ycanvas.get(id);
        if (current) {
          ycanvas.set(id, {
            ...current,
            opacity
          });
        }
      });
    });
  };

  const handleUpdateAlignment = (textAlignment: 'left' | 'center' | 'right') => {
    ydoc.transact(() => {
      selectedIds.forEach(id => {
        const current = ycanvas.get(id);
        if (current) {
          ycanvas.set(id, {
            ...current,
            textAlignment
          });
        }
      });
    });
  };

  const handleUpdateLayer = (action: 'front' | 'back') => {
    ydoc.transact(() => {
      selectedIds.forEach(id => {
        const current = ycanvas.get(id);
        if (current) {
          const currentZ = current.zIndex || 10;
          ycanvas.set(id, {
            ...current,
            zIndex: action === 'front' ? currentZ + 5 : Math.max(1, currentZ - 5)
          });
        }
      });
    });
  };

  const handleDuplicate = () => {
    ydoc.transact(() => {
      const duplicatedIds: string[] = [];
      selectedIds.forEach(id => {
        const elem = elements[id];
        if (elem && elem.type !== 'connector') {
          const newId = `elem-${Math.random().toString(36).substring(2, 11)}`;
          const copy = {
            ...elem,
            id: newId,
            x: elem.x + 40,
            y: elem.y + 40
          };
          ycanvas.set(newId, copy);
          duplicatedIds.push(newId);
        }
      });
      if (duplicatedIds.length > 0) {
        setSelectedIds(duplicatedIds);
      }
    });
  };

  const handleDeleteSelected = () => {
    ydoc.transact(() => {
      selectedIds.forEach(id => {
        if (ycanvas.has(id)) {
          ycanvas.delete(id);
        }
      });
    });
    setSelectedIds([]);
  };

  // Align or Distribute selected items
  const handleAlignSelected = (type: 'left' | 'center' | 'top' | 'middle') => {
    if (selectedIds.length <= 1) return;
    const selectedElems = selectedIds.map(id => elements[id]).filter(Boolean);
    if (selectedElems.length <= 1) return;

    let targetVal = 0;
    if (type === 'left') {
      targetVal = Math.min(...selectedElems.map(el => el.x));
    } else if (type === 'center') {
      const sumX = selectedElems.reduce((sum, el) => sum + el.x + (el.width || 140) / 2, 0);
      targetVal = sumX / selectedElems.length;
    } else if (type === 'top') {
      targetVal = Math.min(...selectedElems.map(el => el.y));
    } else if (type === 'middle') {
      const sumY = selectedElems.reduce((sum, el) => sum + el.y + (el.height || 140) / 2, 0);
      targetVal = sumY / selectedElems.length;
    }

    ydoc.transact(() => {
      selectedIds.forEach(id => {
        const current = ycanvas.get(id);
        if (current) {
          if (type === 'left') {
            ycanvas.set(id, { ...current, x: targetVal });
          } else if (type === 'center') {
            const w = current.width || 140;
            ycanvas.set(id, { ...current, x: Math.round(targetVal - w / 2) });
          } else if (type === 'top') {
            ycanvas.set(id, { ...current, y: targetVal });
          } else if (type === 'middle') {
            const h = current.height || 140;
            ycanvas.set(id, { ...current, y: Math.round(targetVal - h / 2) });
          }
        }
      });
    });
  };

  const customConnectors = Object.values(elements).filter(
    el => el.type === 'connector' && el.connector
  );

  // Background style configuration
  const bgStyles: Record<BgStylePattern, React.CSSProperties> = {
    dot: {
      backgroundSize: `${24 * scale}px ${24 * scale}px`,
      backgroundImage: 'radial-gradient(#cbd5e1 1.5px, transparent 1.5px)',
    },
    grid: {
      backgroundSize: `${24 * scale}px ${24 * scale}px`,
      backgroundImage: 'linear-gradient(to right, #cbd5e1 1px, transparent 1px), linear-gradient(to bottom, #cbd5e1 1px, transparent 1px)',
    },
    ruled: {
      backgroundSize: `${24 * scale}px ${24 * scale}px`,
      backgroundImage: 'linear-gradient(to bottom, #cbd5e1 1px, transparent 1px)',
    },
    none: {}
  };

  const bgStylesDark: Record<BgStylePattern, React.CSSProperties> = {
    dot: {
      backgroundSize: `${24 * scale}px ${24 * scale}px`,
      backgroundImage: 'radial-gradient(#27272a 1.5px, transparent 1.5px)',
    },
    grid: {
      backgroundSize: `${24 * scale}px ${24 * scale}px`,
      backgroundImage: 'linear-gradient(to right, #27272a 1px, transparent 1px), linear-gradient(to bottom, #27272a 1px, transparent 1px)',
    },
    ruled: {
      backgroundSize: `${24 * scale}px ${24 * scale}px`,
      backgroundImage: 'linear-gradient(to bottom, #27272a 1px, transparent 1px)',
    },
    none: {}
  };

  return (
    <div
      onMouseDown={handleBackgroundMouseDown}
      onMouseMove={handleGlobalMouseMove}
      onMouseUp={handleGlobalMouseUp}
      onWheel={handleWheel}
      className="h-[75vh] w-full border border-slate-200 dark:border-zinc-800 rounded-3xl overflow-hidden bg-slate-50 dark:bg-zinc-950 shadow-inner relative cursor-grab active:cursor-grabbing select-none"
    >
      {/* Dynamic Background Patterns (Dot/Grid/Ruled/None) */}
      {bgPattern !== 'none' && (
        <>
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px)`,
              ...bgStyles[bgPattern]
            }}
            className="absolute inset-0 dark:opacity-30 pointer-events-none opacity-60 bg-repeat"
          />
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px)`,
              ...bgStylesDark[bgPattern]
            }}
            className="absolute inset-0 hidden dark:block pointer-events-none opacity-50 bg-repeat"
          />
        </>
      )}

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

        {/* Draw Draggable Elements */}
        {Object.values(elements).map(elem => {
          if (elem.type === 'connector') return null;

          if (elem.type === 'card') {
            const block = blocks.find(b => b.id === elem.id);
            if (!block) return null;
            return (
              <div key={elem.id} className="pointer-events-auto">
                <CanvasCard
                  block={block}
                  canvasElem={elem}
                  onDragStart={handleCardDragStart}
                  onStartConnector={handleStartConnector}
                  isSelected={selectedIds.includes(elem.id)}
                  onSelectToggle={handleSelectToggle}
                  onResizeStart={handleResizeStart}
                  onRotateStart={handleRotateStart}
                />
              </div>
            );
          }

          // Custom frames, notes, and shapes
          return (
            <div key={elem.id} className="pointer-events-auto">
              <CanvasShape
                canvasElem={elem}
                isSelected={selectedIds.includes(elem.id)}
                onSelectToggle={handleSelectToggle}
                onDragStart={handleCardDragStart}
                onChangeText={handleUpdateText}
                onResizeStart={handleResizeStart}
                onRotateStart={handleRotateStart}
              />
            </div>
          );
        })}
      </div>

      {/* CANVAS LOCAL TOOL PALETTE (AFFiNE Clean-look Toolbar) */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-slate-200/50 dark:border-zinc-800/60 rounded-full px-4 py-2 flex items-center gap-3 shadow-lg shadow-black/5">
        {[
          { id: 'select', tooltip: 'Select tool', icon: MousePointer },
          { id: 'card', tooltip: 'Add Block Card', icon: Layout },
          { id: 'note', tooltip: 'Add Sticky Note', icon: StickyNote },
          { id: 'frame', tooltip: 'Add Frame Group', icon: Box },
        ].map((tool) => {
          const Icon = tool.icon;
          const isSelected = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => {
                setActiveTool(tool.id as any);
                setShapeDropdownOpen(false);
                setBgDropdownOpen(false);
              }}
              className={`p-2 rounded-full transition-colors ${
                isSelected
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'
              }`}
              title={tool.tooltip}
              aria-label={tool.tooltip}
              type="button"
            >
              <Icon className="w-4 h-4" />
            </button>
          );
        })}

        {/* Custom Shapes Dropdown in Tool Palette */}
        <div className="relative">
          <button
            onClick={() => {
              setActiveTool('shape');
              setShapeDropdownOpen(!shapeDropdownOpen);
              setBgDropdownOpen(false);
            }}
            className={`p-2 rounded-full flex items-center gap-1 transition-colors ${
              activeTool === 'shape'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'
            }`}
            title="Custom Shapes Palette"
            aria-label="Custom Shapes Palette"
            type="button"
          >
            <PlusCircle className="w-4 h-4" />
            <ChevronDown className="w-3 h-3" />
          </button>
          {shapeDropdownOpen && (
            <div className="absolute top-12 left-0 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-2 flex flex-col gap-1.5 shadow-xl min-w-[120px] pointer-events-auto">
              {[
                { type: 'rectangle', label: 'Rectangle' },
                { type: 'circle', label: 'Circle' },
                { type: 'triangle', label: 'Triangle' },
                { type: 'star', label: 'Star' },
              ].map((item) => (
                <button
                  key={item.type}
                  onClick={() => {
                    setSelectedShapeType(item.type as any);
                    setActiveTool('shape');
                    setShapeDropdownOpen(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium text-left transition-colors flex items-center justify-between ${
                    selectedShapeType === item.type && activeTool === 'shape'
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800'
                  }`}
                  type="button"
                >
                  <span>{item.label}</span>
                  {selectedShapeType === item.type && activeTool === 'shape' && (
                    <Check className="w-3.5 h-3.5 text-indigo-500" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-[1px] h-5 bg-slate-200/80 dark:bg-zinc-800/80 mx-1" />

        {/* Background Style Grid Patterns */}
        <div className="relative">
          <button
            onClick={() => {
              setBgDropdownOpen(!bgDropdownOpen);
              setShapeDropdownOpen(false);
            }}
            className="p-2 rounded-full text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1"
            title="Canvas Grid Pattern selector"
            aria-label="Canvas Grid Pattern selector"
            type="button"
          >
            <Grid className="w-4 h-4" />
            <ChevronDown className="w-3 h-3" />
          </button>
          {bgDropdownOpen && (
            <div className="absolute top-12 right-0 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-2 flex flex-col gap-1.5 shadow-xl min-w-[120px] pointer-events-auto">
              {[
                { type: 'dot', label: 'Dot Grid' },
                { type: 'grid', label: 'Mesh Grid' },
                { type: 'ruled', label: 'Ruled Lines' },
                { type: 'none', label: 'Blank' },
              ].map((pattern) => (
                <button
                  key={pattern.type}
                  onClick={() => {
                    setBgPattern(pattern.type as BgStylePattern);
                    setBgDropdownOpen(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium text-left transition-colors flex items-center justify-between ${
                    bgPattern === pattern.type
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800'
                  }`}
                  type="button"
                >
                  <span>{pattern.label}</span>
                  {bgPattern === pattern.type && (
                    <Check className="w-3.5 h-3.5 text-indigo-500" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* FLOATING PROPERTIES TOOLBAR (Appears dynamically for selected canvas elements) */}
      {selectedIds.length > 0 && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-slate-200/50 dark:border-zinc-800/60 rounded-2xl px-4 py-2 flex items-center gap-3 shadow-xl shadow-black/10 pointer-events-auto">
          {/* Fill/Color Picker palette */}
          <div className="flex items-center gap-1.5 border-r border-slate-200 dark:border-zinc-800/80 pr-3">
            {[
              { color: '#ef4444', label: 'Red' },
              { color: '#f59e0b', label: 'Amber' },
              { color: '#10b981', label: 'Emerald' },
              { color: '#6366f1', label: 'Indigo' },
              { color: '#a855f7', label: 'Purple' },
              { color: '#1f2937', label: 'Dark' },
            ].map((col) => (
              <button
                key={col.color}
                onClick={() => handleUpdateColor(col.color)}
                style={{ backgroundColor: col.color }}
                className="w-4 h-4 rounded-full border border-white dark:border-zinc-950 hover:scale-125 transition-transform"
                title={col.label}
                aria-label={`Fill ${col.label}`}
                type="button"
              />
            ))}
          </div>

          {/* Alignment selection controls */}
          <div className="flex items-center gap-1 border-r border-slate-200 dark:border-zinc-800/80 pr-3">
            {[
              { align: 'left', icon: AlignLeft },
              { align: 'center', icon: AlignCenter },
              { align: 'right', icon: AlignRight },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.align}
                  onClick={() => handleUpdateAlignment(item.align as any)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg text-slate-500 hover:text-indigo-500 transition-colors"
                  title={`Align ${item.align}`}
                  aria-label={`Align ${item.align}`}
                  type="button"
                >
                  <Icon className="w-3.5 h-3.5" />
                </button>
              );
            })}
          </div>

          {/* Layering & Z-Index controllers */}
          <div className="flex items-center gap-1 border-r border-slate-200 dark:border-zinc-800/80 pr-3">
            <button
              onClick={() => handleUpdateLayer('front')}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg text-slate-500 hover:text-indigo-500 transition-colors"
              title="Bring to Front"
              aria-label="Bring to Front"
              type="button"
            >
              <Layers className="w-3.5 h-3.5 text-indigo-500" />
            </button>
            <button
              onClick={() => handleUpdateLayer('back')}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg text-slate-500 hover:text-indigo-500 transition-colors"
              title="Send to Back"
              aria-label="Send to Back"
              type="button"
            >
              <Layers className="w-3.5 h-3.5 opacity-40" />
            </button>
          </div>

          {/* Alignment and Distribution layout alignment */}
          {selectedIds.length > 1 && (
            <div className="flex items-center gap-1 border-r border-slate-200 dark:border-zinc-800/80 pr-3">
              <button
                onClick={() => handleAlignSelected('left')}
                className="px-2 py-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-md text-[10px] font-mono font-bold text-slate-600 hover:text-indigo-500 transition-colors"
                title="Align Lefts"
                type="button"
              >
                Left
              </button>
              <button
                onClick={() => handleAlignSelected('top')}
                className="px-2 py-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-md text-[10px] font-mono font-bold text-slate-600 hover:text-indigo-500 transition-colors"
                title="Align Tops"
                type="button"
              >
                Top
              </button>
            </div>
          )}

          {/* Border Styles */}
          <div className="flex items-center gap-1.5 border-r border-slate-200 dark:border-zinc-800/80 pr-3">
            <button
              onClick={() => handleUpdateBorder('#6366f1', 'dashed')}
              className="px-2 py-1 text-[9px] font-mono font-bold border border-dashed border-slate-300 dark:border-zinc-800 hover:border-indigo-500 rounded-md text-slate-600"
              title="Dashed border styling"
              type="button"
            >
              Dash
            </button>
            <button
              onClick={() => handleUpdateBorder('#6366f1', 'solid')}
              className="px-2 py-1 text-[9px] font-mono font-bold border border-solid border-slate-300 dark:border-zinc-800 hover:border-indigo-500 rounded-md text-slate-600"
              title="Solid border styling"
              type="button"
            >
              Solid
            </button>
          </div>

          {/* Duplicate, Trash actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleDuplicate}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg text-slate-500 hover:text-indigo-500 transition-colors"
              title="Duplicate elements"
              aria-label="Duplicate elements"
              type="button"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleDeleteSelected}
              className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg text-red-500 hover:text-red-600 transition-colors"
              title="Delete elements"
              aria-label="Delete elements"
              type="button"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

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
      <div className="absolute bottom-6 left-6 z-40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-slate-200/50 dark:border-zinc-800/60 rounded-2xl px-3 py-2 flex items-center gap-2 shadow-lg shadow-black/5">
        <button
          onClick={() => setScale((s: number) => Math.max(0.3, s - 0.1))}
          className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-colors"
          title="Zoom Out"
          aria-label="Zoom Out"
          type="button"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" /></svg>
        </button>
        <span className="text-xs font-mono font-semibold text-slate-600 dark:text-zinc-300 min-w-[3.5rem] text-center">
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={() => setScale((s: number) => Math.min(2.5, s + 0.1))}
          className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-colors"
          title="Zoom In"
          aria-label="Zoom In"
          type="button"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
        </button>
        <div className="w-[1px] h-4 bg-slate-200/80 dark:bg-zinc-800/80 mx-1" />
        <button
          onClick={() => {
            setPan({ x: 100, y: 100 });
            setScale(1);
          }}
          className="px-2 py-0.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-colors text-[10px] font-mono font-semibold"
          title="Reset Viewport"
          aria-label="Reset Viewport"
          type="button"
        >
          Reset
        </button>
      </div>
    </div>
  );
};
