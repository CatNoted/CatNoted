declare module 'y-indexeddb' {
  import { Doc } from 'yjs';
  export class IndexeddbPersistence {
    constructor(name: string, doc: Doc);
    on(event: 'synced', callback: () => void): void;
    off(event: 'synced', callback: () => void): void;
    destroy(): void;
  }
}
