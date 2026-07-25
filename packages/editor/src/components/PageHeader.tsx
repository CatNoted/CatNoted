import React, { useState, useRef, useEffect } from 'react';
import { Image, Smile, Trash2, RefreshCw } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  icon?: string;
  coverUrl?: string;
  createdAt?: number;
  blocksCount?: number;
  wordCount?: number;
  onTitleChange: (title: string) => void;
  onIconChange: (icon: string | undefined) => void;
  onCoverChange: (coverUrl: string | undefined) => void;
}

const PRESET_EMOJIS = [
  '📄', '🐱', '🚀', '💡', '📝', '🎨', '📚', '⚙️', 
  '⚡', '🌐', '🎯', '📌', '🏆', '🌟', '🔒', '🧪', 
  '🔮', '📊', '📂', '📓', '🛠️', '🧬', '💻', '🧠', 
  '💬', '🍀', '🔥', '✨', '☕', '🎧', '🌈', '🧩'
];

const PRESET_COVERS = [
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80', // Vibrant Abstract Fluid
  'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1200&q=80', // Smooth Gradient Mesh
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80', // Calm Coastal Ocean
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80', // Deep Space Nebula
  'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1200&q=80', // Minimal Dark Geometry
  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80', // Matrix Cyberpunk Green
];

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  icon = '📄',
  coverUrl,
  createdAt,
  blocksCount = 0,
  wordCount = 0,
  onTitleChange,
  onIconChange,
  onCoverChange,
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const emojiMenuRef = useRef<HTMLDivElement>(null);
  const coverMenuRef = useRef<HTMLDivElement>(null);

  // Auto-close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiMenuRef.current && !emojiMenuRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
      if (coverMenuRef.current && !coverMenuRef.current.contains(e.target as Node)) {
        setShowCoverPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getRandomCover = () => {
    const randomIdx = Math.floor(Math.random() * PRESET_COVERS.length);
    return PRESET_COVERS[randomIdx];
  };

  const readingTime = Math.max(1, Math.ceil(wordCount / 200));
  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <div className="group/header relative w-full mb-6 select-none">
      {/* Cover Image Banner */}
      {coverUrl ? (
        <div className="relative w-full h-44 sm:h-52 rounded-2xl overflow-hidden mb-4 shadow-sm border border-slate-200/50 dark:border-zinc-800/50 transition-all">
          <img
            src={coverUrl}
            alt="Page cover"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover/header:opacity-100 transition-opacity flex items-end justify-end p-3 gap-2">
            <button
              type="button"
              onClick={() => onCoverChange(getRandomCover())}
              className="px-2.5 py-1.5 bg-black/60 hover:bg-black/80 text-white rounded-lg text-xs font-medium backdrop-blur-md transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Change cover
            </button>
            <button
              type="button"
              onClick={() => onCoverChange(undefined)}
              className="px-2.5 py-1.5 bg-black/60 hover:bg-rose-600/90 text-white rounded-lg text-xs font-medium backdrop-blur-md transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Remove cover
            </button>
          </div>
        </div>
      ) : (
        <div className="h-4 flex items-center gap-3 mb-2 opacity-0 group-hover/header:opacity-100 transition-opacity">
          {!icon && (
            <button
              type="button"
              onClick={() => onIconChange('📄')}
              className="text-xs font-medium text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 transition-colors"
            >
              <Smile className="w-3.5 h-3.5" />
              Add icon
            </button>
          )}
          <button
            type="button"
            onClick={() => onCoverChange(getRandomCover())}
            className="text-xs font-medium text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 transition-colors"
          >
            <Image className="w-3.5 h-3.5" />
            Add cover
          </button>
        </div>
      )}

      {/* Cover Picker Modal (when clicked add cover button) */}
      {showCoverPicker && (
        <div
          ref={coverMenuRef}
          className="absolute left-0 top-10 z-50 p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl w-72"
        >
          <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400 mb-2">
            Select Cover Image
          </p>
          <div className="grid grid-cols-3 gap-2 mb-2">
            {PRESET_COVERS.map((url, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  onCoverChange(url);
                  setShowCoverPicker(false);
                }}
                className="h-14 rounded-lg overflow-hidden border border-slate-200 dark:border-zinc-700 hover:scale-105 transition-transform"
              >
                <img src={url} alt="preset" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Page Icon / Emoji Button */}
      <div className="relative inline-block mb-3">
        {icon ? (
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="text-4xl p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer select-none"
            title="Change icon"
          >
            {icon}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="text-2xl p-2 rounded-xl border border-dashed border-slate-300 dark:border-zinc-700 text-slate-400 hover:text-indigo-500 hover:border-indigo-400 transition-colors flex items-center gap-1.5"
          >
            <Smile className="w-5 h-5" />
            <span className="text-xs font-medium">Icon</span>
          </button>
        )}

        {/* Emoji Picker Dropdown Popup */}
        {showEmojiPicker && (
          <div
            ref={emojiMenuRef}
            className="absolute left-0 top-full mt-1 z-50 p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-64 text-left"
          >
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-zinc-800">
              <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
                Choose Emoji
              </span>
              {icon && (
                <button
                  type="button"
                  onClick={() => {
                    onIconChange(undefined);
                    setShowEmojiPicker(false);
                  }}
                  className="text-[10px] text-red-500 hover:underline"
                >
                  Remove
                </button>
              )}
            </div>
            <div className="grid grid-cols-6 gap-1 max-h-48 overflow-y-auto">
              {PRESET_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    onIconChange(emoji);
                    setShowEmojiPicker(false);
                  }}
                  className="text-xl p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-transform hover:scale-110"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Editable Document Title (`h1`) */}
      <div className="mb-2">
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Untitled"
          className="w-full text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-zinc-100 bg-transparent border-none outline-none focus:ring-0 p-0 placeholder-slate-300 dark:placeholder-zinc-600 tracking-tight leading-tight"
        />
      </div>

      {/* Page Metadata Bar (Created Date, Word Count, Reading Time) */}
      <div className="flex items-center gap-3 text-[11px] font-medium text-slate-400 dark:text-zinc-500">
        {formattedDate && <span>Created {formattedDate}</span>}
        <span>·</span>
        <span>{wordCount} words</span>
        <span>·</span>
        <span>{readingTime} min read</span>
        <span>·</span>
        <span>{blocksCount} blocks</span>
      </div>
    </div>
  );
};
