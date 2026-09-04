import React, { useState } from 'react';
import { useDocumentStore } from '../store.js';
import { Link2, Trash2, RotateCcw, ChevronDown } from 'lucide-react';

interface EmbedBlockProps {
  id: string;
  refPageId?: string;
  activePage: string;
  onUpdateProps: (props: { refPageId?: string }) => void;
  onDelete: () => void;
}

export const EmbedBlock: React.FC<EmbedBlockProps> = ({
  id: _id,
  refPageId,
  activePage,
  onUpdateProps,
  onDelete,
}) => {
  const { blocks: rootBlocks } = useDocumentStore('root-doc-node');
  const { pages: metaPages } = useDocumentStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Extract combined list of pages from both metadata and root document's wiki-links
  const embeddablePages = React.useMemo(() => {
    const list: Array<{ id: string; title: string; icon?: string }> = [];
    const seenIds = new Set<string>();

    // We can embed the Root Note (root-doc-node) if the activePage is not root-doc-node
    if (activePage !== 'root-doc-node') {
      list.push({ id: 'root-doc-node', title: 'Root Note', icon: '📄' });
      seenIds.add('root-doc-node');
    }

    // Include pages from metadata (ypages)
    if (metaPages) {
      metaPages.forEach((p) => {
        if (p.id !== activePage && !seenIds.has(p.id)) {
          list.push({ id: p.id, title: p.title, icon: p.icon || '📄' });
          seenIds.add(p.id);
        }
      });
    }

    // Include pages from root document wiki links
    if (rootBlocks) {
      rootBlocks.forEach((block) => {
        const matches = [...block.content.matchAll(/\[\[(.*?)\]\]/g)];
        matches.forEach((match) => {
          const title = match[1]?.trim();
          if (title) {
            const id = `page-${title.toLowerCase().replace(/\s+/g, '-')}`;
            if (id !== activePage && !seenIds.has(id)) {
              list.push({ id, title, icon: '📄' });
              seenIds.add(id);
            }
          }
        });
      });
    }

    return list;
  }, [rootBlocks, metaPages, activePage]);

  // If a target page is selected, fetch its blocks and metadata reactively
  const targetStore = useDocumentStore(refPageId || 'dummy-non-existent-id');
  const targetBlocks = refPageId ? targetStore.blocks : [];
  const targetPageMeta = refPageId ? targetStore.pageMeta : null;

  const handleSelectPage = (pageId: string) => {
    onUpdateProps({ refPageId: pageId });
    setIsDropdownOpen(false);
  };

  const handleReset = () => {
    onUpdateProps({ refPageId: undefined });
  };

  // Render Page Selector
  if (!refPageId) {
    return (
      <div className="w-full my-3 p-4 bg-muted border border-border rounded-2xl shadow-sm transition-all text-foreground">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Link2 className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-semibold">Page Embed Reference</h4>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Select another page to display its content inline as a synced block
            </p>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="px-3 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <span>Choose Page</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-60 bg-card border border-border rounded-xl shadow-xl z-50 py-1 text-xs max-h-52 overflow-y-auto">
                {embeddablePages.length > 0 ? (
                  embeddablePages.map((page) => (
                    <button
                      key={page.id}
                      type="button"
                      onClick={() => handleSelectPage(page.id)}
                      className="w-full px-3 py-2 text-left hover:bg-muted text-foreground flex items-center gap-2 min-w-0"
                    >
                      <span className="text-xs shrink-0">{page.icon || '📄'}</span>
                      <span className="flex-1 min-w-0 truncate">{page.title || 'Untitled Document'}</span>
                    </button>
                  ))
                ) : (
                  <p className="px-3 py-2 text-muted-foreground italic">
                    No other pages available
                  </p>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-muted rounded-lg transition-colors ml-1"
            title="Delete block"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Find the target title and content blocks
  const targetTitle = React.useMemo(() => {
    return targetPageMeta?.title || targetBlocks.find(b => b.type === 'heading' && b.properties?.level === 1)?.content || 'Untitled Document';
  }, [targetPageMeta?.title, targetBlocks]);

  const targetIcon = targetPageMeta?.icon || '📄';

  // Filter out the main H1 block at index 0 from the preview to avoid repeating the page title
  const filteredBlocksForPreview = React.useMemo(() => {
    return targetBlocks.filter(
      (b, index) => !(index === 0 && b.type === 'heading' && b.properties?.level === 1)
    ).slice(0, 5);
  }, [targetBlocks]);

  return (
    <div className="group/embed relative w-full my-4 border border-border/80 bg-muted/30 hover:bg-muted/60 rounded-2xl p-4 transition-all">
      {/* Header with page title & link badge */}
      <div className="flex items-center justify-between border-b border-border pb-2.5 mb-3">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <span className="text-base flex-shrink-0">{targetIcon}</span>
          <h3 className="text-xs font-bold text-foreground flex-1 min-w-0 truncate">
            {targetTitle}
          </h3>
          <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-wider scale-90 shrink-0">
            Synced Block
          </span>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover/embed:opacity-100 focus-within:opacity-100 transition-opacity ml-2 shrink-0">
          <button
            type="button"
            onClick={handleReset}
            className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors focus-visible:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-border"
            title="Change embedded page"
            aria-label="Change embedded page"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1 text-muted-foreground hover:text-destructive hover:bg-muted rounded-lg transition-colors focus-visible:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
            title="Delete block"
            aria-label="Delete block"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Preview Content */}
      <div className="space-y-2 text-xs leading-relaxed text-muted-foreground pointer-events-none select-none">
        {filteredBlocksForPreview.length > 0 ? (
          filteredBlocksForPreview.map((block) => {
            // Render styled simple previews
            switch (block.type) {
              case 'heading': {
                const level = block.properties?.level || 2;
                const sizeClass = level === 1 ? 'text-sm font-bold' : level === 2 ? 'text-xs font-bold' : 'text-[11px] font-semibold';
                return (
                  <div key={block.id} className={`${sizeClass} text-foreground pt-1`}>
                    {block.content || <span className="opacity-30 italic">Empty Heading</span>}
                  </div>
                );
              }
              case 'bullet':
                return (
                  <div key={block.id} className="flex items-start gap-1.5 pl-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-1.5 shrink-0" />
                    <span>{block.content || <span className="opacity-30 italic">Empty List Item</span>}</span>
                  </div>
                );
              case 'ordered':
                return (
                  <div key={block.id} className="flex items-start gap-1.5 pl-1">
                    <span className="text-muted-foreground font-medium shrink-0">1.</span>
                    <span>{block.content || <span className="opacity-30 italic">Empty List Item</span>}</span>
                  </div>
                );
              case 'todo':
                return (
                  <div key={block.id} className="flex items-start gap-2 pl-1">
                    <input
                      type="checkbox"
                      checked={!!block.properties?.checked}
                      disabled
                      className="w-3 h-3 rounded border-border mt-1 accent-accent shrink-0"
                    />
                    <span className={block.properties?.checked ? 'line-through text-muted-foreground' : ''}>
                      {block.content || <span className="opacity-30 italic">Empty Task</span>}
                    </span>
                  </div>
                );
              case 'quote':
                return (
                  <div key={block.id} className="flex gap-2 pl-1 py-0.5">
                    <div className="w-0.5 bg-primary rounded-full shrink-0" />
                    <span className="italic text-muted-foreground">{block.content || <span className="opacity-30 italic">Empty Quote</span>}</span>
                  </div>
                );
              case 'callout':
                return (
                  <div key={block.id} className="flex gap-2 p-2 bg-muted border border-border rounded-lg">
                    <span>{block.properties?.calloutIcon || '💡'}</span>
                    <span>{block.content || <span className="opacity-30 italic">Callout</span>}</span>
                  </div>
                );
              case 'code':
                return (
                  <div key={block.id} className="p-2 bg-muted border border-border rounded-lg font-mono text-[10px] text-muted-foreground flex-1 min-w-0 truncate">
                    {block.content || <span className="opacity-30 italic">Code snippet</span>}
                  </div>
                );
              case 'divider':
                return (
                  <div key={block.id} className="py-1">
                    <hr className="border-border" />
                  </div>
                );
              case 'table':
                return (
                  <div key={block.id} className="flex items-center gap-1.5 text-muted-foreground text-[11px] py-1">
                    <span>📊</span>
                    <span>Table Grid</span>
                  </div>
                );
              case 'math':
                return (
                  <div key={block.id} className="flex items-center gap-1.5 text-muted-foreground text-[11px] py-1">
                    <span>🧮</span>
                    <span>Math Formula: {block.content}</span>
                  </div>
                );
              case 'bookmark':
                return (
                  <div key={block.id} className="flex items-center gap-1.5 text-muted-foreground text-[11px] py-1">
                    <span>🔗</span>
                    <span>Bookmark: {block.properties?.bookmarkTitle || block.properties?.bookmarkUrl}</span>
                  </div>
                );
              case 'image':
                return (
                  <div key={block.id} className="flex items-center gap-1.5 text-muted-foreground text-[11px] py-1">
                    <span>🖼️</span>
                    <span>Image Preview: {block.properties?.caption || 'untitled'}</span>
                  </div>
                );
              case 'widget':
                return (
                  <div key={block.id} className="flex items-center gap-1.5 text-muted-foreground text-[11px] py-1">
                    <span>🧩</span>
                    <span>AI Widget: {block.properties?.widgetId}</span>
                  </div>
                );
              case 'kanban':
                return (
                  <div key={block.id} className="flex items-center gap-1.5 text-muted-foreground text-[11px] py-1">
                    <span>📋</span>
                    <span>Kanban Board: {block.properties?.kanbanTitle || block.content}</span>
                  </div>
                );
              default:
                return (
                  <div key={block.id} className="pl-1">
                    {block.content || <span className="opacity-30 italic">Empty block</span>}
                  </div>
                );
            }
          })
        ) : (
          <p className="text-[11px] text-muted-foreground italic pl-1">
            This page is empty
          </p>
        )}
      </div>
    </div>
  );
};
