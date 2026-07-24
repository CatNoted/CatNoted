import React, { useEffect, useRef, useState } from 'react';
import {
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  List,
  ListOrdered,
  Quote,
  Code,
  Cpu,
  Minus,
  CheckSquare,
} from 'lucide-react';

export interface SlashCommand {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  keywords: string[];
  action: () => void;
}

interface SlashCommandMenuProps {
  query: string;
  position: { top: number; left: number };
  onClose: () => void;
  commands: SlashCommand[];
}

export const SlashCommandMenu: React.FC<SlashCommandMenuProps> = ({
  query,
  position,
  onClose,
  commands,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filtered = commands.filter((cmd) => {
    const q = query.toLowerCase();
    if (!q) return true;
    return (
      cmd.label.toLowerCase().includes(q) ||
      cmd.description.toLowerCase().includes(q) ||
      cmd.keywords.some((k) => k.toLowerCase().includes(q))
    );
  });

  // Reset selection when filter changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        setSelectedIndex((i) => (i + 1) % (filtered.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        setSelectedIndex((i) => (i - 1 + (filtered.length || 1)) % (filtered.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].action();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKey, true);
    return () => window.removeEventListener('keydown', handleKey, true);
  }, [filtered, selectedIndex, onClose]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Auto-scroll selected item into view
  useEffect(() => {
    const el = menuRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  if (filtered.length === 0) {
    return (
      <div
        ref={menuRef}
        style={{ top: `${position.top}px`, left: `${position.left}px` }}
        className="fixed z-[9999] w-64 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl shadow-2xl py-2 px-2"
      >
        <p className="text-xs text-slate-400 dark:text-zinc-500 px-2 py-1">
          No commands found for "{query}"
        </p>
      </div>
    );
  }

  return (
    <div
      ref={menuRef}
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
      className="fixed z-[9999] w-64 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl shadow-2xl py-2 overflow-hidden"
    >
      {/* Header */}
      <div className="px-3 pb-1.5 pt-0.5 border-b border-slate-100 dark:border-zinc-800 mb-1">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
          Block Types
        </p>
      </div>

      {/* Commands list */}
      <div className="max-h-64 overflow-y-auto px-1">
        {filtered.map((cmd, i) => (
          <button
            key={cmd.id}
            data-index={i}
            onMouseDown={(e) => {
              e.preventDefault();
              cmd.action();
            }}
            onClick={() => cmd.action()}
            onMouseEnter={() => setSelectedIndex(i)}
            className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg text-left transition-colors group ${
              selectedIndex === i
                ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300'
                : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
            }`}
          >
            <span
              className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-sm ${
                selectedIndex === i
                  ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400'
              }`}
            >
              {cmd.icon}
            </span>
            <span className="min-w-0">
              <p className="text-xs font-medium leading-tight truncate">{cmd.label}</p>
              <p className="text-[10px] leading-tight text-slate-400 dark:text-zinc-500 truncate">
                {cmd.description}
              </p>
            </span>
          </button>
        ))}
      </div>

      {/* Footer hint */}
      <div className="px-3 pt-1.5 border-t border-slate-100 dark:border-zinc-800 mt-1">
        <p className="text-[9px] text-slate-300 dark:text-zinc-600">
          ↑↓ navigate · Enter select · Esc close
        </p>
      </div>
    </div>
  );
};

// Default slash commands factory
export function buildSlashCommands(opts: {
  onSetType: (type: string, properties?: Record<string, unknown>) => void;
  onAddWidget: () => void;
  onClose: () => void;
}): SlashCommand[] {
  const { onSetType, onAddWidget, onClose } = opts;

  const exec = (fn: () => void) => () => { fn(); onClose(); };

  return [
    {
      id: 'text',
      label: 'Text',
      description: 'Plain paragraph',
      icon: <AlignLeft className="w-4 h-4" />,
      keywords: ['paragraph', 'p', 'plain', 'text'],
      action: exec(() => onSetType('text')),
    },
    {
      id: 'heading1',
      label: 'Heading 1',
      description: 'Large section heading',
      icon: <Heading1 className="w-4 h-4" />,
      keywords: ['h1', 'title', 'heading', 'big'],
      action: exec(() => onSetType('heading', { level: 1 })),
    },
    {
      id: 'heading2',
      label: 'Heading 2',
      description: 'Medium section heading',
      icon: <Heading2 className="w-4 h-4" />,
      keywords: ['h2', 'heading', 'medium', 'sub'],
      action: exec(() => onSetType('heading', { level: 2 })),
    },
    {
      id: 'heading3',
      label: 'Heading 3',
      description: 'Small section heading',
      icon: <Heading3 className="w-4 h-4" />,
      keywords: ['h3', 'heading', 'small', 'sub'],
      action: exec(() => onSetType('heading', { level: 3 })),
    },
    {
      id: 'bullet',
      label: 'Bullet List',
      description: 'Unordered list item',
      icon: <List className="w-4 h-4" />,
      keywords: ['ul', 'bullet', 'list', 'unordered', 'item'],
      action: exec(() => onSetType('bullet')),
    },
    {
      id: 'ordered',
      label: 'Numbered List',
      description: 'Ordered list item',
      icon: <ListOrdered className="w-4 h-4" />,
      keywords: ['ol', 'numbered', 'list', 'ordered', '1'],
      action: exec(() => onSetType('ordered')),
    },
    {
      id: 'todo',
      label: 'To-do',
      description: 'Checkbox task item',
      icon: <CheckSquare className="w-4 h-4" />,
      keywords: ['check', 'checkbox', 'task', 'todo', 'done'],
      action: exec(() => onSetType('todo')),
    },
    {
      id: 'quote',
      label: 'Quote',
      description: 'Block quotation',
      icon: <Quote className="w-4 h-4" />,
      keywords: ['blockquote', 'quote', 'cite'],
      action: exec(() => onSetType('quote')),
    },
    {
      id: 'code',
      label: 'Code Block',
      description: 'Monospace code snippet',
      icon: <Code className="w-4 h-4" />,
      keywords: ['code', 'snippet', 'pre', 'monospace', 'syntax'],
      action: exec(() => onSetType('code')),
    },
    {
      id: 'divider',
      label: 'Divider',
      description: 'Horizontal separator line',
      icon: <Minus className="w-4 h-4" />,
      keywords: ['hr', 'divider', 'rule', 'separator', 'line'],
      action: exec(() => onSetType('divider')),
    },
    {
      id: 'widget',
      label: 'AI Widget',
      description: 'Insert live AI-rendered widget',
      icon: <Cpu className="w-4 h-4" />,
      keywords: ['widget', 'ai', 'agent', 'live', 'dynamic', 'interactive'],
      action: exec(onAddWidget),
    },
  ];
}
