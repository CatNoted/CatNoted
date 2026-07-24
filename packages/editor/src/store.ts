import { useState, useEffect } from 'react';
import * as Y from 'yjs';
import { BlockNode, BlockType } from '@catnoted/shared';
import { IndexeddbPersistence } from 'y-indexeddb';

export const ydoc = new Y.Doc();
export const ypages = ydoc.getMap<any>('pages');

// Mock provider for environments without indexedDB (e.g., tests)
const isTestEnv = typeof indexedDB === 'undefined';
const provider = !isTestEnv ? new IndexeddbPersistence('catnoted-main-doc-v3', ydoc) : {
  on: (event: string, cb: any) => {
    if (event === 'synced') setTimeout(cb, 0);
  },
  off: () => {}
} as any;

provider.on('synced', () => {
  if (Array.from(ypages.keys()).length === 0) {
    ydoc.transact(() => {
      ypages.set('root-doc-node', {
        id: 'root-doc-node',
        title: 'Workspace',
        createdAt: Date.now()
      });
      const rootBlocks = ydoc.getArray<BlockNode>('blocks_root-doc-node');
      rootBlocks.insert(0, [
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
    });
  }
});

export function useDocumentStore(pageId: string = 'root-doc-node') {
  const yblocks = ydoc.getArray<BlockNode>(`blocks_${pageId}`);
  const [blocks, setBlocks] = useState<BlockNode[]>(yblocks.toArray());
  const [pages, setPages] = useState<Record<string, any>>(ypages.toJSON());

  useEffect(() => {
    setBlocks(yblocks.toArray());
    setPages(ypages.toJSON());

    const observer = () => {
      setBlocks(yblocks.toArray());
    };

    const pagesObserver = () => {
      setPages(ypages.toJSON());
    };

    yblocks.observe(observer);
    ypages.observe(pagesObserver);

    const handleSync = () => {
      setBlocks(yblocks.toArray());
      setPages(ypages.toJSON());
    };
    provider.on('synced', handleSync);

    return () => {
      yblocks.unobserve(observer);
      ypages.unobserve(pagesObserver);
      provider.off('synced', handleSync);
    };
  }, [pageId, yblocks]);

  const addBlock = (afterId: string | null, type: BlockType = 'text', content: string = '') => {
    const newBlock: BlockNode = {
      id: `block-${Math.random().toString(36).substring(2, 11)}`,
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

  const createPage = (title: string = 'Untitled') => {
    const newPageId = `page-${Math.random().toString(36).substring(2, 11)}`;
    ydoc.transact(() => {
      ypages.set(newPageId, {
        id: newPageId,
        title,
        createdAt: Date.now()
      });
      // create empty block for new page
      const newYBlocks = ydoc.getArray<BlockNode>(`blocks_${newPageId}`);
      newYBlocks.insert(0, [{
        id: `block-${Math.random().toString(36).substring(2, 11)}`,
        type: 'text',
        content: ''
      }]);
    });
    return newPageId;
  };

  const renamePage = (id: string, title: string) => {
    const page = ypages.get(id);
    if (page) {
      ydoc.transact(() => {
        ypages.set(id, { ...page, title });
      });
    }
  };

  const moveBlock = (fromIndex: number, toIndex: number) => {
    ydoc.transact(() => {
      const currentArray = yblocks.toArray();
      if (fromIndex >= 0 && fromIndex < currentArray.length && toIndex >= 0 && toIndex < currentArray.length) {
        const block = yblocks.get(fromIndex);
        yblocks.delete(fromIndex, 1);
        // If moving down, the actual insertion index shifts
        const insertIndex = toIndex > fromIndex ? toIndex : toIndex;
        yblocks.insert(insertIndex, [block]);
      }
    });
  };

  const deletePage = (id: string) => {
    if (id === 'root-doc-node') return; // Cannot delete root
    ydoc.transact(() => {
      ypages.delete(id);
    });
  };

  return {
    blocks,
    pages,
    addBlock,
    updateBlockContent,
    updateBlockType,
    deleteBlock,
    createPage,
    renamePage,
    deletePage,
    moveBlock
  };
}
