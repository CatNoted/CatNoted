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
  const dx = Math.abs(endX - startX) * 0.5;
  const path = `M ${startX} ${startY} C ${startX + dx} ${startY}, ${endX - dx} ${endY}, ${endX} ${endY}`;

  return (
    <svg className="absolute inset-0 pointer-events-none w-full h-full overflow-visible z-0">
      <defs>
        <marker
          id="arrow"
          viewBox="0 0 10 10"
          refX="6"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" className="fill-indigo-400 dark:fill-indigo-850" />
        </marker>
      </defs>
      <path
        d={path}
        fill="none"
        className="stroke-indigo-300 dark:stroke-indigo-950/80"
        strokeWidth="2"
        strokeDasharray="4"
        markerEnd="url(#arrow)"
      />
      {label && (
        <text
          x={(startX + endX) / 2}
          y={(startY + endY) / 2 - 6}
          className="fill-indigo-500 dark:fill-indigo-400 font-mono text-[9px]"
          textAnchor="middle"
        >
          {label}
        </text>
      )}
    </svg>
  );
};
