import React, { useState, useEffect } from 'react';
import { useDocumentStore } from '../store.js';
import { BlockRow } from './BlockRow.js';

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
    addBlock, 
    updateBlockContent, 
    updateBlockType, 
    deleteBlock 
  } = useDocumentStore(activePage);

  const [focusBlockId, setFocusBlockId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  useEffect(() => {
    // If the page has exactly 1 block and it's a level-1 heading, auto-focus it
    if (blocks.length === 1 && blocks[0].type === 'heading' && blocks[0].properties?.level === 1) {
      setFocusBlockId(blocks[0].id);
    }
  }, [activePage, blocks]);

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
      {blocks.map((block, index) => (
        <BlockRow
          key={block.id}
          block={block}
          index={index}
          isFocused={focusBlockId === block.id}
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
        />
      ))}
    </div>
  );
};