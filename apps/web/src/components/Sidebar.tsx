/**
 * z-index layering reference:
 * - Modals & Overlays (e.g. AuthModal, SettingsModal, CommandPalette): z-[100]
 * - Floating UI & Rails (e.g. Left/Right rails, Floating Space Agent Panel, FAB): z-20 to z-40
 * - Workspace / Editor Content (e.g. Doc Editor, Canvas elements): z-0 to z-10
 */

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
    'px-2.5 text-[11px] font-semibold uppercase tracking-wider text-ink-muted';

  const itemClassName =
    'flex items-center w-full px-3 py-2 text-[13px] leading-5 text-ink rounded-lg transition-all select-none gap-x-2.5 hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent font-medium';

  const getItemIconClass = (active: boolean) =>
    `shrink-0 ${active ? 'text-accent' : 'text-ink-muted'}`;

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
          className={`${sectionClassName} flex items-center justify-between w-full px-3 py-1.5 rounded-lg hover:bg-surface-hover transition-all gap-x-2 group`}
          aria-label={collapsed ? `Expand ${label}` : `Collapse ${label}`}
          aria-expanded={!collapsed}
        >
          <span className="flex items-center gap-x-2">
            {SectionIcon && <SectionIcon className="w-3.5 h-3.5 shrink-0 text-ink-muted" />}
            <span>{label}</span>
          </span>
          <Icon className="w-3.5 h-3.5 shrink-0 text-ink-muted opacity-60 group-hover:opacity-100 transition-opacity" />
        </button>
        {!collapsed && <div className="mt-1 space-y-0.5 px-1">{children}</div>}
      </div>
    );
  };

  return (
    <div className="w-64 border-r border-soft bg-surface h-full flex flex-col shrink-0 text-ink select-none">
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-2.5 px-1.5 py-1">
          <div className="w-6 h-6 rounded-lg bg-accent flex items-center justify-center text-white font-bold text-xs shadow-sm">
            CN
          </div>
          <span className="font-semibold text-[14px] text-slate-800 dark:text-zinc-200 tracking-tight truncate min-w-0" title="CatNoted Workspace">
            CatNoted Workspace
          </span>
        </div>
      </div>

      <div className="px-3 py-1.5 space-y-0.5">
        <button
          type="button"
          onClick={() => onModeChange('doc')}
          className={`${itemClassName} ${activeMode === 'doc' ? 'bg-accent-soft text-accent font-semibold' : ''}`}
        >
          <FileText className={`${getItemIconClass(activeMode === 'doc')} w-4 h-4`} />
          <span className="truncate">Doc Mode</span>
        </button>
        <button
          type="button"
          onClick={() => onModeChange('canvas')}
          className={`${itemClassName} ${activeMode === 'canvas' ? 'bg-accent-soft text-accent font-semibold' : ''}`}
        >
          <LayoutGrid className={`${getItemIconClass(activeMode === 'canvas')} w-4 h-4`} />
          <span className="truncate">Canvas</span>
        </button>
        <button
          type="button"
          onClick={() => onModeChange('graph')}
          className={`${itemClassName} ${activeMode === 'graph' ? 'bg-accent-soft text-accent font-semibold' : ''}`}
        >
          <Network className={`${getItemIconClass(activeMode === 'graph')} w-4 h-4`} />
          <span className="truncate">Graph</span>
        </button>
        <button
          type="button"
          onClick={() => onModeChange('journals')}
          className={`${itemClassName} ${activeMode === 'journals' ? 'bg-accent-soft text-accent font-semibold' : ''}`}
        >
          <Calendar className={`${getItemIconClass(activeMode === 'journals')} w-4 h-4`} />
          <span className="truncate">Journals</span>
        </button>
        <button
          type="button"
          onClick={() => onModeChange('settings')}
          className={`${itemClassName} ${activeMode === 'settings' ? 'bg-accent-soft text-accent font-semibold' : ''}`}
        >
          <Settings className={`${getItemIconClass(activeMode === 'settings')} w-4 h-4`} />
          <span className="truncate">Settings</span>
        </button>
      </div>

      <div className="px-4 my-2">
        <hr className="border-soft" />
      </div>

      <div className="flex-1 overflow-y-auto py-2 space-y-2 px-1">
        {renderSection('Favorites', favoritesCollapsed, setFavoritesCollapsed, Star, (
          <>
            {favoritePages.length > 0 ? (
              favoritePages.map(node => (
                <div
                  key={node.id}
                  onClick={() => onModeChange('doc')}
                  title={node.title || 'Untitled'}
                  className={`${itemClassName} group/sidebar-row flex items-center justify-between pr-2 cursor-pointer`}
                >
                  <div className="flex items-center min-w-0 flex-1 gap-x-2.5">
                    <span className="w-4 h-4 shrink-0 flex items-center justify-center text-xs">
                      {node.icon || '📄'}
                    </span>
                    <span className="truncate min-w-0">{node.title || 'Untitled'}</span>
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
                        className="p-1 rounded text-ink-muted hover:text-danger hover:bg-danger-soft transition-colors"
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
                      className="p-1 rounded text-ink-muted hover:text-ink hover:bg-surface-hover transition-colors"
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
                  title={node.title || 'Untitled'}
                  className={`${itemClassName} group/sidebar-row flex items-center justify-between pr-2 cursor-pointer`}
                >
                  <div className="flex items-center min-w-0 flex-1 gap-x-2.5">
                    <span className="w-4 h-4 shrink-0 flex items-center justify-center text-xs">
                      {node.icon || '📄'}
                    </span>
                    <span className="truncate min-w-0">{node.title || 'Untitled'}</span>
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
                        className="p-1 rounded text-ink-muted hover:text-danger hover:bg-danger-soft transition-colors"
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
                      className="p-1 rounded text-ink-muted hover:text-ink hover:bg-surface-hover transition-colors"
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
            <button type="button" onClick={() => onModeChange('doc')} className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-surface-hover text-ink hover:bg-surface dark:hover:bg-surface-hover transition-colors">
              <Tag className="w-3 h-3 text-warning" />
              <span>product</span>
            </button>
            <button type="button" onClick={() => onModeChange('doc')} className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-surface-hover text-ink hover:bg-surface dark:hover:bg-surface-hover transition-colors">
              <Tag className="w-3 h-3 text-warning" />
              <span>engineering</span>
            </button>
          </div>
        ))}

        {renderSection('Collections', collectionsCollapsed, setCollectionsCollapsed, LayoutGrid, (
          <>
            <button type="button" onClick={() => onModeChange('doc')} className={itemClassName}>
              <LayoutGrid className={`${getItemIconClass(false)} w-4 h-4 text-accent`} />
              <span className="truncate">Design Review</span>
            </button>
            <button type="button" onClick={() => onModeChange('doc')} className={itemClassName}>
              <LayoutGrid className={`${getItemIconClass(false)} w-4 h-4 text-success`} />
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

      <div className="border-t border-soft dark:border-soft p-3 space-y-1">
        <button
          type="button"
          onClick={() => onModeChange('doc')}
          className={`${itemClassName} text-accent hover:bg-accent-soft`}
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
          <Download className="w-4 h-4 text-ink-muted" />
          <span className="truncate">Import</span>
        </button>

        <button
          type="button"
          onClick={() => onModeChange('doc')}
          className={itemClassName}
          title="Template"
        >
          <FileSpreadsheet className="w-4 h-4 text-ink-muted" />
          <span className="truncate">Template</span>
        </button>

        <button
          type="button"
          onClick={() => onModeChange('doc')}
          className={itemClassName}
          title="Trash"
        >
          <Trash2 className="w-4 h-4 text-danger" />
          <span className="truncate text-danger">Trash</span>
        </button>

        <button
          type="button"
          onClick={() => onModeChange('doc')}
          className={itemClassName}
          title="Learn more"
        >
          <CircleHelp className="w-4 h-4 text-ink-muted" />
          <span className="truncate">Learn more</span>
        </button>
      </div>
    </div>
  );
};
