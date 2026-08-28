import React from 'react';
import { CanvasElement } from '@catnoted/shared';
import { ResizeHandles } from './ResizeHandles.js';

interface GenericShapeProps {
  element: CanvasElement;
  isSelected: boolean;
  onSelectToggle: (e: React.MouseEvent, id: string) => void;
  onDragStart: (e: React.MouseEvent, id: string) => void;
  onResizeStart: (e: React.MouseEvent, handle: string, id: string) => void;
  onStartConnector?: (e: React.MouseEvent, fromId: string) => void;
  onTextChange: (id: string, text: string) => void;
}

export const GenericShape: React.FC<GenericShapeProps> = ({
  element,
  isSelected,
  onSelectToggle,
  onDragStart,
  onResizeStart,
  onStartConnector,
  onTextChange
}) => {
  const width = element.width || 200;
  const height = element.height || 100;

  let shapeClass = 'absolute shadow-sm flex items-center p-2 ';

  // Base classes and Colors
  if (element.type === 'note') {
    shapeClass += 'bg-warning-soft text-foreground rounded ';
  } else if (element.type === 'frame') {
    shapeClass += 'bg-transparent border-border rounded-xl ';
  } else {
    shapeClass += (element.color || 'bg-card') + ' ';
    if (element.shapeType === 'circle') shapeClass += 'rounded-full ';
    else shapeClass += 'rounded-xl ';
  }

  // Border Style (overrides default frame border if specified)
  if (element.borderStyle === 'dashed') {
    shapeClass += 'border-2 border-dashed border-border ';
  } else if (element.borderStyle === 'solid') {
    shapeClass += 'border border-border ';
  } else if (element.borderStyle === 'none' && element.type !== 'frame') {
    // No border class added
  } else if (element.type !== 'frame') {
    // Default for non-frames
    shapeClass += 'border border-border ';
  } else {
    // Default for frames
    shapeClass += 'border-2 border-dashed border-border ';
  }

  // Alignment
  let alignClass = 'text-center';
  if (element.textAlign === 'left') alignClass = 'text-left';
  if (element.textAlign === 'right') alignClass = 'text-right';

  return (
    <div
      style={{
        left: element.x,
        top: element.y,
        width,
        height,
        zIndex: element.zIndex || 10,
        transform: `rotate(${element.rotation || 0}deg)`,
        opacity: element.opacity ?? 1,
      }}
      className={`absolute group ${isSelected ? 'ring-2 ring-primary ring-offset-1 ring-offset-transparent' : ''}`}
      onMouseDown={(e) => {
        if ((e.target as HTMLElement).tagName === 'TEXTAREA') return;
        onSelectToggle(e, element.id);
        onDragStart(e, element.id);
      }}
    >
      <div className={`${shapeClass} w-full h-full relative overflow-hidden group justify-center transition-shadow ${isSelected ? 'shadow-md shadow-primary/5' : ''}`}>
        {element.type === 'frame' ? (
           <span className="absolute top-2 left-3 text-[10px] font-mono font-medium text-muted-foreground bg-card/80 px-1.5 py-0.5 rounded shadow-sm z-10">Frame</span>
        ) : null}

        {element.type !== 'frame' && (
          <textarea
            value={element.text || ''}
            onChange={(e) => onTextChange(element.id, e.target.value)}
            className={`w-full h-full bg-transparent resize-none ${alignClass} outline-none focus:ring-0 p-2 placeholder-muted-foreground/40 flex flex-col justify-center text-sm`}
            placeholder="Type..."
            style={{
              pointerEvents: isSelected ? 'auto' : 'none',
            }}
          />
        )}
      </div>

      {onStartConnector && element.type !== 'frame' && (
        <button
          onMouseDown={(e) => {
            e.stopPropagation();
            onStartConnector(e, element.id);
          }}
          className={`absolute right-[-8px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-primary bg-background hover:bg-primary hover:scale-125 transition-all cursor-crosshair z-20 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100'
          }`}
          title="Drag to connect"
          aria-label={`Drag connector from this shape`}
          type="button"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-primary hover:bg-background" />
        </button>
      )}

      {isSelected && (
        <ResizeHandles
          width={width}
          height={height}
          onResizeStart={(e, handle) => onResizeStart(e, handle, element.id)}
        />
      )}
    </div>
  );
};
