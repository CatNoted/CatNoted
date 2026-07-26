import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react-hooks';
import { usePersistence } from '../persistence.js';

// Mock Supabase Config
vi.mock('../../supabase.js', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ error: null })
    }))
  },
  isSupabaseConfigured: true
}));

import { supabase } from '../../supabase.js';

describe('usePersistence Hook - Offline/Sync/Conflict Tests', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    // Default online
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: true,
      writable: true
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should initialize with offline status if navigator is offline', () => {
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: false,
      writable: true
    });

    const { result } = renderHook(() => usePersistence());
    expect(result.current.status).toBe('offline');
  });

  it('should queue updates when offline and store in localStorage', () => {
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: false,
      writable: true
    });

    const { result } = renderHook(() => usePersistence());
    act(() => {
      result.current.persistUpdate([1, 2, 3], 123456);
    });

    expect(result.current.status).toBe('offline');
    const saved = localStorage.getItem('catnoted:offline-sync-queue');
    expect(saved).toBeDefined();
    const parsed = JSON.parse(saved || '[]');
    expect(parsed.length).toBe(1);
    expect(parsed[0].encryptedBlob).toEqual([1, 2, 3]);
  });

  it('should load offline queue from localStorage on mount and process when online', async () => {
    // Seed localStorage with a pending item
    const queuedItem = {
      id: 'test-id',
      documentId: '00000000-0000-0000-0000-000000000000',
      encryptedBlob: [4, 5, 6],
      clientId: 999,
      timestamp: Date.now()
    };
    localStorage.setItem('catnoted:offline-sync-queue', JSON.stringify([queuedItem]));

    const mockInsert = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as any);

    const { result } = renderHook(() => usePersistence());

    // It should start processing on mount because we are online
    expect(result.current.status).toBe('saving');

    await act(async () => {
      await Promise.resolve(); // resolve promise inside processQueue
    });

    expect(mockInsert).toHaveBeenCalled();
    expect(result.current.status).toBe('saved');
    expect(localStorage.getItem('catnoted:offline-sync-queue')).toBe('[]');
  });

  it('should detect duplicate/conflict and trigger version divergence workflow', async () => {
    const mockInsert = vi.fn().mockResolvedValue({
      error: { code: '23505', message: 'duplicate key value violates unique constraint' }
    });
    vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as any);

    const { result } = renderHook(() => usePersistence());

    act(() => {
      result.current.persistUpdate([11, 12], 555);
    });

    // Fast-forward to processQueue
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.status).toBe('conflict');
    expect(result.current.conflictMsg).toContain('Version conflict detected');

    // Test Resolution 1: Keep Local (overwrite/retry with fresh clientId)
    mockInsert.mockResolvedValue({ error: null }); // Succeed on retry

    // Switch to real timers momentarily so setTimeout(..., 0) can resolve without vi timing interference
    vi.useRealTimers();

    act(() => {
      result.current.resolveConflict('local');
    });

    await act(async () => {
      // Allow multiple microtask/async loops to complete
      for (let i = 0; i < 10; i++) {
        await Promise.resolve();
      }
    });

    expect(result.current.status).toBe('saved');
    expect(result.current.conflictMsg).toBeNull();
  });

  it('should discard local changes on remote resolution conflict option', async () => {
    const mockInsert = vi.fn().mockResolvedValue({
      error: { code: '23505', message: 'duplicate key value violates unique constraint' }
    });
    vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as any);

    const { result } = renderHook(() => usePersistence());

    act(() => {
      result.current.persistUpdate([21, 22], 777);
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.status).toBe('conflict');

    // Test Resolution 2: Discard Local
    act(() => {
      result.current.resolveConflict('remote');
    });

    expect(result.current.status).toBe('saved');
    expect(result.current.conflictMsg).toBeNull();
    expect(localStorage.getItem('catnoted:offline-sync-queue')).toBe('[]');
  });
});
