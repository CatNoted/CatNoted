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
      applyFormat('createLink', url);
    }
  };

  const colors = [
    { name: 'Yellow', bg: 'bg-yellow-200 dark:bg-yellow-500/30' },
    { name: 'Green', bg: 'bg-emerald-200 dark:bg-emerald-500/30' },
    { name: 'Blue', bg: 'bg-sky-200 dark:bg-sky-500/30' },
    { name: 'Pink', bg: 'bg-rose-200 dark:bg-rose-500/30' },
    { name: 'Purple', bg: 'bg-purple-200 dark:bg-purple-500/30' },
  ];

  return (
    <div
      ref={menuRef}
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
      className="fixed z-[9999] flex items-center gap-0.5 p-1 bg-slate-900/90 dark:bg-zinc-900/95 backdrop-blur-md text-white rounded-xl shadow-2xl border border-slate-700/50 dark:border-zinc-800/60/80 animate-in fade-in zoom-in-95 duration-150 select-none"
    >
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          applyFormat('bold');
        }}
        className="p-1.5 hover:bg-slate-700 dark:hover:bg-zinc-800 rounded-lg transition-colors text-slate-200 hover:text-white"
        title="Bold (Ctrl+B)"
      >
        <Bold className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          applyFormat('italic');
        }}
        className="p-1.5 hover:bg-slate-700 dark:hover:bg-zinc-800 rounded-lg transition-colors text-slate-200 hover:text-white"
        title="Italic (Ctrl+I)"
      >
        <Italic className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          applyFormat('underline');
        }}
        className="p-1.5 hover:bg-slate-700 dark:hover:bg-zinc-800 rounded-lg transition-colors text-slate-200 hover:text-white"
        title="Underline (Ctrl+U)"
      >
        <Underline className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          applyFormat('strikeThrough');
        }}
        className="p-1.5 hover:bg-slate-700 dark:hover:bg-zinc-800 rounded-lg transition-colors text-slate-200 hover:text-white"
        title="Strikethrough"
      >
        <Strikethrough className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          const sel = window.getSelection();
          if (sel && !sel.isCollapsed) {
            applyFormat('insertHTML', `<code class="bg-slate-800 px-1 py-0.5 rounded font-mono text-xs text-amber-400">${sel.toString()}</code>`);
          }
        }}
        className="p-1.5 hover:bg-slate-700 dark:hover:bg-zinc-800 rounded-lg transition-colors text-slate-200 hover:text-white"
        title="Inline Code"
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
          className="p-1.5 hover:bg-slate-700 dark:hover:bg-zinc-800 rounded-lg transition-colors text-amber-400 hover:text-amber-300"
          title="Highlight color"
        >
          <Highlighter className="w-3.5 h-3.5" />
        </button>

        {showColorPicker && (
          <div className="absolute left-0 bottom-full mb-2 p-1.5 bg-slate-900 border border-slate-700 rounded-lg shadow-xl flex items-center gap-1">
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
        className="p-1.5 hover:bg-slate-700 dark:hover:bg-zinc-800 rounded-lg transition-colors text-slate-200 hover:text-white"
        title="Link"
      >
        <Link className="w-3.5 h-3.5" />
      </button>

      <div className="w-px h-4 bg-slate-700 dark:bg-zinc-700 mx-1" />

      {onAskAI && (
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            onAskAI(selectedText);
          }}
          className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium flex items-center gap-1 transition-colors shadow-sm"
          title="Ask Space Agent AI"
        >
          <Sparkles className="w-3 h-3 text-amber-300" />
          <span>Ask AI</span>
        </button>
      )}
    </div>
  );
};
