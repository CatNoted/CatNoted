import React from 'react';
import { CanvasElement } from '@catnoted/shared';
import { ResizeHandles } from './ResizeHandles.js';

interface GenericShapeProps {
  element: CanvasElement;
  isSelected: boolean;
  onSelectToggle: (e: React.MouseEvent, id: string) => void;
  onDragStart: (e: React.MouseEvent, id: string) => void;
  onResizeStart: (e: React.MouseEvent, handle: string, id: string) => void;
  onTextChange: (id: string, text: string) => void;
}

export const GenericShape: React.FC<GenericShapeProps> = ({
  element,
  isSelected,
  onSelectToggle,
  onDragStart,
  onResizeStart,
  onTextChange
}) => {
  const width = element.width || 200;
  const height = element.height || 100;

  let shapeClass = 'absolute shadow-sm flex items-center p-2 ';

  // Base classes and Colors
  if (element.type === 'note') {
    shapeClass += 'bg-yellow-100/90 dark:bg-yellow-900/90 rounded text-slate-800 dark:text-zinc-100 ';
  } else if (element.type === 'frame') {
    shapeClass += 'bg-transparent border-slate-400 dark:border-zinc-500 rounded-xl ';
  } else {
    shapeClass += (element.color || 'bg-white dark:bg-zinc-800') + ' ';
    if (element.shapeType === 'circle') shapeClass += 'rounded-full ';
    else shapeClass += 'rounded-xl ';
  }

  // Border Style (overrides default frame border if specified)
  if (element.borderStyle === 'dashed') {
    shapeClass += 'border-2 border-dashed border-slate-400 dark:border-zinc-500 ';
  } else if (element.borderStyle === 'solid') {
    shapeClass += 'border border-slate-300 dark:border-zinc-700 ';
  } else if (element.borderStyle === 'none' && element.type !== 'frame') {
    // No border class added
  } else if (element.type !== 'frame') {
    // Default for non-frames
    shapeClass += 'border border-slate-300 dark:border-zinc-700 ';
  } else {
    // Default for frames
    shapeClass += 'border-2 border-dashed border-slate-400 dark:border-zinc-500 ';
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
      className={`absolute ${isSelected ? 'ring-2 ring-amber-500 ring-offset-1 ring-offset-transparent' : ''}`}
      onMouseDown={(e) => {
        if ((e.target as HTMLElement).tagName === 'TEXTAREA') return;
        onSelectToggle(e, element.id);
        onDragStart(e, element.id);
      }}
    >
      <div className={`${shapeClass} w-full h-full relative overflow-hidden group justify-center`}>
        {element.type === 'frame' ? (
           <span className="absolute top-2 left-2 text-[10px] font-mono text-slate-400 bg-white/80 dark:bg-zinc-900/80 px-1 rounded z-10">Frame</span>
        ) : null}

        {element.type !== 'frame' && (
          <textarea
            value={element.text || ''}
            onChange={(e) => onTextChange(element.id, e.target.value)}
            className={`w-full h-full bg-transparent resize-none ${alignClass} outline-none focus:ring-0 p-1 placeholder-slate-400/50 flex flex-col justify-center`}
            placeholder="Type..."
            style={{
              pointerEvents: isSelected ? 'auto' : 'none',
            }}
          />
        )}
      </div>

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
