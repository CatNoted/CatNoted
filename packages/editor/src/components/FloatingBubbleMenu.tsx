import React, { useState, useEffect, useRef } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Link,
  Highlighter,
  Sparkles,
} from 'lucide-react';

interface FloatingBubbleMenuProps {
  onFormat?: (formatType: string, value?: string) => void;
  onAskAI?: (selectedText: string) => void;
}

export const FloatingBubbleMenu: React.FC<FloatingBubbleMenuProps> = ({
  onFormat,
  onAskAI,
}) => {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [selectedText, setSelectedText] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        setVisible(false);
        setShowColorPicker(false);
        return;
      }

      const text = selection.toString().trim();
      if (!text) {
        setVisible(false);
        setShowColorPicker(false);
        return;
      }

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      if (rect.width === 0 || rect.height === 0) {
        setVisible(false);
        return;
      }

      // Position centered directly above selection range
      const top = Math.max(10, rect.top - 48);
      const left = Math.max(10, Math.min(window.innerWidth - 320, rect.left + rect.width / 2 - 140));

      setSelectedText(text);
      setPosition({ top, left });
      setVisible(true);
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);

  if (!visible) return null;

  const applyFormat = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    if (onFormat) onFormat(command, value);
  };

  const handleLink = () => {
    const url = prompt('Enter URL link:', 'https://');
    if (url) {
      const lowerUrl = url.trim().toLowerCase();
      // 🛡️ Sentinel: Prevent XSS by blocking unsafe protocols in user-provided link URLs
      if (lowerUrl.startsWith('javascript:') || lowerUrl.startsWith('data:') || lowerUrl.startsWith('vbscript:')) {
        alert('Unsafe URL protocols are not allowed');
        return;
      }
      applyFormat('createLink', url);
    }
  };

  const colors = [
    { name: 'Yellow', bg: 'bg-warning-soft' },
    { name: 'Green', bg: 'bg-success-soft' },
    { name: 'Blue', bg: 'bg-muted' },
    { name: 'Pink', bg: 'bg-danger-soft' },
    { name: 'Purple', bg: 'bg-muted' },
  ];

  return (
    <div
      ref={menuRef}
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
      className="fixed z-[9999] flex items-center gap-0.5 p-1 bg-card dark:bg-card backdrop-blur-md text-foreground rounded-xl shadow-2xl border border-border animate-in fade-in zoom-in-95 duration-150 select-none"
    >
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          applyFormat('bold');
        }}
        className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
        title="Bold (Ctrl+B)"
        aria-label="Format bold text"
      >
        <Bold className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          applyFormat('italic');
        }}
        className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
        title="Italic (Ctrl+I)"
        aria-label="Format italic text"
      >
        <Italic className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          applyFormat('underline');
        }}
        className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
        title="Underline (Ctrl+U)"
        aria-label="Format underline text"
      >
        <Underline className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          applyFormat('strikeThrough');
        }}
        className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
        title="Strikethrough"
        aria-label="Format strikethrough text"
      >
        <Strikethrough className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          const sel = window.getSelection();
          if (sel && !sel.isCollapsed) {
            const text = sel.toString();
            const escaped = text.replace(/[&<>"']/g, (m) => {
              return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m as '&' | '<' | '>' | '"' | "'"] || m;
            });
            applyFormat('insertHTML', `<code class="bg-muted px-1 py-0.5 rounded font-mono text-xs text-foreground">${escaped}</code>`);
          }
        }}
        className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
        title="Inline Code"
        aria-label="Format as inline code"
      >
        <Code className="w-3.5 h-3.5" />
      </button>

      <div className="relative">
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            setShowColorPicker(!showColorPicker);
          }}
          className="p-1.5 hover:bg-muted rounded-lg transition-colors text-foreground hover:text-foreground"
          title="Highlight color"
          aria-label="Choose highlight color"
          aria-expanded={showColorPicker}
          aria-haspopup="true"
        >
          <Highlighter className="w-3.5 h-3.5" />
        </button>

        {showColorPicker && (
          <div className="absolute left-0 bottom-full mb-2 p-1.5 bg-card border border-border rounded-lg shadow-xl flex items-center gap-1">
            {colors.map((c) => (
              <button
                key={c.name}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  applyFormat('backColor', c.bg);
                  setShowColorPicker(false);
                }}
                className={`w-5 h-5 rounded-full ${c.bg} hover:scale-110 transition-transform`}
                title={c.name}
                aria-label={`Highlight with ${c.name.toLowerCase()} color`}
              />
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          handleLink();
        }}
        className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
        title="Link"
        aria-label="Insert link"
      >
        <Link className="w-3.5 h-3.5" />
      </button>

      <div className="w-px h-4 bg-border dark:bg-border mx-1" />

      {onAskAI && (
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            onAskAI(selectedText);
          }}
          className="px-2 py-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-xs font-medium flex items-center gap-1 transition-colors shadow-sm"
          title="Ask Space Agent AI"
        >
          <Sparkles className="w-3 h-3 text-warning" />
          <span>Ask AI</span>
        </button>
      )}
    </div>
  );
};
