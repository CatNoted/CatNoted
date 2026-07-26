import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../supabase.js';

export type SyncStatus = 'saved' | 'saving' | 'offline' | 'error' | 'conflict';

interface QueuedUpdate {
  id: string;
  documentId: string;
  encryptedBlob: number[];
  clientId: number;
  timestamp: number;
}

const toHexString = (bytes: number[]) => {
  return '\\x' + bytes.map(b => b.toString(16).padStart(2, '0')).join('');
}

const saveQueue = (queue: QueuedUpdate[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('catnoted:offline-sync-queue', JSON.stringify(queue));
  }
};

const loadQueue = (): QueuedUpdate[] => {
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem('catnoted:offline-sync-queue');
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        console.error('Failed to parse offline sync queue:', e);
      }
    }
  }
  return [];
};

export function usePersistence(documentId: string = '00000000-0000-0000-0000-000000000000') {
  const [status, setStatus] = useState<SyncStatus>(() => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return 'offline';
    }
    const saved = loadQueue();
    return saved.length > 0 ? 'saving' : 'saved';
  });
  const [conflictMsg, setConflictMsg] = useState<string | null>(null);

  const queueRef = useRef<QueuedUpdate[]>([]);
  const isOnlineRef = useRef<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const processQueue = useCallback(async () => {
    if (!isOnlineRef.current || queueRef.current.length === 0) {
      if (!isOnlineRef.current) {
        setStatus('offline');
      } else {
        setStatus('saved');
      }
      return;
    }

    setStatus('saving');

    const itemsToProcess = [...queueRef.current];
    queueRef.current = [];
    saveQueue([]);

    if (!isSupabaseConfigured || !supabase) {
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
             // Re-queue the conflicting item and any remaining un-synced items
             queueRef.current = [...itemsToProcess.slice(i), ...queueRef.current];
             saveQueue(queueRef.current);
             return;
          }
          // On other errors, put this item and remaining back into queue
          queueRef.current = [...itemsToProcess.slice(i), ...queueRef.current];
          saveQueue(queueRef.current);
          throw error;
        }
      }
      setStatus('saved');
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    } catch (e: any) {
      console.error('Failed to sync crdt_update:', e);
      setStatus('error');
      // Re-queue items that failed to process
      queueRef.current = [...itemsToProcess, ...queueRef.current];
      saveQueue(queueRef.current);

      // Set up retry timer if not already set
      if (!retryTimerRef.current) {
        retryTimerRef.current = setTimeout(() => {
          retryTimerRef.current = null;
          processQueue();
        }, 5000);
      }
    }
  }, []);

  const resolveConflict = useCallback((resolution: 'local' | 'remote') => {
    if (resolution === 'local') {
      // Re-assign new clientIds/timestamps to bypass unique constraints and retry
      queueRef.current = queueRef.current.map(item => ({
        ...item,
        clientId: Date.now() + Math.floor(Math.random() * 1000),
        timestamp: Date.now()
      }));
      saveQueue(queueRef.current);
      setConflictMsg(null);
      setStatus('saving');
      processQueue();
    } else {
      // Discard conflicting updates from queue
      queueRef.current = [];
      saveQueue([]);
      setConflictMsg(null);
      setStatus('saved');
    }
  }, [processQueue]);

  useEffect(() => {
    // Initial queue loading on mount
    queueRef.current = loadQueue();
    if (queueRef.current.length > 0) {
      if (isOnlineRef.current) {
        setStatus('saving');
        processQueue();
      } else {
        setStatus('offline');
      }
    }
  }, [processQueue]);

  useEffect(() => {
    const handleOnline = () => {
      isOnlineRef.current = true;
      setStatus(queueRef.current.length > 0 ? 'saving' : 'saved');
      processQueue();
    };
    const handleOffline = () => {
      isOnlineRef.current = false;
      setStatus('offline');
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
      }
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
    };
  }, [processQueue]);

  const persistUpdate = useCallback((encryptedBlob: number[], clientId: number = Date.now()) => {
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

    queueRef.current.push(newUpdate);
    saveQueue(queueRef.current);

    if (isOnlineRef.current) {
      setStatus('saving');
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
      syncTimerRef.current = setTimeout(() => {
        processQueue();
      }, 1000);
    } else {
      setStatus('offline');
    }
  }, [documentId, processQueue]);

  return {
    status,
    conflictMsg,
    dismissConflict: () => {
      setConflictMsg(null);
      setStatus('saved');
    },
    resolveConflict,
    persistUpdate
  };
}
