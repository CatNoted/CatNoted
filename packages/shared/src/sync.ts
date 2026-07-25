export interface SyncRoom {
  subscribe(callback: (payload: any) => void): () => void;
  broadcast(payload: any): void;
  status(): 'connected' | 'disconnected' | 'connecting';
}
