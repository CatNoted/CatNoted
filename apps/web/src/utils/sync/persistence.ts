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

export function usePersistence(documentId: string = '00000000-0000-0000-0000-000000000000') {
  const [status, setStatus] = useState<SyncStatus>('saved');
  const [conflictMsg, setConflictMsg] = useState<string | null>(null);

  const queueRef = useRef<QueuedUpdate[]>([]);
  const isOnlineRef = useRef<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const processQueue = useCallback(async () => {
    if (!isOnlineRef.current || queueRef.current.length === 0) return;

    setStatus('saving');

    const itemsToProcess = [...queueRef.current];
    queueRef.current = [];

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
             // Re-queue remaining un-synced items
             queueRef.current = [...itemsToProcess.slice(i + 1), ...queueRef.current];
             return;
          }
          // On other errors, put this item and remaining back into queue
          queueRef.current = [...itemsToProcess.slice(i), ...queueRef.current];
          throw error;
        }
      }
      setStatus('saved');
    } catch (e: any) {
      console.error('Failed to sync crdt_update:', e);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      isOnlineRef.current = true;
      setStatus(queueRef.current.length > 0 ? 'saving' : 'saved');
      processQueue();
    };
    const handleOffline = () => {
      isOnlineRef.current = false;
      setStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
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
    persistUpdate
  };
}
