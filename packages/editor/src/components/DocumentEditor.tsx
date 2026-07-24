import React, { useState } from 'react';
import { useDocumentStore, Page, ydoc } from '../store.js';
import { TextBlock } from './TextBlock.js';
import { HeadingBlock } from './HeadingBlock.js';
import { WidgetBlockPlaceholder } from './WidgetBlockPlaceholder.js';
import { SandboxFrame } from '@catnoted/agent-runtime';
import { BlockNode } from '@catnoted/shared';
import { 
  Plus, 
  Trash2, 
  Heading1, 
  Heading2, 
  Heading3, 
  AlignLeft, 
  Cpu, 
  MoreVertical,
  GripVertical,
  FileText
} from 'lucide-react';

interface DocumentEditorProps {
  activePageId?: string;
  onPageSelect?: (pageId: string) => void;
}

export const DocumentEditor: React.FC<DocumentEditorProps> = ({
  activePageId = 'root-doc-node',
  onPageSelect
}) => {
  const { 
    blocks, 
    addBlock, 
    updateBlockContent, 
    updateBlockType, 
    deleteBlock,
    moveBlock,
    pages,
    renamePage
  } = useDocumentStore(activePageId);

  const [focusBlockId, setFocusBlockId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Find current page object
  const currentPage = pages.find(p => p.id === activePageId) || {
    id: activePageId,
    title: 'Untitled Note',
    createdAt: Date.now()
  };

  // Handle page title update
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    renamePage(activePageId, e.target.value);
  };

  const handleCreateBlock = (afterId: string, type: any = 'text') => {
    const newId = addBlock(afterId, type, '');
    setFocusBlockId(newId);
  };

  const handleBackspaceBlock = (id: string, index: number) => {
    if (blocks.length > 1) {
      deleteBlock(id);
      // Focus on the previous block
      const prevBlock = blocks[index - 1];
      if (prevBlock) {
        setFocusBlockId(prevBlock.id);
      }
    }
  };

  const handleEnterBlock = (block: any, index: number) => {
    if (['bullet', 'ordered', 'todo'].includes(block.type)) {
      if (block.content.trim() === '') {
        // Convert to text paragraph if empty on Enter
        updateBlockType(block.id, 'text');
      } else {
        // Continue list of the same type
        handleCreateBlock(block.id, block.type);
      }
    } else {
      handleCreateBlock(block.id, 'text');
    }
  };

  const handleAddWidget = (afterId: string) => {
    const newId = addBlock(afterId, 'widget', '');
    updateBlockType(newId, 'widget', { widgetId: `widget-${Math.random().toString(36).substring(2, 6)}` });
    setActiveMenuId(null);
  };

  // HTML5 Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', String(index));
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const sourceIndexStr = e.dataTransfer.getData('text/plain');
    if (sourceIndexStr === '') return;
    const sourceIndex = parseInt(sourceIndexStr, 10);
    if (isNaN(sourceIndex) || sourceIndex === targetIndex) return;

    moveBlock(sourceIndex, targetIndex);
    setDraggedIndex(sourceIndex); // just to set some state and satisfy strict typescript
  };

  // Filter out the first level-1 heading block from blocks display to avoid title redundancy
  const filteredBlocks = blocks.filter((block, idx) => {
    if (idx === 0 && block.type === 'heading' && block.properties?.level === 1) {
      return false;
    }
    return true;
  });

  // Backlinks Calculation
  const backlinks = React.useMemo(() => {
    if (!activePageId) return [];
    const list: Page[] = [];
    const activeTitle = currentPage.title.trim().toLowerCase();
    if (!activeTitle) return [];

    pages.forEach(p => {
      if (p.id === activePageId) return; // skip self

      const targetYblocks = p.id === 'root-doc-node' ? ydoc.getArray<BlockNode>('blocks') : ydoc.getArray<BlockNode>(`blocks-${p.id}`);
      const pageBlocks = targetYblocks.toArray();
      const hasLink = pageBlocks.some(b => {
        const text = b.content.toLowerCase();
        return text.includes(`[[${activeTitle}]]`);
      });

      if (hasLink) {
        list.push(p);
      }
    });

    return list;
  }, [activePageId, currentPage.title, pages, blocks]);

  const formattedDate = new Date(currentPage.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="max-w-3xl mx-auto py-10">

      {/* 1. Page Title & Metadata Section */}
      <div className="px-14 mb-8 space-y-2">
        <input
          type="text"
          value={currentPage.title}
          onChange={handleTitleChange}
          placeholder="Untitled Note"
          className="w-full bg-transparent border-none outline-none focus:ring-0 text-4xl font-bold text-slate-900 dark:text-zinc-100 p-0 leading-tight placeholder-slate-200 dark:placeholder-zinc-850"
        />
        <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-zinc-500 font-medium select-none">
          <span>Created: {formattedDate}</span>
          <span>•</span>
          <span>Local Workspace</span>
        </div>
      </div>

      {/* 2. Body Blocks List */}
      <div className="space-y-0.5">
        {filteredBlocks.map((block) => {
          const isFocused = focusBlockId === block.id;
          const originalIndex = blocks.findIndex(b => b.id === block.id);

          return (
            <div
              key={block.id}
              className="group flex items-start gap-0 px-4 py-0.5 rounded-lg transition-all hover:bg-slate-50/80 dark:hover:bg-zinc-900/30 hover:shadow-sm hover:ring-1 hover:ring-slate-100 dark:hover:ring-zinc-800/60"
            >
              {/* Left Block Controls - pt-[6px] to align controls with first line baseline */}
              <div className="w-14 flex-shrink-0 flex items-start justify-end gap-0.5 pt-[6px] opacity-0 group-hover:opacity-100 transition-opacity select-none">
                <button
                  type="button"
                  draggable
                  onDragStart={(e) => handleDragStart(e, originalIndex)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, originalIndex)}
                  title="Drag to reorder"
                  className="p-0.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-grab active:cursor-grabbing"
                >
                  <GripVertical className="w-3 h-3" />
                </button>

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
                    className="p-0.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    <MoreVertical className="w-3 h-3" />
                  </button>

                  {activeMenuId === block.id && (
                    <div className="absolute left-0 mt-1 w-40 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-lg z-50 py-1 text-xs">
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
                          updateBlockType(block.id, 'heading', { level: 3 });
                          setActiveMenuId(null);
                        }}
                        className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200"
                      >
                        <Heading3 className="w-3.5 h-3.5" /> Heading 3
                      </button>
                      <button
                        onClick={() => handleAddWidget(block.id)}
                        className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-zinc-800 text-indigo-600 dark:text-indigo-400"
                      >
                        <Cpu className="w-3.5 h-3.5" /> Insert AI Widget
                      </button>
                      <div className="border-t border-slate-100 dark:border-zinc-800 my-1"></div>
                      <button
                        onClick={() => {
                          deleteBlock(block.id);
                          setActiveMenuId(null);
                        }}
                        className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-zinc-800 text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete Block
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Block Content — always to the right of controls */}
              <div className="flex-1 min-w-0 pr-4">
                {block.type === 'heading' && (
                  <HeadingBlock
                    id={block.id}
                    content={block.content}
                    level={block.properties?.level || 2}
                    onChange={(val) => updateBlockContent(block.id, val)}
                    onEnter={() => handleEnterBlock(block, originalIndex)}
                    onBackspace={() => handleBackspaceBlock(block.id, originalIndex)}
                    onSetType={(type, props) => updateBlockType(block.id, type as any, props)}
                    onAddWidget={() => handleAddWidget(block.id)}
                    focusOnMount={isFocused}
                  />
                )}

                {block.type === 'text' && (
                  <TextBlock
                    id={block.id}
                    content={block.content}
                    onChange={(val) => updateBlockContent(block.id, val)}
                    onEnter={() => handleEnterBlock(block, originalIndex)}
                    onBackspace={() => handleBackspaceBlock(block.id, originalIndex)}
                    onSetType={(type, props) => updateBlockType(block.id, type as any, props)}
                    onAddWidget={() => handleAddWidget(block.id)}
                    focusOnMount={isFocused}
                  />
                )}

                {/* --- Bullet list - mt-[11px] to center bullet point correctly --- */}
                {block.type === 'bullet' && (
                  <div className="flex items-start gap-2">
                    <span className="mt-[11px] w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-zinc-500 flex-shrink-0" />
                    <TextBlock
                      id={block.id}
                      content={block.content}
                      onChange={(val) => updateBlockContent(block.id, val)}
                      onEnter={() => handleEnterBlock(block, originalIndex)}
                      onBackspace={() => handleBackspaceBlock(block.id, originalIndex)}
                      onSetType={(type, props) => updateBlockType(block.id, type as any, props)}
                      onAddWidget={() => handleAddWidget(block.id)}
                      focusOnMount={isFocused}
                    />
                  </div>
                )}

                {/* --- Ordered list - mt-[6px] to align numbers perfectly --- */}
                {block.type === 'ordered' && (
                  <div className="flex items-start gap-2">
                    <span className="mt-[6px] text-xs font-medium text-slate-400 dark:text-zinc-500 flex-shrink-0 w-4 text-right">
                      {originalIndex + 1}.
                    </span>
                    <TextBlock
                      id={block.id}
                      content={block.content}
                      onChange={(val) => updateBlockContent(block.id, val)}
                      onEnter={() => handleEnterBlock(block, originalIndex)}
                      onBackspace={() => handleBackspaceBlock(block.id, originalIndex)}
                      onSetType={(type, props) => updateBlockType(block.id, type as any, props)}
                      onAddWidget={() => handleAddWidget(block.id)}
                      focusOnMount={isFocused}
                    />
                  </div>
                )}

                {/* --- To-do / checkbox - mt-[6px] to align checkbox perfectly --- */}
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
                      className="mt-[6px] w-3.5 h-3.5 rounded border-slate-300 dark:border-zinc-600 accent-indigo-500 flex-shrink-0 cursor-pointer"
                    />
                    <TextBlock
                      id={block.id}
                      content={block.content}
                      onChange={(val) => updateBlockContent(block.id, val)}
                      onEnter={() => handleEnterBlock(block, originalIndex)}
                      onBackspace={() => handleBackspaceBlock(block.id, originalIndex)}
                      onSetType={(type, props) => updateBlockType(block.id, type as any, props)}
                      onAddWidget={() => handleAddWidget(block.id)}
                      focusOnMount={isFocused}
                    />
                  </div>
                )}

                {/* --- Quote --- */}
                {block.type === 'quote' && (
                  <div className="flex gap-3">
                    <div className="w-0.5 bg-indigo-400 dark:bg-indigo-500 rounded-full flex-shrink-0 self-stretch" />
                    <TextBlock
                      id={block.id}
                      content={block.content}
                      onChange={(val) => updateBlockContent(block.id, val)}
                      onEnter={() => handleEnterBlock(block, originalIndex)}
                      onBackspace={() => handleBackspaceBlock(block.id, originalIndex)}
                      onSetType={(type, props) => updateBlockType(block.id, type as any, props)}
                      onAddWidget={() => handleAddWidget(block.id)}
                      focusOnMount={isFocused}
                    />
                  </div>
                )}

                {/* --- Code block --- */}
                {block.type === 'code' && (
                  <div className="rounded-lg bg-slate-900 dark:bg-zinc-950 border border-slate-700 dark:border-zinc-800 px-4 py-3">
                    <textarea
                      value={block.content}
                      onChange={(e) => updateBlockContent(block.id, e.target.value)}
                      placeholder="// Code here..."
                      rows={3}
                      className="w-full bg-transparent resize-none border-none outline-none focus:ring-0 p-0 text-xs font-mono text-emerald-300 placeholder-slate-600 leading-relaxed"
                      style={{ minHeight: '3rem' }}
                    />
                  </div>
                )}

                {/* --- Divider --- */}
                {block.type === 'divider' && (
                  <div className="py-2">
                    <hr className="border-slate-200 dark:border-zinc-700" />
                  </div>
                )}

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

      {/* 3. Backlinks Section */}
      {backlinks.length > 0 && (
        <div className="mt-16 pt-8 border-t border-slate-200/50 dark:border-zinc-800/60 px-14 space-y-4">
          <div className="text-xs font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5 select-none">
            <span>Backlinks</span>
            <span className="text-[10px] bg-slate-100 dark:bg-zinc-800 text-slate-500 px-2 py-0.5 rounded-full font-bold">{backlinks.length}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {backlinks.map(link => (
              <button
                key={link.id}
                onClick={() => {
                  if (onPageSelect) onPageSelect(link.id);
                }}
                className="text-left p-3.5 rounded-2xl border border-slate-200/60 dark:border-zinc-800/60 bg-white/40 dark:bg-zinc-900/40 hover:bg-slate-50 dark:hover:bg-zinc-850 hover:border-indigo-300 dark:hover:border-indigo-500/30 transition-all flex items-center gap-2.5 group"
              >
                <FileText className="w-4 h-4 text-slate-400 dark:text-zinc-500 group-hover:text-indigo-500 transition-colors shrink-0" />
                <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300 group-hover:text-indigo-600 dark:hover:text-indigo-400 truncate">{link.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
