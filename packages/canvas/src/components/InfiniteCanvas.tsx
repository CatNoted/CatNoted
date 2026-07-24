import React, { useState, useEffect, useRef } from 'react';
import { useDocumentStore, ydoc } from '@catnoted/editor';
import { CanvasElement } from '@catnoted/shared';
import { useCanvasViewport } from '../hooks/useCanvasViewport.js';
import { CanvasCard } from './CanvasCard.js';
import { CanvasShape } from './CanvasShape.js';
import { ConnectorLine } from './ConnectorLine.js';
import {
  Plus,
  Square,
  Circle,
  Triangle as TriangleIcon,
  Star,
  Trash2,
  MousePointer,
  Type,
  Layers
} from 'lucide-react';

// Sync layout with the same shared Y.Doc
export const ycanvas = ydoc.getMap<CanvasElement>('canvas');

// Helper to extract unique page/tag links from blocks to represent graph nodes
const getGraphNodes = (blocks: any[]) => {
  const nodes: { id: string; label: string; type: string }[] = [];
  const linkRegex = /\[\[(.*?)\]\]/g;
  const tagRegex = /#([a-zA-Z0-9_\-]+)/g;

  blocks.forEach(block => {
    let match;
    linkRegex.lastIndex = 0;
    while ((match = linkRegex.exec(block.content)) !== null) {
      const pageName = match[1].replace(/[\[\]]/g, '').trim();
      if (!pageName) continue;
      const nodeId = `graph-page-${pageName.toLowerCase().replace(/\s+/g, '-')}`;
      if (!nodes.some(n => n.id === nodeId)) {
        nodes.push({ id: nodeId, label: `📄 ${pageName}`, type: 'page' });
      }
    }

    tagRegex.lastIndex = 0;
    while ((match = tagRegex.exec(block.content)) !== null) {
      const tagName = match[1].trim();
      if (!tagName) continue;
      const nodeId = `graph-tag-${tagName.toLowerCase()}`;
      if (!nodes.some(n => n.id === nodeId)) {
        nodes.push({ id: nodeId, label: `#${tagName}`, type: 'tag' });
      }
    }
  });
  return nodes;
};

