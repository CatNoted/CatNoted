import { createClient } from '@supabase/supabase-js';
import { SyncRoom } from '@catnoted/shared';

const supabaseUrl = ((import.meta as any).env.VITE_SUPABASE_URL as string) || '';
const supabaseAnonKey = ((import.meta as any).env.VITE_SUPABASE_ANON_KEY as string) || '';

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export class MockSyncRoom implements SyncRoom {
  private listeners: Set<(payload: any) => void> = new Set();
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => { this.isOnline = true; });
      window.addEventListener('offline', () => { this.isOnline = false; });
    }
  }

  subscribe(callback: (payload: any) => void) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  broadcast(payload: any) {
    if (!this.isOnline) return;
    setTimeout(() => {
      this.listeners.forEach(cb => cb(payload));
    }, 100);
  }

  status(): 'connected' | 'disconnected' | 'connecting' {
    return this.isOnline ? 'connected' : 'disconnected';
  }
}

export const mockSyncChannel = new MockSyncRoom();
