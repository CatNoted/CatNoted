import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BrowserVFS } from '../vfs.js';

// Setup a simple in-memory mock for indexedDB
const mockStore = new Map();
const mockIDB = {
  open: vi.fn(() => {
    const request: any = {};
    setTimeout(() => {
      request.result = {
        objectStoreNames: { contains: () => true },
        transaction: () => ({
          objectStore: () => ({
            put: (node: any) => {
              const req: any = {};
              setTimeout(() => {
                mockStore.set(node.path, node);
                if (req.onsuccess) req.onsuccess();
              }, 0);
              return req;
            },
            get: (path: string) => {
              const req: any = {};
              setTimeout(() => {
                req.result = mockStore.get(path);
                if (req.onsuccess) req.onsuccess();
              }, 0);
              return req;
            },
            delete: (path: string) => {
              const req: any = {};
              setTimeout(() => {
                mockStore.delete(path);
                if (req.onsuccess) req.onsuccess();
              }, 0);
              return req;
            },
            getAll: () => {
              const req: any = {};
              setTimeout(() => {
                req.result = Array.from(mockStore.values());
                if (req.onsuccess) req.onsuccess();
              }, 0);
              return req;
            }
          })
        })
      };
      if (request.onsuccess) request.onsuccess();
    }, 0);
    return request;
  }),
  deleteDatabase: vi.fn(() => {
    const request: any = {};
    setTimeout(() => {
      mockStore.clear();
      if (request.onsuccess) request.onsuccess();
    }, 0);
    return request;
  })
};

vi.stubGlobal('indexedDB', mockIDB);

describe('Whitebox Test: BrowserVFS (Virtual File System)', () => {
  beforeEach(async () => {
    mockStore.clear();
  });

  it('should initialize default skills and settings when VFS is empty', async () => {
    const vfs = new BrowserVFS();
    await vfs.initDefaults();
    const files = await vfs.list();

    expect(files.length).toBeGreaterThanOrEqual(2);
    expect(await vfs.read('skills/widget_maker.md')).toContain('# Widget Maker Skill');
    expect(await vfs.read('settings/keys.json')).toContain('geminiKey');
  });

  it('should write and read files from VFS accurately', async () => {
    const vfs = new BrowserVFS();
    const sampleContent = 'export function hello() { return "world"; }';
    
    await vfs.write('scripts/hello.js', sampleContent);
    const content = await vfs.read('scripts/hello.js');

    expect(content).toBe(sampleContent);
  });

  it('should return null when reading non-existent paths', async () => {
    const vfs = new BrowserVFS();
    expect(await vfs.read('non/existent/file.txt')).toBeNull();
  });

  it('should delete existing files from VFS', async () => {
    const vfs = new BrowserVFS();
    await vfs.write('temp/draft.md', '# Temporary Draft');
    expect(await vfs.read('temp/draft.md')).not.toBeNull();

    await vfs.delete('temp/draft.md');
    expect(await vfs.read('temp/draft.md')).toBeNull();
  });

  it('should list all stored VFS nodes correctly', async () => {
    const vfs = new BrowserVFS();
    await vfs.write('notes/note1.txt', 'Note 1');
    await vfs.write('notes/note2.txt', 'Note 2');

    const list = await vfs.list();
    const paths = list.map((n) => n.path);

    expect(paths).toContain('notes/note1.txt');
    expect(paths).toContain('notes/note2.txt');
  });
});
