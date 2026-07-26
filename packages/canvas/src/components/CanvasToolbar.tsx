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
    const base = "p-2.5 rounded-xl transition-all flex items-center justify-center gap-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500";
    if (activeFeedback === id) {
      return `${base} bg-indigo-600 text-white scale-90 dark:bg-indigo-500 dark:text-zinc-950`;
    }
    return `${base} hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400`;
  };

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-slate-200/60 dark:border-zinc-800/60 rounded-2xl p-2 flex items-center gap-1.5 shadow-xl shadow-slate-200/20 dark:shadow-black/20 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
      <button aria-label="Add Card"
        onClick={() => triggerAdd('card')}
        className={getButtonClass('card')}
        title="Add Card (C)"
        type="button"
      >
        <MessageSquare className="w-5 h-5 group-hover:scale-110 transition-transform" />
      </button>

      <div className="w-px h-6 bg-slate-200 dark:bg-zinc-800 mx-1" />

      <button aria-label="Add Rectangle"
        onClick={() => triggerAdd('shape', 'rectangle')}
        className={getButtonClass('rectangle')}
        title="Add Rectangle (R)"
        type="button"
      >
        <Square className="w-5 h-5 group-hover:scale-110 transition-transform" />
      </button>

      <button aria-label="Add Ellipse"
        onClick={() => triggerAdd('shape', 'circle')}
        className={getButtonClass('circle')}
        title="Add Ellipse (E)"
        type="button"
      >
        <Circle className="w-5 h-5 group-hover:scale-110 transition-transform" />
      </button>

      <div className="w-px h-6 bg-slate-200 dark:bg-zinc-800 mx-1" />

      <button aria-label="Add Text Note"
        onClick={() => triggerAdd('note')}
        className={getButtonClass('note')}
        title="Add Text Note (T)"
        type="button"
      >
        <Type className="w-5 h-5 group-hover:scale-110 transition-transform" />
      </button>

      <button aria-label="Add Frame"
        onClick={() => triggerAdd('frame')}
        className={getButtonClass('frame')}
        title="Add Frame (F)"
        type="button"
      >
        <Frame className="w-5 h-5 group-hover:scale-110 transition-transform" />
      </button>

      {onToggleHelp && (
        <>
          <div className="w-px h-6 bg-slate-200 dark:bg-zinc-800 mx-1" />
          <button aria-label="Toggle Help & Shortcuts Overlay"
            onClick={onToggleHelp}
            className={`${getButtonClass('help')} ${isHelpActive ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40' : ''}`}
            title="Help & Shortcuts (?)"
            type="button"
          >
            <HelpCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>
        </>
      )}
    </div>
  );
};
