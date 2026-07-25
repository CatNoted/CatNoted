import React, { useState, useEffect, useRef } from 'react';
import { useDocumentStore } from '../store.js';
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

import { 
  Plus, 
  Trash2, 
  Heading1, 
  Heading2, 
  AlignLeft, 
  Cpu, 
  GripVertical,
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
}

export const DocumentEditor: React.FC<DocumentEditorProps> = ({
  activePage = 'root-doc-node',
  onRenamePage
}) => {
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
      const fromIndex = blocks.findIndex(b => b.id === draggedBlockId);
      const toIndex = blocks.findIndex(b => b.id === id);

      if (fromIndex !== -1 && toIndex !== -1) {
        deleteBlock(draggedBlockId);
        moveBlock(fromIndex, toIndex);
      }
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
  const wordCount = blocks.reduce((acc, b) => acc + (b.content ? b.content.trim().split(/\s+/).filter(Boolean).length : 0), 0);

  const headingBlock = blocks.find(b => b.type === 'heading' && b.properties?.level === 1);
  const displayTitle = pageMeta?.title || headingBlock?.content || 'Untitled Document';

  const fontClass = pageMeta?.fontStyle === 'serif' 
    ? 'font-serif' 
    : pageMeta?.fontStyle === 'mono' 
    ? 'font-mono' 
    : 'font-sans';

  const layoutClass = pageMeta?.fullWidth ? 'max-w-6xl px-8' : 'max-w-3xl px-4';

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
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-zinc-500 opacity-60">
          <span className="text-4xl mb-3">📝</span>
          <p className="text-sm font-medium">This document is empty</p>
          <p className="text-xs mt-1">Start typing or type '/' for commands</p>
          <button
            onClick={() => handleCreateBlock('root')}
            className="mt-4 px-4 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-md text-xs font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors"
          >
            Create first block
          </button>
        </div>
      )}

      {blocks.map((block, index) => {
        const isFocused = focusBlockId === block.id;

        return (
          <div 
            key={block.id} 
            draggable
            onDragStart={(e) => handleDragStart(e, block.id)}
            onDragOver={(e) => handleDragOver(e, block.id)}
            onDrop={(e) => handleDrop(e, block.id)}
            className={`group flex items-start gap-0 px-2 py-0.5 rounded-lg transition-all hover:bg-slate-50/80 dark:hover:bg-zinc-900/30 hover:shadow-sm hover:ring-1 hover:ring-slate-100 dark:hover:ring-zinc-800/60 ${dragOverBlockId === block.id ? "border-t-2 border-indigo-500" : ""}`}
          >
            {/* Left Block Controls */}
            <div className={`w-10 flex-shrink-0 flex items-start justify-end gap-0.5 ${activeMenuId === block.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity ${
              block.type === 'heading'
                ? block.properties?.level === 1
                  ? 'pt-[10px]'
                  : block.properties?.level === 2
                  ? 'pt-[8px]'
                  : 'pt-[6px]'
                : 'pt-[6px]'
            }`}>
              <button
                type="button"
                onClick={() => handleCreateBlock(block.id)}
                title="Add block below"
                className="p-0.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                <Plus className="w-3 h-3" />
              </button>
              
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setActiveMenuId(activeMenuId === block.id ? null : block.id)}
                  title="Block settings"
                  className="p-0.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-grab active:cursor-grabbing"
                >
                  <GripVertical className="w-3 h-3" />
                </button>

                {activeMenuId === block.id && (
                  <div className="absolute left-0 mt-1 w-44 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl z-50 py-1 text-xs">
                    <button
                      onClick={() => {
                        updateBlockType(block.id, 'text');
                        setActiveMenuId(null);
                      }}
                      className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200"
                    >
                      <AlignLeft className="w-3.5 h-3.5" /> Text Paragraph
                    </button>
                    <button
                      onClick={() => {
                        updateBlockType(block.id, 'heading', { level: 1 });
                        setActiveMenuId(null);
                      }}
                      className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200"
                    >
                      <Heading1 className="w-3.5 h-3.5" /> Heading 1
                    </button>
                    <button
                      onClick={() => {
                        updateBlockType(block.id, 'heading', { level: 2 });
                        setActiveMenuId(null);
                      }}
                      className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200"
                    >
                      <Heading2 className="w-3.5 h-3.5" /> Heading 2
                    </button>
                    <button
                      onClick={() => {
                        updateBlockType(block.id, 'callout', { calloutIcon: '💡', calloutBg: 'indigo' });
                        setActiveMenuId(null);
                      }}
                      className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200"
                    >
                      <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Callout
                    </button>
                    <button
                      onClick={() => {
                        updateBlockType(block.id, 'toggle', { expanded: true });
                        setActiveMenuId(null);
                      }}
                      className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200"
                    >
                      <ChevronRight className="w-3.5 h-3.5 text-indigo-500" /> Toggle List
                    </button>
                    <button
                      onClick={() => {
                        updateBlockType(block.id, 'code', { language: 'javascript' });
                        setActiveMenuId(null);
                      }}
                      className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200"
                    >
                      <Code className="w-3.5 h-3.5" /> Code Block
                    </button>
                    <button
                      onClick={() => {
                        updateBlockType(block.id, 'math');
                        setActiveMenuId(null);
                      }}
                      className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200"
                    >
                      <Sigma className="w-3.5 h-3.5 text-purple-500" /> Math Formula
                    </button>
                    <button
                      onClick={() => {
                        updateBlockType(block.id, 'table');
                        setActiveMenuId(null);
                      }}
                      className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200"
                    >
                      <TableIcon className="w-3.5 h-3.5 text-emerald-500" /> Table
                    </button>
                    <button
                      onClick={() => {
                        updateBlockType(block.id, 'embed');
                        setActiveMenuId(null);
                      }}
                      className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200"
                    >
                      <Link2 className="w-3.5 h-3.5 text-indigo-500" /> Embed Page
                    </button>
                    <button
                      onClick={() => {
                        duplicateBlock(block.id);
                        setActiveMenuId(null);
                      }}
                      className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200"
                    >
                      <Copy className="w-3.5 h-3.5" /> Duplicate
                    </button>
                    <button
                      onClick={() => handleAddWidget(block.id)}
                      className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-zinc-800 text-indigo-600 dark:text-indigo-400 font-semibold"
                    >
                      <Cpu className="w-3.5 h-3.5" /> Insert AI Widget
                    </button>
                    <div className="border-t border-slate-100 dark:border-zinc-800 my-1"></div>
                    <button
                      onClick={() => {
                        deleteBlock(block.id);
                        setActiveMenuId(null);
                      }}
                      className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-zinc-800 text-red-500 font-medium"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete Block
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Block Content Renderers */}
            <div className="flex-1 min-w-0 w-full pl-0">
              {block.type === 'heading' && (
                <HeadingBlock
                  id={block.id}
                  type={block.type}
                  content={block.content}
                  level={block.properties?.level || 2}
                  onChange={(val) => updateBlockContent(block.id, val)}
                  onEnter={() => handleEnterBlock(block.id, index)}
                  onBackspace={() => handleBackspaceBlock(block.id, index)}
                  onSetType={(type, props) => updateBlockType(block.id, type as any, props)}
                  onAddWidget={() => handleAddWidget(block.id)}
                  onFocus={() => {
                    setFocusBlockId(block.id);
                    if (index === 0 && block.properties?.level === 1 && activePage !== 'root-doc-node') {
                      titleOnFocusRef.current = block.content;
                    }
                  }}
                  onBlur={() => {
                    if (index === 0 && block.properties?.level === 1 && activePage !== 'root-doc-node' && onRenamePage) {
                      const oldTitle = titleOnFocusRef.current.trim();
                      const newTitle = block.content.trim();
                      if (oldTitle && newTitle && oldTitle !== newTitle) {
                        onRenamePage(oldTitle, newTitle);
                      }
                    }
                  }}
                  focusOnMount={isFocused}
                />
              )}

              {block.type === 'text' && (
                <TextBlock
                  id={block.id}
                  type={block.type}
                  content={block.content}
                  onChange={(val) => updateBlockContent(block.id, val)}
                  onEnter={() => handleEnterBlock(block.id, index)}
                  onBackspace={() => handleBackspaceBlock(block.id, index)}
                  onSetType={(type, props) => updateBlockType(block.id, type as any, props)}
                  onAddWidget={() => handleAddWidget(block.id)}
                  focusOnMount={isFocused}
                  blockType={block.type}
                  onFocus={() => setFocusBlockId(block.id)}
                />
              )}

              {/* --- Callout block --- */}
              {block.type === 'callout' && (
                <CalloutBlock
                  id={block.id}
                  content={block.content}
                  icon={block.properties?.calloutIcon || '💡'}
                  bg={block.properties?.calloutBg || 'indigo'}
                  onChange={(val) => updateBlockContent(block.id, val)}
                  onUpdateProps={(props) => updateBlockProperties(block.id, props)}
                  onEnter={() => handleEnterBlock(block.id, index)}
                  onBackspace={() => handleBackspaceBlock(block.id, index)}
                  onFocus={() => setFocusBlockId(block.id)}
                  focusOnMount={isFocused}
                />
              )}

              {/* --- Toggle block --- */}
              {block.type === 'toggle' && (
                <ToggleBlock
                  id={block.id}
                  content={block.content}
                  expanded={block.properties?.expanded !== false}
                  onChange={(val) => updateBlockContent(block.id, val)}
                  onUpdateProps={(props) => updateBlockProperties(block.id, props)}
                  onEnter={() => handleEnterBlock(block.id, index)}
                  onBackspace={() => handleBackspaceBlock(block.id, index)}
                  onFocus={() => setFocusBlockId(block.id)}
                  focusOnMount={isFocused}
                />
              )}

              {/* --- Code block --- */}
              {block.type === 'code' && (
                <CodeBlock
                  id={block.id}
                  content={block.content}
                  language={block.properties?.language || 'javascript'}
                  onChange={(val) => updateBlockContent(block.id, val)}
                  onUpdateProps={(props) => updateBlockProperties(block.id, props)}
                  onDelete={() => deleteBlock(block.id)}
                />
              )}

              {/* --- Embed page reference block --- */}
              {block.type === 'embed' && (
                <EmbedBlock
                  id={block.id}
                  refPageId={block.properties?.refPageId}
                  activePage={activePage}
                  onUpdateProps={(props) => updateBlockProperties(block.id, props)}
                  onDelete={() => deleteBlock(block.id)}
                />
              )}

              {/* --- Math formula block --- */}
              {block.type === 'math' && (
                <MathBlock
                  id={block.id}
                  content={block.content}
                  onChange={(val) => updateBlockContent(block.id, val)}
                  onDelete={() => deleteBlock(block.id)}
                />
              )}

              {/* --- Table grid block --- */}
              {block.type === 'table' && (
                <TableBlock
                  id={block.id}
                  rows={block.properties?.rows}
                  onUpdateProps={(props) => updateBlockProperties(block.id, props)}
                  onDelete={() => deleteBlock(block.id)}
                />
              )}

              {/* --- Web bookmark block --- */}
              {block.type === 'bookmark' && (
                <BookmarkBlock
                  id={block.id}
                  bookmarkUrl={block.properties?.bookmarkUrl}
                  bookmarkTitle={block.properties?.bookmarkTitle}
                  bookmarkDescription={block.properties?.bookmarkDescription}
                  bookmarkFavicon={block.properties?.bookmarkFavicon}
                  onUpdateProps={(props) => updateBlockProperties(block.id, props)}
                  onDelete={() => deleteBlock(block.id)}
                />
              )}

              {/* --- Image media block --- */}
              {block.type === 'image' && (
                <ImageBlock
                  id={block.id}
                  url={block.properties?.url}
                  caption={block.properties?.caption}
                  width={block.properties?.width}
                  align={block.properties?.align}
                  onUpdateProps={(props) => updateBlockProperties(block.id, props)}
                  onDelete={() => deleteBlock(block.id)}
                />
              )}

              {/* --- Bullet list --- */}
              {block.type === 'bullet' && (
                <div className="flex items-start gap-2">
                  <div className="flex flex-col flex-shrink-0">
                    {block.content.split('\n').map((_, i) => (
                      <div key={i} className="h-7 w-1.5 flex items-center justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-zinc-500" />
                      </div>
                    ))}
                  </div>
                  <TextBlock
                    id={block.id}
                    type={block.type}
                    content={block.content}
                    onChange={(val) => updateBlockContent(block.id, val)}
                    onEnter={() => handleEnterBlock(block.id, index)}
                    onBackspace={() => handleBackspaceBlock(block.id, index)}
                    onSetType={(type, props) => updateBlockType(block.id, type as any, props)}
                    onAddWidget={() => handleAddWidget(block.id)}
                    focusOnMount={isFocused}
                    blockType={block.type}
                    onFocus={() => setFocusBlockId(block.id)}
                  />
                </div>
              )}

              {/* --- Ordered list --- */}
              {block.type === 'ordered' && (
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 text-xs font-medium text-slate-400 dark:text-zinc-500 flex-shrink-0 w-4 text-right">
                    {index + 1}.
                  </span>
                  <TextBlock
                    id={block.id}
                    type={block.type}
                    content={block.content}
                    onChange={(val) => updateBlockContent(block.id, val)}
                    onEnter={() => handleEnterBlock(block.id, index)}
                    onBackspace={() => handleBackspaceBlock(block.id, index)}
                    onSetType={(type, props) => updateBlockType(block.id, type as any, props)}
                    onAddWidget={() => handleAddWidget(block.id)}
                    focusOnMount={isFocused}
                    blockType={block.type}
                    onFocus={() => setFocusBlockId(block.id)}
                  />
                </div>
              )}

              {/* --- To-do / checkbox --- */}
              {block.type === 'todo' && (
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={!!block.properties?.checked}
                    onChange={(e) =>
                      updateBlockType(block.id, 'todo' as any, {
                        ...block.properties,
                        checked: e.target.checked,
                      })
                    }
                    className="mt-1 w-3.5 h-3.5 rounded border-slate-300 dark:border-zinc-600 accent-indigo-500 flex-shrink-0 cursor-pointer"
                  />
                  <TextBlock
                    id={block.id}
                    type={block.type}
                    content={block.content}
                    onChange={(val) => updateBlockContent(block.id, val)}
                    onEnter={() => handleEnterBlock(block.id, index)}
                    onBackspace={() => handleBackspaceBlock(block.id, index)}
                    onSetType={(type, props) => updateBlockType(block.id, type as any, props)}
                    onAddWidget={() => handleAddWidget(block.id)}
                    focusOnMount={isFocused}
                    blockType={block.type}
                    onFocus={() => setFocusBlockId(block.id)}
                  />
                </div>
              )}

              {/* --- Quote --- */}
              {block.type === 'quote' && (
                <div className="flex gap-3">
                  <div className="w-0.5 bg-indigo-400 dark:bg-indigo-500 rounded-full flex-shrink-0 self-stretch" />
                  <TextBlock
                    id={block.id}
                    type={block.type}
                    content={block.content}
                    onChange={(val) => updateBlockContent(block.id, val)}
                    onEnter={() => handleEnterBlock(block.id, index)}
                    onBackspace={() => handleBackspaceBlock(block.id, index)}
                    onSetType={(type, props) => updateBlockType(block.id, type as any, props)}
                    onAddWidget={() => handleAddWidget(block.id)}
                    focusOnMount={isFocused}
                    blockType={block.type}
                    onFocus={() => setFocusBlockId(block.id)}
                  />
                </div>
              )}

              {/* --- Divider --- */}
              {block.type === 'divider' && (
                <div className="py-2">
                  <hr className="border-slate-200 dark:border-zinc-700" />
                </div>
              )}

              {/* --- AI Widget --- */}
              {block.type === 'widget' && (
                block.properties?.srcDoc ? (
                  <div className="w-full my-4 border border-slate-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
                    <div className="h-8 border-b border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 px-3 flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>Widget Render Sandbox</span>
                      <button 
                        onClick={() => deleteBlock(block.id)}
                        className="text-red-400 hover:text-red-500 font-sans"
                      >
                        ✕ Remove
                      </button>
                    </div>
                    <SandboxFrame srcDoc={block.properties.srcDoc} theme="dark" />
                  </div>
                ) : (
                  <WidgetBlockPlaceholder
                    id={block.id}
                    properties={block.properties}
                    onDelete={() => deleteBlock(block.id)}
                  />
                )
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};