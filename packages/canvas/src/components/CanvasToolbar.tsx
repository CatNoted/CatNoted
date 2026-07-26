import React, { useState, useEffect } from 'react';
import { Type, Square, MessageSquare, Circle, Frame, HelpCircle } from 'lucide-react';
import { CanvasElementType } from '@catnoted/shared';

interface CanvasToolbarProps {
  onAddElement: (type: CanvasElementType, shapeType?: 'rectangle' | 'circle') => void;
  onToggleHelp?: () => void;
  isHelpActive?: boolean;
}

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  onAddElement,
  onToggleHelp,
  isHelpActive = false
}) => {
  const [activeFeedback, setActiveFeedback] = useState<string | null>(null);

  const triggerAdd = (type: CanvasElementType, shapeType?: 'rectangle' | 'circle') => {
    const feedbackId = type === 'shape' ? shapeType : type;
    if (feedbackId) {
      onAddElement(type, shapeType);
      setActiveFeedback(feedbackId);
      setTimeout(() => {
        setActiveFeedback(null);
      }, 200);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      if (
        activeElement &&
        (activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.getAttribute('contenteditable') === 'true')
      ) {
        return;
      }

      if (e.ctrlKey || e.metaKey || e.altKey) {
        return;
      }

      const key = e.key.toLowerCase();
      if (key === 'c') {
        e.preventDefault();
        triggerAdd('card');
      } else if (key === 'r') {
        e.preventDefault();
        triggerAdd('shape', 'rectangle');
      } else if (key === 'e' || key === 'o') {
        e.preventDefault();
        triggerAdd('shape', 'circle');
      } else if (key === 't') {
        e.preventDefault();
        triggerAdd('note');
      } else if (key === 'f') {
        e.preventDefault();
        triggerAdd('frame');
      } else if (e.key === '?') {
        e.preventDefault();
        if (onToggleHelp) {
          onToggleHelp();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onAddElement, onToggleHelp]);

  const getButtonClass = (id: string) => {
    const base = "p-2.5 rounded-xl transition-all flex items-center justify-center gap-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";
    if (activeFeedback === id) {
      return `${base} bg-primary text-primary-foreground scale-90`;
    }
    return `${base} hover:bg-muted text-muted-foreground hover:text-primary`;
  };

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 bg-card/90 backdrop-blur-md border border-border/60 rounded-2xl p-2 flex items-center gap-1.5 shadow-xl shadow-border/5 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
      <button
        onClick={() => triggerAdd('card')}
        className={getButtonClass('card')}
        title="Add Card (C)"
        aria-label="Add Card"
        type="button"
      >
        <MessageSquare className="w-5 h-5 group-hover:scale-110 transition-transform" />
      </button>

      <div className="w-px h-6 bg-border mx-1" />

      <button
        onClick={() => triggerAdd('shape', 'rectangle')}
        className={getButtonClass('rectangle')}
        title="Add Rectangle (R)"
        aria-label="Add Rectangle"
        type="button"
      >
        <Square className="w-5 h-5 group-hover:scale-110 transition-transform" />
      </button>

      <button
        onClick={() => triggerAdd('shape', 'circle')}
        className={getButtonClass('circle')}
        title="Add Ellipse (E)"
        aria-label="Add Ellipse"
        type="button"
      >
        <Circle className="w-5 h-5 group-hover:scale-110 transition-transform" />
      </button>

      <div className="w-px h-6 bg-border mx-1" />

      <button
        onClick={() => triggerAdd('note')}
        className={getButtonClass('note')}
        title="Add Text Note (T)"
        aria-label="Add Text Note"
        type="button"
      >
        <Type className="w-5 h-5 group-hover:scale-110 transition-transform" />
      </button>

      <button
        onClick={() => triggerAdd('frame')}
        className={getButtonClass('frame')}
        title="Add Frame (F)"
        aria-label="Add Frame"
        type="button"
      >
        <Frame className="w-5 h-5 group-hover:scale-110 transition-transform" />
      </button>

      {onToggleHelp && (
        <>
          <div className="w-px h-6 bg-border mx-1" />
          <button
            onClick={onToggleHelp}
            className={`${getButtonClass('help')} ${isHelpActive ? 'text-primary bg-muted' : ''}`}
            title="Help & Shortcuts (?)"
            aria-label="Toggle Help & Shortcuts Overlay"
            type="button"
          >
            <HelpCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>
        </>
      )}
    </div>
  );
};
