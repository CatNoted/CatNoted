import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, it, expect, vi } from 'vitest';
import { SandboxFrame } from '../SandboxFrame.js';

describe('SandboxFrame Component Tests', () => {
  it('renders iframe with combined srcDoc containing handlers', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    await act(async () => {
      const root = createRoot(container);
      root.render(
        <SandboxFrame
          srcDoc="<div>Hello Test</div>"
          theme="dark"
          height="200px"
        />
      );
    });

    const iframe = container.querySelector('iframe');
    expect(iframe).not.toBeNull();
    expect(iframe?.getAttribute('sandbox')).toBe('allow-scripts');
    expect(iframe?.getAttribute('style')).toContain('height: 200px');

    const srcDocContent = iframe?.getAttribute('srcDoc');
    expect(srcDocContent).toContain('sandbox_error');
    expect(srcDocContent).toContain('<div>Hello Test</div>');

    document.body.removeChild(container);
  });

  it('triggers onError callback when sandbox_error message is received', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const onErrorMock = vi.fn();

    await act(async () => {
      const root = createRoot(container);
      root.render(
        <SandboxFrame
          srcDoc="<div>Hello Test</div>"
          onError={onErrorMock}
        />
      );
    });

    // Simulate window receiving message from the sandboxed iframe
    const iframe = container.querySelector('iframe');
    await act(async () => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            type: 'sandbox_error',
            payload: { message: 'ReferenceError: invalidVar is not defined' },
          },
          source: iframe?.contentWindow,
        })
      );
    });

    expect(onErrorMock).toHaveBeenCalledTimes(1);
    expect(onErrorMock).toHaveBeenCalledWith({ message: 'ReferenceError: invalidVar is not defined' });

    document.body.removeChild(container);
  });
});
