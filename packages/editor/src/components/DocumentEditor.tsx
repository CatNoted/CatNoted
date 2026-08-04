// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { useDocumentStore, yblocks, ypages } from '../store.js';
import { HeadingBlock } from './HeadingBlock.js';
import { TextBlock } from './TextBlock.js';
import { CalloutBlock } from './CalloutBlock.js';
import { ToggleBlock } from './ToggleBlock.js';
import { CodeBlock } from './CodeBlock.js';
import { MathBlock } from './MathBlock.js';
import { TableBlock } from './TableBlock.js';
import { BookmarkBlock } from './BookmarkBlock.js';
import { ImageBlock } from './ImageBlock.js';
import { WidgetBlockPlaceholder } from './WidgetBlockPlaceholder.js';
import { PageHeader } from './PageHeader.js';
import { FloatingBubbleMenu } from './FloatingBubbleMenu.js';
import { SandboxFrame } from '@catnoted/agent-runtime';
import { EmbedBlock } from './EmbedBlock.js';
import { BlockRow } from './BlockRow.js';

import { 
  Trash2, 
  Heading1, 
  Heading2, 
  AlignLeft, 
  Cpu, 
  Copy,
  Lightbulb,
  ChevronRight,
  Code,
  Sigma,
  Table as TableIcon,
  Link2
} from 'lucide-react';

interface DocumentEditorProps {
  activePage?: string;
  onRenamePage?: (oldTitle: string, newTitle: string) => void;
  onPageSelect?: (pageId: string) => void;
}

