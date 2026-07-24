import React from 'react';
import { BlockNode, CanvasElement } from '@catnoted/shared';
import { useDocumentStore } from '@catnoted/editor';

interface CanvasCardProps {
  block: BlockNode;
  canvasElem: CanvasElement;
  onDragStart: (e: React.MouseEvent, id: string) => void;
  onStartConnector: (e: React.MouseEvent, fromId: string) => void;
  isSelected?: boolean;
  onSelectToggle?: (e: React.MouseEvent, id: string) => void;
}

export const CanvasCard: React.FC<CanvasCardProps> = ({
  block,
  canvasElem,
  onDragStart,
  onStartConnector,
  isSelected = false,
  onSelectToggle
}) => {
  const { updateBlockContent } = useDocumentStore();

  return (
    <div
      style={{
        left: canvasElem.x,
        top: canvasElem.y,
        width: canvasElem.width || 260,
        zIndex: canvasElem.zIndex || 10,
        transform: `rotate(${canvasElem.rotation || 0}deg)`,
      }}
      onMouseDown={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest('button, input, textarea')) return;
        if (onSelectToggle) {
          onSelectToggle(e, block.id);
        }
      }}
      className={`absolute bg-white dark:bg-zinc-900/90 backdrop-blur-sm border rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:shadow-none hover:shadow-md transition-all select-none flex flex-col ${
        isSelected
          ? 'border-indigo-500/50 ring-2 ring-indigo-500/20 shadow-indigo-500/5'
          : 'border-slate-200/80 dark:border-zinc-800'
      }`}
    >
      {/* Drag Handle Header */}
      <div
        onMouseDown={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest('button, input, textarea')) return;
          onDragStart(e, block.id);
        }}
        className="h-7 cursor-grab active:cursor-grabbing border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/50 rounded-t-xl flex items-center px-3 justify-between"
      >
        <span className="text-[9px] font-medium text-slate-400 uppercase tracking-widest">{block.type}</span>
        <div className="flex items-center gap-1.5">
          {isSelected && (
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
          )}
          <div className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-zinc-800" />
        </div>
      </div>

      {/* Editable Block Content Area */}
      <div className="p-4 flex-1">
        {block.type === 'heading' ? (
          <textarea
            value={block.content}
            onChange={(e) => updateBlockContent(block.id, e.target.value)}
            rows={1}
            className="w-full bg-transparent resize-none font-bold text-slate-900 dark:text-zinc-50 border-none outline-none focus:ring-0 p-0 text-base leading-tight placeholder-slate-300"
            placeholder="Heading..."
          />
        ) : block.type === 'widget' ? (
          <div className="py-2 flex flex-col items-center justify-center text-center">
            <span className="text-xl mb-1">🤖</span>
            <span className="text-[10px] font-mono bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500 px-2 py-0.5 rounded-full">
              {block.properties?.widgetId || 'AI Sandbox'}
            </span>
          </div>
        ) : (
          <textarea
            value={block.content}
            onChange={(e) => updateBlockContent(block.id, e.target.value)}
            className="w-full bg-transparent resize-none text-slate-700 dark:text-zinc-200 border-none outline-none focus:ring-0 p-0 text-xs leading-relaxed placeholder-slate-300"
            placeholder="Write card content..."
            rows={3}
          />
        )}
      </div>

      {/* Connector Handle Port - Right Side */}
      <button
        onMouseDown={(e) => {
          e.stopPropagation();
          onStartConnector(e, block.id);
        }}
        className="absolute right-[-8px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-amber-500 bg-zinc-950 hover:bg-amber-500 hover:scale-125 transition-all cursor-crosshair z-20 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
        title="Drag to connect"
        aria-label={`Drag connector from ${block.content || 'this card'}`}
        type="button"
      >
        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 hover:bg-zinc-950" />
      </button>

      {/* Connector Handle Port - Left Side (Target node port / helpful visual aid) */}
      <div
        className="absolute left-[-8px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border border-zinc-700 bg-zinc-900 z-20 flex items-center justify-center pointer-events-none"
        aria-hidden="true"
      >
        <div className="w-1 h-1 rounded-full bg-zinc-500" />
      </div>
    </div>
  );
};
