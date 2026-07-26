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
  isBroken?: boolean;
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
  forceShowLabel = false,
  isBroken = false
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
          <path d="M 0 1 L 9 5 L 0 9 z" className="fill-primary/60" />
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
          <path d="M 0 1 L 9 5 L 0 9 z" className="fill-primary" />
        </marker>

        {/* Broken arrow marker in rose color */}
        <marker
          id="broken-arrow"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 9 5 L 0 9 z" className="fill-rose-500 dark:fill-rose-600" />
        </marker>
      </defs>

      {/* Selection highlight glow */}
      {isSelected && (
        <path
          d={path}
          fill="none"
          className="stroke-primary/25 pointer-events-none"
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
        className={isBroken
          ? `stroke-rose-500/80 dark:stroke-rose-600/80 hover:stroke-rose-600 dark:hover:stroke-rose-500 transition-colors`
          : `${
              isSelected
                ? 'stroke-primary'
                : 'stroke-primary/60 hover:stroke-primary'
            } transition-colors`
        }
        strokeDasharray={isBroken ? "4,4" : undefined}
        strokeWidth={isSelected ? "3" : "2.5"}
        markerStart={arrowStart ? (isBroken ? "url(#broken-arrow)" : "url(#arrow)") : undefined}
        markerEnd={arrowEnd ? (isBroken ? "url(#broken-arrow)" : "url(#arrow)") : undefined}
      />

      {label && (
        <text
          x={(startX + endX) / 2}
          y={(startY + endY) / 2 - 8}
          className={isBroken
            ? `fill-rose-600 dark:fill-rose-400 font-semibold text-[10px] tracking-wide pointer-events-none opacity-100`
            : `fill-primary font-medium text-[10px] tracking-wide transition-opacity duration-200 pointer-events-none ${
                forceShowLabel ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`
          }
          textAnchor="middle"
          style={{ textShadow: '0 1px 2px rgba(255,255,255,0.8)' }}
        >
          {label}
        </text>
      )}
    </svg>
  );
};
