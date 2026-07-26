// @ts-nocheck
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
import { BlockRow } from './BlockRow.js';

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

  // Subview states for lightweight AFFiNE view chooser
  const [subView, setSubView] = useState<'doc' | 'kanban' | 'table' | 'edgeless'>('doc');
  const [edgelessPositions, setEdgelessPositions] = useState<Record<string, { x: number, y: number }>>({});
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [elementStartPos, setElementStartPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const newPositions = { ...edgelessPositions };
    let changed = false;
    blocks.forEach((block, index) => {
      if (!newPositions[block.id]) {
        newPositions[block.id] = {
          x: 40 + (index % 3) * 280,
          y: 40 + Math.floor(index / 3) * 220
        };
        changed = true;
      }
    });
    if (changed) {
      setEdgelessPositions(newPositions);
    }
  }, [blocks]);

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
        viewMode={subView}
        onViewModeChange={setSubView}
      />

      {subView === 'doc' && (
        <>
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
        </>
      )}

      {subView === 'kanban' && (
        <div className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* COLUMN 1: Drafts & Notes */}
          <div className="bg-slate-50 dark:bg-zinc-900/40 p-4 rounded-2xl border border-slate-200/50 dark:border-zinc-800/60 flex flex-col min-h-[400px]">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200/50 dark:border-zinc-800/50">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-400 dark:text-zinc-500 flex items-center gap-2">
                📄 Notes & Drafts
              </span>
              <span className="text-[11px] bg-slate-200 dark:bg-zinc-800 px-2 py-0.5 rounded-full font-bold text-slate-600 dark:text-zinc-400">
                {blocks.filter(b => b.type !== 'todo' && b.content.trim() !== '').length}
              </span>
            </div>
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[500px] pr-1">
              {blocks
                .filter(b => b.type !== 'todo' && b.content.trim() !== '')
                .map(block => (
                  <div key={block.id} className="p-3 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/60 rounded-xl shadow-sm hover:shadow-md transition-shadow group/card relative">
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-indigo-500 dark:text-indigo-400 font-semibold uppercase bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded text-[9px] shrink-0">
                        {block.type}
                      </span>
                      <div className="text-xs text-slate-700 dark:text-zinc-300 break-words whitespace-pre-wrap flex-1">
                        {block.content}
                      </div>
                    </div>
                  </div>
                ))}
              {blocks.filter(b => b.type !== 'todo' && b.content.trim() !== '').length === 0 && (
                <div className="text-center py-8 text-xs text-slate-400 dark:text-zinc-600 italic">No notes or drafts yet.</div>
              )}
            </div>
          </div>

          {/* COLUMN 2: To Do */}
          <div className="bg-slate-50 dark:bg-zinc-900/40 p-4 rounded-2xl border border-slate-200/50 dark:border-zinc-800/60 flex flex-col min-h-[400px]">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200/50 dark:border-zinc-800/50">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-400 dark:text-zinc-500 flex items-center gap-2">
                ⭕ To Do
              </span>
              <span className="text-[11px] bg-slate-200 dark:bg-zinc-800 px-2 py-0.5 rounded-full font-bold text-slate-600 dark:text-zinc-400">
                {blocks.filter(b => b.type === 'todo' && !b.properties?.checked).length}
              </span>
            </div>
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[500px] pr-1">
              {blocks
                .filter(b => b.type === 'todo' && !b.properties?.checked)
                .map(block => (
                  <div key={block.id} className="p-3 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/60 rounded-xl shadow-sm hover:shadow-md transition-shadow flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={false}
                      onChange={() => updateBlockProperties(block.id, { checked: true })}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0"
                    />
                    <input
                      type="text"
                      value={block.content}
                      onChange={(e) => updateBlockContent(block.id, e.target.value)}
                      placeholder="Task content..."
                      className="text-xs text-slate-700 dark:text-zinc-300 bg-transparent border-none p-0 focus:ring-0 flex-1 min-w-0"
                    />
                    <button
                      onClick={() => deleteBlock(block.id)}
                      className="text-slate-300 hover:text-rose-500 transition-colors p-0.5"
                      title="Delete Task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              {blocks.filter(b => b.type === 'todo' && !b.properties?.checked).length === 0 && (
                <div className="text-center py-8 text-xs text-slate-400 dark:text-zinc-600 italic">No pending tasks.</div>
              )}
            </div>
            <button
              onClick={() => {
                const newId = addBlock(blocks[blocks.length - 1]?.id || 'root', 'todo', '');
                updateBlockProperties(newId, { checked: false });
              }}
              className="mt-3 w-full py-2 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800/50 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Task
            </button>
          </div>

          {/* COLUMN 3: Done */}
          <div className="bg-slate-50 dark:bg-zinc-900/40 p-4 rounded-2xl border border-slate-200/50 dark:border-zinc-800/60 flex flex-col min-h-[400px]">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200/50 dark:border-zinc-800/50">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-400 dark:text-zinc-500 flex items-center gap-2">
                ✅ Done
              </span>
              <span className="text-[11px] bg-slate-200 dark:bg-zinc-800 px-2 py-0.5 rounded-full font-bold text-slate-600 dark:text-zinc-400">
                {blocks.filter(b => b.type === 'todo' && b.properties?.checked).length}
              </span>
            </div>
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[500px] pr-1">
              {blocks
                .filter(b => b.type === 'todo' && b.properties?.checked)
                .map(block => (
                  <div key={block.id} className="p-3 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/60 rounded-xl shadow-sm hover:shadow-md transition-shadow flex items-start gap-3 opacity-60">
                    <input
                      type="checkbox"
                      checked={true}
                      onChange={() => updateBlockProperties(block.id, { checked: false })}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0"
                    />
                    <span className="text-xs text-slate-500 line-through break-words whitespace-pre-wrap flex-1">
                      {block.content || 'Untitled Done Task'}
                    </span>
                    <button
                      onClick={() => deleteBlock(block.id)}
                      className="text-slate-300 hover:text-rose-500 transition-colors p-0.5"
                      title="Delete Task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              {blocks.filter(b => b.type === 'todo' && b.properties?.checked).length === 0 && (
                <div className="text-center py-8 text-xs text-slate-400 dark:text-zinc-600 italic">No completed tasks.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {subView === 'table' && (
        <div className="pt-4 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-950/60 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-zinc-900/60 border-b border-slate-200 dark:border-zinc-800 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  <th className="px-4 py-3 w-32">Block Type</th>
                  <th className="px-4 py-3">Content</th>
                  <th className="px-4 py-3 w-28">Status</th>
                  <th className="px-4 py-3 w-24">Words</th>
                  <th className="px-4 py-3 w-16">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 dark:divide-zinc-800/80 text-xs">
                {blocks.map(block => {
                  const isTodo = block.type === 'todo';
                  const isChecked = block.properties?.checked;
                  const words = block.content ? block.content.trim().split(/\s+/).filter(Boolean).length : 0;

                  return (
                    <tr key={block.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-500 dark:text-zinc-400 uppercase text-[10px] tracking-wider">
                        {block.type}
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={block.content}
                          onChange={(e) => updateBlockContent(block.id, e.target.value)}
                          placeholder="Enter block content..."
                          className="w-full bg-transparent border-none p-0 focus:ring-0 text-slate-800 dark:text-zinc-200"
                        />
                      </td>
                      <td className="px-4 py-3">
                        {isTodo ? (
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => updateBlockProperties(block.id, { checked: !isChecked })}
                              className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-[10px] font-semibold text-slate-500">
                              {isChecked ? 'Done' : 'Pending'}
                            </span>
                          </label>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400">
                            Block
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-400 dark:text-zinc-500 font-mono">
                        {words}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => deleteBlock(block.id)}
                          className="text-slate-300 hover:text-rose-500 transition-colors p-1"
                          title="Delete Block"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {subView === 'edgeless' && (
        <div className="pt-4 relative w-full h-[600px] border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-slate-50 dark:bg-zinc-950 shadow-inner select-none"
          style={{
            backgroundImage: 'radial-gradient(var(--pattern-color, #cbd5e1) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
            '--pattern-color': 'rgba(148, 163, 184, 0.15)'
          } as any}
          onMouseMove={(e) => {
            if (activeDragId && edgelessPositions[activeDragId]) {
              const deltaX = e.clientX - dragStartPos.x;
              const deltaY = e.clientY - dragStartPos.y;
              setEdgelessPositions(prev => ({
                ...prev,
                [activeDragId]: {
                  x: elementStartPos.x + deltaX,
                  y: elementStartPos.y + deltaY
                }
              }));
            }
          }}
          onMouseUp={() => setActiveDragId(null)}
          onMouseLeave={() => setActiveDragId(null)}
        >
          <div className="absolute top-4 left-4 z-10 px-2.5 py-1 bg-white/80 dark:bg-zinc-900/80 backdrop-blur border border-slate-200/50 dark:border-zinc-800/60 rounded-xl text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
            🎨 Drag cards to arrange freely (Edgeless Preview)
          </div>

          <div className="absolute inset-0 overflow-auto">
            {blocks.map(block => {
              const pos = edgelessPositions[block.id] || { x: 40, y: 40 };

              return (
                <div
                  key={block.id}
                  style={{
                    position: 'absolute',
                    left: pos.x,
                    top: pos.y,
                    width: 250,
                    transform: 'translate3d(0,0,0)'
                  }}
                  className="p-3 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/60 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-150 cursor-grab active:cursor-grabbing select-none"
                  onMouseDown={(e) => {
                    if ((e.target as HTMLElement).closest('input, button, select, textarea')) return;
                    e.preventDefault();
                    setActiveDragId(block.id);
                    setDragStartPos({ x: e.clientX, y: e.clientY });
                    setElementStartPos({ x: pos.x, y: pos.y });
                  }}
                >
                  <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-100 dark:border-zinc-800/60 text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase">
                    <span>{block.type}</span>
                    <button
                      onClick={() => deleteBlock(block.id)}
                      className="text-slate-300 hover:text-rose-500 p-0.5 rounded transition-colors"
                      title="Delete Block"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  {block.type === 'todo' ? (
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={block.properties?.checked || false}
                        onChange={() => updateBlockProperties(block.id, { checked: !block.properties?.checked })}
                        className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <span className={`text-xs text-slate-700 dark:text-zinc-300 ${block.properties?.checked ? 'line-through opacity-50' : ''}`}>
                        {block.content || 'Untitled task'}
                      </span>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-700 dark:text-zinc-300 break-words whitespace-pre-wrap">
                      {block.content || <span className="italic opacity-40">Empty {block.type} block</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
