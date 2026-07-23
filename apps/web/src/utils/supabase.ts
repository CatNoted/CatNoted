import { createClient } from '@supabase/supabase-js';

const supabaseUrl = ((import.meta as any).env.VITE_SUPABASE_URL as string) || '';
const supabaseAnonKey = ((import.meta as any).env.VITE_SUPABASE_ANON_KEY as string) || '';

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

class MockBroadcastChannel {
  private listeners: Set<(payload: any) => void> = new Set();

  subscribe(callback: (payload: any) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  broadcast(payload: any) {
    setTimeout(() => {
      this.listeners.forEach(cb => cb(payload));
    }, 100);
  }
}

export const mockSyncChannel = new MockBroadcastChannel();
