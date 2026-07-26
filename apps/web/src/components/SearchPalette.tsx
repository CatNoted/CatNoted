import React, { useState, useEffect, useRef, useMemo, useCallback, useId } from 'react';
import {
  Search,
  FileText,
  Tag,
  Clock,
  CornerDownLeft,
  X
} from 'lucide-react';
import { yblocks, ypages } from '@catnoted/editor';
import { parseDocumentGraph } from '@catnoted/graph';
import { BlockNode, PageMeta } from '@catnoted/shared';

interface SearchPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectResult: (result: { id: string; type: string; title: string; parentId?: string }) => void;
  isDarkMode?: boolean;
}

interface SearchResultItem {
  id: string;
  type: 'page' | 'block' | 'tag' | 'ghost-page';
  title: string;
  subtitle: string;
  parentId?: string; // used for blocks
}

export const SearchPalette: React.FC<SearchPaletteProps> = ({
  isOpen,
  onClose,
  onSelectResult,
  isDarkMode
}) => {
  // Use isDarkMode to satisfy TypeScript's unused locals check
  if (isDarkMode === undefined) {
    // no-op, just read it
  }
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const paletteId = useId();

  // Reactive state for Yjs documents
  const [allBlocks, setAllBlocks] = useState<BlockNode[]>([]);
  const [allPages, setAllPages] = useState<PageMeta[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    const updateStore = () => {
      setAllBlocks(yblocks.toArray());
      setAllPages(ypages.toJSON() ? Object.values(ypages.toJSON() as Record<string, PageMeta>) : []);
    };

    updateStore();
    yblocks.observe(updateStore);
    ypages.observe(updateStore);

    return () => {
      yblocks.unobserve(updateStore);
      ypages.unobserve(updateStore);
    };
  }, [isOpen]);

  // Load last opened result if any
  const lastOpenedResult = useMemo<SearchResultItem | null>(() => {
    try {
      const stored = localStorage.getItem('catnoted:last-search-result');
      if (stored) {
        return JSON.parse(stored) as SearchResultItem;
      }
    } catch (e) {
      console.warn('Failed to parse last opened search result', e);
    }
    return null;
  }, [isOpen]);

  const normalizedSearch = search.trim().toLowerCase();

  // Search filtering & grouping
  const groupedResults = useMemo(() => {
    const pagesList: SearchResultItem[] = [];
    const blocksList: SearchResultItem[] = [];
    const tagsList: SearchResultItem[] = [];

    if (!normalizedSearch) {
      return { pages: [], blocks: [], tags: [] };
    }

    // 1. Pages Search
    allPages.forEach((page) => {
      if (page.title && page.title.toLowerCase().includes(normalizedSearch)) {
        pagesList.push({
          id: page.id,
          type: 'page',
          title: page.title,
          subtitle: page.id === 'root-doc-node' ? 'Root Space Note' : 'Workspace Document',
        });
      }
    });

    // 2. Blocks Search
    const textBlockTypes = ['text', 'heading', 'bullet', 'ordered', 'todo', 'quote', 'callout', 'code'];
    allBlocks.forEach((block) => {
      if (
        block.content &&
        textBlockTypes.includes(block.type) &&
        block.content.toLowerCase().includes(normalizedSearch)
      ) {
        // Find parent page title
        const parentId = block.parentId || 'root-doc-node';
        const parentPage = allPages.find((p) => p.id === parentId);
        let parentTitle = parentPage?.title;

        if (!parentTitle) {
          if (parentId === 'root-doc-node') {
            const rootHeading = allBlocks.find(
              (b) => b.type === 'heading' && b.properties?.level === 1 && (!b.parentId || b.parentId === 'root-doc-node')
            );
            parentTitle = rootHeading?.content || 'Root Note';
          } else {
            const rawName = parentId.startsWith('page-') ? parentId.slice(5) : parentId;
            parentTitle = rawName
              .split('-')
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(' ');
          }
        }

        blocksList.push({
          id: block.id,
          type: 'block',
          title: block.content,
          subtitle: `In Page: ${parentTitle}`,
          parentId,
        });
      }
    });

    // 3. Graph Nodes (Tags & Ghost Pages)
    const graphData = parseDocumentGraph(allBlocks, allPages);
    graphData.nodes.forEach((node) => {
      if (node.id === 'root-doc-node') return;

      const nodeLabelClean = node.label.replace(/[📄#]/g, '').trim();
      if (nodeLabelClean.toLowerCase().includes(normalizedSearch)) {
        if (node.type === 'tag') {
          // Check if already present to avoid duplicates
          if (!tagsList.some((t) => t.id === node.id)) {
            tagsList.push({
              id: node.id,
              type: 'tag',
              title: `#${node.rawName || nodeLabelClean}`,
              subtitle: 'Workspace Tag Node',
            });
          }
        } else if (node.type === 'page') {
          // If this is a ghost page (referenced in a wikilink but doesn't exist as an actual ypage yet!)
          const existsAsRealPage = allPages.some((p) => p.id === node.id);
          if (!existsAsRealPage && !pagesList.some((p) => p.id === node.id)) {
            pagesList.push({
              id: node.id,
              type: 'ghost-page',
              title: node.rawName || nodeLabelClean,
              subtitle: 'Uncreated Wiki-Link Page (will auto-create on visit)',
            });
          }
        }
      }
    });

    return {
      pages: pagesList,
      blocks: blocksList,
      tags: tagsList,
    };
  }, [allBlocks, allPages, normalizedSearch]);

  const visibleGroups = useMemo(() => {
    const groups: { key: string; items: SearchResultItem[] }[] = [];

    // If search is empty, we show the last opened result as a quick access group
    if (!normalizedSearch) {
      if (lastOpenedResult) {
        groups.push({
          key: 'Last Opened',
          items: [lastOpenedResult],
        });
      }
      return groups;
    }

    if (groupedResults.pages.length) {
      groups.push({ key: 'Pages & Documents', items: groupedResults.pages });
    }
    if (groupedResults.blocks.length) {
      groups.push({ key: 'Matching Blocks Content', items: groupedResults.blocks });
    }
    if (groupedResults.tags.length) {
      groups.push({ key: 'Tags & Graph Connections', items: groupedResults.tags });
    }

    return groups;
  }, [groupedResults, normalizedSearch, lastOpenedResult]);

  const flatItems = useMemo(
    () => visibleGroups.flatMap((group) => group.items),
    [visibleGroups]
  );

  const selectedItem = flatItems[selectedIndex];

  useEffect(() => {
    if (!isOpen) return;
    setSearch('');
    setSelectedIndex(0);
    const focusTimer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(focusTimer);
  }, [isOpen]);

  const selectCurrent = useCallback(() => {
    if (selectedItem) {
      onSelectResult(selectedItem);
      onClose();
    }
  }, [selectedItem, onClose, onSelectResult]);

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
      listEl.querySelectorAll<HTMLButtonElement>('[data-search-item]')
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
      className="fixed inset-0 z-[100] flex items-start justify-center bg-neutral-950/20 px-4 pt-[10vh] backdrop-blur-[2px] dark:bg-neutral-950/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search Workspace"
        className="flex w-full max-w-[500px] flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-2xl dark:border-gray-800/80 dark:bg-[#18181c]"
      >
        {/* Search Input Area */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100/50 dark:border-gray-800/40">
          <Search className="h-4.5 w-4.5 shrink-0 text-gray-400 dark:text-gray-500" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search pages, blocks, and tags..."
            className="w-full bg-transparent text-[14px] text-gray-800 outline-none placeholder:text-gray-400 dark:text-gray-200"
          />
          <button
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/60"
            aria-label="Close search"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results / Empty States List */}
        <div
          id={`${paletteId}-list`}
          ref={listRef}
          role="listbox"
          aria-activedescendant={
            selectedItem
              ? `${paletteId}-item-${selectedItem.id}`
              : undefined
          }
          tabIndex={-1}
          className="flex max-h-[min(360px,60vh)] flex-1 flex-col overflow-y-auto px-2 py-2"
        >
          {visibleGroups.length === 0 && !search && (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center select-none">
              <div className="mb-3 rounded-full bg-slate-50 dark:bg-zinc-800/50 p-3">
                <Search className="h-5 w-5 text-slate-400 dark:text-zinc-500" />
              </div>
              <p className="text-[13px] font-semibold text-slate-700 dark:text-zinc-300">
                Search CatNoted Workspace
              </p>
              <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1 max-w-[280px]">
                Type to instantly search through your pages, block content, and graph connections.
              </p>
            </div>
          )}

          {visibleGroups.length === 0 && search && (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center select-none">
              <p className="text-[13px] font-semibold text-slate-600 dark:text-zinc-400">
                No results found for "{search}"
              </p>
              <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">
                Try searching with different terms or tags.
              </p>
            </div>
          )}

          {visibleGroups.map((group) => (
            <div key={group.key} className="mb-2 last:mb-0">
              <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                {group.key}
              </div>
              {group.items.map((item) => {
                const idx = flatItems.indexOf(item);
                const isSelected = selectedIndex === idx;

                return (
                  <button
                    key={`${item.id}-${item.type}`}
                    id={`${paletteId}-item-${item.id}`}
                    role="option"
                    aria-selected={isSelected}
                    data-search-item
                    onClick={() => {
                      onSelectResult(item);
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={[
                      'group flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-75',
                      isSelected
                        ? 'bg-gray-100 text-gray-900 dark:bg-zinc-800/60 dark:text-gray-100'
                        : 'text-gray-600 hover:bg-gray-50/80 dark:text-gray-300 dark:hover:bg-zinc-800/20'
                    ].join(' ')}
                  >
                    {item.type === 'tag' ? (
                      <Tag className="h-4 w-4 mt-0.5 shrink-0 text-amber-500" />
                    ) : item.type === 'page' || item.type === 'ghost-page' ? (
                      <FileText className={`h-4 w-4 mt-0.5 shrink-0 ${item.type === 'ghost-page' ? 'text-gray-400/60' : 'text-indigo-500'}`} />
                    ) : item.type === 'block' ? (
                      <FileText className="h-4 w-4 mt-0.5 shrink-0 text-slate-400" />
                    ) : (
                      <Clock className="h-4 w-4 mt-0.5 shrink-0 text-indigo-500" />
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-medium leading-normal">
                        {item.title}
                      </div>
                      <div className="truncate text-[10.5px] text-gray-400 dark:text-gray-500 mt-0.5">
                        {item.subtitle}
                      </div>
                    </div>

                    {isSelected && (
                      <span className="ml-auto flex items-center shrink-0">
                        <CornerDownLeft className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Keyboard Navigation Footer Guide */}
        <div className="flex items-center justify-between border-t border-gray-100/80 dark:border-gray-800/60 px-4 py-2 text-[10px] text-gray-400/80 dark:text-gray-500">
          <div className="flex items-center gap-1.5">
            <kbd className="rounded bg-gray-50 dark:bg-zinc-800 px-1 py-0.5 font-sans text-[10px] font-medium border border-gray-200/60 dark:border-zinc-700 text-gray-500 dark:text-gray-400 shadow-sm">↑</kbd>
            <kbd className="rounded bg-gray-50 dark:bg-zinc-800 px-1 py-0.5 font-sans text-[10px] font-medium border border-gray-200/60 dark:border-zinc-700 text-gray-500 dark:text-gray-400 shadow-sm">↓</kbd>
            <span>Navigate</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="rounded bg-gray-50 dark:bg-zinc-800 px-1 py-0.5 font-sans text-[10px] font-medium border border-gray-200/60 dark:border-zinc-700 text-gray-500 dark:text-gray-400 shadow-sm">Enter</kbd>
            <span>Confirm</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="rounded bg-gray-50 dark:bg-zinc-800 px-1 py-0.5 font-sans text-[10px] font-medium border border-gray-200/60 dark:border-zinc-700 text-gray-500 dark:text-gray-400 shadow-sm">Esc</kbd>
            <span>Close</span>
          </div>
        </div>
      </div>
    </div>
  );
};
