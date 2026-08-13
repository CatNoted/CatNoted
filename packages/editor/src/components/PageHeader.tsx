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
  isInfoExpanded?: boolean;
  onInfoExpandedChange?: (expanded: boolean) => void;
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
  icon,
  coverUrl,
  createdAt,
  blocksCount = 0,
  wordCount = 0,
  onTitleChange,
  onIconChange,
  onCoverChange,
  isInfoExpanded = true,
  onInfoExpandedChange,
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
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowEmojiPicker(false);
        setShowCoverPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const readingTime = Math.max(1, Math.ceil(wordCount / 200));
  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  const renderEmojiPickerDropdown = () => (
    <div
      ref={emojiMenuRef}
      className="absolute left-0 top-full mt-2 z-50 p-4 bg-card border border-border rounded-2xl shadow-2xl w-72 text-left select-none animate-in fade-in-50 duration-200"
    >
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-border">
        <span className="text-xs font-bold text-foreground">
          Choose Icon or Emoji
        </span>
        {icon && (
          <button
            type="button"
            onClick={() => {
              onIconChange(undefined);
              setShowEmojiPicker(false);
            }}
            aria-label="Remove page icon"
            className="text-[10px] text-destructive hover:underline font-semibold"
          >
            Remove
          </button>
        )}
      </div>

      <div className="mb-3.5">
        <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1.5">
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
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-transform hover:scale-110 flex items-center justify-center border border-border"
                title={iconName}
                aria-label={`Select icon ${iconName}`}
              >
                {IconComponent && <IconComponent className="w-4 h-4" />}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1.5">
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
              className="text-xl p-1.5 hover:bg-muted rounded-lg transition-transform hover:scale-110 flex items-center justify-center"
              aria-label={`Select emoji ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderCoverPickerDropdown = () => (
    <div
      ref={coverMenuRef}
      className="absolute left-0 top-full mt-2 z-50 p-4 bg-card border border-border rounded-2xl shadow-2xl w-80 text-left select-none animate-in fade-in-50 duration-200"
    >
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-border">
        <span className="text-xs font-bold text-foreground">
          Page Cover Settings
        </span>
        {coverUrl && (
          <button
            type="button"
            onClick={() => {
              onCoverChange(undefined);
              setShowCoverPicker(false);
            }}
            aria-label="Remove page cover image"
            className="text-[10px] text-destructive hover:opacity-80 font-semibold"
          >
            Remove
          </button>
        )}
      </div>

      <div className="space-y-4">
        <div className="space-y-3 bg-card p-2.5 rounded-xl border border-border">
          <div>
            <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">
              Upload Cover File
            </label>
            <input
              type="file"
              accept="image/*"
              aria-label="Upload custom cover image file"
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
              className="block w-full text-[10px] text-muted-foreground
                file:mr-2 file:py-1 file:px-2.5
                file:rounded-md file:border-0
                file:text-[10px] file:font-semibold
                file:bg-muted file:text-foreground
                hover:file:bg-muted/80
                cursor-pointer"
            />
          </div>

          <div className="border-t border-border my-1"></div>

          <div>
            <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">
              Or Paste Cover URL
            </label>
            <div className="flex gap-1.5">
              <input
                type="text"
                placeholder="https://images.unsplash.com/..."
                value={coverInputUrl}
                aria-label="Custom cover image URL"
                onChange={(e) => setCoverInputUrl(e.target.value)}
                className="flex-1 text-[11px] px-2 py-1 border border-border rounded-lg bg-card text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
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
                aria-label="Save custom cover URL"
                className="px-2.5 py-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-[10px] font-semibold transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>

        <div>
          <span className="block text-[10px] font-bold text-muted-foreground uppercase mb-1.5">
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
                className="h-9 rounded-lg border border-border hover:scale-105 transition-transform"
                style={{ background: gradient }}
                aria-label={`Select gradient cover ${i + 1}`}
                title={`Gradient ${i + 1}`}
              />
            ))}
          </div>
        </div>

        <div>
          <span className="block text-[10px] font-bold text-muted-foreground uppercase mb-1.5">
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
                className="h-10 rounded-lg overflow-hidden border border-border hover:scale-105 transition-transform"
                aria-label={`Select photo cover ${i + 1}`}
              >
                <img src={url} alt={`Preset ${i + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="group/header relative w-full mb-8 select-none">
      {/* Cover Image Banner */}
      {coverUrl ? (
        <div className="relative w-full h-44 sm:h-52 rounded-2xl overflow-hidden mb-6 bg-muted">
          {coverUrl.startsWith('linear-gradient') ? (
            <div className="w-full h-full" style={{ background: coverUrl }} />
          ) : (
            <img
              src={coverUrl}
              alt="Page cover"
              className="w-full h-full object-cover animate-fade-in"
            />
          )}

          {/* Cover Actions Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover/header:opacity-100 transition-opacity flex items-end justify-end p-3 gap-2 z-10">
            <button
              type="button"
              onClick={() => setShowCoverPicker(!showCoverPicker)}
              aria-expanded={showCoverPicker}
              aria-haspopup="true"
              aria-label="Change cover image"
              className="px-2.5 py-1.5 bg-black/60 hover:bg-black/80 text-white rounded-lg text-xs font-medium backdrop-blur-md transition-all flex items-center gap-1.5 shadow-sm"
            >
              <LucideIcons.Image className="w-3.5 h-3.5" />
              Change cover
            </button>
            <button
              type="button"
              onClick={() => onCoverChange(undefined)}
              aria-label="Remove cover image"
              className="px-2.5 py-1.5 bg-black/60 hover:bg-destructive hover:text-destructive-foreground text-white rounded-lg text-xs font-medium backdrop-blur-md transition-all flex items-center gap-1.5 shadow-sm"
            >
              <LucideIcons.Trash2 className="w-3.5 h-3.5" />
              Remove cover
            </button>
          </div>

          {/* Cover Picker Modal (when cover exists) */}
          {showCoverPicker && (
            <div className="absolute right-3 top-14 z-50">
              {renderCoverPickerDropdown()}
            </div>
          )}
        </div>
      ) : null}

      {/* Spacing & Hover Actions Bar (Add Icon / Add Cover / Page Info) */}
      <div className="flex items-center gap-4 mb-4 h-8 text-muted-foreground -ml-3">
        {!icon && (
          <div className="relative inline-block">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              aria-expanded={showEmojiPicker}
              aria-haspopup="true"
              aria-label="Add icon"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold hover:bg-muted hover:text-foreground rounded-lg transition-colors"
            >
              <LucideIcons.Smile className="w-4 h-4" />
              Add icon
            </button>

            {showEmojiPicker && renderEmojiPickerDropdown()}
          </div>
        )}

        {!coverUrl && (
          <div className="relative inline-block">
            <button
              type="button"
              onClick={() => setShowCoverPicker(!showCoverPicker)}
              aria-expanded={showCoverPicker}
              aria-haspopup="true"
              aria-label="Add cover"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold hover:bg-muted hover:text-foreground rounded-lg transition-colors"
            >
              <LucideIcons.Image className="w-4 h-4" />
              Add cover
            </button>

            {showCoverPicker && renderCoverPickerDropdown()}
          </div>
        )}

        {/* Toggle Page Info Button */}
        <div className="relative inline-block">
          <button
            type="button"
            onClick={() => onInfoExpandedChange?.(!isInfoExpanded)}
            aria-expanded={isInfoExpanded}
            aria-label="Toggle page info"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold hover:bg-muted hover:text-foreground rounded-lg transition-colors"
          >
            <LucideIcons.Info className="w-4 h-4" />
            {isInfoExpanded ? 'Hide info' : 'Page info'}
          </button>
        </div>
      </div>

      {/* Page Icon (if icon is set) - stacked vertically above title */}
      {icon && (
        <div className="relative inline-block mb-4 -ml-2">
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            aria-expanded={showEmojiPicker}
            aria-haspopup="true"
            aria-label="Change page icon"
            className="text-[44px] p-2 rounded-xl
              border border-transparent
              hover:bg-muted
              transition-colors cursor-pointer select-none
              flex items-center justify-center
              h-[64px] w-[64px]"
            title="Change icon"
          >
            {renderPageIcon(icon, "w-12 h-12 text-accent")}
          </button>

          {/* Emoji Picker Dropdown */}
          {showEmojiPicker && renderEmojiPickerDropdown()}
        </div>
      )}

      {/* Editable Document Title */}
      <div className="w-full">
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Untitled"
          className="w-full
            text-3xl sm:text-[32px]
            font-bold
            text-foreground
            bg-transparent border-none outline-none focus:ring-0 p-0
            placeholder-muted-foreground
            tracking-tight leading-tight"
        />
      </div>

      {/* Metadata Row / Collapsible Info block */}
      {isInfoExpanded && (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-muted-foreground animate-in fade-in slide-in-from-top-1 duration-200">
          {formattedDate && (
            <span className="inline-flex items-center gap-1.5">
              <LucideIcons.Calendar className="w-3.5 h-3.5 opacity-90" />
              <span className="opacity-80">Created</span>
              <span className="text-foreground">{formattedDate}</span>
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <LucideIcons.FileText className="w-3.5 h-3.5 opacity-90" />
            <span className="opacity-80">Words</span>
            <span className="text-foreground">{wordCount}</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <LucideIcons.Clock className="w-3.5 h-3.5 opacity-90" />
            <span className="opacity-80">Read</span>
            <span className="text-foreground">{readingTime} min</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <LucideIcons.LayoutGrid className="w-3.5 h-3.5 opacity-90" />
            <span className="opacity-80">Blocks</span>
            <span className="text-foreground">{blocksCount}</span>
          </span>
        </div>
      )}
    </div>
  );
};
