import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase, isSupabaseConfigured, mockSyncChannel } from '../supabase.js';
import { SyncRoom } from '@catnoted/shared';

export type SyncStatus = 'saved' | 'saving' | 'offline' | 'error' | 'conflict';

interface QueuedUpdate {
  id: string;
  documentId: string;
  encryptedBlob: number[];
  clientId: number;
  timestamp: number;
}

const DB_NAME = 'catnoted-sync-db';
const STORE_NAME = 'pending-updates';

function openDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
    return Promise.resolve(null);
  }
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function savePendingUpdate(update: QueuedUpdate): Promise<void> {
  const db = await openDB();
  if (!db) return;
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  store.put(update);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getPendingUpdates(): Promise<QueuedUpdate[]> {
  const db = await openDB();
  if (!db) return [];
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  const request = store.getAll();
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

async function deletePendingUpdate(id: string): Promise<void> {
  const db = await openDB();
  if (!db) return;
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  store.delete(id);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

const toHexString = (bytes: number[]) => {
  return '\\x' + bytes.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function usePersistence(
  documentId: string = '00000000-0000-0000-0000-000000000000',
  room: SyncRoom = mockSyncChannel
) {
  const [status, setStatus] = useState<SyncStatus>(() => {
    return room.status() === 'connected' ? 'saved' : 'offline';
  });
  const [conflictMsg, setConflictMsg] = useState<string | null>(null);

  const queueRef = useRef<QueuedUpdate[]>([]);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isOnline = useCallback(() => {
    return room.status() === 'connected';
  }, [room]);

  const processQueue = useCallback(async () => {
    if (!isOnline() || queueRef.current.length === 0) return;

    setStatus('saving');

    const itemsToProcess = [...queueRef.current];
    queueRef.current = [];

    if (!isSupabaseConfigured || !supabase) {
      // In mock/test environments or local dev without Supabase, clear queue and save state
      for (const item of itemsToProcess) {
        await deletePendingUpdate(item.id);
      }
      setTimeout(() => setStatus('saved'), 500);
      return;
    }

    try {
      for (let i = 0; i < itemsToProcess.length; i++) {
        const item = itemsToProcess[i];
        const { error } = await supabase.from('crdt_updates').insert({
          document_id: item.documentId,
          client_id: item.clientId,
          encrypted_blob: toHexString(item.encryptedBlob),
        });

        if (error) {
          if (error.code === '23505' || error.message.includes('conflict') || error.message.includes('duplicate')) {
             setConflictMsg('Version conflict detected with remote changes.');
             setStatus('conflict');
             // Re-queue remaining un-synced items
             queueRef.current = [...itemsToProcess.slice(i + 1), ...queueRef.current];
             return;
          }
          // On other errors, put this item and remaining back into queue
          queueRef.current = [...itemsToProcess.slice(i), ...queueRef.current];
          throw error;
        }

        // Successfully pushed to remote sync, delete from IndexedDB!
        await deletePendingUpdate(item.id);
      }
      setStatus('saved');
    } catch (e: any) {
      console.error('Failed to sync crdt_update:', e);
      setStatus('error');
    }
  }, [isOnline]);

  // Load existing pending updates from IndexedDB on initialization
  useEffect(() => {
    const loadPending = async () => {
      const pending = await getPendingUpdates();
      if (pending.length > 0) {
        // Filter out duplicates if any
        const existingIds = new Set(queueRef.current.map(q => q.id));
        const uniquePending = pending.filter(q => !existingIds.has(q.id));
        if (uniquePending.length > 0) {
          queueRef.current = [...uniquePending, ...queueRef.current];
          if (isOnline()) {
            setStatus('saving');
            processQueue();
          } else {
            setStatus('offline');
          }
        }
      }
    };
    loadPending();
  }, [isOnline, processQueue]);

  useEffect(() => {
    const handleOnline = () => {
      setStatus(queueRef.current.length > 0 ? 'saving' : 'saved');
      processQueue();
    };
    const handleOffline = () => {
      setStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check on mount
    if (!isOnline()) {
      setStatus('offline');
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
      }
    };
  }, [processQueue, isOnline]);

  const persistUpdate = useCallback(async (encryptedBlob: number[], clientId: number = Date.now()) => {
    // If the doc ID is just a local string without UUID format, mock a UUID
    const validUuidMatch = documentId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    const dbDocId = validUuidMatch ? documentId : '00000000-0000-0000-0000-000000000000';

    const newUpdate: QueuedUpdate = {
      id: Math.random().toString(36).substring(2),
      documentId: dbDocId,
      encryptedBlob,
      clientId,
      timestamp: Date.now()
    };

    // ALWAYS persist to IndexedDB first!
    await savePendingUpdate(newUpdate);

    queueRef.current.push(newUpdate);

    if (isOnline()) {
      setStatus('saving');
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
      syncTimerRef.current = setTimeout(() => {
        processQueue();
      }, 1000);
    } else {
      setStatus('offline');
    }
  }, [documentId, processQueue, isOnline]);

  return {
    status,
    conflictMsg,
    dismissConflict: () => {
      setConflictMsg(null);
      setStatus('saved');
    },
    persistUpdate
  };
}
