import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useDocumentStore,
  createJournalPage,
  yblocks,
  ypages
} from '@catnoted/editor';

describe('Journals System Integration', () => {
  beforeEach(() => {
    // Clear stores before each test
    yblocks.delete(0, yblocks.length);
    ypages.clear();
  });

  it('should create a blank journal page and set correct metadata', () => {
    let pageId: string;
    act(() => {
      pageId = createJournalPage('2026-01-14', 'empty');
    });

    expect(pageId).toBe('journal-2026-01-14');

    const meta = ypages.get(pageId);
    expect(meta).toBeDefined();
    expect(meta?.id).toBe(pageId);
    expect(meta?.title).toBe('January 14, 2026');
    expect(meta?.journalDate).toBe('2026-01-14');
    expect(meta?.icon).toBe('📅');

    // Should have 2 blocks (Heading 1 and 1 empty text)
    const pageBlocks = yblocks.toArray().filter(b => b.parentId === pageId);
    expect(pageBlocks).toHaveLength(2);
    expect(pageBlocks[0].type).toBe('heading');
    expect(pageBlocks[0].content).toBe('January 14, 2026');
    expect(pageBlocks[1].type).toBe('text');
    expect(pageBlocks[1].content).toBe('');
  });

  it('should seed a daily reflection template correct structures', () => {
    let pageId: string;
    act(() => {
      pageId = createJournalPage('2026-01-14', 'reflection');
    });

    const pageBlocks = yblocks.toArray().filter(b => b.parentId === pageId);
    expect(pageBlocks).toHaveLength(7);
    expect(pageBlocks[0].type).toBe('heading');
    expect(pageBlocks[0].content).toContain('Daily Reflection');
    expect(pageBlocks[1].content).toContain('What went well');
    expect(pageBlocks[3].content).toContain('What could have been better');
    expect(pageBlocks[5].content).toContain('grateful');
  });

  it('should seed gratitude journal template structures correctly', () => {
    let pageId: string;
    act(() => {
      pageId = createJournalPage('2026-01-14', 'gratitude');
    });

    const pageBlocks = yblocks.toArray().filter(b => b.parentId === pageId);
    expect(pageBlocks).toHaveLength(4);
    expect(pageBlocks[0].type).toBe('heading');
    expect(pageBlocks[0].content).toContain('Gratitude Journal');
    expect(pageBlocks[1].type).toBe('bullet');
    expect(pageBlocks[1].content).toContain('Three wonderful things');
  });

  it('should not duplicate journal pages if createJournalPage is called twice for the same date', () => {
    let pageId1: string;
    let pageId2: string;

    act(() => {
      pageId1 = createJournalPage('2026-01-14', 'empty');
    });

    // Manually add custom block
    act(() => {
      yblocks.insert(yblocks.length, [{
        id: 'b-custom',
        type: 'text',
        content: 'My special entry',
        parentId: pageId1
      }]);
    });

    act(() => {
      pageId2 = createJournalPage('2026-01-14', 'gratitude');
    });

    expect(pageId1).toBe(pageId2);

    // Page blocks should still contain our custom entry and not be overwritten by gratitude templates
    const pageBlocks = yblocks.toArray().filter(b => b.parentId === pageId1);
    expect(pageBlocks.some(b => b.id === 'b-custom')).toBe(true);
  });
});
