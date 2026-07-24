import React from 'react';
import { CanvasElement } from '@catnoted/shared';
import { Palette, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Square, CircleDashed, AlignLeft, AlignCenter, AlignRight, Lock, Unlock, ArrowUpToLine, ArrowDownToLine, Layers } from 'lucide-react';

interface CanvasPropertiesProps {
  selectedElements: CanvasElement[];
  onUpdateElement: (id: string, updates: Partial<CanvasElement>) => void;
  elements: Record<string, CanvasElement>;
}

export const CanvasProperties: React.FC<CanvasPropertiesProps> = ({ selectedElements, onUpdateElement, elements }) => {
  if (selectedElements.length === 0) return null;

  const element = selectedElements[0];

  const handleUpdate = (updates: Partial<CanvasElement>) => {
    selectedElements.forEach(el => onUpdateElement(el.id, updates));
  };

  const handleBringToFront = () => {
    const allZ = Object.values(elements).map(el => el.zIndex || 0);
    const maxZ = allZ.length ? Math.max(...allZ) : 0;
    handleUpdate({ zIndex: maxZ + 1 });
  };

  const handleSendToBack = () => {
    const allZ = Object.values(elements).map(el => el.zIndex || 0);
    const minZ = allZ.length ? Math.min(...allZ) : 0;
    handleUpdate({ zIndex: minZ - 1 });
  };

  const handleToggleLock = () => {
    selectedElements.forEach(el => onUpdateElement(el.id, { locked: !el.locked }));
  };


  const handleNudge = (dx: number, dy: number) => {
    selectedElements.forEach(el => onUpdateElement(el.id, { x: el.x + dx, y: el.y + dy }));
  };

  const colors = ['bg-white', 'bg-red-100', 'bg-orange-100', 'bg-amber-100', 'bg-green-100', 'bg-emerald-100', 'bg-cyan-100', 'bg-blue-100', 'bg-indigo-100', 'bg-violet-100', 'bg-purple-100', 'bg-fuchsia-100', 'bg-pink-100', 'bg-rose-100'];

  return (
    <div className="absolute top-6 right-6 z-40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-slate-200/50 dark:border-zinc-800/60 rounded-2xl p-3 flex flex-col gap-4 shadow-lg shadow-black/5 w-56">
      <div className="text-xs font-mono font-semibold text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-zinc-800 pb-2">Properties</div>

      {/* Fill Color */}
      <div className="flex flex-col gap-2">
        <span className="text-xs text-slate-600 dark:text-zinc-400 font-medium flex items-center gap-1"><Palette className="w-3 h-3" /> Fill Color</span>
        <div className="flex flex-wrap gap-1.5">
          {colors.map(color => (
            <button
              key={color}
              onClick={() => handleUpdate({ color })}
              className={`w-5 h-5 rounded-md border border-slate-200 dark:border-zinc-700 ${color.replace('bg-', 'bg-').replace('-100', '-100 dark:bg-opacity-20')} hover:scale-110 transition-transform ${element.color === color ? 'ring-2 ring-indigo-500' : ''}`}
              title={color}
              aria-label={`Set color to ${color}`}
              type="button"
            />
          ))}
        </div>
      </div>

      {/* Border Options */}
      <div className="flex flex-col gap-2">
        <span className="text-xs text-slate-600 dark:text-zinc-400 font-medium flex items-center gap-1"><Square className="w-3 h-3" /> Border</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleUpdate({ borderStyle: 'solid' })}
            className={`p-1.5 rounded border ${element.borderStyle === 'solid' ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            <Square className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleUpdate({ borderStyle: 'dashed' })}
            className={`p-1.5 rounded border ${element.borderStyle === 'dashed' ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            <CircleDashed className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleUpdate({ borderStyle: 'none' })}
            className={`p-1.5 rounded border text-xs font-medium ${!element.borderStyle || element.borderStyle === 'none' ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            None
          </button>
        </div>
      </div>

      {/* Opacity */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-600 dark:text-zinc-400 font-medium">Opacity</span>
          <span className="text-xs text-slate-500">{Math.round((element.opacity ?? 1) * 100)}%</span>
        </div>
        <input
          type="range"
          min="0.1"
          max="1"
          step="0.1"
          value={element.opacity ?? 1}
          onChange={(e) => handleUpdate({ opacity: parseFloat(e.target.value) })}
          className="w-full accent-indigo-500"
        />
      </div>


      {/* Arrange & Lock */}
      <div className="flex flex-col gap-2">
        <span className="text-xs text-slate-600 dark:text-zinc-400 font-medium flex items-center gap-1"><Layers className="w-3 h-3" /> Arrange & Lock</span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleBringToFront}
            className="p-1.5 rounded border bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-700"
            title="Bring to Front (])"
            type="button"
          >
            <ArrowUpToLine className="w-4 h-4" />
          </button>
          <button
            onClick={handleSendToBack}
            className="p-1.5 rounded border bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-700"
            title="Send to Back ([)"
            type="button"
          >
            <ArrowDownToLine className="w-4 h-4" />
          </button>
          <button
            onClick={handleToggleLock}
            className={`p-1.5 rounded border ${element.locked ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-400' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-700'}`}
            title="Toggle Lock (Ctrl+L)"
            type="button"
          >
            {element.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Alignment */}
      <div className="flex flex-col gap-2">
        <span className="text-xs text-slate-600 dark:text-zinc-400 font-medium">Text Align</span>
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800 p-1 rounded-lg w-fit">
          <button
            onClick={() => handleUpdate({ textAlign: 'left' })}
            className={`p-1 rounded ${element.textAlign === 'left' ? 'bg-white dark:bg-zinc-700 shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleUpdate({ textAlign: 'center' })}
            className={`p-1 rounded ${!element.textAlign || element.textAlign === 'center' ? 'bg-white dark:bg-zinc-700 shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleUpdate({ textAlign: 'right' })}
            className={`p-1 rounded ${element.textAlign === 'right' ? 'bg-white dark:bg-zinc-700 shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <AlignRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Nudge Controls */}
      <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
        <span className="text-xs text-slate-600 dark:text-zinc-400 font-medium">Nudge</span>
        <div className="grid grid-cols-3 gap-1 w-fit self-center">
          <div />
          <button onClick={() => handleNudge(0, -10)} className="p-1 bg-slate-100 dark:bg-zinc-800 rounded hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-500" type="button"><ArrowUp className="w-3 h-3" /></button>
          <div />
          <button onClick={() => handleNudge(-10, 0)} className="p-1 bg-slate-100 dark:bg-zinc-800 rounded hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-500" type="button"><ArrowLeft className="w-3 h-3" /></button>
          <button onClick={() => handleNudge(0, 10)} className="p-1 bg-slate-100 dark:bg-zinc-800 rounded hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-500" type="button"><ArrowDown className="w-3 h-3" /></button>
          <button onClick={() => handleNudge(10, 0)} className="p-1 bg-slate-100 dark:bg-zinc-800 rounded hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-500" type="button"><ArrowRight className="w-3 h-3" /></button>
        </div>
      </div>
    </div>
  );
};
