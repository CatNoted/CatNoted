import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../supabase.js';
import { ydoc } from '@catnoted/editor';
import * as Y from 'yjs';
import { decryptPayload } from '../crypto.js';

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

function hexToBytes(hex: string): Uint8Array {
  let cleanHex = hex.replace(/^\\x|^0x/i, '');
  if (cleanHex.length % 2 !== 0) {
    cleanHex = '0' + cleanHex;
  }
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
  }
  return bytes;
}

export function usePersistence(
  documentId: string = '00000000-0000-0000-0000-000000000000',
  passphrase?: string
) {
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

        // Ensure the document exists in the public.documents table first to avoid foreign key violation
        const { data: docExists, error: docCheckError } = await supabase
          .from('documents')
          .select('id')
          .eq('id', item.documentId)
          .maybeSingle();

        if (!docExists && !docCheckError) {
          // Fetch user's workspaces under workspace membership rules
          const { data: workspaces } = await supabase
            .from('workspaces')
            .select('id')
            .limit(1);

          const workspaceId = workspaces && workspaces.length > 0
            ? workspaces[0].id
            : null;

          if (workspaceId) {
            await supabase.from('documents').insert({
              id: item.documentId,
              workspace_id: workspaceId,
              type: 'doc',
              encrypted_title: '',
              encrypted_meta: ''
            });
          }
        }

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

  // Fetch and apply remote updates on load
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !passphrase) return;

    let isMounted = true;

    const loadRemoteUpdates = async () => {
      if (!supabase) return;
      try {
        const validUuidMatch = documentId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
        const dbDocId = validUuidMatch ? documentId : '00000000-0000-0000-0000-000000000000';

        const { data, error } = await supabase
          .from('crdt_updates')
          .select('encrypted_blob')
          .eq('document_id', dbDocId)
          .order('created_at', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0 && isMounted) {
          const decryptedUpdates: Uint8Array[] = [];
          for (const row of data) {
            try {
              const encryptedBytes = typeof row.encrypted_blob === 'string'
                ? hexToBytes(row.encrypted_blob)
                : new Uint8Array(row.encrypted_blob);

              const decrypted = await decryptPayload(encryptedBytes, passphrase);
              decryptedUpdates.push(decrypted);
            } catch (e) {
              console.warn('Failed to decrypt loaded remote update:', e);
            }
          }

          if (decryptedUpdates.length > 0 && isMounted) {
            ydoc.transact(() => {
              for (const decrypted of decryptedUpdates) {
                Y.applyUpdate(ydoc, decrypted, 'remote-sync');
              }
            }, 'remote-sync');
          }
        }
      } catch (err) {
        console.error('Failed to load remote CRDT updates:', err);
      }
    };

    if (typeof navigator !== 'undefined' && navigator.onLine) {
      loadRemoteUpdates();
    }

    return () => {
      isMounted = false;
    };
  }, [documentId, passphrase]);

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
