// @ts-nocheck
import React, { useRef, useState } from 'react';
import {
  Plus,
  Trash2,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  Cpu,
  MoreVertical
} from 'lucide-react';
import { TextBlock } from './TextBlock.js';
import { HeadingBlock } from './HeadingBlock.js';
import { WidgetBlockPlaceholder } from './WidgetBlockPlaceholder.js';
import { SandboxFrame } from '@catnoted/agent-runtime';
import { ToggleBlock } from './ToggleBlock.js';
import { KanbanBlock } from './KanbanBlock.js';
import { Columns } from 'lucide-react';

interface BlockRowProps {
  block: any;
  index: number;
  isFocused: boolean;
  activeMenuId: string | null;
  activePage: string;
  onRenamePage?: (oldTitle: string, newTitle: string) => void;
  handleCreateBlock: (id: string) => void;
  handleBackspaceBlock: (id: string, index: number) => void;
  handleAddWidget: (id: string) => void;
  updateBlockContent: (id: string, val: string) => void;
  updateBlockType: (id: string, type: any, props?: any) => void;
  deleteBlock: (id: string) => void;
  setActiveMenuId: (id: string | null) => void;
  draggedBlockId: string | null;
  dragOverBlockId: string | null;
  handleDragStart: (e: React.DragEvent, id: string) => void;
  handleDragOver: (e: React.DragEvent, id: string) => void;
  handleDrop: (e: React.DragEvent, id: string) => void;
  setFocusBlockId: (id: string | null) => void;
  titleOnFocusRef: React.MutableRefObject<string>;
  updateBlockProperties: (id: string, props: any) => void;
  duplicateBlock: (id: string) => void;
  handleEnterBlock: (id: string, index: number) => void;
}

