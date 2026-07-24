import React from 'react';
import { Type, Square, MessageSquare, Network } from 'lucide-react';
import { CanvasElementType } from '@catnoted/shared';

interface CanvasToolbarProps {
  onAddElement: (type: CanvasElementType) => void;
}

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({ onAddElement }) => {
  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-slate-200/50 dark:border-zinc-800/60 rounded-2xl p-1.5 flex items-center gap-1 shadow-lg shadow-black/5">
      <button
        onClick={() => onAddElement('card')}
        className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-colors flex items-center justify-center gap-2"
        title="Add Card"
        aria-label="Add Card"
        type="button"
      >
        <MessageSquare className="w-4 h-4" />
      </button>

      <button
        onClick={() => onAddElement('note')}
        className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-colors flex items-center justify-center gap-2"
        title="Add Note"
        aria-label="Add Note"
        type="button"
      >
        <Type className="w-4 h-4" />
      </button>

      <button
        onClick={() => onAddElement('frame')}
        className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-colors flex items-center justify-center gap-2"
        title="Add Frame"
        aria-label="Add Frame"
        type="button"
      >
        <Square className="w-4 h-4" />
      </button>

      <button
        onClick={() => onAddElement('shape')}
        className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-colors flex items-center justify-center gap-2"
        title="Add Shape"
        aria-label="Add Shape"
        type="button"
      >
        <Network className="w-4 h-4" />
      </button>
    </div>
  );
};
