import { useState, useEffect } from 'react';
import * as Y from 'yjs';
import { BlockNode, BlockType, BlockProperties, PageMeta } from '@catnoted/shared';
import { IndexeddbPersistence } from 'y-indexeddb';

export const ydoc = new Y.Doc();
export const ypages = ydoc.getMap<PageMeta>('pages');
export const yblocks = ydoc.getArray<BlockNode>('blocks');
const provider = typeof window !== 'undefined' && typeof indexedDB !== 'undefined' 
  ? new IndexeddbPersistence('catnoted-doc', ydoc) 
  : null;

const initializedPages = new Set<string>();

export function useDocumentStore(pageId: string = 'root-doc-node') {
  const [blocks, setBlocks] = useState<BlockNode[]>([]);
  const [pages, setPages] = useState<PageMeta[]>([]);
  const [pageMeta, setPageMeta] = useState<PageMeta | null>(null);

  useEffect(() => {
    const updateBlocks = () => {
      const allBlocks = yblocks.toArray();
      const pageBlocks = allBlocks.filter(b => (b.parentId || 'root-doc-node') === pageId);

      // Deduplicate blocks by id to avoid duplicate rendering from Yjs observer noise
      const seen = new Set<string>();
      const deduped = pageBlocks.filter(b => {
        if (seen.has(b.id)) return false;
        seen.add(b.id);
        return true;
      });

      const isTest = typeof process !== 'undefined' && (process.env.NODE_ENV === 'test' || process.env.VITEST);

      if (!isTest && !initializedPages.has(pageId)) {
        initializedPages.add(pageId);
        if (deduped.length === 0) {
          if (pageId === 'root-doc-node') {
            ydoc.transact(() => {
              yblocks.insert(yblocks.length, [
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
            });
            return;
          } else if (pageId.startsWith('journal-')) {
            const dateStr = pageId.slice(8);
            const date = new Date(dateStr);
            const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' };
            const formattedDate = date.toLocaleDateString('en-US', options) !== 'Invalid Date'
              ? date.toLocaleDateString('en-US', options)
              : dateStr;
            const templateId = typeof window !== 'undefined' ? localStorage.getItem('catnoted_journal_template') || 'empty' : 'empty';

            ydoc.transact(() => {
              // Register page metadata if not present
              if (!ypages.get(pageId)) {
                ypages.set(pageId, {
                  id: pageId,
                  title: formattedDate,
                  icon: '📅',
                  fontStyle: 'sans',
                  fullWidth: false,
                  isFavorite: false,
                  createdAt: Date.now(),
                  updatedAt: Date.now(),
                  journalDate: dateStr
                });
              }

              const newBlocks: BlockNode[] = [];
              const headingId = `block-${Math.random().toString(36).substring(2, 11)}`;

              if (templateId === 'reflection') {
                newBlocks.push({
                  id: headingId,
                  type: 'heading',
                  content: `Daily Reflection — ${formattedDate}`,
                  properties: { level: 1 },
                  parentId: pageId
                });
                newBlocks.push({
                  id: `block-${Math.random().toString(36).substring(2, 11)}`,
                  type: 'heading',
                  content: 'What went well today? ✨',
                  properties: { level: 2 },
                  parentId: pageId
                });
                newBlocks.push({
                  id: `block-${Math.random().toString(36).substring(2, 11)}`,
                  type: 'text',
                  content: '',
                  parentId: pageId
                });
                newBlocks.push({
                  id: `block-${Math.random().toString(36).substring(2, 11)}`,
                  type: 'heading',
                  content: 'What could have been better? 🛠️',
                  properties: { level: 2 },
                  parentId: pageId
                });
                newBlocks.push({
                  id: `block-${Math.random().toString(36).substring(2, 11)}`,
                  type: 'text',
                  content: '',
                  parentId: pageId
                });
                newBlocks.push({
                  id: `block-${Math.random().toString(36).substring(2, 11)}`,
                  type: 'heading',
                  content: 'Three things I am grateful for 🙏',
                  properties: { level: 2 },
                  parentId: pageId
                });
                newBlocks.push({
                  id: `block-${Math.random().toString(36).substring(2, 11)}`,
                  type: 'bullet',
                  content: 'Today, I am grateful for...',
                  parentId: pageId
                });
              } else if (templateId === 'gratitude') {
                newBlocks.push({
                  id: headingId,
                  type: 'heading',
                  content: `Gratitude Journal — ${formattedDate}`,
                  properties: { level: 1 },
                  parentId: pageId
                });
                newBlocks.push({
                  id: `block-${Math.random().toString(36).substring(2, 11)}`,
                  type: 'bullet',
                  content: 'Three wonderful things that happened today:',
                  parentId: pageId
                });
                newBlocks.push({
                  id: `block-${Math.random().toString(36).substring(2, 11)}`,
                  type: 'bullet',
                  content: 'How I will improve my tomorrow:',
                  parentId: pageId
                });
                newBlocks.push({
                  id: `block-${Math.random().toString(36).substring(2, 11)}`,
                  type: 'bullet',
                  content: 'My positive affirmation for today:',
                  parentId: pageId
                });
              } else {
                newBlocks.push({
                  id: headingId,
                  type: 'heading',
                  content: formattedDate,
                  properties: { level: 1 },
                  parentId: pageId
                });
                newBlocks.push({
                  id: `block-${Math.random().toString(36).substring(2, 11)}`,
                  type: 'text',
                  content: '',
                  parentId: pageId
                });
              }
              yblocks.insert(yblocks.length, newBlocks);
            });
            return;
          } else {
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
            });
            return;
          }
        }
      }

      setBlocks(deduped);
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
      const pageBlocks = allBlocks.filter(b => (b.parentId || 'root-doc-node') === pageId);

      // Deduplicate blocks by id to avoid duplicate rendering from Yjs observer noise
      const seen = new Set<string>();
      const deduped = pageBlocks.filter(b => {
        if (seen.has(b.id)) return false;
        seen.add(b.id);
        return true;
      });

      setBlocks(deduped);
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
      const arr = yblocks.toArray();
      // Work backwards to avoid index shift issues if there are multiple duplicates
      for (let i = arr.length - 1; i >= 0; i--) {
        if (arr[i].id === id) {
          const current = yblocks.get(i);
          const updated = { ...current, content };
          yblocks.delete(i, 1);
          yblocks.insert(i, [updated]);
        }
      }
    });
  };

  const updateBlockType = (id: string, type: BlockType, properties?: any) => {
    ydoc.transact(() => {
      const arr = yblocks.toArray();
      for (let i = arr.length - 1; i >= 0; i--) {
        if (arr[i].id === id) {
          const current = yblocks.get(i);
          const updated = {
            ...current,
            type,
            properties: properties !== undefined ? properties : (type === 'heading' ? { level: 2 } : {})
          };
          yblocks.delete(i, 1);
          yblocks.insert(i, [updated]);
        }
      }
    });
  };

  const updateBlockProperties = (id: string, propsPartial: Partial<BlockProperties>) => {
    ydoc.transact(() => {
      const arr = yblocks.toArray();
      for (let i = arr.length - 1; i >= 0; i--) {
        if (arr[i].id === id) {
          const current = yblocks.get(i);
          const updated = {
            ...current,
            properties: {
              ...current.properties,
              ...propsPartial
            }
          };
          yblocks.delete(i, 1);
          yblocks.insert(i, [updated]);
        }
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
      const arr = yblocks.toArray();
      for (let i = arr.length - 1; i >= 0; i--) {
        if (arr[i].id === id) {
          yblocks.delete(i, 1);
        }
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

  const moveBlock = (draggedId: string, targetId: string) => {
    ydoc.transact(() => {
      const currentArray = yblocks.toArray();
      const fromIndex = currentArray.findIndex(b => b.id === draggedId);
      let toIndex = currentArray.findIndex(b => b.id === targetId);

      if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
        const block = yblocks.get(fromIndex);
        yblocks.delete(fromIndex, 1);

        // If we deleted an item before the target, the target index shifted down by 1
        if (fromIndex < toIndex) {
          toIndex--;
        }

        // Ensure index is within valid bounds
        if (toIndex < 0) toIndex = 0;
        if (toIndex > yblocks.length) toIndex = yblocks.length;

        yblocks.insert(toIndex, [block]);
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
    createJournalPage,
    renamePage,
    deletePage,
    moveBlock
  };
};

export const createJournalPage = (dateStr: string, templateId: string = 'empty') => {
  const pageId = `journal-${dateStr}`;
  const date = new Date(dateStr);
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' };
  const formattedDate = date.toLocaleDateString('en-US', options) !== 'Invalid Date'
    ? date.toLocaleDateString('en-US', options)
    : dateStr;

  const existing = ypages.get(pageId);
  if (existing) return pageId;

  ydoc.transact(() => {
    ypages.set(pageId, {
      id: pageId,
      title: formattedDate,
      icon: '📅',
      fontStyle: 'sans',
      fullWidth: false,
      isFavorite: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      journalDate: dateStr
    });

    const newBlocks: BlockNode[] = [];
    const headingId = `block-${Math.random().toString(36).substring(2, 11)}`;

    if (templateId === 'reflection') {
      newBlocks.push({
        id: headingId,
        type: 'heading',
        content: `Daily Reflection — ${formattedDate}`,
        properties: { level: 1 },
        parentId: pageId
      });
      newBlocks.push({
        id: `block-${Math.random().toString(36).substring(2, 11)}`,
        type: 'heading',
        content: 'What went well today? ✨',
        properties: { level: 2 },
        parentId: pageId
      });
      newBlocks.push({
        id: `block-${Math.random().toString(36).substring(2, 11)}`,
        type: 'text',
        content: '',
        parentId: pageId
      });
      newBlocks.push({
        id: `block-${Math.random().toString(36).substring(2, 11)}`,
        type: 'heading',
        content: 'What could have been better? 🛠️',
        properties: { level: 2 },
        parentId: pageId
      });
      newBlocks.push({
        id: `block-${Math.random().toString(36).substring(2, 11)}`,
        type: 'text',
        content: '',
        parentId: pageId
      });
      newBlocks.push({
        id: `block-${Math.random().toString(36).substring(2, 11)}`,
        type: 'heading',
        content: 'Three things I am grateful for 🙏',
        properties: { level: 2 },
        parentId: pageId
      });
      newBlocks.push({
        id: `block-${Math.random().toString(36).substring(2, 11)}`,
        type: 'bullet',
        content: 'Today, I am grateful for...',
        parentId: pageId
      });
    } else if (templateId === 'gratitude') {
      newBlocks.push({
        id: headingId,
        type: 'heading',
        content: `Gratitude Journal — ${formattedDate}`,
        properties: { level: 1 },
        parentId: pageId
      });
      newBlocks.push({
        id: `block-${Math.random().toString(36).substring(2, 11)}`,
        type: 'bullet',
        content: 'Three wonderful things that happened today:',
        parentId: pageId
      });
      newBlocks.push({
        id: `block-${Math.random().toString(36).substring(2, 11)}`,
        type: 'bullet',
        content: 'How I will improve my tomorrow:',
        parentId: pageId
      });
      newBlocks.push({
        id: `block-${Math.random().toString(36).substring(2, 11)}`,
        type: 'bullet',
        content: 'My positive affirmation for today:',
        parentId: pageId
      });
    } else {
      newBlocks.push({
        id: headingId,
        type: 'heading',
        content: formattedDate,
        properties: { level: 1 },
        parentId: pageId
      });
      newBlocks.push({
        id: `block-${Math.random().toString(36).substring(2, 11)}`,
        type: 'text',
        content: '',
        parentId: pageId
      });
    }

    yblocks.insert(yblocks.length, newBlocks);
  });

  return pageId;
}

