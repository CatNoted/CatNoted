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
        <div className="p-3 bg-muted border border-border rounded-xl flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-accent shrink-0" />
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveUrl();
            }}
            placeholder="Paste image URL..."
            className="flex-1 bg-transparent text-xs font-mono text-foreground outline-none"
            autoFocus
          />
          <button
            type="button"
            onClick={handleSaveUrl}
            className="px-3 py-1 bg-accent hover:bg-accent/90 text-foreground text-xs font-medium rounded-lg transition-colors"
          >
            Insert Image
          </button>
        </div>
      ) : (
        <div className={`flex flex-col ${alignClass} items-center`}>
          <div
            style={{ width: `${width}%` }}
            className="relative rounded-2xl overflow-hidden border border-border/60 shadow-sm transition-all"
          >
            <img src={url} alt={caption || 'Embedded Image'} className="w-full h-auto object-cover" />

            {/* Controls Bar */}
            <div className="absolute top-2 right-2 opacity-0 group-hover/img:opacity-100 transition-opacity bg-card/80 backdrop-blur-md p-1 rounded-xl flex items-center gap-1 text-foreground text-xs">
              {([25, 50, 75, 100] as const).map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => onUpdateProps({ width: w })}
                  className={`px-1.5 py-0.5 rounded font-mono text-[10px] ${
                    width === w ? 'bg-accent text-white font-bold' : 'hover:bg-muted text-muted-foreground'
                  }`}
                >
                  {w}%
                </button>
              ))}
              <div className="w-px h-3 bg-border mx-1" />
              <button
                type="button"
                onClick={() => onUpdateProps({ align: 'left' })}
                className={`p-1 rounded ${align === 'left' ? 'bg-accent' : 'hover:bg-muted text-muted-foreground'}`}
              >
                <AlignLeft className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => onUpdateProps({ align: 'center' })}
                className={`p-1 rounded ${align === 'center' ? 'bg-accent' : 'hover:bg-muted text-muted-foreground'}`}
              >
                <AlignCenter className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => onUpdateProps({ align: 'right' })}
                className={`p-1 rounded ${align === 'right' ? 'bg-accent' : 'hover:bg-muted text-muted-foreground'}`}
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
            className="w-full max-w-sm text-center text-xs text-muted-foreground bg-transparent border-none outline-none focus:ring-0 mt-1.5"
          />
        </div>
      )}
    </div>
  );
};
