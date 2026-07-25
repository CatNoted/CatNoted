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
    </div>
  );
};
