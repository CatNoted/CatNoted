import React, { useState, useRef, useEffect } from 'react';
import * as LucideIcons from 'lucide-react';

export const renderPageIcon = (icon: string | undefined, className = "w-5 h-5") => {
  if (!icon) return <LucideIcons.FileText className={className} />;
  if (icon.startsWith('lucide:')) {
    const iconName = icon.slice(7);
    const IconComponent = (LucideIcons as any)[iconName];
    if (IconComponent) {
      return <IconComponent className={className} />;
    }
  }
  return <span className={`select-none flex items-center justify-center text-center ${className}`}>{icon}</span>;
};

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
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
];

const PRESET_GRADIENTS = [
  'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
  'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
  'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
  'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)',
  'linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)',
  'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
];

const PRESET_ICONS = [
  'Sparkles', 'Heart', 'Star', 'Settings', 'FileText', 'Image',
  'Smile', 'Info', 'Check', 'BookOpen', 'Cpu', 'Layers',
  'Compass', 'Coffee', 'Bell'
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
  const [coverInputUrl, setCoverInputUrl] = useState('');
  const emojiMenuRef = useRef<HTMLDivElement>(null);
  const coverMenuRef = useRef<HTMLDivElement>(null);

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
      <div className="relative w-full h-44 sm:h-52 rounded-2xl overflow-hidden mb-5 shadow-sm border border-slate-200/50 dark:border-zinc-800/50 transition-all bg-slate-100 dark:bg-zinc-800/40">
        {coverUrl ? (
          coverUrl.startsWith('linear-gradient') ? (
            <div className="w-full h-full" style={{ background: coverUrl }} />
          ) : (
            <img
              src={coverUrl}
              alt="Page cover"
              className="w-full h-full object-cover animate-fade-in"
            />
          )
        ) : null}

        {/* Cover Actions Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover/header:opacity-100 transition-opacity flex items-end justify-end p-3 gap-2 z-10">
          <button
            type="button"
            onClick={() => setShowCoverPicker(!showCoverPicker)}
            className="px-2.5 py-1.5 bg-black/60 hover:bg-black/80 text-white rounded-lg text-xs font-medium backdrop-blur-md transition-all flex items-center gap-1.5 shadow-sm"
          >
            <LucideIcons.Image className="w-3.5 h-3.5" />
            {coverUrl ? 'Change cover' : 'Add cover'}
          </button>
          {coverUrl && (
            <button
              type="button"
              onClick={() => onCoverChange(undefined)}
              className="px-2.5 py-1.5 bg-black/60 hover:bg-rose-600/90 text-white rounded-lg text-xs font-medium backdrop-blur-md transition-all flex items-center gap-1.5 shadow-sm"
            >
              <LucideIcons.Trash2 className="w-3.5 h-3.5" />
              Remove cover
            </button>
          )}
        </div>
      </div>

      {/* Cover Picker Modal */}
      {showCoverPicker && (
        <div
          ref={coverMenuRef}
          className="absolute right-0 top-14 z-50 p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-80 text-left select-none animate-in fade-in-50 duration-200"
        >
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100 dark:border-zinc-800">
            <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">
              Page Cover Settings
            </span>
            {coverUrl && (
              <button
                type="button"
                onClick={() => {
                  onCoverChange(undefined);
                  setShowCoverPicker(false);
                }}
                className="text-[10px] text-red-500 hover:text-red-600 font-semibold"
              >
                Remove
              </button>
            )}
          </div>

          <div className="space-y-4">
            <div className="space-y-3 bg-slate-50 dark:bg-zinc-950 p-2.5 rounded-xl border border-slate-150 dark:border-zinc-800/60">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase mb-1">
                  Upload Cover File
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        if (event.target?.result) {
                          onCoverChange(event.target.result as string);
                          setShowCoverPicker(false);
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="block w-full text-[10px] text-slate-500 dark:text-zinc-400
                    file:mr-2 file:py-1 file:px-2.5
                    file:rounded-md file:border-0
                    file:text-[10px] file:font-semibold
                    file:bg-indigo-50 file:text-indigo-600
                    dark:file:bg-zinc-800 dark:file:text-zinc-300
                    hover:file:bg-indigo-100 dark:hover:file:bg-zinc-700
                    cursor-pointer"
                />
              </div>

              <div className="border-t border-slate-200/60 dark:border-zinc-800/40 my-1"></div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase mb-1">
                  Or Paste Cover URL
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="https://images.unsplash.com/..."
                    value={coverInputUrl}
                    onChange={(e) => setCoverInputUrl(e.target.value)}
                    className="flex-1 text-[11px] px-2 py-1 border border-slate-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (coverInputUrl.trim()) {
                        onCoverChange(coverInputUrl.trim());
                        setCoverInputUrl('');
                        setShowCoverPicker(false);
                      }
                    }}
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-semibold transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>

            <div>
              <span className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase mb-1.5">
                Gradient Presets
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {PRESET_GRADIENTS.map((gradient, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      onCoverChange(gradient);
                      setShowCoverPicker(false);
                    }}
                    className="h-9 rounded-lg border border-slate-200/50 dark:border-zinc-800 hover:scale-105 transition-transform"
                    style={{ background: gradient }}
                    title={`Gradient ${i + 1}`}
                  />
                ))}
              </div>
            </div>

            <div>
              <span className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase mb-1.5">
                Photo Presets
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {PRESET_COVERS.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      onCoverChange(url);
                      setShowCoverPicker(false);
                    }}
                    className="h-10 rounded-lg overflow-hidden border border-slate-200/50 dark:border-zinc-800 hover:scale-105 transition-transform"
                  >
                    <img src={url} alt={`Preset ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Doc Header Row */}
      <div className="flex items-start gap-3">
        {/* Page Icon Button */}
        <div className="relative inline-block shrink-0">
          {icon ? (
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="text-[26px] p-2 rounded-xl
                border border-transparent
                hover:border-slate-200 dark:hover:border-zinc-700
                hover:bg-slate-100 dark:hover:bg-zinc-800/60
                transition-colors cursor-pointer select-none
                flex items-center justify-center
                h-[56px] w-[56px]"
              title="Change icon"
            >
              {renderPageIcon(icon, "w-10 h-10 text-indigo-600 dark:text-indigo-400")}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="text-2xl p-2 rounded-xl
                border border-dashed border-slate-300 dark:border-zinc-700
                text-slate-400 hover:text-indigo-500 hover:border-indigo-400
                transition-colors flex items-center gap-1.5"
            >
              <LucideIcons.Smile className="w-5 h-5" />
              <span className="text-xs font-medium">Icon</span>
            </button>
          )}

          {/* Emoji / Icon Picker Dropdown */}
          {showEmojiPicker && (
            <div
              ref={emojiMenuRef}
              className="absolute left-0 top-full mt-1.5 z-50 p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-72 text-left"
            >
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-150 dark:border-zinc-800">
                <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                  Choose Icon or Emoji
                </span>
                {icon && (
                  <button
                    type="button"
                    onClick={() => {
                      onIconChange(undefined);
                      setShowEmojiPicker(false);
                    }}
                    className="text-[10px] text-red-500 hover:underline font-semibold"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="mb-3.5">
                <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase block mb-1.5">
                  Common Icons
                </span>
                <div className="grid grid-cols-5 gap-1.5">
                  {PRESET_ICONS.map((iconName) => {
                    const IconComponent = (LucideIcons as any)[iconName];
                    return (
                      <button
                        key={iconName}
                        type="button"
                        onClick={() => {
                          onIconChange(`lucide:${iconName}`);
                          setShowEmojiPicker(false);
                        }}
                        className="p-1.5 text-slate-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-transform hover:scale-110 flex items-center justify-center border border-slate-100 dark:border-zinc-800/40"
                        title={iconName}
                      >
                        {IconComponent && <IconComponent className="w-4 h-4" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase block mb-1.5">
                  Emojis
                </span>
                <div className="grid grid-cols-6 gap-1 max-h-40 overflow-y-auto pr-1">
                  {PRESET_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        onIconChange(emoji);
                        setShowEmojiPicker(false);
                      }}
                      className="text-xl p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-transform hover:scale-110 flex items-center justify-center"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Editable Document Title */}
        <div className="flex-1 min-w-0 pt-1">
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Untitled"
            className="w-full
              text-[clamp(32px,3.8vw,44px)]
              font-bold
              text-slate-900 dark:text-zinc-100
              bg-transparent border-none outline-none focus:ring-0 p-0
              placeholder-slate-300 dark:placeholder-zinc-600
              tracking-tight leading-snug"
          />
        </div>
      </div>

      {/* Metadata Row */}
      <div
        className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium text-slate-400 dark:text-zinc-500"
      >
        {formattedDate ? (
          <span className="inline-flex items-center gap-1">
            <span className="opacity-70">Created</span>
            <span className="text-slate-500 dark:text-zinc-400">{formattedDate}</span>
          </span>
        ) : null}
        <span className="hidden sm:inline opacity-30">|</span>
        <span className="inline-flex items-center gap-1">
          <span className="opacity-70">Words</span>
          <span className="text-slate-500 dark:text-zinc-400">{wordCount}</span>
        </span>
        <span className="hidden sm:inline opacity-30">|</span>
        <span className="inline-flex items-center gap-1">
          <span className="opacity-70">Read</span>
          <span className="text-slate-500 dark:text-zinc-400">{readingTime} min</span>
        </span>
        <span className="hidden sm:inline opacity-30">|</span>
        <span className="inline-flex items-center gap-1">
          <span className="opacity-70">Blocks</span>
          <span className="text-slate-500 dark:text-zinc-400">{blocksCount}</span>
        </span>
      </div>
    </div>
  );
};
