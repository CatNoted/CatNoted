import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BrowserVFS, requestLlmWidget } from '@catnoted/agent-runtime';

describe('BrowserVFS', () => {
  let vfs: BrowserVFS;

  beforeEach(() => {
    localStorage.clear();
    vfs = new BrowserVFS();
  });

  it('should initialize with default files', () => {
    const list = vfs.list();
    expect(list.length).toBeGreaterThan(0);
    expect(list.some(f => f.path === 'skills/widget_maker.md')).toBe(true);
    expect(list.some(f => f.path === 'settings/keys.json')).toBe(true);
  });

  it('should read, write, and delete files', () => {
    const testPath = 'test/file.txt';
    const testContent = 'Hello VFS';

    vfs.write(testPath, testContent);
    expect(vfs.read(testPath)).toBe(testContent);

    const list = vfs.list();
    expect(list.some(f => f.path === testPath)).toBe(true);

    vfs.delete(testPath);
    expect(vfs.read(testPath)).toBeNull();
  });
});

describe('requestLlmWidget', () => {
  it('should return a fallback widget when no API key is provided', async () => {
    const result = await requestLlmWidget('create a calculator');
    expect(result.code).toContain('calc-display');
    expect(result.text).toContain('Successfully compiled a secure HTML/JS widget for "Mini Calculator".');
  });

  it('should return a fallback analog clock widget', async () => {
    const result = await requestLlmWidget('create a clock');
    expect(result.code).toContain('hour-hand');
    expect(result.text).toContain('Successfully compiled a secure HTML/JS widget for "Analog Clock".');
  });

  it('should return a fallback todo widget', async () => {
    const result = await requestLlmWidget('create a todo');
    expect(result.code).toContain('todo-in');
    expect(result.text).toContain('Successfully compiled a secure HTML/JS widget for "Quick Tasks Todo".');
  });
});
