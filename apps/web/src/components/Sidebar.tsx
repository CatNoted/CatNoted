import React, { useMemo, useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  FileText,
  FolderOpen,
  Star,
  FolderTree,
  Tag,
  LayoutGrid,
  CircleHelp,
  Download,
  FileSpreadsheet,
  Trash2,
  Plus,
  Network,
  MoreHorizontal,
  Search,
  Calendar,
  Settings,
} from 'lucide-react';
import { useDocumentStore } from '@catnoted/editor';
import { ActiveMode } from '../layouts/AppLayout';

interface SidebarProps {
  onModeChange: (mode: ActiveMode) => void;
  activeMode?: ActiveMode;
}

export const Sidebar: React.FC<SidebarProps> = ({ onModeChange, activeMode = 'doc' }) => {
  const { pages, deletePage } = useDocumentStore();

  const favoritePages = useMemo(
    () => (pages || []).filter((p: any) => p?.isFavorite),
    [pages]
  );

  const [favoritesCollapsed, setFavoritesCollapsed] = useState(false);
  const [organizeCollapsed, setOrganizeCollapsed] = useState(false);
  const [tagsCollapsed, setTagsCollapsed] = useState(false);
  const [collectionsCollapsed, setCollectionsCollapsed] = useState(false);
  const [othersCollapsed, setOthersCollapsed] = useState(true);

  const sectionClassName =
    'px-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500';

  const itemClassName =
    'flex items-center w-full px-3 py-2 text-[13px] leading-5 text-slate-700 dark:text-zinc-300 rounded-lg transition-all select-none gap-x-2.5 hover:bg-slate-100 dark:hover:bg-zinc-850 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 font-medium';

  const getItemIconClass = (active: boolean) =>
    `shrink-0 ${active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-zinc-500'}`;

  const renderSection = (
    label: string,
    collapsed: boolean,
    setCollapsed: (_: boolean) => void,
    icon: React.ElementType,
    children: React.ReactNode
  ) => {
    const Icon = collapsed ? ChevronRight : ChevronDown;
    const SectionIcon = icon;
    return (
      <div className="mb-2">
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className={`${sectionClassName} flex items-center justify-between w-full px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-850 transition-all gap-x-2 group`}
          aria-label={collapsed ? `Expand ${label}` : `Collapse ${label}`}
          aria-expanded={!collapsed}
        >
          <span className="flex items-center gap-x-2">
            {SectionIcon && <SectionIcon className="w-3.5 h-3.5 shrink-0 text-slate-400 dark:text-zinc-500" />}
            <span>{label}</span>
          </span>
          <Icon className="w-3.5 h-3.5 shrink-0 text-slate-400 dark:text-zinc-500 opacity-60 group-hover:opacity-100 transition-opacity" />
        </button>
        {!collapsed && <div className="mt-1 space-y-0.5 px-1">{children}</div>}
      </div>
    );
  };

  return (
    <div className="w-64 border-r border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 h-full flex flex-col shrink-0 text-token select-none">
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-2.5 px-1.5 py-1">
          <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
            CN
          </div>
          <span className="font-semibold text-[14px] text-slate-800 dark:text-zinc-200 tracking-tight">
            CatNoted Workspace
          </span>
        </div>
      </div>

      <div className="px-3 py-1.5 space-y-0.5">
        <button
          type="button"
          onClick={() => onModeChange('doc')}
          className={`${itemClassName} ${activeMode === 'doc' ? 'bg-slate-100 dark:bg-zinc-800/80 text-slate-900 dark:text-white font-semibold' : ''}`}
        >
          <FileText className={`${getItemIconClass(activeMode === 'doc')} w-4 h-4`} />
          <span className="truncate">Doc Mode</span>
        </button>
        <button
          type="button"
          onClick={() => onModeChange('canvas')}
          className={`${itemClassName} ${activeMode === 'canvas' ? 'bg-slate-100 dark:bg-zinc-800/80 text-slate-900 dark:text-white font-semibold' : ''}`}
        >
          <LayoutGrid className={`${getItemIconClass(activeMode === 'canvas')} w-4 h-4`} />
          <span className="truncate">Canvas</span>
        </button>
        <button
          type="button"
          onClick={() => onModeChange('graph')}
          className={`${itemClassName} ${activeMode === 'graph' ? 'bg-slate-100 dark:bg-zinc-800/80 text-slate-900 dark:text-white font-semibold' : ''}`}
        >
          <Network className={`${getItemIconClass(activeMode === 'graph')} w-4 h-4`} />
          <span className="truncate">Graph</span>
        </button>
        <button
          type="button"
          onClick={() => onModeChange('journals')}
          className={`${itemClassName} ${activeMode === 'journals' ? 'bg-slate-100 dark:bg-zinc-800/80 text-slate-900 dark:text-white font-semibold' : ''}`}
        >
          <Calendar className={`${getItemIconClass(activeMode === 'journals')} w-4 h-4`} />
          <span className="truncate">Journals</span>
        </button>
        <button
          type="button"
          onClick={() => onModeChange('search')}
          className={`${itemClassName} ${activeMode === 'search' ? 'bg-slate-100 dark:bg-zinc-800/80 text-slate-900 dark:text-white font-semibold' : ''}`}
        >
          <Search className={`${getItemIconClass(activeMode === 'search')} w-4 h-4`} />
          <span className="truncate">Search</span>
        </button>
        <button
          type="button"
          onClick={() => onModeChange('settings')}
          className={`${itemClassName} ${activeMode === 'settings' ? 'bg-slate-100 dark:bg-zinc-800/80 text-slate-900 dark:text-white font-semibold' : ''}`}
        >
          <Settings className={`${getItemIconClass(activeMode === 'settings')} w-4 h-4`} />
          <span className="truncate">Settings</span>
        </button>
      </div>

      <div className="px-4 my-2">
        <hr className="border-slate-200 dark:border-zinc-800" />
      </div>

      <div className="flex-1 overflow-y-auto py-2 space-y-2 px-1">
        {renderSection('Favorites', favoritesCollapsed, setFavoritesCollapsed, Star, (
          <>
            {favoritePages.length > 0 ? (
              favoritePages.map(node => (
                <div
                  key={node.id}
                  onClick={() => onModeChange('doc')}
                  className={`${itemClassName} group/sidebar-row flex items-center justify-between pr-2 cursor-pointer`}
                >
                  <div className="flex items-center min-w-0 flex-1 gap-x-2.5">
                    <span className="w-4 h-4 shrink-0 flex items-center justify-center text-xs">
                      {node.icon || '📄'}
                    </span>
                    <span className="truncate">{node.title || 'Untitled'}</span>
                  </div>
                  {/* Hover Actions */}
                  <div className="opacity-0 group-hover/sidebar-row:opacity-100 flex items-center gap-1 transition-opacity shrink-0">
                    {node.id !== 'root-doc-node' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete page "${node.title || 'Untitled'}"?`)) {
                            deletePage(node.id);
                          }
                        }}
                        className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors"
                        aria-label="Delete page"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        alert('More options');
                      }}
                      className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors"
                      aria-label="More options"
                    >
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => onModeChange('doc')}
                  className={itemClassName}
                >
                  <FileText className={`${getItemIconClass(false)} w-4 h-4`} />
                  <span className="truncate">Getting Started</span>
                </button>
                <button
                  type="button"
                  onClick={() => onModeChange('doc')}
                  className={itemClassName}
                >
                  <FileText className={`${getItemIconClass(false)} w-4 h-4`} />
                  <span className="truncate">Architecture Specs</span>
                </button>
              </>
            )}
          </>
        ))}

        {renderSection('Organize', organizeCollapsed, setOrganizeCollapsed, FolderTree, (
          <>
            {pages && pages.length > 0 ? (
              pages.map(node => (
                <div
                  key={node.id}
                  onClick={() => onModeChange('doc')}
                  className={`${itemClassName} group/sidebar-row flex items-center justify-between pr-2 cursor-pointer`}
                >
                  <div className="flex items-center min-w-0 flex-1 gap-x-2.5">
                    <span className="w-4 h-4 shrink-0 flex items-center justify-center text-xs">
                      {node.icon || '📄'}
                    </span>
                    <span className="truncate">{node.title || 'Untitled'}</span>
                  </div>
                  {/* Hover Actions */}
                  <div className="opacity-0 group-hover/sidebar-row:opacity-100 flex items-center gap-1 transition-opacity shrink-0">
                    {node.id !== 'root-doc-node' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete page "${node.title || 'Untitled'}"?`)) {
                            deletePage(node.id);
                          }
                        }}
                        className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors"
                        aria-label="Delete page"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        alert('More options');
                      }}
                      className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors"
                      aria-label="More options"
                    >
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => onModeChange('doc')}
                  className={itemClassName}
                >
                  <FolderOpen className={`${getItemIconClass(false)} w-4 h-4`} />
                  <span className="truncate">Folders</span>
                </button>
                <button
                  type="button"
                  onClick={() => onModeChange('doc')}
                  className={`${itemClassName} pl-6`}
                >
                  <FileText className={`${getItemIconClass(false)} w-4 h-4`} />
                  <span className="truncate">Getting Started</span>
                </button>
                <button
                  type="button"
                  onClick={() => onModeChange('doc')}
                  className={`${itemClassName} pl-6`}
                >
                  <FileText className={`${getItemIconClass(false)} w-4 h-4`} />
                  <span className="truncate">Architecture Specs</span>
                </button>
              </>
            )}
          </>
        ))}

        {renderSection('Tags', tagsCollapsed, setTagsCollapsed, Tag, (
          <div className="flex flex-wrap gap-1.5 p-2">
            <button type="button" onClick={() => onModeChange('doc')} className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors">
              <Tag className="w-3 h-3 text-amber-500" />
              <span>product</span>
            </button>
            <button type="button" onClick={() => onModeChange('doc')} className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors">
              <Tag className="w-3 h-3 text-amber-500" />
              <span>engineering</span>
            </button>
          </div>
        ))}

        {renderSection('Collections', collectionsCollapsed, setCollectionsCollapsed, LayoutGrid, (
          <>
            <button type="button" onClick={() => onModeChange('doc')} className={itemClassName}>
              <LayoutGrid className={`${getItemIconClass(false)} w-4 h-4 text-indigo-500`} />
              <span className="truncate">Design Review</span>
            </button>
            <button type="button" onClick={() => onModeChange('doc')} className={itemClassName}>
              <LayoutGrid className={`${getItemIconClass(false)} w-4 h-4 text-emerald-500`} />
              <span className="truncate">Weekly Sync</span>
            </button>
          </>
        ))}

        {renderSection('Others', othersCollapsed, setOthersCollapsed, CircleHelp, (
          <>
            <button type="button" onClick={() => onModeChange('doc')} className={itemClassName}>
              <CircleHelp className={`${getItemIconClass(false)} w-4 h-4`} />
              <span className="truncate">Read Only Docs</span>
            </button>
            <button type="button" onClick={() => onModeChange('doc')} className={itemClassName}>
              <FolderOpen className={`${getItemIconClass(false)} w-4 h-4`} />
              <span className="truncate">Shared Room</span>
            </button>
          </>
        ))}
      </div>

      <div className="border-t border-slate-200 dark:border-zinc-800 p-3 space-y-1">
        <button
          type="button"
          onClick={() => onModeChange('doc')}
          className={`${itemClassName} text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30`}
          title="New page"
        >
          <Plus className="w-4 h-4" />
          <span className="truncate">New Page</span>
        </button>

        <button
          type="button"
          onClick={() => onModeChange('doc')}
          className={itemClassName}
          title="Import"
        >
          <Download className="w-4 h-4 text-slate-400 dark:text-zinc-500" />
          <span className="truncate">Import</span>
        </button>

        <button
          type="button"
          onClick={() => onModeChange('doc')}
          className={itemClassName}
          title="Template"
        >
          <FileSpreadsheet className="w-4 h-4 text-slate-400 dark:text-zinc-500" />
          <span className="truncate">Template</span>
        </button>

        <button
          type="button"
          onClick={() => onModeChange('doc')}
          className={itemClassName}
          title="Trash"
        >
          <Trash2 className="w-4 h-4 text-red-500/80 dark:text-red-400/80" />
          <span className="truncate text-red-600 dark:text-red-400">Trash</span>
        </button>

        <button
          type="button"
          onClick={() => onModeChange('doc')}
          className={itemClassName}
          title="Learn more"
        >
          <CircleHelp className="w-4 h-4 text-slate-400 dark:text-zinc-500" />
          <span className="truncate">Learn more</span>
        </button>
      </div>
    </div>
  );
};
