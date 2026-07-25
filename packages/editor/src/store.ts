import { useState, useEffect } from 'react';
import * as Y from 'yjs';
import { BlockNode, BlockType, BlockProperties, PageMeta } from '@catnoted/shared';
import { IndexeddbPersistence } from 'y-indexeddb';

export const ydoc = new Y.Doc();
export const ypages = ydoc.getMap<PageMeta>('pages');
const yblocks = ydoc.getArray<BlockNode>('blocks');
const provider = typeof window !== 'undefined' && typeof indexedDB !== 'undefined' 
  ? new IndexeddbPersistence('catnoted-doc', ydoc) 
  : null;

// Prepopulate if empty
if (yblocks.length === 0) {
  yblocks.insert(0, [
    {
      id: 'block-init-1',
      type: 'heading',
      content: 'Selamat Datang di CatNoted! 🐱',
      properties: { level: 1 },
      parentId: 'root-doc-node'
    },
    {
      id: 'block-init-2',
      type: 'text',
      content: 'Ini adalah editor dokumen berbasis blok yang didukung oleh Yjs CRDT. Tekan Enter untuk membuat paragraf baru, atau ubah tipe blok.',
      parentId: 'root-doc-node'
    }
  ]);
}

export function useDocumentStore(pageId: string = 'root-doc-node') {
  const [blocks, setBlocks] = useState<BlockNode[]>([]);
  const [pages, setPages] = useState<PageMeta[]>([]);
  const [pageMeta, setPageMeta] = useState<PageMeta | null>(null);

  useEffect(() => {
    const updateBlocks = () => {
      const allBlocks = yblocks.toArray();
      const pageBlocks = allBlocks.filter(b => (b.parentId || 'root-doc-node') === pageId);

      // Prepopulate sub-page if empty (inside transact, observer will re-fire)
      if (pageId !== 'root-doc-node' && pageBlocks.length === 0) {
        const rawName = pageId.startsWith('page-') ? pageId.slice(5) : pageId;
        const pageName = rawName
          .split('-')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');

        ydoc.transact(() => {
          yblocks.insert(yblocks.length, [
            {
              id: `block-${Math.random().toString(36).substring(2, 11)}`,
              type: 'heading',
              content: pageName,
              properties: { level: 1 },
              parentId: pageId
            }
          ]);

          // Make sure metadata is also registered in ypages so it is no longer a "ghost" page
          if (!ypages.has(pageId)) {
            ypages.set(pageId, {
              id: pageId,
              title: pageName,
              icon: '📄',
              fontStyle: 'sans',
              fullWidth: false,
              isFavorite: false,
              createdAt: Date.now()
            });
          }
        });
        // observer will fire again after insert — don't set blocks here
        return;
      }

      setBlocks(pageBlocks);
    };

    const updatePageMetadata = () => {
      const currentMeta = ypages.get(pageId);
      if (currentMeta) {
        setPageMeta(currentMeta);
      } else {
        setPageMeta({
          id: pageId,
          title: pageId === 'root-doc-node' ? 'Root Note' : pageId,
          icon: '📄',
          fontStyle: 'sans',
          fullWidth: false,
          isFavorite: false,
          createdAt: Date.now()
        });
      }
      setPages(ypages.toJSON() ? Object.values(ypages.toJSON()) : []);
    };

    updateBlocks();
    updatePageMetadata();

    const observer = () => {
      updateBlocks();
    };

    const pagesObserver = () => {
      updatePageMetadata();
    };

    yblocks.observe(observer);
    ypages.observe(pagesObserver);

    const handleSync = () => {
      // Filter by current pageId to avoid cross-page duplicates
      const allBlocks = yblocks.toArray();
      setBlocks(allBlocks.filter(b => (b.parentId || 'root-doc-node') === pageId));
      updatePageMetadata();
    };
    if (provider && typeof provider.on === 'function') {
      provider.on('synced', handleSync);
    }

    return () => {
      yblocks.unobserve(observer);
      ypages.unobserve(pagesObserver);
      if (provider && typeof provider.off === 'function') {
        provider.off('synced', handleSync);
      }
    };
  }, [pageId]);

  const addBlock = (afterId: string | null, type: BlockType = 'text', content: string = '', properties: BlockProperties = {}) => {
    const newBlock: BlockNode = {
      id: `block-${Math.random().toString(36).substring(2, 11)}`,
      type,
      content,
      properties: Object.keys(properties).length > 0 ? properties : (type === 'heading' ? { level: 2 } : {}),
      parentId: pageId
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

  const updateBlockProperties = (id: string, propsPartial: Partial<BlockProperties>) => {
    ydoc.transact(() => {
      const index = yblocks.toArray().findIndex(b => b.id === id);
      if (index !== -1) {
        const current = yblocks.get(index);
        const updated = {
          ...current,
          properties: {
            ...current.properties,
            ...propsPartial
          }
        };
        yblocks.delete(index, 1);
        yblocks.insert(index, [updated]);
      }
    });
  };

  const duplicateBlock = (id: string) => {
    const targetBlock = blocks.find(b => b.id === id);
    if (!targetBlock) return null;

    const newId = addBlock(
      id,
      targetBlock.type,
      targetBlock.content,
      JSON.parse(JSON.stringify(targetBlock.properties || {}))
    );
    return newId;
  };

  const deleteBlock = (id: string) => {
    ydoc.transact(() => {
      const index = yblocks.toArray().findIndex(b => b.id === id);
      if (index !== -1) {
        yblocks.delete(index, 1);
      }
    });
  };

  const updatePageMeta = (metaPartial: Partial<PageMeta>) => {
    ydoc.transact(() => {
      const current = ypages.get(pageId) || {
        id: pageId,
        title: pageId === 'root-doc-node' ? 'Root Note' : pageId,
        icon: '📄',
        createdAt: Date.now()
      };
      const updated = {
        ...current,
        ...metaPartial,
        updatedAt: Date.now()
      };
      ypages.set(pageId, updated);
      setPageMeta(updated);
    });
  };

  const createPage = (title: string = 'Untitled', icon: string = '📄') => {
    const newPageId = `page-${Math.random().toString(36).substring(2, 11)}`;
    ydoc.transact(() => {
      ypages.set(newPageId, {
        id: newPageId,
        title,
        icon,
        fontStyle: 'sans',
        fullWidth: false,
        isFavorite: false,
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
        ypages.set(id, { ...page, title, updatedAt: Date.now() });
      });
    }
  };

  const moveBlock = (fromIndex: number, toIndex: number) => {
    ydoc.transact(() => {
      const currentArray = yblocks.toArray();
      if (fromIndex >= 0 && fromIndex < currentArray.length && toIndex >= 0 && toIndex < currentArray.length) {
        const block = yblocks.get(fromIndex);
        yblocks.delete(fromIndex, 1);
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
    pageMeta,
    addBlock,
    updateBlockContent,
    updateBlockType,
    updateBlockProperties,
    duplicateBlock,
    deleteBlock,
    updatePageMeta,
    createPage,
    renamePage,
    deletePage,
    moveBlock
  };
}

