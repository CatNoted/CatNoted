import React, { useMemo, useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  FileText,
  Clock,
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
} from 'lucide-react';
import { useDocumentStore } from '@catnoted/editor';
import { ActiveMode } from '../layouts/AppLayout';

interface SidebarProps {
  onModeChange: (mode: ActiveMode) => void;
}

type SidebarAction = {
  label: string;
  icon: React.ElementType;
  mode: ActiveMode;
  variant?: 'ghost' | 'danger';
};

const DEFAULT_ACTIONS: SidebarAction[] = [
  { label: 'Import', icon: Download, mode: 'doc' },
  { label: 'Template', icon: FileSpreadsheet, mode: 'doc' },
  { label: 'Trash', icon: Trash2, mode: 'doc', variant: 'danger' },
];

export const Sidebar: React.FC<SidebarProps> = ({ onModeChange }) => {
  const { blocks } = useDocumentStore();

  const docTitles = useMemo(
    () =>
      blocks
        .filter(b => b.type === 'heading' || b.type === 'text')
        .map(b => (typeof b.content === 'string' ? b.content : ''))
        .map(title => (title.trim() ? title : 'Untitled Document'))
        .slice(0, 5),
    [blocks]
  );

  const [recentCollapsed, setRecentCollapsed] = useState(false);
  const [favoritesCollapsed, setFavoritesCollapsed] = useState(false);
  const [treeCollapsed, setTreeCollapsed] = useState(false);
  const [othersCollapsed, setOthersCollapsed] = useState(true);

  const sectionClassName =
    'px-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-400';

  const itemClassName =
    'flex items-center w-full px-2 py-1.5 text-[13px] leading-5 text-slate-700 dark:text-zinc-300 rounded-md transition-colors select-none gap-x-2 hover:bg-slate-200/70 dark:hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500';

  const getItemIconClass = (active: boolean) =>
    `shrink-0 ${active ? 'text-indigo-500 dark:text-indigo-400' : 'text-slate-400 dark:text-zinc-500'}`;

  const actionClassName = (variant?: 'ghost' | 'danger') =>
    `inline-flex items-center justify-center gap-x-2 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors ${
      variant === 'danger'
        ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40'
        : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-200/70 dark:hover:bg-zinc-800'
    }`;

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
      <div className="mb-1">
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className={`${sectionClassName} flex items-center w-full px-2 py-1.5 rounded-md hover:bg-slate-200/70 dark:hover:bg-zinc-800 transition-colors gap-x-2`}
        >
          <Icon className="w-3.5 h-3.5 shrink-0" />
          {SectionIcon && <SectionIcon className="w-3.5 h-3.5 shrink-0" />}
          <span className="truncate">{label}</span>
        </button>
        {!collapsed && <div className="mt-0.5 space-y-0.5">{children}</div>}
      </div>
    );
  };

  return (
    <div className="w-64 border-r border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 h-full flex flex-col shrink-0 text-token">
      <div className="px-3 py-2.5 border-b border-slate-200 dark:border-zinc-800">
        <h2 className="text-[13px] font-semibold text-slate-800 dark:text-zinc-200 tracking-tight">
          Workspace
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto py-2 space-y-2">
        {renderSection('Favorites', favoritesCollapsed, setFavoritesCollapsed, Star, (
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
        ))}

        {renderSection('Recent', recentCollapsed, setRecentCollapsed, Clock, (
          <>
            {docTitles.length > 0 ? (
              docTitles.map((title, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onModeChange('doc')}
                  className={itemClassName}
                >
                  <FileText className={`${getItemIconClass(false)} w-4 h-4`} />
                  <span className="truncate">{title}</span>
                </button>
              ))
            ) : (
              <div className="px-2 py-1.5 text-[12px] text-slate-400 dark:text-zinc-500">
                No recent docs
              </div>
            )}
          </>
        ))}

        {renderSection('Organize', treeCollapsed, setTreeCollapsed, FolderTree, (
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
              className={`${itemClassName} ml-4`}
            >
              <FileText className={`${getItemIconClass(false)} w-4 h-4`} />
              <span className="truncate">Getting Started</span>
            </button>
            <button
              type="button"
              onClick={() => onModeChange('doc')}
              className={`${itemClassName} ml-4`}
            >
              <FileText className={`${getItemIconClass(false)} w-4 h-4`} />
              <span className="truncate">Architecture Specs</span>
            </button>
          </>
        ))}

        {renderSection('Tags', othersCollapsed, setOthersCollapsed, Tag, (
          <>
            <button type="button" onClick={() => onModeChange('doc')} className={itemClassName}>
              <span className="inline-flex items-center rounded-full bg-slate-200 dark:bg-zinc-700 px-1.5 py-0.5 text-[11px] font-medium text-slate-700 dark:text-zinc-200">
                product
              </span>
            </button>
            <button type="button" onClick={() => onModeChange('doc')} className={itemClassName}>
              <span className="inline-flex items-center rounded-full bg-slate-200 dark:bg-zinc-700 px-1.5 py-0.5 text-[11px] font-medium text-slate-700 dark:text-zinc-200">
                engineering
              </span>
            </button>
          </>
        ))}

        {renderSection('Collections', othersCollapsed, setOthersCollapsed, LayoutGrid, (
          <>
            <button type="button" onClick={() => onModeChange('doc')} className={itemClassName}>
              <span className="truncate">Design Review</span>
            </button>
          </>
        ))}

        {renderSection('Others', othersCollapsed, setOthersCollapsed, CircleHelp, (
          <>
            <button type="button" onClick={() => onModeChange('doc')} className={itemClassName}>
              <span className="truncate">Read Only Docs</span>
            </button>
            <button type="button" onClick={() => onModeChange('doc')} className={itemClassName}>
              <span className="truncate">Shared Room</span>
            </button>
          </>
        ))}
      </div>

      <div className="border-t border-slate-200 dark:border-zinc-800 px-2 py-2 space-y-2">
        <button
          type="button"
          onClick={() => onModeChange('doc')}
          className={`${actionClassName()} flex w-full`}
          title="New page"
        >
          <Plus className="w-4 h-4" />
          <span className="truncate">New</span>
        </button>

        <div className="flex items-center gap-x-1">
          {DEFAULT_ACTIONS.map(({ label, icon: Icon, mode, variant }) => (
            <button
              key={label}
              type="button"
              onClick={() => onModeChange(mode)}
              className={`${actionClassName(variant)} flex-1`}
              title={label}
            >
              <Icon className="w-4 h-4" />
              <span className="truncate">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
