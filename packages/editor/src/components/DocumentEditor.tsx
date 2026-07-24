import React, { useState } from 'react';
import { useDocumentStore } from '../store.js';
import { TextBlock } from './TextBlock.js';
import { HeadingBlock } from './HeadingBlock.js';
import { WidgetBlockPlaceholder } from './WidgetBlockPlaceholder.js';
import { SandboxFrame } from '@catnoted/agent-runtime';
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

export const DocumentEditor: React.FC = () => {
  const { 
    blocks, 
    addBlock, 
    updateBlockContent, 
    updateBlockType, 
    deleteBlock 
  } = useDocumentStore();

  const [focusBlockId, setFocusBlockId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const handleCreateBlock = (afterId: string) => {
    const newId = addBlock(afterId, 'text', '');
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

  const handleAddWidget = (afterId: string) => {
    const newId = addBlock(afterId, 'widget', '');
    updateBlockType(newId, 'widget', { widgetId: `widget-${Math.random().toString(36).substring(2, 6)}` });
    setActiveMenuId(null);
  };

  return (
    <div className="max-w-3xl mx-auto py-10 space-y-0.5">
      {blocks.map((block, index) => {
        const isFocused = focusBlockId === block.id;

        return (
          <div 
            key={block.id} 
            className="group flex items-start gap-0 px-4 py-0.5 rounded-lg transition-all hover:bg-slate-50/80 dark:hover:bg-zinc-900/30 hover:shadow-sm hover:ring-1 hover:ring-slate-100 dark:hover:ring-zinc-800/60"
          >
            {/* Left Block Controls - fixed width gutter, never overlaps content */}
            <div className="w-10 flex-shrink-0 flex items-start justify-end gap-0.5 pt-[4px] opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => handleCreateBlock(block.id)}
                title="Add block below"
                className="p-0.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                <Plus className="w-3 h-3" />
              </button>
              
              <div className="relative">
                <button
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
                  onEnter={() => handleCreateBlock(block.id)}
                  onBackspace={() => handleBackspaceBlock(block.id, index)}
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
                  onEnter={() => handleCreateBlock(block.id)}
                  onBackspace={() => handleBackspaceBlock(block.id, index)}
                  onSetType={(type, props) => updateBlockType(block.id, type as any, props)}
                  onAddWidget={() => handleAddWidget(block.id)}
                  focusOnMount={isFocused}
                />
              )}

              {/* --- Bullet list --- */}
              {block.type === 'bullet' && (
                <div className="flex items-start gap-2">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-zinc-500 flex-shrink-0" />
                  <TextBlock
                    id={block.id}
                    content={block.content}
                    onChange={(val) => updateBlockContent(block.id, val)}
                    onEnter={() => handleCreateBlock(block.id)}
                    onBackspace={() => handleBackspaceBlock(block.id, index)}
                    onSetType={(type, props) => updateBlockType(block.id, type as any, props)}
                    onAddWidget={() => handleAddWidget(block.id)}
                    focusOnMount={isFocused}
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
                    onChange={(val) => updateBlockContent(block.id, val)}
                    onEnter={() => handleCreateBlock(block.id)}
                    onBackspace={() => handleBackspaceBlock(block.id, index)}
                    onSetType={(type, props) => updateBlockType(block.id, type as any, props)}
                    onAddWidget={() => handleAddWidget(block.id)}
                    focusOnMount={isFocused}
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
                    onChange={(val) => updateBlockContent(block.id, val)}
                    onEnter={() => handleCreateBlock(block.id)}
                    onBackspace={() => handleBackspaceBlock(block.id, index)}
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
                    onEnter={() => handleCreateBlock(block.id)}
                    onBackspace={() => handleBackspaceBlock(block.id, index)}
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
  );
};
