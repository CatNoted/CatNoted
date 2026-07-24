import React, { useRef, useEffect } from 'react';
import { CanvasElement } from '@catnoted/shared';

interface CanvasShapeProps {
  canvasElem: CanvasElement;
  isSelected?: boolean;
  onSelectToggle?: (e: React.MouseEvent, id: string) => void;
  onDragStart: (e: React.MouseEvent, id: string) => void;
  onChangeText?: (id: string, text: string) => void;
  onResizeStart?: (e: React.MouseEvent, id: string, dir: string) => void;
  onRotateStart?: (e: React.MouseEvent, id: string) => void;
}

export const CanvasShape: React.FC<CanvasShapeProps> = ({
  canvasElem,
  isSelected = false,
  onSelectToggle,
  onDragStart,
  onChangeText,
  onResizeStart,
  onRotateStart
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea height for notes
  useEffect(() => {
    if (canvasElem.type === 'note' && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [canvasElem.text, canvasElem.type]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button, input, textarea')) return;
    if (onSelectToggle) {
      onSelectToggle(e, canvasElem.id);
    }
  };

  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button, input, textarea')) return;
    onDragStart(e, canvasElem.id);
  };

  const handleResizeMouseDown = (e: React.MouseEvent, dir: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (onResizeStart) {
      onResizeStart(e, canvasElem.id, dir);
    }
  };

  const handleRotateMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (onRotateStart) {
      onRotateStart(e, canvasElem.id);
    }
  };

  const textAlignmentClass = canvasElem.textAlignment === 'center'
    ? 'text-center'
    : canvasElem.textAlignment === 'right'
    ? 'text-right'
    : 'text-left';

  const opacityStyle = canvasElem.opacity !== undefined ? { opacity: canvasElem.opacity / 100 } : {};

  // HELPER FOR SELECTION BOUNDARY ELEMENTS
  const renderSelectionHandles = () => {
    if (!isSelected) return null;
    return (
      <>
        {/* Rotation Stem/Handle */}
        <div
          onMouseDown={handleRotateMouseDown}
          className="absolute top-[-24px] left-1/2 -translate-x-1/2 flex flex-col items-center cursor-alias group z-30 pointer-events-auto"
          title="Rotate"
        >
          <div className="w-4 h-4 rounded-full bg-indigo-500 hover:bg-indigo-600 border border-white dark:border-zinc-950 flex items-center justify-center text-[10px] text-white shadow-md">
            ⟳
          </div>
          <div className="w-[1px] h-2 bg-indigo-500" />
        </div>

        {/* 8-Directional Resize Nodes */}
        {[
          { dir: 'nw', class: 'top-[-4px] left-[-4px] cursor-nwse-resize' },
          { dir: 'n', class: 'top-[-4px] left-1/2 -translate-x-1/2 cursor-ns-resize' },
          { dir: 'ne', class: 'top-[-4px] right-[-4px] cursor-nesw-resize' },
          { dir: 'e', class: 'top-1/2 -translate-y-1/2 right-[-4px] cursor-ew-resize' },
          { dir: 'se', class: 'bottom-[-4px] right-[-4px] cursor-nwse-resize' },
          { dir: 's', class: 'bottom-[-4px] left-1/2 -translate-x-1/2 cursor-ns-resize' },
          { dir: 'sw', class: 'bottom-[-4px] left-[-4px] cursor-nesw-resize' },
          { dir: 'w', class: 'top-1/2 -translate-y-1/2 left-[-4px] cursor-ew-resize' },
        ].map((handle) => (
          <div
            key={handle.dir}
            onMouseDown={(e) => handleResizeMouseDown(e, handle.dir)}
            className={`absolute w-2 h-2 rounded-full bg-indigo-600 border border-white dark:border-zinc-950 hover:scale-125 transition-transform z-30 shadow-md pointer-events-auto ${handle.class}`}
          />
        ))}
      </>
    );
  };

  // RENDER STICKY NOTE
  if (canvasElem.type === 'note') {
    const defaultNoteBg = 'bg-amber-100 dark:bg-amber-900/40';
    const bgStyle = canvasElem.color ? { backgroundColor: canvasElem.color } : {};

    return (
      <div
        style={{
          left: canvasElem.x,
          top: canvasElem.y,
          width: canvasElem.width || 180,
          height: canvasElem.height || 180,
          zIndex: canvasElem.zIndex || 10,
          transform: `rotate(${canvasElem.rotation || 0}deg)`,
          ...opacityStyle,
          ...bgStyle
        }}
        onMouseDown={handleMouseDown}
        className={`absolute rounded-xl shadow-sm p-4 flex flex-col cursor-pointer border select-none transition-shadow ${
          isSelected
            ? 'border-indigo-500 ring-2 ring-indigo-500/30 shadow-md shadow-indigo-500/10'
            : 'border-amber-200/50 dark:border-amber-900/30'
        } ${!canvasElem.color ? defaultNoteBg : ''}`}
      >
        <div
          onMouseDown={handleHeaderMouseDown}
          className="h-4 w-full cursor-grab active:cursor-grabbing flex items-center justify-between mb-1"
        >
          <span className="text-[9px] font-mono text-amber-600/60 dark:text-amber-400/60 uppercase tracking-widest">Sticky Note</span>
        </div>
        <textarea
          ref={textareaRef}
          value={canvasElem.text || ''}
          onChange={(e) => onChangeText?.(canvasElem.id, e.target.value)}
          placeholder="Type something..."
          className={`w-full bg-transparent resize-none border-none outline-none focus:ring-0 p-0 text-sm leading-relaxed text-amber-950 dark:text-amber-100 placeholder-amber-900/30 dark:placeholder-amber-200/20 ${textAlignmentClass}`}
          rows={3}
        />
        {renderSelectionHandles()}
      </div>
    );
  }

  // RENDER FRAME
  if (canvasElem.type === 'frame') {
    const borderClass = canvasElem.borderStyle === 'dashed'
      ? 'border-dashed'
      : canvasElem.borderStyle === 'dotted'
      ? 'border-dotted'
      : canvasElem.borderStyle === 'none'
      ? 'border-none'
      : 'border-solid';

    const bgStyle = canvasElem.color ? { backgroundColor: canvasElem.color } : {};
    const borderStyleColor = canvasElem.borderColor ? { borderColor: canvasElem.borderColor } : {};

    return (
      <div
        style={{
          left: canvasElem.x,
          top: canvasElem.y,
          width: canvasElem.width || 400,
          height: canvasElem.height || 300,
          zIndex: canvasElem.zIndex || 2, // frames go beneath standard cards
          transform: `rotate(${canvasElem.rotation || 0}deg)`,
          ...opacityStyle,
          ...bgStyle,
          ...borderStyleColor
        }}
        onMouseDown={handleMouseDown}
        className={`absolute rounded-3xl border-2 transition-all p-4 flex flex-col select-none ${borderClass} ${
          isSelected
            ? 'border-indigo-500 ring-4 ring-indigo-500/15 shadow-xl shadow-indigo-500/5'
            : 'border-slate-300 dark:border-zinc-800'
        } ${!canvasElem.color ? 'bg-slate-100/30 dark:bg-zinc-900/20' : ''}`}
      >
        <div
          onMouseDown={handleHeaderMouseDown}
          className="flex items-center gap-2 cursor-grab active:cursor-grabbing mb-2 pb-2 border-b border-slate-200/40 dark:border-zinc-800/40"
        >
          <span className="text-[10px] font-mono font-bold bg-slate-200 dark:bg-zinc-800 text-slate-500 px-2 py-0.5 rounded-md uppercase tracking-wider">
            Frame
          </span>
          <input
            type="text"
            value={canvasElem.text || ''}
            onChange={(e) => onChangeText?.(canvasElem.id, e.target.value)}
            placeholder="Frame Title"
            className="bg-transparent border-none outline-none focus:ring-0 p-0 text-xs font-semibold text-slate-700 dark:text-zinc-200"
          />
        </div>
        <div className="flex-1 pointer-events-none" />
        {renderSelectionHandles()}
      </div>
    );
  }

  // RENDER CUSTOM SHAPES (Rectangle, Circle, Triangle, Star)
  const renderShapeSvg = () => {
    const shapeType = canvasElem.shapeType || 'rectangle';
    const fill = canvasElem.color || '#6366f1'; // Default Indigo
    const stroke = canvasElem.borderColor || 'transparent';
    const strokeWidth = canvasElem.borderStyle === 'none' ? 0 : 2;
    const strokeDasharray = canvasElem.borderStyle === 'dashed' ? '5,5' : canvasElem.borderStyle === 'dotted' ? '2,2' : undefined;

    switch (shapeType) {
      case 'circle':
        return (
          <svg className="w-full h-full absolute inset-0 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
            <circle cx="50" cy="50" r="48" fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={strokeDasharray} />
          </svg>
        );
      case 'triangle':
        return (
          <svg className="w-full h-full absolute inset-0 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
            <polygon points="50,2 98,98 2,98" fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={strokeDasharray} />
          </svg>
        );
      case 'star':
        return (
          <svg className="w-full h-full absolute inset-0 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
            <polygon points="50,2 63,38 98,38 70,60 81,96 50,75 19,96 30,60 2,38 37,38" fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={strokeDasharray} />
          </svg>
        );
      case 'rectangle':
      default:
        return (
          <svg className="w-full h-full absolute inset-0 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
            <rect x="2" y="2" width="96" height="96" rx="12" fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={strokeDasharray} />
          </svg>
        );
    }
  };

  return (
    <div
      style={{
        left: canvasElem.x,
        top: canvasElem.y,
        width: canvasElem.width || 140,
        height: canvasElem.height || 140,
        zIndex: canvasElem.zIndex || 10,
        transform: `rotate(${canvasElem.rotation || 0}deg)`,
        ...opacityStyle
      }}
      onMouseDown={handleMouseDown}
      className={`absolute flex items-center justify-center p-4 cursor-pointer select-none ${
        isSelected
          ? 'ring-2 ring-indigo-500/40 shadow-xl'
          : ''
      }`}
    >
      {/* Background Shape SVG */}
      {renderShapeSvg()}

      {/* Foreground Interactive Grab Header */}
      <div
        onMouseDown={handleHeaderMouseDown}
        className="absolute top-2 left-1/2 -translate-x-1/2 h-3 w-1/2 cursor-grab active:cursor-grabbing opacity-0 hover:opacity-100 flex items-center justify-center z-10"
        title="Drag Shape"
      >
        <div className="w-6 h-1 bg-white/40 rounded-full" />
      </div>

      {/* Central Editable Text */}
      <div className="z-10 w-full flex flex-col justify-center items-center h-full px-2">
        <textarea
          value={canvasElem.text || ''}
          onChange={(e) => onChangeText?.(canvasElem.id, e.target.value)}
          placeholder="..."
          className={`w-full bg-transparent resize-none border-none outline-none focus:ring-0 p-0 text-xs font-semibold leading-tight text-white dark:text-zinc-100 placeholder-white/40 text-center`}
          rows={2}
        />
      </div>
      {renderSelectionHandles()}
    </div>
  );
};
