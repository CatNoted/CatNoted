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

export function useDocumentStore(pageId: string = 'root-doc-node') {
  const [blocks, setBlocks] = useState<BlockNode[]>([]);
  const yarr = pageId === 'root-doc-node' ? yblocks : ydoc.getArray<BlockNode>(`blocks:${pageId}`);

  useEffect(() => {
    // Prepopulate sub-page if empty
    if (pageId !== 'root-doc-node' && yarr.length === 0) {
      const rawName = pageId.startsWith('page-') ? pageId.slice(5) : pageId;
      const pageName = rawName
        .split('-')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

      ydoc.transact(() => {
        yarr.insert(0, [
          {
            id: `block-${Math.random().toString(36).substring(2, 11)}`,
            type: 'heading',
            content: pageName,
            properties: { level: 1 }
          }
        ]);
      });
    }

    setBlocks(yarr.toArray());

    const observer = () => {
      setBlocks(yarr.toArray());
    };

    yarr.observe(observer);
    return () => {
      yarr.unobserve(observer);
    };
  }, [pageId, yarr]);

  const addBlock = (afterId: string | null, type: BlockType = 'text', content: string = '') => {
    const newBlock: BlockNode = {
      id: `block-${Math.random().toString(36).substring(2, 11)}`,
      type,
      content,
      properties: type === 'heading' ? { level: 2 } : {}
    };

    ydoc.transact(() => {
      if (afterId === null) {
        yarr.insert(yarr.length, [newBlock]);
      } else {
        const index = yarr.toArray().findIndex(b => b.id === afterId);
        if (index !== -1) {
          yarr.insert(index + 1, [newBlock]);
        } else {
          yarr.insert(yarr.length, [newBlock]);
        }
      }
    });

    return newBlock.id;
  };

  const updateBlockContent = (id: string, content: string) => {
    ydoc.transact(() => {
      const index = yarr.toArray().findIndex(b => b.id === id);
      if (index !== -1) {
        const current = yarr.get(index);
        const updated = { ...current, content };
        yarr.delete(index, 1);
        yarr.insert(index, [updated]);
      }
    });
  };

  const updateBlockType = (id: string, type: BlockType, properties?: any) => {
    ydoc.transact(() => {
      const index = yarr.toArray().findIndex(b => b.id === id);
      if (index !== -1) {
        const current = yarr.get(index);
        const updated = { 
          ...current, 
          type, 
          properties: properties !== undefined ? properties : (type === 'heading' ? { level: 2 } : {}) 
        };
        yarr.delete(index, 1);
        yarr.insert(index, [updated]);
      }
    });
  };

  const deleteBlock = (id: string) => {
    ydoc.transact(() => {
      const index = yarr.toArray().findIndex(b => b.id === id);
      if (index !== -1) {
        yarr.delete(index, 1);
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
