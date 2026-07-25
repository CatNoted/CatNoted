import React, { useState } from 'react';
import { ChevronRight, ChevronDown, FileText, Clock, FolderClosed, FolderOpen } from 'lucide-react';
import { useDocumentStore } from '@catnoted/editor';
import { ActiveMode } from '../layouts/AppLayout';

interface SidebarProps {
  onModeChange: (mode: ActiveMode) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onModeChange }) => {
  const { blocks } = useDocumentStore();

  // Extract headings or text as mock "docs"
  const docTitles = blocks
    .filter(b => b.type === 'heading' || b.type === 'text')
    .map(b => b.content || 'Untitled Document')
    .slice(0, 5); // Just taking top 5 for recent docs

  const [isRecentOpen, setIsRecentOpen] = useState(true);
  const [isTreeOpen, setIsTreeOpen] = useState(true);

  return (
    <div className="w-64 border-r border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 h-full flex flex-col shrink-0">
      <div className="p-4 border-b border-slate-200 dark:border-zinc-800">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-zinc-200">Workspace</h2>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {/* Recent Docs Section */}
        <div className="px-2 mb-4">
          <button
            onClick={() => setIsRecentOpen(!isRecentOpen)}
            className="flex items-center w-full px-2 py-1.5 text-xs font-semibold text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 hover:bg-slate-200/50 dark:hover:bg-zinc-800/50 rounded-lg transition-colors"
          >
            {isRecentOpen ? <ChevronDown className="w-3.5 h-3.5 mr-1" /> : <ChevronRight className="w-3.5 h-3.5 mr-1" />}
            <Clock className="w-3.5 h-3.5 mr-1.5" />
            Recent
          </button>

          {isRecentOpen && (
            <div className="mt-1 space-y-0.5">
              {docTitles.length > 0 ? docTitles.map((title, i) => (
                <button
                  key={i}
                  onClick={() => onModeChange('doc')}
                  className="flex items-center w-full px-2 py-1.5 ml-2 text-sm text-slate-700 dark:text-zinc-300 hover:bg-slate-200/50 dark:hover:bg-zinc-800/50 rounded-lg transition-colors truncate"
                >
                  <FileText className="w-4 h-4 mr-2 text-indigo-500 dark:text-indigo-400 shrink-0" />
                  <span className="truncate">{title}</span>
                </button>
              )) : (
                <div className="px-4 py-2 text-xs text-slate-400">No recent docs</div>
              )}
            </div>
          )}
        </div>

        {/* Page Tree Section */}
        <div className="px-2">
          <button
            onClick={() => setIsTreeOpen(!isTreeOpen)}
            className="flex items-center w-full px-2 py-1.5 text-xs font-semibold text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 hover:bg-slate-200/50 dark:hover:bg-zinc-800/50 rounded-lg transition-colors"
          >
            {isTreeOpen ? <ChevronDown className="w-3.5 h-3.5 mr-1" /> : <ChevronRight className="w-3.5 h-3.5 mr-1" />}
            {isTreeOpen ? <FolderOpen className="w-3.5 h-3.5 mr-1.5" /> : <FolderClosed className="w-3.5 h-3.5 mr-1.5" />}
            Pages
          </button>

          {isTreeOpen && (
            <div className="mt-1 space-y-0.5 ml-2 border-l border-slate-200 dark:border-zinc-800 pl-1">
              <button
                onClick={() => onModeChange('doc')}
                className="flex items-center w-full px-2 py-1.5 text-sm text-slate-700 dark:text-zinc-300 hover:bg-slate-200/50 dark:hover:bg-zinc-800/50 rounded-lg transition-colors truncate"
              >
                <FileText className="w-4 h-4 mr-2 text-slate-400 dark:text-zinc-500 shrink-0" />
                <span className="truncate">Getting Started</span>
              </button>
              <button
                onClick={() => onModeChange('doc')}
                className="flex items-center w-full px-2 py-1.5 text-sm text-slate-700 dark:text-zinc-300 hover:bg-slate-200/50 dark:hover:bg-zinc-800/50 rounded-lg transition-colors truncate"
              >
                <FileText className="w-4 h-4 mr-2 text-slate-400 dark:text-zinc-500 shrink-0" />
                <span className="truncate">Architecture Specs</span>
              </button>
              <button
                onClick={() => onModeChange('doc')}
                className="flex items-center w-full px-2 py-1.5 text-sm text-slate-700 dark:text-zinc-300 hover:bg-slate-200/50 dark:hover:bg-zinc-800/50 rounded-lg transition-colors truncate"
              >
                <FileText className="w-4 h-4 mr-2 text-slate-400 dark:text-zinc-500 shrink-0" />
                <span className="truncate">Weekly Notes</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