export const InfiniteCanvas: React.FC = () => {
  const { blocks, addBlock } = useDocumentStore();
  const [elements, setElements] = useState<Record<string, CanvasElement>>({});
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
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
    setSelectedElementId(id);
  };

  const handleGlobalMouseMove = (e: React.MouseEvent) => {
    // If panning canvas
    handleMouseMove(e);

    // If dragging card or shape
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

  // Helper to add card via toolbar
  const handleAddNewCard = () => {
    const newBlockId = addBlock(null, 'text', '');
    const x = Math.round((400 - pan.x) / scale);
    const y = Math.round((200 - pan.y) / scale);

    ydoc.transact(() => {
      ycanvas.set(newBlockId, {
        id: newBlockId,
        type: 'card',
        x,
        y,
        width: 240,
        height: 120,
        zIndex: 15,
        rotation: 0,
        blockId: newBlockId
      });
    });
    setSelectedElementId(newBlockId);
  };

  // Helper to add shape via toolbar
  const handleAddNewShape = (shapeType: 'rectangle' | 'circle' | 'triangle' | 'star') => {
    const id = `shape-${Math.random().toString(36).substring(2, 11)}`;
    const x = Math.round((400 - pan.x) / scale);
    const y = Math.round((200 - pan.y) / scale);

    ydoc.transact(() => {
      ycanvas.set(id, {
        id,
        type: 'shape',
        shapeType,
        x,
        y,
        width: 140,
        height: 140,
        zIndex: 15,
        rotation: 0,
        color: '#FEF08A', // soft yellow default
        text: ''
      });
    });
    setSelectedElementId(id);
  };

  // Embed a block onto the canvas (updates position or adds card)
  const embedBlock = (blockId: string) => {
    const x = Math.round((400 - pan.x) / scale);
    const y = Math.round((200 - pan.y) / scale);

    ydoc.transact(() => {
      ycanvas.set(blockId, {
        id: blockId,
        type: 'card',
        x,
        y,
        width: 240,
        height: 120,
        zIndex: 15,
        rotation: 0,
        blockId
      });
    });
    setSelectedElementId(blockId);
  };

  // Embed a graph node as a text/shape element
  const embedGraphNode = (nodeId: string, label: string) => {
    const x = Math.round((400 - pan.x) / scale);
    const y = Math.round((200 - pan.y) / scale);

    ydoc.transact(() => {
      ycanvas.set(nodeId, {
        id: nodeId,
        type: 'shape',
        shapeType: 'rectangle',
        x,
        y,
        width: 160,
        height: 80,
        zIndex: 15,
        rotation: 0,
        text: label,
        color: '#E0E7FF' // soft indigo
      });
    });
    setSelectedElementId(nodeId);
  };

  // Quick Action: Delete Selected Element
  const handleDeleteSelected = () => {
    if (!selectedElementId) return;
    ydoc.transact(() => {
      ycanvas.delete(selectedElementId);
    });
    setSelectedElementId(null);
  };

  // Quick Action: Change Color
  const handleChangeColor = (colorHex: string) => {
    if (!selectedElementId) return;
    const current = ycanvas.get(selectedElementId);
    if (current) {
      ydoc.transact(() => {
        ycanvas.set(selectedElementId, {
          ...current,
          color: colorHex
        });
      });
    }
  };

  // Quick Action: Change Shape Type
  const handleChangeShapeType = (shapeType: 'rectangle' | 'circle' | 'triangle' | 'star') => {
    if (!selectedElementId) return;
    const current = ycanvas.get(selectedElementId);
    if (current && current.type === 'shape') {
      ydoc.transact(() => {
        ycanvas.set(selectedElementId, {
          ...current,
          shapeType
        });
      });
    }
  };

  // Handle Embed drop-down interaction
  const handleEmbedSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (!value) return;

    if (value.startsWith('graph-')) {
      const option = e.target.options[e.target.selectedIndex];
      embedGraphNode(value, option.text);
    } else {
      embedBlock(value);
    }
    e.target.value = ''; // reset selection
  };

  const graphNodes = getGraphNodes(blocks);
  const selectedElement = selectedElementId ? elements[selectedElementId] : null;

  // Predefined gorgeous colors for quick palette selection
  const colorOptions = [
    { name: 'Yellow', hex: '#FEF08A' },
    { name: 'Indigo', hex: '#E0E7FF' },
    { name: 'Green', hex: '#D1FAE5' },
    { name: 'Rose', hex: '#FFE4E6' },
    { name: 'Blue', hex: '#DBEAFE' },
    { name: 'Amber', hex: '#FFEDD5' },
    { name: 'White', hex: '#FFFFFF' }
  ];

  return (
    <div className="relative w-full">
      <div
        onMouseDown={(e) => {
          handleMouseDown(e);
          // clicking canvas background clears selection
          if (e.target === e.currentTarget) {
            setSelectedElementId(null);
          }
        }}
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

          {/* Draw Draggable Elements (Cards & Shapes) */}
          {Object.values(elements).map(elem => {
            if (elem.type === 'card') {
              const blockId = elem.blockId || elem.id;
              const block = blocks.find(b => b.id === blockId);
              if (!block) return null;

              return (
                <div
                  key={elem.id}
                  className="pointer-events-auto"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setSelectedElementId(elem.id);
                  }}
                >
                  <div className={selectedElementId === elem.id ? "ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-zinc-950 rounded-2xl" : ""}>
                    <CanvasCard
                      block={block}
                      canvasElem={elem}
                      onDragStart={handleCardDragStart}
                    />
                  </div>
                </div>
              );
            } else if (elem.type === 'shape') {
              return (
                <div
                  key={elem.id}
                  className="pointer-events-auto"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setSelectedElementId(elem.id);
                  }}
                >
                  <CanvasShape
                    canvasElem={elem}
                    isSelected={selectedElementId === elem.id}
                    onDragStart={handleCardDragStart}
                    onChangeText={(text) => {
                      const current = ycanvas.get(elem.id);
                      if (current) {
                        ycanvas.set(elem.id, { ...current, text });
                      }
                    }}
                  />
                </div>
              );
            }
            return null;
          })}
        </div>
      </div>

      {/* COMPACT & MOBILE-FRIENDLY CANVAS TOOLBAR */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/95 dark:bg-zinc-900/95 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl px-4 py-2.5 flex flex-wrap items-center gap-3 z-40 max-w-[95%] text-xs font-medium text-slate-700 dark:text-zinc-200">

        {/* Insert Options */}
        <div className="flex items-center gap-1.5 border-r border-slate-200 dark:border-zinc-800 pr-3">
          <button
            onClick={handleAddNewCard}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-100 transition-colors"
            title="Insert Card"
          >
            <Type className="w-3.5 h-3.5 text-indigo-500" />
            <span className="hidden sm:inline">Card</span>
          </button>

          {/* Shapes bar */}
          <div className="flex items-center gap-1 pl-1">
            <button
              onClick={() => handleAddNewShape('rectangle')}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400"
              title="Add Rectangle"
            >
              <Square className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleAddNewShape('circle')}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400"
              title="Add Circle"
            >
              <Circle className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleAddNewShape('triangle')}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400"
              title="Add Triangle"
            >
              <TriangleIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleAddNewShape('star')}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400"
              title="Add Star"
            >
              <Star className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Embedding Shared Elements (Dropdown selector) */}
        <div className="flex items-center gap-1.5 border-r border-slate-200 dark:border-zinc-800 pr-3">
          <select
            onChange={handleEmbedSelect}
            defaultValue=""
            className="bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg py-1 px-2 text-[11px] outline-none max-w-[120px] focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="" disabled>Embed Shared...</option>
            {blocks.length > 0 && (
              <optgroup label="Document Blocks">
                {blocks.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.content ? (b.content.length > 20 ? `${b.content.slice(0, 20)}...` : b.content) : `[${b.type}]`}
                  </option>
                ))}
              </optgroup>
            )}
            {graphNodes.length > 0 && (
              <optgroup label="Graph References">
                {graphNodes.map(n => (
                  <option key={n.id} value={n.id}>
                    {n.label}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>

        {/* Selected Element Quick Actions */}
        {selectedElement ? (
          <div className="flex items-center gap-2">
            {/* Color Palette Picker */}
            <div className="flex items-center gap-1.5">
              {colorOptions.map(opt => (
                <button
                  key={opt.hex}
                  onClick={() => handleChangeColor(opt.hex)}
                  className="w-4 h-4 rounded-full border border-slate-300 dark:border-zinc-600 transition-transform hover:scale-125 focus:outline-none"
                  style={{ backgroundColor: opt.hex }}
                  title={opt.name}
                />
              ))}
            </div>

            {/* Shape Conversion quick option (Only if selected is a Shape) */}
            {selectedElement.type === 'shape' && (
              <div className="flex items-center gap-1 border-l border-slate-200 dark:border-zinc-800 pl-2.5">
                <button
                  onClick={() => handleChangeShapeType('rectangle')}
                  className={`p-1 rounded ${selectedElement.shapeType === 'rectangle' ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500' : 'hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400'}`}
                  title="To Rectangle"
                >
                  <Square className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleChangeShapeType('circle')}
                  className={`p-1 rounded ${selectedElement.shapeType === 'circle' ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500' : 'hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400'}`}
                  title="To Circle"
                >
                  <Circle className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleChangeShapeType('triangle')}
                  className={`p-1 rounded ${selectedElement.shapeType === 'triangle' ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500' : 'hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400'}`}
                  title="To Triangle"
                >
                  <TriangleIcon className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleChangeShapeType('star')}
                  className={`p-1 rounded ${selectedElement.shapeType === 'star' ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500' : 'hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400'}`}
                  title="To Star"
                >
                  <Star className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Delete Selection */}
            <button
              onClick={handleDeleteSelected}
              className="flex items-center gap-1 px-2 py-1 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-600 rounded-lg transition-colors border-l border-slate-200 dark:border-zinc-800 pl-2.5 ml-1"
              title="Delete Element"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Delete</span>
            </button>
          </div>
        ) : (
          <div className="text-[10px] text-slate-400 dark:text-zinc-500 flex items-center gap-1 px-1">
            <MousePointer className="w-3 h-3 text-slate-400" />
            <span>Select an element to edit</span>
          </div>
        )}
      </div>
    </div>
  );
};
