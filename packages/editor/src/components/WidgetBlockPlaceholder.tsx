import React from 'react';
import { Cpu, Trash2 } from 'lucide-react';

interface WidgetBlockPlaceholderProps {
  id: string;
  properties?: {
    widgetId?: string;
    [key: string]: any;
  };
  onDelete: () => void;
}

export const WidgetBlockPlaceholder: React.FC<WidgetBlockPlaceholderProps> = ({
  properties,
  onDelete
}) => {
  const widgetId = properties?.widgetId || 'unassigned';

  return (
    <div className="w-full my-4 border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 p-4 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-900 pb-2 mb-3">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
          <Cpu className="w-4 h-4" />
          <span className="text-xs font-mono font-semibold">AI Widget Container</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full font-mono">
            ID: {widgetId}
          </span>
          <button 
            onClick={onDelete}
            title="Delete Widget"
            className="p-1 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      
      <div className="py-6 flex flex-col items-center justify-center text-center">
        <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center mb-2">
          <span className="text-sm">🤖</span>
        </div>
        <p className="text-xs font-medium text-slate-700 dark:text-zinc-300">Widget Sandbox Standby</p>
        <p className="text-[10px] text-slate-400 mt-1 max-w-xs">
          The Space Agent runtime will dynamically inject sandbox iframe and compiled JS widget here.
        </p>
      </div>
    </div>
  );
};
