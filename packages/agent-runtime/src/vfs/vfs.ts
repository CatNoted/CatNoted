export interface VFSNode {
  path: string;
  content: string;
  type: 'file' | 'directory';
  updatedAt: number;
}

export class BrowserVFS {
  private dbName = 'catnoted_vfs_db';
  private storeName = 'vfs_nodes';
  private version = 1;
  private dbPromise: Promise<IDBDatabase>;

  constructor() {
    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'path' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async initDefaults(): Promise<void> {
    const files = await this.list();
    if (files.length === 0) {
      await this.write('skills/widget_maker.md', '# Widget Maker Skill\nAgent can generate HTML widgets.');
      await this.write('settings/keys.json', JSON.stringify({ geminiKey: '', openaiKey: '' }));
    }
  }

  async write(path: string, content: string): Promise<void> {
    const db = await this.dbPromise;
    const node: VFSNode = {
      path,
      content,
      type: 'file',
      updatedAt: Date.now()
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const request = store.put(node);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async read(path: string): Promise<string | null> {
    const db = await this.dbPromise;

    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const request = store.get(path);

      request.onsuccess = () => {
        const node = request.result as VFSNode | undefined;
        resolve(node ? node.content : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async delete(path: string): Promise<void> {
    const db = await this.dbPromise;

    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const request = store.delete(path);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async list(): Promise<VFSNode[]> {
    const db = await this.dbPromise;

    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result as VFSNode[]);
      request.onerror = () => reject(request.error);
    });
  }
}
