import React, { useState, useRef, useEffect } from 'react';
import { Palette } from 'lucide-react';

interface CalloutBlockProps {
  id: string;
  content: string;
  icon?: string;
  bg?: string;
  onChange: (val: string) => void;
  onUpdateProps: (props: { calloutIcon?: string; calloutBg?: string }) => void;
  onEnter: () => void;
  onBackspace: () => void;
  onFocus: () => void;
  focusOnMount?: boolean;
}

const CALLOUT_ICONS = ['💡', '⚠️', 'ℹ️', '📌', '🔥', '🚀', '⚡', '💬', '✅', '❓'];

const CALLOUT_BG_THEMES: Record<string, { bg: string; border: string; text: string }> = {
  indigo: {
    bg: 'bg-indigo-50/80 dark:bg-indigo-950/30',
    border: 'border-indigo-200 dark:border-indigo-800/60',
    text: 'text-accent',
  },
  emerald: {
    bg: 'bg-emerald-50/80 dark:bg-emerald-950/30',
    border: 'border-emerald-200 dark:border-emerald-800/60',
    text: 'text-emerald-900 dark:text-emerald-200',
  },
  amber: {
    bg: 'bg-amber-50/80 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800/60',
    text: 'text-amber-900 dark:text-amber-200',
  },
  rose: {
    bg: 'bg-rose-50/80 dark:bg-rose-950/30',
    border: 'border-rose-200 dark:border-rose-800/60',
    text: 'text-rose-900 dark:text-rose-200',
  },
  sky: {
    bg: 'bg-sky-50/80 dark:bg-sky-950/30',
    border: 'border-sky-200 dark:border-sky-800/60',
    text: 'text-sky-900 dark:text-sky-200',
  },
  purple: {
    bg: 'bg-purple-50/80 dark:bg-purple-950/30',
    border: 'border-purple-200 dark:border-purple-800/60',
    text: 'text-purple-900 dark:text-purple-200',
  },
};

export const CalloutBlock: React.FC<CalloutBlockProps> = ({
  id: _id,
  content,
  icon = '💡',
  bg = 'indigo',
  onChange,
  onUpdateProps,
  onEnter,
  onBackspace,
  onFocus,
  focusOnMount,
}) => {
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showBgPicker, setShowBgPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const currentTheme = CALLOUT_BG_THEMES[bg] || CALLOUT_BG_THEMES.indigo;

  useEffect(() => {
    if (focusOnMount && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(content.length, content.length);
    }
  }, [focusOnMount]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowIconPicker(false);
        setShowBgPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onEnter();
    } else if (e.key === 'Backspace' && content === '') {
      e.preventDefault();
      onBackspace();
    }
  };

  return (
    <div
      className={`group/callout relative flex items-start gap-3 p-3.5 rounded-xl border ${currentTheme.bg} ${currentTheme.border} transition-colors my-1`}
    >
      {/* Icon Picker Trigger */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setShowIconPicker(!showIconPicker);
            setShowBgPicker(false);
          }}
          className="text-2xl hover:scale-110 transition-transform select-none cursor-pointer"
          title="Change callout icon"
        >
          {icon}
        </button>

        {showIconPicker && (
          <div
            ref={menuRef}
            className="absolute left-0 top-full mt-2 z-50 p-2 bg-card border border-border rounded-xl shadow-xl grid grid-cols-5 gap-1 w-44"
          >
            {CALLOUT_ICONS.map((ic) => (
              <button
                key={ic}
                type="button"
                onClick={() => {
                  onUpdateProps({ calloutIcon: ic });
                  setShowIconPicker(false);
                }}
                className="text-xl p-1 hover:bg-muted rounded transition-transform hover:scale-110"
              >
                {ic}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 min-w-0">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={onFocus}
          placeholder="Callout text..."
          rows={1}
          className={`w-full bg-transparent resize-none border-none outline-none focus:ring-0 p-0 text-sm font-normal ${currentTheme.text} placeholder-muted-foreground leading-relaxed`}
        />
      </div>

      {/* Color Theme Selector Trigger */}
      <div className="relative opacity-0 group-hover/callout:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={() => {
            setShowBgPicker(!showBgPicker);
            setShowIconPicker(false);
          }}
          className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          title="Change highlight color"
        >
          <Palette className="w-3.5 h-3.5" />
        </button>

        {showBgPicker && (
          <div
            ref={menuRef}
            className="absolute right-0 top-full mt-2 z-50 p-2 bg-card border border-border rounded-xl shadow-xl flex items-center gap-1.5"
          >
            {Object.keys(CALLOUT_BG_THEMES).map((themeKey) => (
              <button
                key={themeKey}
                type="button"
                onClick={() => {
                  onUpdateProps({ calloutBg: themeKey });
                  setShowBgPicker(false);
                }}
                className={`w-5 h-5 rounded-full capitalize hover:scale-110 transition-transform ${
                  themeKey === 'indigo'
                    ? 'bg-indigo-400'
                    : themeKey === 'emerald'
                    ? 'bg-emerald-400'
                    : themeKey === 'amber'
                    ? 'bg-amber-400'
                    : themeKey === 'rose'
                    ? 'bg-rose-400'
                    : themeKey === 'sky'
                    ? 'bg-sky-400'
                    : 'bg-purple-400'
                }`}
                title={themeKey}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
