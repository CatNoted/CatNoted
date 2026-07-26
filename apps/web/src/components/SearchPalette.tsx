import React, { useState, useEffect, useRef, useMemo, useCallback, useId } from 'react';
import { Search, FileText, Tag, Clock, X, CornerDownLeft } from 'lucide-react';
import { ActiveMode } from '../layouts/AppLayout.js';
import { yblocks, ypages, renderPageIcon } from '@catnoted/editor';
import { parseDocumentGraph } from '@catnoted/graph';
import { PageMeta, BlockNode } from '@catnoted/shared';

interface SearchPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onPageSelect: (pageId: string) => void;
  onModeChange: (mode: ActiveMode) => void;
}

export interface SearchResultItem {
  id: string;
  type: 'page' | 'block' | 'tag';
  title: string;
  subtitle?: string;
  parentId?: string;
  icon: any;
}

export const SearchPalette: React.FC<SearchPaletteProps> = ({
  isOpen,
  onClose,
  onPageSelect,
  onModeChange
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [allBlocks, setAllBlocks] = useState<BlockNode[]>([]);
  const [allPages, setAllPages] = useState<PageMeta[]>([]);
  const [lastOpened, setLastOpened] = useState<SearchResultItem | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const paletteId = useId();

  // Load real-time workspace data from Yjs CRDT arrays/maps
  useEffect(() => {
    if (!isOpen) return;

    const updateData = () => {
      setAllBlocks(yblocks.toArray());
      setAllPages(ypages.toJSON() ? Object.values(ypages.toJSON()) : []);
    };

    updateData();
    yblocks.observe(updateData);
    ypages.observe(updateData);

    return () => {
      yblocks.unobserve(updateData);
      ypages.unobserve(updateData);
    };
  }, [isOpen]);

  // Load last opened result from localStorage
  useEffect(() => {
    if (!isOpen) return;
    setQuery('');
    setSelectedIndex(0);

    try {
      const saved = localStorage.getItem('catnoted:last-search-result');
      if (saved) {
        setLastOpened(JSON.parse(saved));
      } else {
        setLastOpened(null);
      }
    } catch (e) {
      setLastOpened(null);
    }

    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 50);

    return () => clearTimeout(timer);
  }, [isOpen]);

  // Document graph tags & ghost nodes
  const graphNodes = useMemo(() => {
    return parseDocumentGraph(allBlocks, allPages).nodes;
  }, [allBlocks, allPages]);

  const normalizedQuery = query.trim().toLowerCase();

  // Filter and group search results
  const searchGroups = useMemo(() => {
    if (!normalizedQuery) {
      if (lastOpened) {
        return [
          {
            title: 'Last Opened',
            items: [lastOpened]
          }
        ];
      }
      return [];
    }

    const groups: { title: string; items: SearchResultItem[] }[] = [];
    const deletedPageIds = new Set(allPages.filter(p => p.isDeleted).map(p => p.id));

    // 1. Pages Match
    const matchedPages = allPages
      .filter(p => !p.isDeleted && p.title?.toLowerCase().includes(normalizedQuery))
      .map(p => ({
        id: p.id,
        type: 'page' as const,
        title: p.title || 'Untitled Page',
        subtitle: p.id === 'root-doc-node' ? 'Root workspace document' : 'Page',
        icon: p.icon || '📄'
      }));

    if (matchedPages.length > 0) {
      groups.push({ title: 'Pages', items: matchedPages });
    }

    // 2. Blocks Match
    const matchedBlocks = allBlocks
      .filter(b => {
        const pId = b.parentId || 'root-doc-node';
        if (deletedPageIds.has(pId)) return false;
        return (b.type === 'heading' || b.type === 'text') && b.content?.toLowerCase().includes(normalizedQuery);
      })
      .map(b => {
        const pId = b.parentId || 'root-doc-node';
        const parentPage = allPages.find(p => p.id === pId);
        const parentTitle = parentPage?.title || 'Untitled Document';
        return {
          id: b.id,
          type: 'block' as const,
          title: b.content,
          subtitle: `In ${parentTitle}`,
          parentId: pId,
          icon: FileText
        };
      });

    if (matchedBlocks.length > 0) {
      groups.push({ title: 'Blocks / Headings', items: matchedBlocks });
    }

    // 3. Tags & Ghost Pages Match
    const existingPageIds = new Set(allPages.map(p => p.id));
    const matchedTagsAndGhosts = graphNodes
      .filter(node => {
        const matches = node.label.toLowerCase().includes(normalizedQuery);
        if (!matches) return false;
        if (node.type === 'tag') return true;
        // Include ghost page node (has page type but is not in existing pages)
        return node.type === 'page' && !existingPageIds.has(node.id) && node.id !== 'root-doc-node';
      })
      .map(node => ({
        id: node.id,
        type: (node.type === 'tag' ? 'tag' : 'page') as const,
        title: node.rawName || node.label,
        subtitle: node.type === 'tag' ? 'Tag' : 'Ghost Page (not created yet)',
        icon: node.type === 'tag' ? Tag : FileText
      }));

    if (matchedTagsAndGhosts.length > 0) {
      groups.push({ title: 'Tags & Ghost Pages', items: matchedTagsAndGhosts });
    }

    return groups;
  }, [normalizedQuery, allPages, allBlocks, graphNodes, lastOpened]);

  // Flattened results for keyboard arrow index lookup
  const flatItems = useMemo(() => {
    return searchGroups.flatMap(g => g.items);
  }, [searchGroups]);

  const selectedResult = flatItems[selectedIndex];

  // Execution navigation
  const executeSelection = useCallback((item: SearchResultItem) => {
    if (!item) return;

    // Persist to last opened
    try {
      localStorage.setItem('catnoted:last-search-result', JSON.stringify(item));
    } catch (e) {
      // ignore
    }

    if (item.type === 'block') {
      localStorage.setItem('catnoted:pending-scroll-block', item.id);
      onPageSelect(item.parentId || 'root-doc-node');
    } else {
      onPageSelect(item.id);
    }

    onModeChange('doc');
    onClose();
  }, [onPageSelect, onModeChange, onClose]);

  // Handle global and panel keys
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev < flatItems.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : flatItems.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedResult) {
          executeSelection(selectedResult);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, flatItems, selectedIndex, selectedResult, executeSelection, onClose]);

  // Scroll active item into view
  useEffect(() => {
    if (!isOpen || selectedIndex < 0) return;
    const listEl = listRef.current;
    if (!listEl) return;

    const buttons = Array.from(listEl.querySelectorAll<HTMLButtonElement>('[data-search-item]'));
    const target = buttons[selectedIndex];
    if (target) {
      target.scrollIntoView({ block: 'nearest' });
    }
  }, [isOpen, selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-neutral-950/20 px-4 pt-[10vh] backdrop-blur-[2px] dark:bg-neutral-950/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Workspace Search"
        className="flex w-full max-w-[500px] flex-col overflow-hidden rounded-2xl border border-gray-150/60 bg-white shadow-2xl dark:border-zinc-800/80 dark:bg-zinc-900"
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100/50 dark:border-zinc-800/40">
          <Search className="h-4 w-4 shrink-0 text-slate-400 dark:text-zinc-500" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search pages, blocks, tags..."
            className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 dark:text-zinc-100 focus:outline-none focus:ring-0"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setSelectedIndex(0);
                inputRef.current?.focus();
              }}
              className="p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400"
            >
              <X className="h-3 w-3" />
            </button>
          )}
          <kbd className="hidden rounded bg-slate-50 dark:bg-zinc-800/60 px-1.5 py-0.5 font-sans text-[10px] border border-slate-200/60 dark:border-zinc-800 text-slate-400 dark:text-zinc-500 sm:block">
            ESC
          </kbd>
        </div>

        {/* Results Container */}
        <div
          id={`${paletteId}-list`}
          ref={listRef}
          role="listbox"
          tabIndex={-1}
          className="flex max-h-[350px] flex-1 flex-col overflow-y-auto px-2 py-2"
        >
          {flatItems.length === 0 && (
            <div className="px-3 py-12 text-center text-xs text-slate-400 dark:text-zinc-500 flex flex-col items-center gap-1.5">
              <Search className="h-6 w-6 text-slate-300 dark:text-zinc-700" />
              <span>{query ? 'No matching search results' : 'Search workspace across all notes'}</span>
            </div>
          )}

          {searchGroups.map((group) => (
            <div key={group.title} className="mb-2 last:mb-0">
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                {group.title}
              </div>
              <div className="mt-1 space-y-0.5">
                {group.items.map((item) => {
                  const idx = flatItems.indexOf(item);
                  const isSelected = selectedIndex === idx;
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.id}
                      role="option"
                      aria-selected={isSelected}
                      data-search-item
                      onClick={() => executeSelection(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-all duration-75 ${
                        isSelected
                          ? 'bg-slate-100 text-slate-900 dark:bg-zinc-800 dark:text-zinc-100'
                          : 'text-slate-600 hover:bg-slate-50/80 dark:text-zinc-300 dark:hover:bg-zinc-800/50'
                      }`}
                    >
                      <span className="shrink-0">
                        {typeof Icon === 'string' ? (
                          <span className="w-4 h-4 flex items-center justify-center text-xs">{renderPageIcon(Icon)}</span>
                        ) : (
                          <Icon className={`h-4 w-4 shrink-0 ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-zinc-500'}`} />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-semibold text-slate-700 dark:text-zinc-200">
                          {item.title || 'Untitled'}
                        </div>
                        {item.subtitle && (
                          <div className="truncate text-[10px] text-slate-400 dark:text-zinc-500">
                            {item.subtitle}
                          </div>
                        )}
                      </div>
                      {isSelected && (
                        <CornerDownLeft className="h-3 w-3 shrink-0 text-slate-400 dark:text-zinc-500" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Shortcut Footer */}
        <div className="flex items-center justify-between border-t border-slate-100/80 dark:border-zinc-800/60 px-4 py-2 text-[10px] text-slate-400/80 dark:text-zinc-500">
          <div className="flex items-center gap-1.5">
            <kbd className="rounded bg-slate-50 dark:bg-zinc-800/50 px-1 py-0.5 font-sans text-[10px] border border-slate-200/60 dark:border-zinc-800 text-slate-500 dark:text-zinc-400">↑↓</kbd>
            <span>Navigate</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="rounded bg-slate-50 dark:bg-zinc-800/50 px-1 py-0.5 font-sans text-[10px] border border-slate-200/60 dark:border-zinc-800 text-slate-500 dark:text-zinc-400">Enter</kbd>
            <span>Open note</span>
          </div>
        </div>
      </div>
    </div>
  );
};
