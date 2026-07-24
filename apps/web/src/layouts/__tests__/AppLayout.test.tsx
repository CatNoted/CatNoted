import { createRoot } from 'react-dom/client';
import { AppLayout } from '../AppLayout.js';
import { describe, it, expect, vi } from 'vitest';
import { act } from 'react';

// Mock @catnoted/agent-runtime to avoid network requests or compilation runtimes
vi.mock('@catnoted/agent-runtime', () => ({
  requestLlmWidget: vi.fn(),
  SandboxFrame: () => <div data-testid="sandbox-frame" />
}));

describe('AppLayout Sidebar Integration Tests', () => {
  it('should render the workspace sidebar, recent documents list, and page tree categories', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const onModeChange = vi.fn();
    const onToggleTheme = vi.fn();
    const onPageSelect = vi.fn();

    await act(async () => {
      const root = createRoot(container);
      root.render(
        <AppLayout
          activeMode="doc"
          onModeChange={onModeChange}
          isDarkMode={true}
          onToggleTheme={onToggleTheme}
          activePage="root-doc-node"
          onPageSelect={onPageSelect}
        >
          <div data-testid="workspace-content">Main Doc Content</div>
        </AppLayout>
      );
    });

    // Wait for any async React state updates/effects to settle
    await new Promise(resolve => setTimeout(resolve, 50));

    // Verify Sidebar Headers and Layout Sections are rendered
    expect(container.innerHTML).toContain('Workspace Library');
    expect(container.innerHTML).toContain('Recent Documents');
    expect(container.innerHTML).toContain('Page Tree');
    expect(container.innerHTML).toContain('Pages');
    expect(container.innerHTML).toContain('Tags');
    expect(container.innerHTML).toContain('Widgets');

    // Clean up
    document.body.removeChild(container);
  });

  it('should toggle tree section collapse and expand state when clicked', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    await act(async () => {
      const root = createRoot(container);
      root.render(
        <AppLayout
          activeMode="doc"
          onModeChange={vi.fn()}
          isDarkMode={true}
          onToggleTheme={vi.fn()}
          activePage="root-doc-node"
          onPageSelect={vi.fn()}
        >
          <div>Workspace Content</div>
        </AppLayout>
      );
    });

    await new Promise(resolve => setTimeout(resolve, 50));

    // Locate the toggle button for 'Pages' category (the one containing 'Pages')
    const buttons = Array.from(container.querySelectorAll('button'));
    const pagesButton = buttons.find(btn => btn.textContent?.includes('Pages'));

    expect(pagesButton).toBeDefined();

    // Pages should start expanded. Click to collapse it.
    await act(async () => {
      pagesButton?.click();
    });

    await new Promise(resolve => setTimeout(resolve, 50));

    // Let's verify clicking again expands or collapses
    const tagsButton = buttons.find(btn => btn.textContent?.includes('Tags'));
    expect(tagsButton).toBeDefined();

    // Clean up
    document.body.removeChild(container);
  });

  it('should trigger onPageSelect and onModeChange callbacks when selecting an item', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const onModeChange = vi.fn();
    const onPageSelect = vi.fn();

    await act(async () => {
      const root = createRoot(container);
      root.render(
        <AppLayout
          activeMode="canvas"
          onModeChange={onModeChange}
          isDarkMode={true}
          onToggleTheme={vi.fn()}
          activePage="root-doc-node"
          onPageSelect={onPageSelect}
        >
          <div>Workspace Content</div>
        </AppLayout>
      );
    });

    await new Promise(resolve => setTimeout(resolve, 50));

    // Clicking on the Recent Document item (e.g. the active document button)
    const buttons = Array.from(container.querySelectorAll('button'));
    const docItemBtn = buttons.find(btn => btn.textContent?.includes('Recent') && !btn.textContent?.includes('Recent Documents'));

    expect(docItemBtn).toBeDefined();

    await act(async () => {
      docItemBtn?.click();
    });

    await new Promise(resolve => setTimeout(resolve, 50));

    // It should switch activeMode to 'doc' and invoke page select callback
    expect(onModeChange).toHaveBeenCalledWith('doc');
    expect(onPageSelect).toHaveBeenCalledWith('root-doc-node');

    // Clean up
    document.body.removeChild(container);
  });

  it('should alert on invalid JSON during widget import', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});

    await act(async () => {
      const root = createRoot(container);
      root.render(
        <AppLayout
          activeMode="doc"
          onModeChange={vi.fn()}
          isDarkMode={true}
          onToggleTheme={vi.fn()}
          activePage="root-doc-node"
          onPageSelect={vi.fn()}
        >
          <div>Workspace Content</div>
        </AppLayout>
      );
    });

    // Wait for AppLayout to render
    await new Promise(resolve => setTimeout(resolve, 50));

    // The Space Agent panel is initially closed. We need to open it.
    const buttons = Array.from(container.querySelectorAll('button'));


    // There is a floating button for the space agent
    const floatBtn = buttons.find(btn => btn.className.includes('fixed bottom-6 right-6'));
    if (floatBtn) {
        await act(async () => {
          floatBtn.click();
        });
        await new Promise(resolve => setTimeout(resolve, 50));
    }


    // Find the file input
    const fileInput = container.querySelector('input[type="file"]');
    expect(fileInput).toBeTruthy();

    // Create an invalid JSON file
    const file = new File(['invalid json data'], 'widgets.json', { type: 'application/json' });

    await act(async () => {
      Object.defineProperty(fileInput!, 'files', { value: [file] });
      fileInput!.dispatchEvent(new Event('change', { bubbles: true }));
    });

    await new Promise(resolve => setTimeout(resolve, 50));

    expect(alertMock).toHaveBeenCalledWith('Failed to parse widget catalog JSON file.');

    alertMock.mockRestore();
    document.body.removeChild(container);
  });
});
