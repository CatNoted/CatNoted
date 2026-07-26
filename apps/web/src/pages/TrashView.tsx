import React from 'react';
import { useDocumentStore } from '@catnoted/editor';
import { Trash2, RotateCcw } from 'lucide-react';

export const TrashView: React.FC = () => {
  const { deletedPages, restorePage, permanentlyDeletePage } = useDocumentStore();

  const handleRestore = (id: string) => {
    restorePage(id);
  };

  const handlePermanentDelete = (id: string, title: string) => {
    if (confirm(`Permanently delete "${title || 'Untitled'}"? This cannot be undone.`)) {
      permanentlyDeletePage(id);
    }
  };

  if (!deletedPages || deletedPages.length === 0) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-[#141416] p-8 select-none">
        <div className="max-w-md text-center flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-zinc-850 flex items-center justify-center text-slate-400 dark:text-zinc-500 shadow-sm">
            <Trash2 className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-200">Trash Bin is Empty</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Pages you delete will appear here. You can restore them or delete them permanently.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-slate-50 dark:bg-[#141416] p-6 md:p-8 overflow-y-auto select-text">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-850 pb-4 shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Trash2 className="w-6 h-6 text-red-500" />
              Trash Bin
            </h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              Items in Trash are soft-deleted. They are excluded from your normal workspace and search index.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {deletedPages.map((page) => (
            <div
              key={page.id}
              className="p-4 bg-white dark:bg-[#16161a] border border-slate-200 dark:border-zinc-800 rounded-2xl flex items-center justify-between shadow-sm transition-all hover:shadow-md"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xl shrink-0">{page.icon || '📄'}</span>
                <div className="min-w-0">
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-zinc-200 truncate">
                    {page.title || 'Untitled Page'}
                  </h4>
                  <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">
                    Deleted or updated recently
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleRestore(page.id)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1.5 px-3 rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Restore
                </button>
                <button
                  type="button"
                  onClick={() => handlePermanentDelete(page.id, page.title)}
                  className="border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-850 text-slate-600 dark:text-zinc-300 py-1.5 px-3 rounded-lg text-xs transition-colors font-medium"
                >
                  Delete Permanently
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
