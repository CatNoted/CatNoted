import { useState, useEffect } from 'react';
import * as Y from 'yjs';
import { BlockNode, BlockType } from '@catnoted/shared';

export const ydoc = new Y.Doc();
export const yblocks = ydoc.getArray<BlockNode>('blocks');

// Prepopulate if empty
if (yblocks.length === 0) {
  yblocks.insert(0, [
    {
      id: 'block-init-1',
      type: 'heading',
      content: 'Selamat Datang di CatNoted! 🐱',
      properties: { level: 1 }
    },
    {
      id: 'block-init-2',
      type: 'text',
      content: 'Ini adalah editor dokumen berbasis blok yang didukung oleh Yjs CRDT. Tekan Enter untuk membuat paragraf baru, atau ubah tipe blok.'
    }
  ]);
}

export function useDocumentStore() {
  const [blocks, setBlocks] = useState<BlockNode[]>([]);

  useEffect(() => {
    setBlocks(yblocks.toArray());

    const observer = () => {
      setBlocks(yblocks.toArray());
    };

    yblocks.observe(observer);
    return () => {
      yblocks.unobserve(observer);
    };
  }, []);

  const addBlock = (afterId: string | null, type: BlockType = 'text', content: string = '') => {
    const newBlock: BlockNode = {
      id: `block-${crypto.randomUUID()}`,
      type,
      content,
      properties: type === 'heading' ? { level: 2 } : {}
    };

    ydoc.transact(() => {
      if (afterId === null) {
        yblocks.insert(yblocks.length, [newBlock]);
      } else {
        const index = yblocks.toArray().findIndex(b => b.id === afterId);
        if (index !== -1) {
          yblocks.insert(index + 1, [newBlock]);
        } else {
          yblocks.insert(yblocks.length, [newBlock]);
        }
      }
    });

    return newBlock.id;
  };

  const updateBlockContent = (id: string, content: string) => {
    ydoc.transact(() => {
      const index = yblocks.toArray().findIndex(b => b.id === id);
      if (index !== -1) {
        const current = yblocks.get(index);
        const updated = { ...current, content };
        yblocks.delete(index, 1);
        yblocks.insert(index, [updated]);
      }
    });
  };

  const updateBlockType = (id: string, type: BlockType, properties?: any) => {
    ydoc.transact(() => {
      const index = yblocks.toArray().findIndex(b => b.id === id);
      if (index !== -1) {
        const current = yblocks.get(index);
        const updated = { 
          ...current, 
          type, 
          properties: properties !== undefined ? properties : (type === 'heading' ? { level: 2 } : {}) 
        };
        yblocks.delete(index, 1);
        yblocks.insert(index, [updated]);
      }
    });
  };

  const deleteBlock = (id: string) => {
    ydoc.transact(() => {
      const index = yblocks.toArray().findIndex(b => b.id === id);
      if (index !== -1) {
        yblocks.delete(index, 1);
      }
    });
  };

  return {
    blocks,
    addBlock,
    updateBlockContent,
    updateBlockType,
    deleteBlock
  };
}