export const DocumentEditor: React.FC<DocumentEditorProps> = ({
  activePage = 'root-doc-node',
  onRenamePage,
  onPageSelect
}) => {
  const [allBlocks, setAllBlocks] = useState<any[]>([]);
  const [allPages, setAllPages] = useState<any[]>([]);
  const [isBacklinksExpanded, setIsBacklinksExpanded] = useState(true);

  useEffect(() => {
    const update = () => {
      const allArray = yblocks.toArray();
      const seen = new Set<string>();
      const dedupedAll = allArray.filter(b => {
        if (!b || !b.id) return false;
        if (seen.has(b.id)) return false;
        seen.add(b.id);
        return true;
      });
      setAllBlocks(dedupedAll);
      setAllPages(ypages.toJSON() ? Object.values(ypages.toJSON()) : []);
    };
    update();
    yblocks.observe(update);
    ypages.observe(update);
    return () => {
      yblocks.unobserve(update);
      ypages.unobserve(update);
    };
  }, []);

  const { 
    blocks, 
    pageMeta,
    addBlock, 
    updateBlockContent, 
    updateBlockType, 
    updateBlockProperties,
    duplicateBlock,
    deleteBlock,
    moveBlock,
    updatePageMeta
  } = useDocumentStore(activePage);

  const [focusBlockId, setFocusBlockId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  const [dragOverBlockId, setDragOverBlockId] = useState<string | null>(null);
  const titleOnFocusRef = useRef('');

  const [editingWidgetId, setEditingWidgetId] = useState<string | null>(null);
  const [editorCode, setEditorCode] = useState<Record<string, string>>({});
  const [rerunKeys, setRerunKeys] = useState<Record<string, number>>({});
  const [widgetErrors, setWidgetErrors] = useState<Record<string, { message: string }>>({});

  const handleEditClick = (id: string, initialCode: string) => {
    setEditingWidgetId(id);
    setEditorCode(prev => ({ ...prev, [id]: initialCode || '' }));
  };

  const handleRerun = (id: string) => {
    setRerunKeys(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
    setWidgetErrors(prev => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
  };

  const handleWidgetError = (id: string, err: { message: string }) => {
    setWidgetErrors(prev => ({ ...prev, [id]: err }));
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedBlockId(id);
    e.dataTransfer.effectAllowed = 'move';
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(img, 0, 0);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverBlockId !== id) {
      setDragOverBlockId(id);
    }
  };

  const handleDrop = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    setDragOverBlockId(null);
    if (draggedBlockId && draggedBlockId !== id) {
      moveBlock(draggedBlockId, id);
    }
    setDraggedBlockId(null);
  };

  useEffect(() => {
    if (blocks.length === 1 && blocks[0].type === 'heading' && blocks[0].properties?.level === 1) {
      setFocusBlockId(blocks[0].id);
    }
  }, [activePage, blocks]);

  const handleCreateBlock = (afterId: string) => {
    const block = blocks.find(b => b.id === afterId);
    if (block && (block.type === 'bullet' || block.type === 'ordered' || block.type === 'todo')) {
      if (block.content.trim() === '') {
        updateBlockType(block.id, 'text', {});
        return;
      } else {
        const newId = addBlock(afterId, block.type as any, '');
        setFocusBlockId(newId);
        return;
      }
    }
    const newId = addBlock(afterId, 'text', '');
    setFocusBlockId(newId);
  };

  const handleEnterBlock = (id: string, index: number) => {
    const block = blocks[index];
    if (block && ['bullet', 'ordered', 'todo'].includes(block.type)) {
      if (block.content.trim() === '') {
        updateBlockType(id, 'text');
        return;
      }
      const newId = addBlock(id, block.type, '');
      if (block.type === 'todo') {
        updateBlockType(newId, 'todo', { checked: false });
      } else {
        updateBlockType(newId, block.type);
      }
      setFocusBlockId(newId);
      return;
    }

    const newId = addBlock(id, 'text', '');
    setFocusBlockId(newId);
  };

  const handleBackspaceBlock = (id: string, index: number) => {
    if (blocks.length > 1) {
      deleteBlock(id);
      const focusBlock = index > 0 ? blocks[index - 1] : blocks[1];
      if (focusBlock) {
        setFocusBlockId(focusBlock.id);
      }
    }
  };

  const handleAddWidget = (afterId: string) => {
    const newId = addBlock(afterId, 'widget', '');
    updateBlockType(newId, 'widget', { widgetId: `widget-${Math.random().toString(36).substring(2, 6)}` });
    setActiveMenuId(null);
  };

  // Calculate word count across document
  // ⚡ Bolt Optimization: Memoize wordCount calculation to prevent O(N) string splitting on every render
  const wordCount = React.useMemo(() => blocks.reduce((acc, b) => acc + (b.content ? b.content.trim().split(/\s+/).filter(Boolean).length : 0), 0), [blocks]);

  // ⚡ Bolt Optimization: Memoize headingBlock find operation to avoid O(N) search on every render
  const headingBlock = React.useMemo(() => blocks.find(b => b.type === 'heading' && b.properties?.level === 1), [blocks]);
  const displayTitle = pageMeta?.title || headingBlock?.content || 'Untitled Document';

  const fontClass = pageMeta?.fontStyle === 'serif' 
    ? 'font-serif' 
    : pageMeta?.fontStyle === 'mono' 
    ? 'font-mono' 
    : 'font-sans';

  const layoutClass = pageMeta?.fullWidth ? 'max-w-6xl px-8' : 'max-w-3xl px-4';

  const backlinks = React.useMemo(() => {
    const list: Array<{ pageId: string; pageTitle: string; pageIcon: string; blockContent: string; blockId: string }> = [];
    const seenBlockIds = new Set<string>();

    // ⚡ Bolt Optimization: Pre-calculate map and common find operations outside the loop
    // to prevent O(N) array scans inside the block iteration.
    const pagesMap = new Map(allPages.map(p => [p.id, p]));
    let precomputedRootTitle: string | undefined;

    allBlocks.forEach(block => {
      const sourceId = block.parentId || 'root-doc-node';
      if (sourceId === activePage) return;

      if (!block.content) return;
      const matches = [...block.content.matchAll(/\[\[(.*?)\]\]/g)];
      matches.forEach(match => {
        const pageName = match[1]?.replace(/[\[\]]/g, '').trim();
        if (!pageName) return;

        const targetId = `page-${pageName.toLowerCase().replace(/\s+/g, '-')}`;
        const isMatch = targetId === activePage || (activePage === 'root-doc-node' && pageName.toLowerCase() === 'root note');

        if (isMatch) {
          if (!seenBlockIds.has(block.id)) {
            seenBlockIds.add(block.id);

            const sourceMeta = pagesMap.get(sourceId);
            let sourceTitle = sourceMeta?.title;
            if (!sourceTitle) {
              if (sourceId === 'root-doc-node') {
                if (precomputedRootTitle === undefined) {
                  const rootHeading = allBlocks.find(b => b.type === 'heading' && b.properties?.level === 1 && (!b.parentId || b.parentId === 'root-doc-node'));
                  precomputedRootTitle = rootHeading?.content || 'Root Note';
                }
                sourceTitle = precomputedRootTitle;
              } else {
                const rawName = sourceId.startsWith('page-') ? sourceId.slice(5) : sourceId;
                sourceTitle = rawName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
              }
            }

            const sourceIcon = sourceMeta?.icon || (sourceId === 'root-doc-node' ? '📁' : '📄');

            list.push({
              pageId: sourceId,
              pageTitle: sourceTitle,
              pageIcon: sourceIcon,
              blockContent: block.content,
              blockId: block.id
            });
          }
        }
      });
    });

    return list;
  }, [allBlocks, allPages, activePage]);

  return (
    <div className={`w-full mx-auto py-8 space-y-0.5 min-h-[60vh] transition-all ${fontClass} ${layoutClass}`} onClick={(e) => {
      if (e.target === e.currentTarget && blocks.length > 0) {
        setFocusBlockId(blocks[blocks.length - 1].id);
      }
    }}>
      {/* Floating Rich Text Format Toolbar */}
      <FloatingBubbleMenu />

      {/* AFFiNE Document Header */}
      <PageHeader
        title={displayTitle}
        icon={pageMeta?.icon}
        coverUrl={pageMeta?.coverUrl}
        createdAt={pageMeta?.createdAt}
        blocksCount={blocks.length}
        wordCount={wordCount}
        isInfoExpanded={pageMeta?.isInfoExpanded !== false}
        onInfoExpandedChange={(expanded) => updatePageMeta({ isInfoExpanded: expanded })}
        onTitleChange={(newTitle) => {
          updatePageMeta({ title: newTitle });
          if (headingBlock) {
            updateBlockContent(headingBlock.id, newTitle);
          }
          if (onRenamePage && activePage !== 'root-doc-node') {
            onRenamePage(pageMeta?.title || '', newTitle);
          }
        }}
        onIconChange={(icon) => updatePageMeta({ icon })}
        onCoverChange={(coverUrl) => updatePageMeta({ coverUrl })}
      />

      {blocks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground opacity-60">
          <span className="text-4xl mb-3">📝</span>
          <p className="text-sm font-medium">This document is empty</p>
          <p className="text-xs mt-1">Start typing or type '/' for commands</p>
          <button
            onClick={() => handleCreateBlock('root')}
            className="mt-4 px-4 py-1.5 bg-accent/10 text-accent rounded-md text-xs font-semibold hover:bg-accent/20 transition-colors"
          >
            Create first block
          </button>
        </div>
      )}

      {blocks.map((block, index) => {
        const isFocused = focusBlockId === block.id;

        return (
          <BlockRow
            key={block.id}
            block={block}
            index={index}
            isFocused={isFocused}
            activeMenuId={activeMenuId}
            activePage={activePage}
            onRenamePage={onRenamePage}
            handleCreateBlock={handleCreateBlock}
            handleBackspaceBlock={handleBackspaceBlock}
            handleAddWidget={handleAddWidget}
            updateBlockContent={updateBlockContent}
            updateBlockType={updateBlockType}
            deleteBlock={deleteBlock}
            setActiveMenuId={setActiveMenuId}
            draggedBlockId={draggedBlockId}
            dragOverBlockId={dragOverBlockId}
            handleDragStart={handleDragStart}
            handleDragOver={handleDragOver}
            handleDrop={handleDrop}
            setFocusBlockId={setFocusBlockId}
            titleOnFocusRef={titleOnFocusRef}
            updateBlockProperties={updateBlockProperties}
            duplicateBlock={duplicateBlock}
            handleEnterBlock={handleEnterBlock}
          />
        );
      })}

      {/* Backlinks Section */}
      <div className="mt-12 select-none border-t border-border pt-8 pb-12">
        <div className="flex flex-col gap-3">
          {/* Header Row */}
          <button
            type="button"
            onClick={() => setIsBacklinksExpanded(!isBacklinksExpanded)}
            className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider w-fit"
            aria-expanded={isBacklinksExpanded}
            aria-label={`${backlinks.length} backlinks`}
          >
            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isBacklinksExpanded ? 'rotate-90' : ''}`} />
            <Link2 className="w-3.5 h-3.5" />
            <span>{backlinks.length} Backlinks</span>
          </button>

          {/* Collapsible Content */}
          {isBacklinksExpanded && (
            <div className="pl-5">
              {backlinks.length === 0 ? (
                <p className="text-xs text-muted-foreground italic font-light">
                  No pages link to this document.
                </p>
              ) : (
                <div className="max-h-60 overflow-y-auto space-y-2 pr-2 scrollbar-thin">
                  {backlinks.map((backlink) => (
                    <button
                      key={backlink.blockId}
                      type="button"
                      onClick={() => {
                        if (onPageSelect) {
                          onPageSelect(backlink.pageId);
                        }
                      }}
                      className="w-full text-left p-2.5 rounded-xl border border-border bg-muted/30 hover:bg-muted/80 hover:border-border transition-all duration-200 flex flex-col gap-1.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent group"
                    >
                      {/* Referencing Page Info */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm shrink-0">{backlink.pageIcon}</span>
                        <span className="text-xs font-semibold text-foreground group-hover:text-accent transition-colors truncate min-w-0">
                          {backlink.pageTitle}
                        </span>
                      </div>

                      {/* Context Content Block Preview */}
                      <div className="text-[11px] text-muted-foreground font-normal leading-relaxed truncate min-w-0 pl-6 border-l border-border">
                        {backlink.blockContent}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
