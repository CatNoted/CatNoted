import { describe, it, expect, beforeEach } from 'vitest';
import { BrowserVFS } from '../vfs.js';

describe('Whitebox Test: BrowserVFS (Virtual File System)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should initialize default skills and settings when VFS is empty', () => {
    const vfs = new BrowserVFS();
    const files = vfs.list();

    expect(files.length).toBeGreaterThanOrEqual(2);
    expect(vfs.read('skills/widget_maker.md')).toContain('# Widget Maker Skill');
    expect(vfs.read('settings/keys.json')).toContain('geminiKey');
  });

  it('should write and read files from VFS accurately', () => {
    const vfs = new BrowserVFS();
    const sampleContent = 'export function hello() { return "world"; }';
    
    vfs.write('scripts/hello.js', sampleContent);
    const content = vfs.read('scripts/hello.js');

    expect(content).toBe(sampleContent);
  });

  it('should return null when reading non-existent paths', () => {
    const vfs = new BrowserVFS();
    expect(vfs.read('non/existent/file.txt')).toBeNull();
  });

  it('should delete existing files from VFS', () => {
    const vfs = new BrowserVFS();
    vfs.write('temp/draft.md', '# Temporary Draft');
    expect(vfs.read('temp/draft.md')).not.toBeNull();

    vfs.delete('temp/draft.md');
    expect(vfs.read('temp/draft.md')).toBeNull();
  });

  it('should list all stored VFS nodes correctly', () => {
    const vfs = new BrowserVFS();
    vfs.write('notes/note1.txt', 'Note 1');
    vfs.write('notes/note2.txt', 'Note 2');

    const list = vfs.list();
    const paths = list.map((n) => n.path);

    expect(paths).toContain('notes/note1.txt');
    expect(paths).toContain('notes/note2.txt');
  });
});
