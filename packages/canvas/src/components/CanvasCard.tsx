import React from 'react';
import { BlockNode, CanvasElement } from '@catnoted/shared';
import { useDocumentStore } from '@catnoted/editor';

interface CanvasCardProps {
  block: BlockNode;
  canvasElem: CanvasElement;
  onDragStart: (e: React.MouseEvent, id: string) => void;
}

export const CanvasCard: React.FC<CanvasCardProps> = ({
  block,
  canvasElem,
  onDragStart
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
      className="absolute bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow select-none flex flex-col"
    >
      {/* Drag Handle Header */}
      <div
        onMouseDown={(e) => onDragStart(e, block.id)}
        className="h-8 cursor-grab active:cursor-grabbing border-b border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 rounded-t-2xl flex items-center px-3 justify-between"
      >
        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">{block.type} card</span>
        <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-zinc-700"></div>
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
    </div>
  );
};
