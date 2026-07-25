import React, { useState } from 'react';
import { ChevronRight, ChevronDown, FileText, Clock, FolderClosed, FolderOpen } from 'lucide-react';
import { useDocumentStore } from '@catnoted/editor';
import { parseDocumentGraph } from '@catnoted/graph';
import { ActiveMode } from '../layouts/AppLayout';

interface SidebarProps {
  onModeChange: (mode: ActiveMode) => void;
  activePage?: string;
  onPageSelect?: (pageId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onModeChange,
  activePage = 'root-doc-node',
  onPageSelect
}) => {
  const { blocks: rootBlocks } = useDocumentStore('root-doc-node');
  const { blocks, pages } = useDocumentStore(activePage);

  // Parse document graph nodes from the root note blocks
  const graphData = React.useMemo(() => {
    return parseDocumentGraph(rootBlocks);
  }, [rootBlocks]);

  const mainHeading = blocks.find(b => b.type === 'heading' && b.properties?.level === 1);
  const docTitle = mainHeading?.content || 'Untitled Document';

  // Merge registered pages from the store with pages discovered from root note blocks scan
  const combinedPages = React.useMemo(() => {
    const storePagesMap = new Map<string, { id: string; title: string; icon?: string; updatedAt?: number; createdAt?: number }>();

    // Add all registered pages from useDocumentStore
    (pages || []).forEach(p => {
      storePagesMap.set(p.id, {
        id: p.id,
        title: p.title || 'Untitled',
        icon: p.icon || '📄',
        updatedAt: p.updatedAt || p.createdAt || 0,
        createdAt: p.createdAt || 0
      });
    });

    // Scan root blocks via parseDocumentGraph to find wiki-linked pages
    const pageNodesFromGraph = graphData.nodes.filter(n => n.type === 'page');
    pageNodesFromGraph.forEach(n => {
      if (n.id !== 'root-doc-node') {
        const rawName = n.rawName || n.label.replace(/^📄\s*/, '').replace(/\s*\(\d+\)$/, '').trim();
        if (!storePagesMap.has(n.id)) {
          storePagesMap.set(n.id, {
            id: n.id,
            title: rawName,
            icon: '📄',
            updatedAt: 0,
            createdAt: 0
          });
        }
      }
    });

    return Array.from(storePagesMap.values());
  }, [pages, graphData.nodes]);

  // Sort Page Tree alphabetically
  const sortedTreePages = React.useMemo(() => {
    return [...combinedPages].sort((a, b) => a.title.localeCompare(b.title));
  }, [combinedPages]);

  // Sort Recent Documents section by updatedAt/createdAt descending
  const recentDocs = React.useMemo(() => {
    const otherPages = [...pages].filter(p => p.id !== 'root-doc-node');
    const sorted = otherPages.sort((a, b) => {
      const timeA = a.updatedAt || a.createdAt || 0;
      const timeB = b.updatedAt || b.createdAt || 0;
      return timeB - timeA;
    });

    const mapped = sorted.map(p => ({
      id: p.id,
      title: p.title || 'Untitled Document'
    }));

    return [
      { id: 'root-doc-node', title: docTitle },
      ...mapped
    ];
  }, [pages, docTitle]);

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
              {recentDocs.length > 0 ? recentDocs.map((doc) => {
                const isActive = activePage === doc.id;
                return (
                  <button
                    key={doc.id}
                    onClick={() => {
                      if (onPageSelect) onPageSelect(doc.id);
                      onModeChange('doc');
                    }}
                    className={`flex items-center w-full px-2 py-1.5 ml-2 text-sm rounded-lg transition-colors truncate ${
                      isActive
                        ? 'bg-slate-200 dark:bg-zinc-800 text-slate-900 dark:text-white font-medium'
                        : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-200/50 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    <FileText className="w-4 h-4 mr-2 text-indigo-500 dark:text-indigo-400 shrink-0" />
                    <span className="truncate">{doc.title}</span>
                  </button>
                );
              }) : (
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
              {sortedTreePages.length === 0 ? (
                <div className="px-4 py-2 text-xs text-slate-400 dark:text-zinc-500">No pages exist.</div>
              ) : (
                sortedTreePages.map((node: any) => {
                  const isActive = activePage === node.id;
                  return (
                    <button
                      key={node.id}
                      onClick={() => {
                        if (onPageSelect) onPageSelect(node.id);
                        onModeChange('doc');
                      }}
                      className={`flex items-center w-full px-2 py-1.5 text-sm rounded-lg transition-colors truncate ${
                        isActive
                          ? 'bg-slate-200 dark:bg-zinc-800 text-slate-900 dark:text-white font-medium'
                          : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-200/50 dark:hover:bg-zinc-800/50'
                      }`}
                    >
                      <FileText className="w-4 h-4 mr-2 text-slate-400 dark:text-zinc-500 shrink-0" />
                      <span className="truncate">{node.title}</span>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
