export interface VFSNode {
  path: string;
  content: string;
  type: 'file' | 'directory';
  updatedAt: number;
}

export class BrowserVFS {
  private prefix = 'catnoted_vfs:';

  constructor() {
    if (this.list().length === 0) {
      this.write('skills/widget_maker.md', '# Widget Maker Skill\nAgent can generate HTML widgets.');
      this.write('settings/keys.json', JSON.stringify({ geminiKey: '', openaiKey: '' }));
    }
  }

  write(path: string, content: string): void {
    const node: VFSNode = {
      path,
      content,
      type: 'file',
      updatedAt: Date.now()
    };
    localStorage.setItem(this.prefix + path, JSON.stringify(node));
  }

  read(path: string): string | null {
    const raw = localStorage.getItem(this.prefix + path);
    if (!raw) return null;
    try {
      const node = JSON.parse(raw) as VFSNode;
      return node.content;
    } catch {
      return null;
    }
  }

  delete(path: string): void {
    localStorage.removeItem(this.prefix + path);
  }

  list(): VFSNode[] {
    const list: VFSNode[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.prefix)) {
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            list.push(JSON.parse(raw) as VFSNode);
          }
        } catch {}
      }
    }
    return list;
  }
}
