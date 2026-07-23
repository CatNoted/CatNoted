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
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-3">
      {blocks.map((block, index) => {
        const isFocused = focusBlockId === block.id;

        return (
          <div 
            key={block.id} 
            className="group relative flex items-start gap-2 -ml-8 px-8 py-1 rounded-lg transition-colors hover:bg-slate-100/50 dark:hover:bg-zinc-900/30"
          >
            {/* Left Block Control Action Button */}
            <div className="absolute left-2 top-1.5 opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
              <button
                onClick={() => handleCreateBlock(block.id)}
                title="Add block below"
                className="p-1 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              
              <div className="relative">
                <button
                  onClick={() => setActiveMenuId(activeMenuId === block.id ? null : block.id)}
                  title="Block settings"
                  className="p-1 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>

                {activeMenuId === block.id && (
                  <div className="absolute left-0 mt-1 w-36 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-lg z-50 py-1 text-xs">
                    <button
                      onClick={() => {
                        updateBlockType(block.id, 'text');
                        setActiveMenuId(null);
                      }}
                      className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-zinc-850"
                    >
                      <AlignLeft className="w-3.5 h-3.5" /> Text Paragraph
                    </button>
                    <button
                      onClick={() => {
                        updateBlockType(block.id, 'heading', { level: 1 });
                        setActiveMenuId(null);
                      }}
                      className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-zinc-850"
                    >
                      <Heading1 className="w-3.5 h-3.5" /> Heading 1
                    </button>
                    <button
                      onClick={() => {
                        updateBlockType(block.id, 'heading', { level: 2 });
                        setActiveMenuId(null);
                      }}
                      className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-zinc-850"
                    >
                      <Heading2 className="w-3.5 h-3.5" /> Heading 2
                    </button>
                    <button
                      onClick={() => {
                        updateBlockType(block.id, 'heading', { level: 3 });
                        setActiveMenuId(null);
                      }}
                      className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-zinc-850"
                    >
                      <Heading3 className="w-3.5 h-3.5" /> Heading 3
                    </button>
                    <button
                      onClick={() => handleAddWidget(block.id)}
                      className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-zinc-850 text-indigo-600 dark:text-indigo-400"
                    >
                      <Cpu className="w-3.5 h-3.5" /> Insert AI Widget
                    </button>
                    <div className="border-t border-slate-100 dark:border-zinc-800 my-1"></div>
                    <button
                      onClick={() => {
                        deleteBlock(block.id);
                        setActiveMenuId(null);
                      }}
                      className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-zinc-850 text-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete Block
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Block Content Renderers */}
            <div className="flex-1 min-w-0">
              {block.type === 'heading' && (
                <HeadingBlock
                  id={block.id}
                  content={block.content}
                  level={block.properties?.level || 2}
                  onChange={(val) => updateBlockContent(block.id, val)}
                  onEnter={() => handleCreateBlock(block.id)}
                  onBackspace={() => handleBackspaceBlock(block.id, index)}
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
                  focusOnMount={isFocused}
                />
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