const BlockRowBase: React.FC<BlockRowProps> = ({
  block,
  index,
  isFocused,
  activeMenuId,
  activePage,
  onRenamePage,
  handleCreateBlock,
  handleBackspaceBlock,
  handleAddWidget,
  updateBlockContent,
  updateBlockType,
  deleteBlock,
  setActiveMenuId,
  draggedBlockId,
  dragOverBlockId,
  handleDragStart,
  handleDragOver,
  handleDrop,
  setFocusBlockId,
  titleOnFocusRef,
  updateBlockProperties,
  duplicateBlock,
  handleEnterBlock,
}) => {
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

  const onEnterBlock = React.useCallback(() => handleEnterBlock(block.id, index), [handleEnterBlock, block.id, index]);
  const onBackspaceBlockInner = React.useCallback(() => handleBackspaceBlock(block.id, index), [handleBackspaceBlock, block.id, index]);
  const onSetTypeBlock = React.useCallback((type: any, props: any) => updateBlockType(block.id, type, props), [updateBlockType, block.id]);
  const onAddWidgetBlock = React.useCallback(() => handleAddWidget(block.id), [handleAddWidget, block.id]);
  const onChangeContent = React.useCallback((val: string) => updateBlockContent(block.id, val), [updateBlockContent, block.id]);

  return (
          <div
            key={block.id}
            className="group flex items-start gap-0 px-4 py-0.5 rounded-lg transition-all hover:bg-slate-50/80 dark:hover:bg-zinc-900/30 hover:shadow-sm hover:ring-1 hover:ring-slate-100 dark:hover:ring-zinc-800/60"
          >
            {/* Left Block Controls - fixed width gutter, never overlaps content */}
            <div className={`w-12 flex-shrink-0 flex items-start justify-end gap-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity ${
              block.type === 'heading'
                ? block.properties?.level === 1
                  ? 'pt-2'
                  : block.properties?.level === 2
                  ? 'pt-1.5'
                  : 'pt-1'
                : 'pt-1'
            }`}>
              <button
                type="button"
                onClick={() => handleCreateBlock(block.id)}
                title="Add block below"
                className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setActiveMenuId(activeMenuId === block.id ? null : block.id)}
                  title="Block settings"
                  className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  <MoreVertical className="w-3.5 h-3.5" />
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
                      onClick={() => {
                        updateBlockType(block.id, 'kanban', { title: 'Kanban Board', columns: [] });
                        setActiveMenuId(null);
                      }}
                      className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200"
                    >
                      <Columns className="w-3.5 h-3.5" /> Kanban Board
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
                  onChange={onChangeContent}
                  onEnter={onEnterBlock}
                  onBackspace={onBackspaceBlockInner}
                  onSetType={onSetTypeBlock}
                  onAddWidget={onAddWidgetBlock}
                  onFocus={() => {
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

              {block.type === 'kanban' && (
                <KanbanBlock
                  id={block.id}
                  title={block.properties?.title || block.content}
                  columns={block.properties?.columns}
                  onUpdateProps={(props) => updateBlockProperties(block.id, props)}
                  onUpdateContent={onChangeContent}
                  onDelete={() => deleteBlock(block.id)}
                />
              )}

              {block.type === 'text' && (
                <div className="group">
                  <TextBlock
                    id={block.id}
                    content={block.content}
                    onChange={onChangeContent}
                    onEnter={onEnterBlock}
                    onBackspace={onBackspaceBlockInner}
                    onSetType={onSetTypeBlock}
                    onAddWidget={onAddWidgetBlock}
                    focusOnMount={isFocused}
                    showLeftActions={true}
                    isFocused={isFocused}
                    onAddClick={() => handleCreateBlock(block.id)}
                    blockType={block.type}
                  />
                </div>
              )}

              {/* --- Toggle list --- */}
              {block.type === 'toggle' && (
                <ToggleBlock
                  id={block.id}
                  content={block.content}
                  expanded={block.properties?.expanded !== false}
                  onChange={onChangeContent}
                  onUpdateProps={(props) => updateBlockProperties(block.id, props)}
                  onEnter={onEnterBlock}
                  onBackspace={onBackspaceBlockInner}
                  onFocus={() => {}}
                  focusOnMount={isFocused}
                />
              )}

              {/* --- Bullet list --- */}
              {block.type === 'bullet' && (
                <div className="flex items-start gap-2">
                  <div className="flex flex-col flex-shrink-0">
                    {block.content.split('\n').map((_: any, i: number) => (
                      <div key={i} className="h-7 w-1.5 flex items-center justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-zinc-500" />
                      </div>
                    ))}
                  </div>
                  <TextBlock
                    id={block.id}
                    content={block.content}
                    onChange={onChangeContent}
                    onEnter={onEnterBlock}
                    onBackspace={onBackspaceBlockInner}
                    onSetType={onSetTypeBlock}
                    onAddWidget={onAddWidgetBlock}
                    focusOnMount={isFocused}
                    blockType={block.type}
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
                    content={block.content}
                    onChange={onChangeContent}
                    onEnter={onEnterBlock}
                    onBackspace={onBackspaceBlockInner}
                    onSetType={onSetTypeBlock}
                    onAddWidget={onAddWidgetBlock}
                    focusOnMount={isFocused}
                    blockType={block.type}
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
                    content={block.content}
                    onChange={onChangeContent}
                    onEnter={onEnterBlock}
                    onBackspace={onBackspaceBlockInner}
                    onSetType={onSetTypeBlock}
                    onAddWidget={onAddWidgetBlock}
                    focusOnMount={isFocused}
                    blockType={block.type}
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
                    onChange={onChangeContent}
                    onEnter={onEnterBlock}
                    onBackspace={onBackspaceBlockInner}
                    onSetType={onSetTypeBlock}
                    onAddWidget={onAddWidgetBlock}
                    focusOnMount={isFocused}
                    blockType={block.type}
                  />
                </div>
              )}

              {/* --- Code block --- */}
              {block.type === 'code' && (
                <div className="rounded-lg bg-slate-900 dark:bg-[#16161a] border border-slate-700 dark:border-zinc-800 px-4 py-3">
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
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-3">
                        <button
                          onClick={() => handleEditClick(block.id, block.properties?.srcDoc || '')}
                          className="text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 font-sans flex items-center gap-1 cursor-pointer font-medium"
                        >
                          ✎ Edit
                        </button>
                        <button
                          onClick={() => handleRerun(block.id)}
                          className="text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 font-sans flex items-center gap-1 cursor-pointer font-medium"
                        >
                          ↻ Rerun
                        </button>
                        <button
                          onClick={() => deleteBlock(block.id)}
                          className="text-red-400 hover:text-red-500 font-sans cursor-pointer font-medium"
                        >
                          ✕ Delete
                        </button>
                      </div>
                    </div>

                    {editingWidgetId === block.id && (
                      <div className="p-3 border-b border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/40 space-y-2">
                        <textarea
                          value={editorCode[block.id] ?? block.properties?.srcDoc ?? ''}
                          onChange={(e) => setEditorCode(prev => ({ ...prev, [block.id]: e.target.value }))}
                          className="w-full h-40 p-2 font-mono text-xs bg-slate-900 text-emerald-400 dark:bg-[#16161a] dark:text-emerald-400 rounded-lg border border-slate-200 dark:border-zinc-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-y"
                          placeholder="Write widget code here..."
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditingWidgetId(null)}
                            className="px-2 py-1 text-[10px] font-sans font-medium text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200 cursor-pointer"
                          >
                            Close
                          </button>
                          <button
                            onClick={() => {
                              const newCode = editorCode[block.id] ?? block.properties?.srcDoc ?? '';
                              updateBlockType(block.id, 'widget', { ...block.properties, srcDoc: newCode });
                              handleRerun(block.id);
                            }}
                            className="px-2.5 py-1 text-[10px] font-sans font-semibold bg-indigo-600 text-white hover:bg-indigo-500 rounded-md transition-colors cursor-pointer"
                          >
                            Run Code
                          </button>
                        </div>
                      </div>
                    )}

                    {widgetErrors[block.id] ? (
                      <div className="p-4 mx-3 my-2 bg-red-50 dark:bg-rose-950/20 border border-red-200 dark:border-rose-900/50 rounded-xl flex flex-col items-center justify-center text-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-rose-950/40 flex items-center justify-center text-red-600 dark:text-rose-400">
                          ⚠
                        </div>
                        <p className="text-xs font-semibold text-red-700 dark:text-rose-300">Widget Render Failed</p>
                        <p className="text-[10px] font-mono text-red-500 max-w-md break-all">{widgetErrors[block.id].message}</p>
                        <div className="flex gap-2 mt-1">
                          <button
                            onClick={() => handleEditClick(block.id, block.properties?.srcDoc || '')}
                            className="px-3 py-1 bg-white hover:bg-slate-50 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer"
                          >
                            Edit Code
                          </button>
                          <button
                            onClick={() => handleRerun(block.id)}
                            className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg text-[10px] font-semibold transition-colors cursor-pointer"
                          >
                            Retry
                          </button>
                        </div>
                      </div>
                    ) : (
                      <SandboxFrame
                        key={rerunKeys[block.id] || 0}
                        srcDoc={block.properties?.srcDoc || ''}
                        theme="dark"
                        onError={(err) => handleWidgetError(block.id, err)}
                      />
                    )}
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
};

export const BlockRow = React.memo(BlockRowBase);
