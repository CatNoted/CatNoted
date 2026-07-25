import React, { useState } from 'react';
import { Image as ImageIcon, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

interface ImageBlockProps {
  id: string;
  url?: string;
  caption?: string;
  width?: number; // percentage 25, 50, 75, 100
  align?: 'left' | 'center' | 'right';
  onUpdateProps: (props: { url?: string; caption?: string; width?: number; align?: 'left' | 'center' | 'right' }) => void;
  onDelete: () => void;
}

export const ImageBlock: React.FC<ImageBlockProps> = ({
  id: _id,
  url = '',
  caption = '',
  width = 100,
  align = 'center',
  onUpdateProps,
  onDelete: _onDelete,
}) => {
  const [urlInput, setUrlInput] = useState(url);
  const [isEditing, setIsEditing] = useState(!url);

  const handleSaveUrl = () => {
    if (!urlInput.trim()) return;
    onUpdateProps({ url: urlInput.trim() });
    setIsEditing(false);
  };

  const alignClass =
    align === 'left' ? 'justify-start' : align === 'right' ? 'justify-end' : 'justify-center';

  return (
    <div className="w-full my-3 select-none group/img">
      {isEditing ? (
        <div className="p-3 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-indigo-500 shrink-0" />
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveUrl();
            }}
            placeholder="Paste image URL..."
            className="flex-1 bg-transparent text-xs font-mono text-slate-800 dark:text-zinc-200 outline-none"
            autoFocus
          />
          <button
            type="button"
            onClick={handleSaveUrl}
            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition-colors"
          >
            Insert Image
          </button>
        </div>
      ) : (
        <div className={`flex flex-col ${alignClass} items-center`}>
          <div
            style={{ width: `${width}%` }}
            className="relative rounded-2xl overflow-hidden border border-slate-200/60 dark:border-zinc-800/60 shadow-sm transition-all"
          >
            <img src={url} alt={caption || 'Embedded Image'} className="w-full h-auto object-cover" />

            {/* Controls Bar */}
            <div className="absolute top-2 right-2 opacity-0 group-hover/img:opacity-100 transition-opacity bg-slate-900/80 backdrop-blur-md p-1 rounded-xl flex items-center gap-1 text-white text-xs">
              {([25, 50, 75, 100] as const).map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => onUpdateProps({ width: w })}
                  className={`px-1.5 py-0.5 rounded font-mono text-[10px] ${
                    width === w ? 'bg-indigo-600 text-white font-bold' : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  {w}%
                </button>
              ))}
              <div className="w-px h-3 bg-slate-700 mx-1" />
              <button
                type="button"
                onClick={() => onUpdateProps({ align: 'left' })}
                className={`p-1 rounded ${align === 'left' ? 'bg-indigo-600' : 'hover:bg-slate-800'}`}
              >
                <AlignLeft className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => onUpdateProps({ align: 'center' })}
                className={`p-1 rounded ${align === 'center' ? 'bg-indigo-600' : 'hover:bg-slate-800'}`}
              >
                <AlignCenter className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => onUpdateProps({ align: 'right' })}
                className={`p-1 rounded ${align === 'right' ? 'bg-indigo-600' : 'hover:bg-slate-800'}`}
              >
                <AlignRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          <input
            type="text"
            value={caption}
            onChange={(e) => onUpdateProps({ caption: e.target.value })}
            placeholder="Add image caption..."
            className="w-full max-w-sm text-center text-xs text-slate-400 dark:text-zinc-500 bg-transparent border-none outline-none focus:ring-0 mt-1.5"
          />
        </div>
      )}
    </div>
  );
};
