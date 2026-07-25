import { createRoot } from 'react-dom/client';
import { usePersistence } from '../sync/persistence.js';
import { SyncRoom } from '@catnoted/shared';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from 'react';

// A simple implementation of SyncRoom for testing
class TestSyncRoom implements SyncRoom {
  private listeners = new Set<(payload: any) => void>();
  private connectionStatus: 'connected' | 'disconnected' | 'connecting' = 'connected';

  subscribe(callback: (payload: any) => void) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  broadcast(payload: any) {
    this.listeners.forEach((cb) => cb(payload));
  }

  status(): 'connected' | 'disconnected' | 'connecting' {
    return this.connectionStatus;
  }

  setConnectionStatus(status: 'connected' | 'disconnected' | 'connecting') {
    this.connectionStatus = status;
  }
}

describe('usePersistence Hook tests', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should initialize status based on the room status', async () => {
    const room = new TestSyncRoom();
    room.setConnectionStatus('disconnected');

    let hookResult: any = null;
    const TestComponent = () => {
      hookResult = usePersistence('test-doc-id', room);
      return null;
    };

    await act(async () => {
      const root = createRoot(container);
      root.render(<TestComponent />);
    });

    expect(hookResult.status).toBe('offline');
  });

  it('should transition status when online/offline events are dispatched', async () => {
    const room = new TestSyncRoom();
    room.setConnectionStatus('connected');

    let hookResult: any = null;
    const TestComponent = () => {
      hookResult = usePersistence('test-doc-id', room);
      return null;
    };

    await act(async () => {
      const root = createRoot(container);
      root.render(<TestComponent />);
    });

    expect(hookResult.status).toBe('saved');

    // Simulate going offline
    room.setConnectionStatus('disconnected');
    await act(async () => {
      window.dispatchEvent(new Event('offline'));
    });

    expect(hookResult.status).toBe('offline');

    // Simulate going online
    room.setConnectionStatus('connected');
    await act(async () => {
      window.dispatchEvent(new Event('online'));
    });

    expect(hookResult.status).toBe('saved');
  });

  it('should handle persistUpdate call and save to the local queue', async () => {
    const room = new TestSyncRoom();
    room.setConnectionStatus('connected');

    let hookResult: any = null;
    const TestComponent = () => {
      hookResult = usePersistence('test-doc-id', room);
      return null;
    };

    await act(async () => {
      const root = createRoot(container);
      root.render(<TestComponent />);
    });

    await act(async () => {
      hookResult.persistUpdate([1, 2, 3], 456);
    });

    expect(hookResult.status).toBe('saving');
  });
});
