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

const CanvasCardBase: React.FC<CanvasCardProps> = ({
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
      className={`absolute bg-card/90 backdrop-blur-sm border rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:shadow-none hover:shadow-md transition-all select-none flex flex-col ${
        isSelected
          ? 'border-primary/50 ring-2 ring-primary/20 shadow-primary/5'
          : 'border-border'
      }`}
    >
      {/* Drag Handle Header */}
      <div
        onMouseDown={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest('button, input, textarea')) return;
          onDragStart(e, block.id);
        }}
        className="h-7 cursor-grab active:cursor-grabbing border-b border-border/80 bg-muted/50 rounded-t-xl flex items-center px-3 justify-between"
      >
        <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest">{block.type}</span>
        <div className="flex items-center gap-1.5">
          {isSelected && (
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          )}
          <div className="w-1.5 h-1.5 rounded-full bg-border" />
        </div>
      </div>

      {/* Editable Block Content Area */}
      <div className="p-4 flex-1">
        {block.type === 'heading' ? (
          <textarea
            value={block.content}
            onChange={(e) => updateBlockContent(block.id, e.target.value)}
            rows={1}
            className="w-full bg-transparent resize-none font-bold text-foreground border-none outline-none focus:ring-0 p-0 text-base leading-tight placeholder-muted-foreground/50"
            placeholder="Heading..."
          />
        ) : block.type === 'widget' ? (
          <div className="py-2 flex flex-col items-center justify-center text-center">
            <span className="text-xl mb-1">🤖</span>
            <span className="text-[10px] font-mono bg-muted text-primary px-2 py-0.5 rounded-full">
              {block.properties?.widgetId || 'AI Sandbox'}
            </span>
          </div>
        ) : (
          <textarea
            value={block.content}
            onChange={(e) => updateBlockContent(block.id, e.target.value)}
            className="w-full bg-transparent resize-none text-foreground/90 border-none outline-none focus:ring-0 p-0 text-xs leading-relaxed placeholder-muted-foreground/50"
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
        className={`absolute right-[-8px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-primary bg-background hover:bg-primary hover:scale-125 transition-all cursor-crosshair z-20 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
          isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100'
        }`}
        title="Drag to connect"
        aria-label={`Drag connector from ${block.content || 'this card'}`}
        type="button"
      >
        <div className="w-1.5 h-1.5 rounded-full bg-primary hover:bg-background" />
      </button>

      {/* Connector Handle Port - Left Side (Target node port / helpful visual aid) */}
      <div
        className={`absolute left-[-8px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-primary/30 bg-background z-20 flex items-center justify-center pointer-events-none transition-opacity ${
          isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
        aria-hidden="true"
      >
        <div className="w-1.5 h-1.5 rounded-full bg-primary/30" />
      </div>
    </div>
  );
};

export const CanvasCard = React.memo(CanvasCardBase);
