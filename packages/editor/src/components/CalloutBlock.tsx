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
  accent: {
    bg: 'bg-muted',
    border: 'border-border',
    text: 'text-foreground',
  },
  emerald: {
    bg: 'bg-success-soft',
    border: 'border-success-soft',
    text: 'text-success',
  },
  amber: {
    bg: 'bg-warning-soft',
    border: 'border-warning-soft',
    text: 'text-warning',
  },
  rose: {
    bg: 'bg-danger-soft',
    border: 'border-danger-soft',
    text: 'text-danger',
  },
  sky: {
    bg: 'bg-muted',
    border: 'border-border/60',
    text: 'text-foreground',
  },
  purple: {
    bg: 'bg-muted',
    border: 'border-border',
    text: 'text-muted-foreground',
  },
};

export const CalloutBlock: React.FC<CalloutBlockProps> = ({
  id: _id,
  content,
  icon = '💡',
  bg = 'accent',
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

  const currentTheme = CALLOUT_BG_THEMES[bg] || CALLOUT_BG_THEMES.accent;

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
          aria-label="Change callout icon"
          aria-haspopup="menu"
          aria-expanded={showIconPicker}
        >
          {icon}
        </button>

        {showIconPicker && (
          <div
            ref={menuRef}
            role="menu"
            aria-label="Callout icons"
            className="absolute left-0 top-full mt-2 z-50 p-2 bg-card border border-border rounded-xl shadow-xl grid grid-cols-5 gap-1 w-44"
          >
            {CALLOUT_ICONS.map((ic) => (
              <button
                key={ic}
                type="button"
                role="menuitem"
                aria-label={`Select icon ${ic}`}
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
          className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-muted transition-colors"
          title="Change highlight color"
          aria-label="Change highlight color"
          aria-haspopup="menu"
          aria-expanded={showBgPicker}
        >
          <Palette className="w-3.5 h-3.5" />
        </button>

        {showBgPicker && (
          <div
            ref={menuRef}
            role="menu"
            aria-label="Callout colors"
            className="absolute right-0 top-full mt-2 z-50 p-2 bg-card border border-border rounded-xl shadow-xl flex items-center gap-1.5"
          >
            {Object.keys(CALLOUT_BG_THEMES).map((themeKey) => (
              <button
                key={themeKey}
                type="button"
                role="menuitem"
                aria-label={`Select color ${themeKey}`}
                onClick={() => {
                  onUpdateProps({ calloutBg: themeKey });
                  setShowBgPicker(false);
                }}
                className={`w-5 h-5 rounded-full capitalize hover:scale-110 transition-transform ${
                  themeKey === 'accent'
                      ? 'bg-primary'
                    : themeKey === 'emerald'
                    ? 'bg-success'
                    : themeKey === 'amber'
                    ? 'bg-warning'
                    : themeKey === 'rose'
                    ? 'bg-danger'
                    : themeKey === 'sky'
                      ? 'bg-primary'
                    : 'bg-muted border border-border'
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
