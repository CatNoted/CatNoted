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
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/40 px-4 pt-[10vh] backdrop-blur-sm dark:bg-black/60"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Commands"
        className="flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-gray-200/70 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900"
      >
        <div className="flex items-center gap-3 px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command..."
            className="w-full bg-transparent text-[15px] text-gray-800 outline-none placeholder:text-gray-400 dark:text-gray-100"
          />
          <kbd className="hidden rounded-lg border border-gray-200 px-2 py-1 text-[11px] text-gray-400 dark:border-gray-700 dark:text-gray-500 sm:block">
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
            <div className="px-3 py-10 text-center text-[13px] text-gray-400">
              No matching command
            </div>
          )}
          {visibleGroups.map((group) => (
            <div key={group.key} className="mb-2 last:mb-0">
              <div className="px-3 pt-2 pb-1 text-[11px] font-medium text-gray-400 uppercase tracking-wide">
                {group.key}
              </div>
              {group.items.map((cmd) => {
                const Icon = cmd.icon;
                const idx = flatItems.indexOf(cmd);
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
                      'flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left',
                      'transition-colors duration-75',
                      isSelected
                        ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
                        : 'text-gray-600 hover:bg-gray-100/60 dark:text-gray-300 dark:hover:bg-gray-800/60'
                    ].join(' ')}
                  >
                    <div
                      className={[
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-md',
                        isSelected
                          ? 'bg-gray-900/5 dark:bg-gray-100/10'
                          : 'bg-gray-100 dark:bg-gray-800'
                      ].join(' ')}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="min-w-0 truncate text-[13px]">
                      {cmd.title}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 px-4 py-2 text-[11px] text-gray-400 dark:border-gray-800">
          <span>
            <kbd className="mr-2 rounded-md border border-gray-200 px-1.5 py-0.5 dark:border-gray-700">↑</kbd>
            <kbd className="mr-2 rounded-md border border-gray-200 px-1.5 py-0.5 dark:border-gray-700">↓</kbd>
            Navigate
          </span>
          <span>
            <kbd className="mr-2 rounded-md border border-gray-200 px-1.5 py-0.5 dark:border-gray-700">Enter</kbd>
            Confirm
          </span>
        </div>
      </div>
    </div>
  );
};
