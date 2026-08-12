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
  Lightbulb,
  ChevronRight,
  Sigma,
  Table as TableIcon,
  Bookmark,
  Image as ImageIcon,
  Link2,
  Kanban,
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

const groupNames = ['Block Types', 'Lists', 'Advanced Blocks', 'AI Tools', 'Others'] as const;
type GroupName = typeof groupNames[number];

const getGroup = (cmd: SlashCommand): GroupName => {
  const id = cmd.id.toLowerCase();
  if (['text', 'heading1', 'heading2', 'heading3', 'quote', 'divider'].includes(id)) {
    return 'Block Types';
  }
  if (['todo', 'bullet', 'ordered', 'toggle'].includes(id)) {
    return 'Lists';
  }
  if (['table', 'callout', 'code', 'math', 'bookmark', 'embed', 'image', 'kanban'].includes(id)) {
    return 'Advanced Blocks';
  }
  if (['widget'].includes(id)) {
    return 'AI Tools';
  }
  return 'Others';
};

export const SlashCommandMenu: React.FC<SlashCommandMenuProps> = ({
  query,
  position,
  onClose,
  commands,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // ⚡ Bolt Optimization: Hoist query.toLowerCase() out of filter loop and memoize results
  const filtered = React.useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return commands;
    return commands.filter((cmd) => {
      return (
        cmd.label.toLowerCase().includes(q) ||
        cmd.description.toLowerCase().includes(q) ||
        cmd.keywords.some((k) => k.toLowerCase().includes(q))
      );
    });
  }, [commands, query]);

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
        className="fixed z-[9999] w-72 bg-card border border-border rounded-xl shadow-xl py-3 px-4 text-center select-none"
      >
        <p className="text-[12.5px] font-medium text-foreground">
          No matching commands
        </p>
        <p className="text-[10.5px] text-muted-foreground mt-1 truncate">
          No matches for "{query}"
        </p>
      </div>
    );
  }

  // Group the filtered commands while keeping their original flat index in `filtered`
  const grouped: { [key in GroupName]?: { cmd: SlashCommand; originalIndex: number }[] } = {};

  filtered.forEach((cmd, idx) => {
    const grp = getGroup(cmd);
    if (!grouped[grp]) {
      grouped[grp] = [];
    }
    grouped[grp]!.push({ cmd, originalIndex: idx });
  });

  return (
    <div
      ref={menuRef}
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
      className="fixed z-[9999] w-72 bg-card border border-border rounded-xl shadow-xl py-1.5 overflow-hidden flex flex-col max-h-[340px]"
    >
      {/* Scrollable list area */}
      <div className="flex-1 overflow-y-auto px-1.5 space-y-2">
        {groupNames.map((groupName) => {
          const items = grouped[groupName];
          if (!items || items.length === 0) return null;

          return (
            <div key={groupName} className="space-y-0.5">
              {/* Group Title */}
              <div className="px-2 py-1 select-none">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {groupName}
                </span>
              </div>

              {/* Group Items */}
              <div className="space-y-0.5">
                {items.map(({ cmd, originalIndex }) => {
                  const isSelected = selectedIndex === originalIndex;
                  return (
                    <button
                      key={cmd.id}
                      data-index={originalIndex}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        cmd.action();
                      }}
                      onClick={() => cmd.action()}
                      onMouseEnter={() => setSelectedIndex(originalIndex)}
                      className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-left transition-colors group ${
                        isSelected
                          ? 'bg-accent/10 text-accent'
                          : 'text-foreground hover:bg-muted'
                      }`}
                    >
                      <span
                        className={`flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-md text-sm border transition-colors ${
                          isSelected
                            ? 'bg-accent/20 text-accent border-accent/30'
                            : 'bg-muted/50 text-muted-foreground border-border'
                        }`}
                      >
                        {cmd.icon}
                      </span>
                      <span className="min-w-0 flex-1 leading-tight">
                        <p className={`text-[12.5px] font-medium leading-tight ${isSelected ? 'text-accent' : 'text-foreground'}`}>
                          {cmd.label}
                        </p>
                        <p className="text-[10.5px] leading-snug text-muted-foreground truncate mt-0.5 font-normal">
                          {cmd.description}
                        </p>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer hint */}
      <div className="px-3.5 py-1.5 border-t border-border mt-1.5 flex items-center justify-between text-[9px] text-muted-foreground font-medium select-none">
        <span>↑↓ navigate</span>
        <span>Enter select</span>
        <span>Esc close</span>
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
      id: 'callout',
      label: 'Callout',
      description: 'Highlighted callout box',
      icon: <Lightbulb className="w-4 h-4" />,
      keywords: ['callout', 'info', 'box', 'highlight', 'note', 'c', 'alert'],
      action: exec(() => onSetType('callout', { calloutIcon: '💡', calloutBg: 'accent' })),
    },
    {
      id: 'toggle',
      label: 'Toggle List',
      description: 'Collapsible item container',
      icon: <ChevronRight className="w-4 h-4" />,
      keywords: ['toggle', 'collapsible', 'expand', 'fold', 'collapse'],
      action: exec(() => onSetType('toggle', { expanded: true })),
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
      action: exec(() => onSetType('code', { language: 'javascript' })),
    },
    {
      id: 'math',
      label: 'Math Formula',
      description: 'LaTeX math equation',
      icon: <Sigma className="w-4 h-4" />,
      keywords: ['math', 'latex', 'formula', 'equation', 'sigma'],
      action: exec(() => onSetType('math')),
    },
    {
      id: 'table',
      label: 'Table Grid',
      description: 'Grid table layout',
      icon: <TableIcon className="w-4 h-4" />,
      keywords: ['table', 'grid', 'matrix', 'row', 'column'],
      action: exec(() => onSetType('table')),
    },
    {
      id: 'kanban',
      label: 'Kanban Board',
      description: 'Editable columns and cards',
      icon: <Kanban className="w-4 h-4" />,
      keywords: ['kanban', 'board', 'trello', 'todo', 'columns', 'cards'],
      action: exec(() => onSetType('kanban', { kanbanTitle: 'Kanban Board', columns: [] })),
    },
    {
      id: 'bookmark',
      label: 'Web Bookmark',
      description: 'Link card preview',
      icon: <Bookmark className="w-4 h-4" />,
      keywords: ['bookmark', 'link', 'url', 'web', 'card'],
      action: exec(() => onSetType('bookmark')),
    },
    {
      id: 'embed',
      label: 'Embed Page',
      description: 'Render inline content from another page',
      icon: <Link2 className="w-4 h-4" />,
      keywords: ['embed', 'synced', 'reference', 'page', 'block', 'page-ref'],
      action: exec(() => onSetType('embed')),
    },
    {
      id: 'image',
      label: 'Image Media',
      description: 'Embedded image with caption',
      icon: <ImageIcon className="w-4 h-4" />,
      keywords: ['image', 'photo', 'picture', 'media', 'img'],
      action: exec(() => onSetType('image')),
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
