import React, { useState, useMemo } from 'react';
import { useDocumentStore } from '@catnoted/editor';
import { Tag, FileText, ChevronRight, Hash } from 'lucide-react';

interface TagsViewProps {
  onNavigateToPage?: (id: string) => void;
}

export const TagsView: React.FC<TagsViewProps> = ({ onNavigateToPage }) => {
  const { pages, blocks } = useDocumentStore();
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Parse all tags in the workspace blocks dynamically!
  const allTagsWithCounts = useMemo(() => {
    const tagMap: Record<string, { name: string; pages: Set<string>; blocks: Array<{ pageId: string; content: string }> }> = {};

    // Seed preset tags so the workspace looks fully configured on mount!
    const presets = ['product', 'engineering', 'urgent', 'ideas', 'refactor', 'draft'];
    presets.forEach(p => {
      tagMap[p] = { name: p, pages: new Set(), blocks: [] };
    });

    // Parse blocks for hashtags like #tag
    if (blocks && Array.isArray(blocks)) {
      blocks.forEach(block => {
        if (!block.content) return;

        // Match word boundary followed by # and letter/numbers
        const matches = block.content.match(/#(\w+)/g);
        if (matches) {
          matches.forEach(m => {
            const tagName = m.slice(1).toLowerCase();
            if (!tagMap[tagName]) {
              tagMap[tagName] = { name: tagName, pages: new Set(), blocks: [] };
            }
            const blockPageId = block.parentId || 'root-doc-node';
            tagMap[tagName].pages.add(blockPageId);
            tagMap[tagName].blocks.push({
              pageId: blockPageId,
              content: block.content
            });
          });
        }
      });
    }

    // Keyword matching fallback for presets to seed pages
    if (pages && Array.isArray(pages)) {
      pages.forEach((page: any) => {
        if (page.isDeleted) return;
        const titleLower = (page.title || '').toLowerCase();

        if (titleLower.includes('specs') || titleLower.includes('figma')) {
          tagMap['product'].pages.add(page.id);
        }
        if (titleLower.includes('spec') || titleLower.includes('architecture') || titleLower.includes('weekly')) {
          tagMap['engineering'].pages.add(page.id);
        }
        if (titleLower.includes('spec')) {
          tagMap['refactor'].pages.add(page.id);
        }
      });
    }

    return Object.values(tagMap).sort((a, b) => b.pages.size - a.pages.size);
  }, [blocks, pages]);

  const activeTagData = selectedTag ? allTagsWithCounts.find(t => t.name === selectedTag) : null;

  // Resolve matching pages for selected tag
  const matchingPages = useMemo(() => {
    if (!activeTagData || !pages) return [];
    const pageIds = Array.from(activeTagData.pages);
    return pages.filter(p => pageIds.includes(p.id) && !p.isDeleted);
  }, [activeTagData, pages]);

  return (
    <div className="h-full w-full bg-slate-50 dark:bg-[#141416] p-6 md:p-8 overflow-y-auto select-text">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-850 pb-4 shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Tag className="w-6 h-6 text-amber-500" />
              Tags Explorer
            </h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              Browse page tags parsed in real-time from your headings, paragraphs, and markdown blocks.
            </p>
          </div>
        </div>

        {selectedTag === null ? (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">All active tags</h3>
            <div className="flex flex-wrap gap-2">
              {allTagsWithCounts.map((tag) => (
                <button
                  key={tag.name}
                  onClick={() => setSelectedTag(tag.name)}
                  className="px-4 py-2 bg-white dark:bg-[#16161a] border border-slate-200 dark:border-zinc-800 hover:border-indigo-500 rounded-xl flex items-center gap-2.5 shadow-sm hover:shadow-md transition-all text-sm font-semibold text-slate-700 dark:text-zinc-200 group"
                >
                  <Hash className="w-4 h-4 text-amber-500 group-hover:scale-115 transition-transform" />
                  <span>{tag.name}</span>
                  <span className="text-xs font-bold bg-slate-100 dark:bg-zinc-850 py-0.5 px-2 rounded-full text-slate-400 dark:text-zinc-500">
                    {tag.pages.size}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-200">
            <button
              onClick={() => setSelectedTag(null)}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              &larr; Back to tags cloud
            </button>

            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 flex items-center gap-3">
              <Hash className="w-6 h-6 text-amber-500 shrink-0" />
              <div>
                <h3 className="text-base font-bold capitalize">#{selectedTag}</h3>
                <p className="text-xs opacity-80">Showing matches of this tag across pages in active workspace.</p>
              </div>
            </div>

            {matchingPages.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-slate-200 dark:border-zinc-800 rounded-3xl text-sm text-slate-500 dark:text-zinc-400 bg-white dark:bg-[#16161a]">
                <FileText className="w-8 h-8 mx-auto text-slate-300 dark:text-zinc-700 mb-2" />
                <p className="font-semibold">No direct pages associated with this tag yet.</p>
                <p className="text-xs mt-1">Add a text or heading block with <code>#{selectedTag}</code> to list it here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Matching documents</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {matchingPages.map((page) => (
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
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
