import React from 'react';

interface ResizeHandlesProps {
  width: number;
  height: number;
  onResizeStart: (e: React.MouseEvent, handle: string) => void;
}

export const ResizeHandles: React.FC<ResizeHandlesProps> = ({ width, height, onResizeStart }) => {
  const handles = [
    { id: 'tl', cursor: 'nwse-resize', left: -4, top: -4 },
    { id: 'tr', cursor: 'nesw-resize', left: width - 4, top: -4 },
    { id: 'bl', cursor: 'nesw-resize', left: -4, top: height - 4 },
    { id: 'br', cursor: 'nwse-resize', left: width - 4, top: height - 4 },
    { id: 't', cursor: 'ns-resize', left: width / 2 - 4, top: -4 },
    { id: 'b', cursor: 'ns-resize', left: width / 2 - 4, top: height - 4 },
    { id: 'l', cursor: 'ew-resize', left: -4, top: height / 2 - 4 },
    { id: 'r', cursor: 'ew-resize', left: width - 4, top: height / 2 - 4 },
  ];

  return (
    <>
      <div className="absolute inset-0 border-2 border-amber-500 pointer-events-none z-30" />
      {handles.map((h) => (
        <div
          key={h.id}
          className="absolute w-2 h-2 bg-white border border-amber-500 z-40"
          style={{
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
