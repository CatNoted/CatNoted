import React from 'react';

interface ConnectorLineProps {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  label?: string;
}

export const ConnectorLine: React.FC<ConnectorLineProps> = ({
  startX,
  startY,
  endX,
  endY,
  label
}) => {
  // Use a softer cubic bezier curve
  const dx = Math.abs(endX - startX) * 0.6;

  // Decide if we should route vertically or horizontally mostly
  const isHorizontal = Math.abs(endX - startX) > Math.abs(endY - startY);

  let path = '';
  if (isHorizontal) {
    path = `M ${startX} ${startY} C ${startX + dx} ${startY}, ${endX - dx} ${endY}, ${endX} ${endY}`;
  } else {
    // Add vertical bias for vertical layouts
    const vy = (endY - startY) * 0.5;
    path = `M ${startX} ${startY} C ${startX} ${startY + vy}, ${endX} ${endY - vy}, ${endX} ${endY}`;
  }

  return (
    <svg className="absolute inset-0 pointer-events-none w-full h-full overflow-visible z-0 group">
      <defs>
        <marker
          id="arrow"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 9 5 L 0 9 z" className="fill-indigo-400 dark:fill-indigo-600" />
        </marker>

        {/* Slightly larger, softer shadow arrow for focus states (if needed later) */}
        <marker
          id="arrow-hover"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 9 5 L 0 9 z" className="fill-indigo-500 dark:fill-indigo-400" />
        </marker>
      </defs>

      {/* Invisible thicker path for easier hover targeting */}
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth="16"
        className="pointer-events-auto cursor-pointer"
      />

      {/* Main connector path */}
      <path
        d={path}
        fill="none"
        className="stroke-indigo-400/80 dark:stroke-indigo-600/80 transition-colors"
        strokeWidth="2.5"
        markerEnd="url(#arrow)"
      />

      {label && (
        <text
          x={(startX + endX) / 2}
          y={(startY + endY) / 2 - 8}
          className="fill-indigo-600 dark:fill-indigo-300 font-medium text-[10px] tracking-wide"
          textAnchor="middle"
          style={{ textShadow: '0 1px 2px rgba(255,255,255,0.8)' }}
        >
          {label}
        </text>
      )}
    </svg>
  );
};
