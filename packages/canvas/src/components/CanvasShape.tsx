import React from 'react';
import { CanvasElement } from '@catnoted/shared';

interface CanvasShapeProps {
  canvasElem: CanvasElement;
  isSelected: boolean;
  onDragStart: (e: React.MouseEvent, id: string) => void;
  onChangeText: (text: string) => void;
}

export const CanvasShape: React.FC<CanvasShapeProps> = ({
  canvasElem,
  isSelected,
  onDragStart,
  onChangeText,
}) => {
  const { id, shapeType = 'rectangle', width = 150, height = 150, x, y, rotation = 0, zIndex = 10, color } = canvasElem;

  // Map of nice, accessible background/border styles
  const defaultBgColor = color || '#FEF08A'; // default soft yellow
  const strokeColor = isSelected ? '#6366f1' : '#cbd5e1'; // indigo-500 if selected, else slate-300

  // Render SVG or shape background
  const renderShapeBody = () => {
    switch (shapeType) {
      case 'circle':
        return (
          <div
            className="absolute inset-0 rounded-full border-2 transition-all flex items-center justify-center overflow-hidden"
            style={{
              backgroundColor: defaultBgColor,
              borderColor: strokeColor,
            }}
          />
        );
      case 'triangle':
        return (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="absolute inset-0 pointer-events-none overflow-visible"
            >
              <polygon
                points="50,4 96,96 4,96"
                fill={defaultBgColor}
                stroke={strokeColor}
                strokeWidth="2"
              />
            </svg>
          </div>
        );
      case 'star':
        return (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="absolute inset-0 pointer-events-none overflow-visible"
            >
              <polygon
                points="50,4 64,35 98,35 71,56 81,90 50,69 19,90 29,56 2,35 36,35"
                fill={defaultBgColor}
                stroke={strokeColor}
                strokeWidth="2"
              />
            </svg>
          </div>
        );
      case 'rectangle':
      default:
        return (
          <div
            className="absolute inset-0 rounded-xl border-2 transition-all"
            style={{
              backgroundColor: defaultBgColor,
              borderColor: strokeColor,
            }}
          />
        );
    }
  };

  // Adjust padding for different shapes so the text centers correctly
  const getTextPaddingClass = () => {
    switch (shapeType) {
      case 'circle':
        return 'p-6';
      case 'triangle':
        return 'pt-12 px-6 pb-4';
      case 'star':
        return 'p-8';
      case 'rectangle':
      default:
        return 'p-4';
    }
  };

  return (
    <div
      style={{
        left: x,
        top: y,
        width,
        height,
        zIndex,
        transform: `rotate(${rotation}deg)`,
      }}
      className={`absolute select-none flex flex-col items-center justify-center transition-shadow ${
        isSelected ? 'shadow-lg z-20 ring-2 ring-indigo-500/40 rounded-xl' : 'hover:shadow-md'
      }`}
    >
      {/* Background shape */}
      {renderShapeBody()}

      {/* Drag trigger / Shape container */}
      <div
        onMouseDown={(e) => {
          // Stop propagation so clicking content doesn't trigger parent canvas actions
          e.stopPropagation();
          onDragStart(e, id);
        }}
        className="absolute inset-0 cursor-grab active:cursor-grabbing pointer-events-auto"
      />

      {/* Center editable text */}
      <div className={`absolute inset-0 flex items-center justify-center pointer-events-none ${getTextPaddingClass()}`}>
        <textarea
          value={canvasElem.text || ''}
          onChange={(e) => onChangeText(e.target.value)}
          className="w-full h-full bg-transparent resize-none border-none outline-none focus:ring-0 p-0 text-center text-xs font-medium text-slate-800 dark:text-slate-900 pointer-events-auto placeholder:text-slate-400/70"
          placeholder="Type shape text..."
          onMouseDown={(e) => {
            // Prevent dragging from input focus click
            e.stopPropagation();
          }}
        />
      </div>
    </div>
  );
};
