import React, { useState } from 'react';
import { useDocumentStore } from '@catnoted/editor';
import { LayoutGrid, FileText, ChevronRight } from 'lucide-react';

interface Collection {
  id: string;
  name: string;
  description: string;
  gradient: string;
}

const PRESET_COLLECTIONS: Collection[] = [
  { id: 'design', name: 'Design Review', description: 'User experience specs, Figma bookmarks, and feedback loops.', gradient: 'from-pink-500 to-indigo-500' },
  { id: 'weekly', name: 'Weekly Sync', description: 'Weekly updates, standup notes, and action items checklists.', gradient: 'from-emerald-400 to-teal-600' },
  { id: 'personal', name: 'Personal', description: 'Personal bucket list, creative thoughts, and side projects.', gradient: 'from-amber-400 to-orange-500' },
  { id: 'work', name: 'Work', description: 'Technical specs, architecture plans, and sprint milestones.', gradient: 'from-blue-500 to-sky-600' },
];

interface CollectionsViewProps {
  onNavigateToPage?: (id: string) => void;
}

export const CollectionsView: React.FC<CollectionsViewProps> = ({ onNavigateToPage }) => {
  const { pages } = useDocumentStore();
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);

  // Filter pages for active collection
  // If the page doesn't have a collection set, we can assign it keyword-based defaults, or let users assign!
  const getPagesForCollection = (colId: string) => {
    return (pages || []).filter((page: any) => {
      if (page.isDeleted) return false;
      if (page.collection === colId) return true;

      // Fallback keyword-matching so that the view is immediately interesting!
      const titleLower = (page.title || '').toLowerCase();
      if (colId === 'design' && (titleLower.includes('design') || titleLower.includes('specs') || titleLower.includes('figma'))) return true;
      if (colId === 'weekly' && (titleLower.includes('weekly') || titleLower.includes('sync') || titleLower.includes('notes'))) return true;
      if (colId === 'personal' && (titleLower.includes('personal') || titleLower.includes('journal') || titleLower.includes('diary'))) return true;
      if (colId === 'work' && (titleLower.includes('work') || titleLower.includes('spec') || titleLower.includes('architecture'))) return true;

      return false;
    });
  };

  const activeCollection = PRESET_COLLECTIONS.find(c => c.id === selectedCollectionId);
  const activePages = selectedCollectionId ? getPagesForCollection(selectedCollectionId) : [];

  return (
    <div className="h-full w-full bg-slate-50 dark:bg-[#141416] p-6 md:p-8 overflow-y-auto select-text">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-850 pb-4 shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <LayoutGrid className="w-6 h-6 text-indigo-500" />
              Collections
            </h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              Organize your pages into structural collections to group distinct workflows and project spaces.
            </p>
          </div>
        </div>

        {selectedCollectionId === null ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PRESET_COLLECTIONS.map((col) => {
              const colPages = getPagesForCollection(col.id);
              return (
                <button
                  key={col.id}
                  onClick={() => setSelectedCollectionId(col.id)}
                  className="p-6 bg-white dark:bg-[#16161a] border border-slate-200 dark:border-zinc-800 rounded-3xl text-left hover:border-indigo-500 hover:shadow-lg transition-all flex flex-col gap-4 group"
                >
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${col.gradient} text-white flex items-center justify-center font-bold text-lg`}>
                    {col.name.slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5 group-hover:text-indigo-500 transition-colors">
                      {col.name}
                      <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
                      {col.description}
                    </p>
                  </div>
                  <div className="mt-auto pt-3 border-t border-slate-100 dark:border-zinc-850 w-full flex justify-between text-[11px] font-semibold text-slate-400 dark:text-zinc-500">
                    <span>{colPages.length} {colPages.length === 1 ? 'Page' : 'Pages'}</span>
                    <span className="text-indigo-600 dark:text-indigo-400 group-hover:underline">Open Collection &rarr;</span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-200">
            {/* Collection Header Back Affordance */}
            <button
              onClick={() => setSelectedCollectionId(null)}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              &larr; Back to all collections
            </button>

            <div className="p-6 rounded-3xl bg-white dark:bg-[#16161a] border border-slate-200 dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${activeCollection?.gradient} text-white flex items-center justify-center font-bold text-xl shrink-0`}>
                  {activeCollection?.name.slice(0, 2)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-zinc-100">{activeCollection?.name}</h2>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">{activeCollection?.description}</p>
                </div>
              </div>
              <div className="text-xs font-bold text-slate-400 dark:text-zinc-500 py-1 px-3 bg-slate-50 dark:bg-zinc-850 rounded-xl">
                {activePages.length} Pages Grouped
              </div>
            </div>

            {/* Pages grouped in collection */}
            {activePages.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-slate-200 dark:border-zinc-800 rounded-3xl text-sm text-slate-500 dark:text-zinc-400 bg-white dark:bg-[#16161a]">
                <FileText className="w-8 h-8 mx-auto text-slate-300 dark:text-zinc-700 mb-2" />
                <p className="font-semibold">No pages in this collection yet.</p>
                <p className="text-xs mt-1">Assign pages keyword matching or move them here using metadata options.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activePages.map((page) => (
                  <button
                    key={page.id}
                    onClick={() => onNavigateToPage?.(page.id)}
                    className="p-4 bg-white dark:bg-[#16161a] border border-slate-200 dark:border-zinc-800 rounded-2xl text-left hover:border-indigo-500 hover:shadow-md transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xl shrink-0">{page.icon || '📄'}</span>
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-slate-800 dark:text-zinc-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {page.title || 'Untitled Page'}
                        </h4>
                        <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">
                          ID: {page.id}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 dark:text-zinc-500 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
