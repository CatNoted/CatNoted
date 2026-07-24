import React from 'react';
import { Type, Square, MessageSquare, Network } from 'lucide-react';
import { CanvasElementType } from '@catnoted/shared';

interface CanvasToolbarProps {
  onAddElement: (type: CanvasElementType) => void;
}

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({ onAddElement }) => {
  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-slate-200/60 dark:border-zinc-800/60 rounded-2xl p-2 flex items-center gap-1.5 shadow-xl shadow-slate-200/20 dark:shadow-black/20 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
      <button
        onClick={() => onAddElement('card')}
        className="p-2.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-colors flex items-center justify-center gap-2 group"
        title="Add Card"
        aria-label="Add Card"
        type="button"
      >
        <MessageSquare className="w-5 h-5 group-hover:scale-110 transition-transform" />
      </button>

      <div className="w-px h-6 bg-slate-200 dark:bg-zinc-800 mx-1" />

      <button
        onClick={() => onAddElement('note')}
        className="p-2.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-colors flex items-center justify-center gap-2 group"
        title="Add Note"
        aria-label="Add Note"
        type="button"
      >
        <Type className="w-5 h-5 group-hover:scale-110 transition-transform" />
      </button>

      <button
        onClick={() => onAddElement('frame')}
        className="p-2.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-colors flex items-center justify-center gap-2 group"
        title="Add Frame"
        aria-label="Add Frame"
        type="button"
      >
        <Square className="w-5 h-5 group-hover:scale-110 transition-transform" />
      </button>

      <button
        onClick={() => onAddElement('shape')}
        className="p-2.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-colors flex items-center justify-center gap-2 group"
        title="Add Shape"
        aria-label="Add Shape"
        type="button"
      >
        <Network className="w-5 h-5 group-hover:scale-110 transition-transform" />
      </button>
    </div>
  );
};
