import { createClient, RealtimeChannel } from '@supabase/supabase-js';

const supabaseUrl = ((import.meta as any).env.VITE_SUPABASE_URL as string) || '';
const supabaseAnonKey = ((import.meta as any).env.VITE_SUPABASE_ANON_KEY as string) || '';

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

class SupabaseSyncChannel {
  private listeners: Set<(payload: any) => void> = new Set();
  private activeChannel: RealtimeChannel | null = null;
  private workspaceId: string = '00000000-0000-0000-0000-000000000000';
  private browserChannel: any = null;

  constructor() {
    // Local tab broadcast channel to sync offline/local-first behavior across tabs
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.browserChannel = new BroadcastChannel('catnoted-sync-room');
      this.browserChannel.onmessage = (event: any) => {
        this.notifyListeners(event.data);
      };
    }

    // Set up auth state change listener to update real-time channel
    if (supabase) {
      supabase.auth.onAuthStateChange(async (_event, session) => {
        await this.initializeChannel(session);
      });
      // Initial trigger
      supabase.auth.getSession().then(({ data: { session } }) => {
        this.initializeChannel(session);
      });
    }
  }

  private notifyListeners(payload: any) {
    this.listeners.forEach(cb => cb(payload));
  }

  async initializeChannel(session: any) {
    if (this.activeChannel) {
      await this.activeChannel.unsubscribe();
      this.activeChannel = null;
    }

    if (!supabase || !session?.user) {
      this.workspaceId = '00000000-0000-0000-0000-000000000000';
      return;
    }

    try {
      // Fetch user's workspaces under workspace membership rules
      const { data: workspaces, error } = await supabase
        .from('workspaces')
        .select('id')
        .limit(1);

      if (workspaces && workspaces.length > 0) {
        this.workspaceId = workspaces[0].id;
      } else {
        this.workspaceId = '00000000-0000-0000-0000-000000000000';
      }
    } catch (err) {
      console.error('Failed to fetch workspaces for channel initialization:', err);
      this.workspaceId = '00000000-0000-0000-0000-000000000000';
    }

    // Subscribe under workspace membership rules (using workspaceId)
    const channelName = `workspace:${this.workspaceId}`;
    this.activeChannel = supabase.channel(channelName, {
      config: {
        broadcast: { self: true },
      },
    });

    this.activeChannel
      .on('broadcast', { event: 'sync' }, (response) => {
        this.notifyListeners(response.payload);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Successfully subscribed to Supabase realtime channel: ${channelName}`);
        }
      });
  }

  subscribe(callback: (payload: any) => void) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  broadcast(payload: any) {
    // 1. Broadcast locally to other tabs/instances
    if (this.browserChannel) {
      this.browserChannel.postMessage(payload);
    } else {
      // Fallback in-memory broadcast for the same page/process or tests
      setTimeout(() => {
        this.notifyListeners(payload);
      }, 50);
    }

    // 2. Broadcast via Supabase Realtime if online and channel is active
    if (this.activeChannel && typeof navigator !== 'undefined' && navigator.onLine) {
      this.activeChannel.send({
        type: 'broadcast',
        event: 'sync',
        payload: payload,
      }).catch((err: any) => {
        console.warn('Failed to broadcast payload via Supabase channel:', err);
      });
    }
  }
}

export const mockSyncChannel = new SupabaseSyncChannel();
