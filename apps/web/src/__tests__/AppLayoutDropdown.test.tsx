import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { describe, it, expect, vi } from 'vitest';

// Enable React act() environment to clean up console warnings
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
import { AppLayout } from '../layouts/AppLayout.js';

// Mock @catnoted/agent-runtime to avoid any background sandbox compile or dynamic ESM issues.
vi.mock('@catnoted/agent-runtime', () => ({
  requestLlmWidget: vi.fn(),
}));

describe('AppLayout Profile Dropdown Tests', () => {
  it('should render the avatar button and toggle the dropdown on click', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    const onModeChange = vi.fn();
    const onToggleTheme = vi.fn();
    const onOpenAuth = vi.fn();
    const onOpenSettings = vi.fn();

    await act(async () => {
      root.render(
        <AppLayout
          activeMode="doc"
          onModeChange={onModeChange}
          isDarkMode={true}
          onToggleTheme={onToggleTheme}
          userEmail="john@catnoted.com"
          onOpenAuth={onOpenAuth}
          onOpenSettings={onOpenSettings}
        >
          <div>Child Content</div>
        </AppLayout>
      );
    });

    // Verify avatar button exists with proper initials
    const avatarButton = container.querySelector('button[title="User Profile Menu"]') as HTMLButtonElement;
    expect(avatarButton).not.toBeNull();
    expect(avatarButton.textContent).toBe('JO'); // initials of john@catnoted.com

    // Dropdown should be closed initially
    expect(container.querySelector('[role="menu"]')).toBeNull();

    // Click the avatar button to open the dropdown
    await act(async () => {
      avatarButton.click();
    });

    // Dropdown menu should be visible
    const dropdownMenu = container.querySelector('[role="menu"]');
    expect(dropdownMenu).not.toBeNull();

    // Verify Local VFS Connected status is present inside dropdown
    expect(dropdownMenu?.textContent).toContain('Local VFS Connected');

    // Find and click the Auth shortcut
    const buttons = Array.from(container.querySelectorAll('button'));
    const authButton = buttons.find(b => b.textContent?.includes('Auth:'));
    expect(authButton).toBeDefined();

    await act(async () => {
      authButton?.click();
    });
    expect(onOpenAuth).toHaveBeenCalled();

    // Re-open dropdown (since it gets closed on shortcut trigger)
    await act(async () => {
      avatarButton.click();
    });

    // Find and click the Settings shortcut
    const settingsButton = Array.from(container.querySelectorAll('button')).find(b => b.textContent?.includes('Settings & Keys'));
    expect(settingsButton).toBeDefined();

    await act(async () => {
      settingsButton?.click();
    });
    expect(onOpenSettings).toHaveBeenCalled();

    // Re-open dropdown
    await act(async () => {
      avatarButton.click();
    });

    // Find and click the Theme Toggle shortcut
    const themeButton = Array.from(container.querySelectorAll('button')).find(b => b.textContent?.includes('Light Mode') || b.textContent?.includes('Dark Mode'));
    expect(themeButton).toBeDefined();

    await act(async () => {
      themeButton?.click();
    });
    expect(onToggleTheme).toHaveBeenCalled();

    // Clean up
    await act(async () => {
      root.unmount();
    });
    document.body.removeChild(container);
  });
});
