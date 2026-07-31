import { createRoot } from 'react-dom/client';
import { ToastProvider, useToast } from './Toast.js';
import { describe, it, expect, beforeEach } from 'vitest';
import { act } from 'react';

const TestApp: React.FC = () => {
  const { toast } = useToast();
  return (
    <div>
      <button id="success-btn" onClick={() => toast('Operation was successful!', { variant: 'success' })}>
        Success
      </button>
      <button id="warning-btn" onClick={() => toast('Warning: payload limit reached', { variant: 'warning' })}>
        Warning
      </button>
      <button id="danger-btn" onClick={() => toast('Error updating VFS nodes', { variant: 'danger', duration: 100 })}>
        Danger
      </button>
    </div>
  );
};

describe('Toast Component & Provider Tests', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  const cleanup = () => {
    document.body.removeChild(container);
  };

  it('should render children and display success, warning, and danger toasts when triggered', async () => {
    await act(async () => {
      const root = createRoot(container);
      root.render(
        <ToastProvider>
          <TestApp />
        </ToastProvider>
      );
    });

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(container.innerHTML).toContain('Success');

    // Initially no toast is rendered
    expect(container.innerHTML).not.toContain('Operation was successful!');

    // Trigger Success Toast
    const successBtn = container.querySelector('#success-btn') as HTMLButtonElement;
    await act(async () => {
      successBtn.click();
    });

    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(container.innerHTML).toContain('Operation was successful!');
    expect(container.innerHTML).toContain('bg-success-soft'); // Variant container style

    // Trigger Warning Toast
    const warningBtn = container.querySelector('#warning-btn') as HTMLButtonElement;
    await act(async () => {
      warningBtn.click();
    });

    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(container.innerHTML).toContain('Warning: payload limit reached');
    expect(container.innerHTML).toContain('bg-warning-soft'); // Variant container style

    cleanup();
  });

  it('should remove toast when close button is clicked', async () => {
    await act(async () => {
      const root = createRoot(container);
      root.render(
        <ToastProvider>
          <TestApp />
        </ToastProvider>
      );
    });

    await new Promise((resolve) => setTimeout(resolve, 10));

    const successBtn = container.querySelector('#success-btn') as HTMLButtonElement;
    await act(async () => {
      successBtn.click();
    });

    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(container.innerHTML).toContain('Operation was successful!');

    // Find and click the close button
    const closeBtn = container.querySelector('button[aria-label="Close notification"]') as HTMLButtonElement;
    expect(closeBtn).not.toBeNull();

    await act(async () => {
      closeBtn.click();
    });

    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(container.innerHTML).not.toContain('Operation was successful!');

    cleanup();
  });

  it('should auto-dismiss toast after duration', async () => {
    await act(async () => {
      const root = createRoot(container);
      root.render(
        <ToastProvider>
          <TestApp />
        </ToastProvider>
      );
    });

    await new Promise((resolve) => setTimeout(resolve, 10));

    const dangerBtn = container.querySelector('#danger-btn') as HTMLButtonElement;
    await act(async () => {
      dangerBtn.click();
    });

    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(container.innerHTML).toContain('Error updating VFS nodes');

    // Wait for auto-dismiss duration of 100ms
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 150));
    });

    expect(container.innerHTML).not.toContain('Error updating VFS nodes');

    cleanup();
  });
});
