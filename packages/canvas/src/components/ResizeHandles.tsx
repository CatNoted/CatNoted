import React from 'react';

interface ResizeHandlesProps {
  width: number;
  height: number;
  onResizeStart: (e: React.MouseEvent, handle: string) => void;
}

export const ResizeHandles: React.FC<ResizeHandlesProps> = ({ width, height, onResizeStart }) => {
  // Using 6px handles (-3px offset) for slightly more refined vector feel
  const handleSize = 6;
  const offset = -3;

  const handles = [
    { id: 'tl', cursor: 'nwse-resize', left: offset, top: offset },
    { id: 'tr', cursor: 'nesw-resize', left: width + offset, top: offset },
    { id: 'bl', cursor: 'nesw-resize', left: offset, top: height + offset },
    { id: 'br', cursor: 'nwse-resize', left: width + offset, top: height + offset },
    { id: 't', cursor: 'ns-resize', left: width / 2 + offset, top: offset },
    { id: 'b', cursor: 'ns-resize', left: width / 2 + offset, top: height + offset },
    { id: 'l', cursor: 'ew-resize', left: offset, top: height / 2 + offset },
    { id: 'r', cursor: 'ew-resize', left: width + offset, top: height / 2 + offset },
  ];

  return (
    <>
      {/* Visual outline connecting handles */}
      <div className="absolute inset-0 border border-primary pointer-events-none z-30" />

      {handles.map((h) => (
        <div
          key={h.id}
          className="absolute bg-background border border-primary z-40 hover:bg-primary/20 shadow-sm"
          style={{
            width: `${handleSize}px`,
            height: `${handleSize}px`,
            left: h.left,
            top: h.top,
            cursor: h.cursor,
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            onResizeStart(e, h.id);
          }}
        />
      ))}
    </>
  );
};
