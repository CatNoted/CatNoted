import React, { useEffect, useRef, useState } from 'react';

export interface WikiLinkMenuProps {
  query: string;
  position: { top: number; left: number };
  onClose: () => void;
  pages: { id: string; title: string }[];
  onSelect: (pageTitle: string) => void;
}

export const WikiLinkMenu: React.FC<WikiLinkMenuProps> = ({
  query,
  position,
  onClose,
  pages,
  onSelect,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filtered = pages.filter((page) => {
    const q = query.toLowerCase();
    if (!q) return true;
    return page.title.toLowerCase().includes(q);
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
          onSelect(filtered[selectedIndex].title);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKey, true);
    return () => window.removeEventListener('keydown', handleKey, true);
  }, [filtered, selectedIndex, onClose, onSelect]);

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
          No pages found for "{query}"
        </p>
      </div>
    );
  }

  return (
    <div
      ref={menuRef}
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
      className="fixed z-[9999] w-64 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl shadow-2xl py-2 overflow-hidden text-xs"
    >
      <div className="px-3 pb-1.5 pt-0.5 border-b border-slate-100 dark:border-zinc-800 mb-1">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
          Link to Page
        </p>
      </div>

      <div className="max-h-64 overflow-y-auto px-1">
        {filtered.map((page, i) => (
          <button
            key={page.id}
            data-index={i}
            onMouseDown={(e) => {
              e.preventDefault();
              onSelect(page.title);
            }}
            onClick={() => onSelect(page.title)}
            onMouseEnter={() => setSelectedIndex(i)}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors group ${
              selectedIndex === i
                ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-medium'
                : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
            }`}
          >
            <span className="truncate">{page.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
