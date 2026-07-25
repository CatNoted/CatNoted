import React from 'react';

interface ConnectorLineProps {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  label?: string;
  type?: 'straight' | 'bezier' | 'stepped' | 'orthogonal';
  arrowStart?: boolean;
  arrowEnd?: boolean;
  color?: string;
  isSelected?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  forceShowLabel?: boolean;
}

export const ConnectorLine: React.FC<ConnectorLineProps> = ({
  startX,
  startY,
  endX,
  endY,
  label,
  type = 'bezier',
  arrowStart = false,
  arrowEnd = false,
  isSelected = false,
  onClick,
  forceShowLabel = false
}) => {
  let path = '';
  if (type === 'straight') {
    path = `M ${startX} ${startY} L ${endX} ${endY}`;
  } else if (type === 'stepped' || type === 'orthogonal') {
    const isHorizontal = Math.abs(endX - startX) > Math.abs(endY - startY);
    if (isHorizontal) {
      const midX = (startX + endX) / 2;
      path = `M ${startX} ${startY} L ${midX} ${startY} L ${midX} ${endY} L ${endX} ${endY}`;
    } else {
      const midY = (startY + endY) / 2;
      path = `M ${startX} ${startY} L ${startX} ${midY} L ${endX} ${midY} L ${endX} ${endY}`;
    }
  } else {
    // Use a softer cubic bezier curve
    const dx = Math.abs(endX - startX) * 0.6;
    const isHorizontal = Math.abs(endX - startX) > Math.abs(endY - startY);
    if (isHorizontal) {
      path = `M ${startX} ${startY} C ${startX + dx} ${startY}, ${endX - dx} ${endY}, ${endX} ${endY}`;
    } else {
      const vy = (endY - startY) * 0.5;
      path = `M ${startX} ${startY} C ${startX} ${startY + vy}, ${endX} ${endY - vy}, ${endX} ${endY}`;
    }
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

      {/* Selection highlight glow */}
      {isSelected && (
        <path
          d={path}
          fill="none"
          className="stroke-indigo-500/25 dark:stroke-indigo-400/25 pointer-events-none"
          strokeWidth="8"
        />
      )}

      {/* Invisible thicker path for easier hover targeting */}
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth="16"
        className="pointer-events-auto cursor-pointer"
        onMouseDown={(e) => {
          e.stopPropagation();
          if (onClick) onClick(e);
        }}
      />

      {/* Main connector path */}
      <path
        d={path}
        fill="none"
        className={`${
          isSelected
            ? 'stroke-indigo-500 dark:stroke-indigo-400'
            : 'stroke-indigo-400/80 dark:stroke-indigo-600/80 hover:stroke-indigo-500 dark:hover:stroke-indigo-400'
        } transition-colors`}
        strokeWidth={isSelected ? "3" : "2.5"}
        markerStart={arrowStart ? "url(#arrow)" : undefined}
        markerEnd={arrowEnd ? "url(#arrow)" : undefined}
      />

      {label && (
        <text
          x={(startX + endX) / 2}
          y={(startY + endY) / 2 - 8}
          className={`fill-indigo-600 dark:fill-indigo-300 font-medium text-[10px] tracking-wide transition-opacity duration-200 pointer-events-none ${
            forceShowLabel ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
          textAnchor="middle"
          style={{ textShadow: '0 1px 2px rgba(255,255,255,0.8)' }}
        >
          {label}
        </text>
      )}
    </svg>
  );
};
