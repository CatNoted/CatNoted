import { useState, useEffect } from 'react';
import * as Y from 'yjs';
import { BlockNode, BlockType } from '@catnoted/shared';

export interface Page {
  id: string;
  title: string;
  createdAt: number;
}

export const ydoc = new Y.Doc();
export const yblocks = ydoc.getArray<BlockNode>('blocks');
export const ypages = ydoc.getMap<Page>('pages');

const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

function uint8ArrayToBase64(arr: Uint8Array): string {
  let bin = '';
  const len = arr.byteLength;
  for (let i = 0; i < len; i++) {
    bin += String.fromCharCode(arr[i]);
  }
  return btoa(bin);
}

function base64ToUint8Array(base64: string): Uint8Array {
  const bin = atob(base64);
  const len = bin.length;
  const arr = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    arr[i] = bin.charCodeAt(i);
  }
  return arr;
}

// Ensure root page is indexed
if (!ypages.has('root-doc-node')) {
  ypages.set('root-doc-node', {
    id: 'root-doc-node',
    title: 'Selamat Datang di CatNoted! 🐱',
    createdAt: Date.now()
  });
}

// Prepopulate standard blocks if empty
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

// Setup persistence after initial default setup to avoid overwriting saved empty state
if (isBrowser) {
  const SAVED_STATE_KEY = 'catnoted:ydoc-state';
  const savedState = localStorage.getItem(SAVED_STATE_KEY);
  if (savedState) {
    try {
      const bytes = base64ToUint8Array(savedState);
      Y.applyUpdate(ydoc, bytes);
    } catch (e) {
      console.error('Failed to load ydoc state:', e);
    }
  }

  ydoc.on('update', () => {
    try {
      const update = Y.encodeStateAsUpdate(ydoc);
      localStorage.setItem(SAVED_STATE_KEY, uint8ArrayToBase64(update));
    } catch (e) {
      console.error('Failed to save ydoc state:', e);
    }
  });
}

export function useDocumentStore(pageId: string = 'root-doc-node') {
  const [blocks, setBlocks] = useState<BlockNode[]>([]);
  const [pages, setPages] = useState<Page[]>([]);

  const ytargetBlocks = pageId === 'root-doc-node' ? yblocks : ydoc.getArray<BlockNode>(`blocks-${pageId}`);

  useEffect(() => {
    // Sync blocks
    setBlocks(ytargetBlocks.toArray());

    const blocksObserver = () => {
      setBlocks(ytargetBlocks.toArray());
    };

    ytargetBlocks.observe(blocksObserver);

    // Sync pages
    const updatePages = () => {
      const list: Page[] = [];
      ypages.forEach((value) => {
        list.push(value);
      });
      list.sort((a, b) => a.createdAt - b.createdAt);
      setPages(list);
    };

    updatePages();
    ypages.observe(updatePages);

    return () => {
      ytargetBlocks.unobserve(blocksObserver);
      ypages.unobserve(updatePages);
    };
  }, [pageId, ytargetBlocks]);

  const addBlock = (afterId: string | null, type: BlockType = 'text', content: string = '') => {
    const newBlock: BlockNode = {
      id: `block-${Math.random().toString(36).substring(2, 11)}`,
      type,
      content,
      properties: type === 'heading' ? { level: 2 } : {}
    };

    ydoc.transact(() => {
      if (afterId === null) {
        ytargetBlocks.insert(ytargetBlocks.length, [newBlock]);
      } else {
        const index = ytargetBlocks.toArray().findIndex(b => b.id === afterId);
        if (index !== -1) {
          ytargetBlocks.insert(index + 1, [newBlock]);
        } else {
          ytargetBlocks.insert(ytargetBlocks.length, [newBlock]);
        }
      }
    });

    return newBlock.id;
  };

  const updateBlockContent = (id: string, content: string) => {
    ydoc.transact(() => {
      const index = ytargetBlocks.toArray().findIndex(b => b.id === id);
      if (index !== -1) {
        const current = ytargetBlocks.get(index);
        const updated = { ...current, content };
        ytargetBlocks.delete(index, 1);
        ytargetBlocks.insert(index, [updated]);
      }
    });
  };

  const updateBlockType = (id: string, type: BlockType, properties?: any) => {
    ydoc.transact(() => {
      const index = ytargetBlocks.toArray().findIndex(b => b.id === id);
      if (index !== -1) {
        const current = ytargetBlocks.get(index);
        const updated = { 
          ...current, 
          type, 
          properties: properties !== undefined ? properties : (type === 'heading' ? { level: 2 } : {}) 
        };
        ytargetBlocks.delete(index, 1);
        ytargetBlocks.insert(index, [updated]);
      }
    });
  };

  const deleteBlock = (id: string) => {
    ydoc.transact(() => {
      const index = ytargetBlocks.toArray().findIndex(b => b.id === id);
      if (index !== -1) {
        ytargetBlocks.delete(index, 1);
      }
    });
  };

  const moveBlock = (sourceIndex: number, targetIndex: number) => {
    ydoc.transact(() => {
      const currentArray = ytargetBlocks.toArray();
      if (sourceIndex < 0 || sourceIndex >= currentArray.length) return;
      if (targetIndex < 0 || targetIndex >= currentArray.length) return;

      const blockToMove = ytargetBlocks.get(sourceIndex);
      ytargetBlocks.delete(sourceIndex, 1);
      ytargetBlocks.insert(targetIndex, [blockToMove]);
    });
  };

  const createPage = (title: string = 'Untitled Note'): string => {
    const id = `page-${Math.random().toString(36).substring(2, 11)}`;
    const newPage: Page = {
      id,
      title,
      createdAt: Date.now()
    };
    ydoc.transact(() => {
      ypages.set(id, newPage);
      const yblocksNew = ydoc.getArray<BlockNode>(`blocks-${id}`);
      yblocksNew.insert(0, [
        {
          id: `block-${Math.random().toString(36).substring(2, 11)}`,
          type: 'text',
          content: ''
        }
      ]);
    });
    return id;
  };

  const deletePage = (id: string) => {
    if (id === 'root-doc-node') return;
    ydoc.transact(() => {
      ypages.delete(id);
      const yblocksNew = ydoc.getArray<BlockNode>(`blocks-${id}`);
      if (yblocksNew.length > 0) {
        yblocksNew.delete(0, yblocksNew.length);
      }
    });
  };

  const renamePage = (id: string, title: string) => {
    ydoc.transact(() => {
      const current = ypages.get(id);
      if (current) {
        ypages.set(id, { ...current, title });
      } else if (id === 'root-doc-node') {
        ypages.set('root-doc-node', {
          id: 'root-doc-node',
          title,
          createdAt: Date.now()
        });
      }
    });
  };

  return {
    blocks,
    pages,
    addBlock,
    updateBlockContent,
    updateBlockType,
    deleteBlock,
    moveBlock,
    createPage,
    deletePage,
    renamePage
  };
}
