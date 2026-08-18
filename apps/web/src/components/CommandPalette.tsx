import React, { useState, useEffect, useRef, useMemo, useCallback, useId } from 'react';
import {
  Search,
  FileText,
  Layout,
  Network,
  Settings,
  Moon,
  Sun,
  EyeOff
} from 'lucide-react';
import { ActiveMode } from '../layouts/AppLayout.js';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onModeSelect: (mode: ActiveMode) => void;
  onToggleTheme: () => void;
  onToggleZen: () => void;
  onOpenSettings: () => void;
  isDarkMode: boolean;
}

interface CommandItem {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<React.ComponentProps<'svg'>>;
  action: () => void;
}

const commandGroups = [
  {
    key: 'Open',
    filter: (cmd: CommandItem) =>
      ['doc', 'canvas', 'graph'].includes(cmd.id)
  },
  {
    key: 'Interface',
    filter: (cmd: CommandItem) => ['zen', 'theme'].includes(cmd.id)
  },
  {
    key: 'System',
    filter: (cmd: CommandItem) => ['settings'].includes(cmd.id)
  }
];

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onModeSelect,
  onToggleTheme,
  onToggleZen,
  onOpenSettings,
  isDarkMode
}) => {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const paletteId = useId();

  const baseCommands = useMemo<CommandItem[]>(
    () => [
      {
        id: 'doc',
        title: 'Doc Mode',
        subtitle: 'Open block editor',
        icon: FileText,
        action: () => onModeSelect('doc')
      },
      {
        id: 'canvas',
        title: 'Canvas Mode',
        subtitle: 'Open spatial whiteboard',
        icon: Layout,
        action: () => onModeSelect('canvas')
      },
      {
        id: 'graph',
        title: 'Graph Mode',
        subtitle: 'Backlinks & tags',
        icon: Network,
        action: () => onModeSelect('graph')
      },
      {
        id: 'zen',
        title: 'Zen Mode',
        subtitle: 'Hide sidebars & panels',
        icon: EyeOff,
        action: onToggleZen
      },
      {
        id: 'theme',
        title: isDarkMode ? 'Light Mode' : 'Dark Mode',
        subtitle: 'Appearance',
        icon: isDarkMode ? Sun : Moon,
        action: onToggleTheme
      },
      {
        id: 'settings',
        title: 'Settings',
        subtitle: 'API keys & E2EE',
        icon: Settings,
        action: onOpenSettings
      }
    ],
    [onModeSelect, onToggleTheme, onToggleZen, onOpenSettings, isDarkMode]
  );

  const normalizedSearch = search.trim().toLowerCase();

  const visibleGroups = useMemo(() => {
    const groups: { key: string; items: CommandItem[] }[] = [];
    for (const group of commandGroups) {
      const items = baseCommands.filter(
        (cmd) =>
          (!normalizedSearch ||
            cmd.title.toLowerCase().includes(normalizedSearch) ||
            cmd.subtitle.toLowerCase().includes(normalizedSearch)) &&
          group.filter(cmd)
      );
      if (items.length) {
        groups.push({ key: group.key, items });
      }
    }
    return groups;
  }, [baseCommands, normalizedSearch]);

  const flatItems = useMemo(
    () => visibleGroups.flatMap((group) => group.items),
    [visibleGroups]
  );

  const flatItemIndices = useMemo(() => {
    const map = new Map<string, number>();
    flatItems.forEach((item, index) => {
      map.set(item.id, index);
    });
    return map;
  }, [flatItems]);

  const selectedCommand = flatItems[selectedIndex];

  useEffect(() => {
    if (!isOpen) return;
    setSearch('');
    setSelectedIndex(0);
    const focusTimer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(focusTimer);
  }, [isOpen]);

  const selectCurrent = useCallback(() => {
    if (selectedCommand) {
      selectedCommand.action();
      onClose();
    }
  }, [selectedCommand, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < flatItems.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : flatItems.length - 1
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        selectCurrent();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, flatItems.length, onClose, selectCurrent]);

  useEffect(() => {
    if (!isOpen || selectedIndex < 0) return;
    const listEl = listRef.current;
    if (!listEl) return;

    const buttons = Array.from(
      listEl.querySelectorAll<HTMLButtonElement>('[data-command-item]')
    );
    const target = buttons[selectedIndex];
    if (target) {
      target.scrollIntoView({ block: 'nearest' });
      target.focus({ preventScroll: true });
    }
  }, [isOpen, selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-overlay/20 px-4 pt-[10vh] backdrop-blur-[2px] dark:bg-overlay/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Commands"
        className="flex w-full max-w-[440px] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl dark:border-border/80 dark:bg-card"
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-muted/50 dark:border-border/40">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command..."
            role="combobox"
            aria-label="Search commands"
            aria-autocomplete="list"
            aria-controls={`${paletteId}-list`}
            aria-expanded={isOpen}
            className="w-full bg-transparent text-[14px] text-foreground outline-none placeholder:text-muted-foreground dark:text-foreground"
          />
          <kbd className="hidden rounded bg-muted dark:bg-muted px-1.5 py-0.5 font-sans text-[10px] border border-border/60 dark:border-border text-muted-foreground sm:block">
            ESC
          </kbd>
        </div>

        <div
          id={`${paletteId}-list`}
          ref={listRef}
          role="listbox"
          aria-activedescendant={
            selectedCommand
              ? `${paletteId}-item-${selectedCommand.id}`
              : undefined
          }
          tabIndex={-1}
          className="flex max-h-[min(320px,60vh)] flex-1 flex-col overflow-y-auto px-2 py-2"
        >
          {visibleGroups.length === 0 && (
            <div className="px-3 py-10 text-center text-[13px] text-muted-foreground">
              No matching command
            </div>
          )}
          {visibleGroups.map((group) => (
            <div key={group.key} className="mb-1 last:mb-0">
              <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                {group.key}
              </div>
              {group.items.map((cmd) => {
                const Icon = cmd.icon;
                const idx = flatItemIndices.get(cmd.id) ?? -1;
                const isSelected = selectedIndex === idx;
                return (
                  <button
                    key={cmd.id}
                    id={`${paletteId}-item-${cmd.id}`}
                    role="option"
                    aria-selected={isSelected}
                    data-command-item
                    onClick={() => {
                      cmd.action();
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={[
                      'group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left',
                      'transition-all duration-75',
                      isSelected
                        ? 'bg-muted text-foreground'
                        : 'text-muted-foreground hover:bg-muted/80 dark:text-muted-foreground dark:hover:bg-muted/50'
                    ].join(' ')}
                  >
                    <Icon
                      className={[
                        'h-4 w-4 shrink-0 transition-colors',
                        isSelected
                          ? 'text-foreground dark:text-foreground'
                          : 'text-muted-foreground'
                      ].join(' ')}
                    />
                    <span className="flex-1 min-w-0 truncate text-[13px] font-medium">
                      {cmd.title}
                    </span>
                    <span
                      className={[
                        'ml-auto text-[11px] font-normal transition-colors shrink-0',
                        isSelected
                          ? 'text-muted-foreground dark:text-muted-foreground'
                          : 'text-muted-foreground/80/80'
                      ].join(' ')}
                    >
                      {cmd.subtitle}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-muted/80 dark:border-border/60 px-4 py-2 text-[10px] text-muted-foreground/80">
          <div className="flex items-center gap-1.5">
            <kbd className="rounded bg-muted dark:bg-muted/50 px-1 py-0.5 font-sans text-[10px] font-medium border border-border/60 dark:border-border text-muted-foreground dark:text-muted-foreground shadow-sm">↑</kbd>
            <kbd className="rounded bg-muted dark:bg-muted/50 px-1 py-0.5 font-sans text-[10px] font-medium border border-border/60 dark:border-border text-muted-foreground dark:text-muted-foreground shadow-sm">↓</kbd>
            <span>Navigate</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="rounded bg-muted dark:bg-muted/50 px-1 py-0.5 font-sans text-[10px] font-medium border border-border/60 dark:border-border text-muted-foreground dark:text-muted-foreground shadow-sm">Enter</kbd>
            <span>Confirm</span>
          </div>
        </div>
      </div>
    </div>
  );
};
