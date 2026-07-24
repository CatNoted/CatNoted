import { createRoot } from 'react-dom/client';
import { SettingsModal } from './SettingsModal.js';
import { describe, it, expect, vi } from 'vitest';
import { act } from 'react';

describe('SettingsModal Integration Tests', () => {
  it('should render nothing when isOpen is false', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const onClose = vi.fn();
    const onPassphraseChange = vi.fn();

    await act(async () => {
      const root = createRoot(container);
      root.render(
        <SettingsModal
          isOpen={false}
          onClose={onClose}
          passphrase=""
          onPassphraseChange={onPassphraseChange}
        />
      );
    });

    // Verify it renders nothing
    expect(container.innerHTML).toBe('');

    // Clean up
    document.body.removeChild(container);
  });
});
