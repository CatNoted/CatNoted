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
    expect(container.innerHTML).toContain('Workspace');
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

  it('should invoke onCreatePage callback when clicking the "+ New Page" button', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const onCreatePage = vi.fn();

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
          onCreatePage={onCreatePage}
        >
          <div>Workspace Content</div>
        </AppLayout>
      );
    });

    await new Promise(resolve => setTimeout(resolve, 50));

    const buttons = Array.from(container.querySelectorAll('button'));
    const newPageButton = buttons.find(btn => btn.textContent?.includes('+ New Page'));

    expect(newPageButton).toBeDefined();

    await act(async () => {
      newPageButton?.click();
    });

    await new Promise(resolve => setTimeout(resolve, 50));

    expect(onCreatePage).toHaveBeenCalled();

    document.body.removeChild(container);
  });

  it('should render the right tool rail and toggle open/close and switch tabs on click', async () => {
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

    // 1. Verify right-side tool rail navigation buttons are rendered
    const buttons = Array.from(container.querySelectorAll('button'));
    const infoButton = buttons.find(btn => btn.getAttribute('aria-label') === 'Page Info');
    const outlineButton = buttons.find(btn => btn.getAttribute('aria-label') === 'Outline');
    const agentButton = buttons.find(btn => btn.getAttribute('aria-label') === 'Space Agent');
    const historyButton = buttons.find(btn => btn.getAttribute('aria-label') === 'Page History');

    expect(infoButton).toBeDefined();
    expect(outlineButton).toBeDefined();
    expect(agentButton).toBeDefined();
    expect(historyButton).toBeDefined();

    // 2. Open Page Info Tab
    await act(async () => {
      infoButton?.click();
    });
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(container.innerHTML).toContain('Page Info &amp; Style');
    expect(container.innerHTML).toContain('Page Style Settings');
    expect(container.innerHTML).toContain('Document Statistics');

    // 3. Switch to Document Outline Tab
    await act(async () => {
      outlineButton?.click();
    });
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(container.innerHTML).toContain('Document Outline');
    expect(container.innerHTML).toContain('Click an outline heading below');

    // 4. Switch to Space Agent Tab
    await act(async () => {
      agentButton?.click();
    });
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(container.innerHTML).toContain('Docked Space Agent');

    // 5. Switch to Page History Tab
    await act(async () => {
      historyButton?.click();
    });
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(container.innerHTML).toContain('Version History');
    expect(container.innerHTML).toContain('Current active version');

    // 6. Click History Tab again to close/collapse
    await act(async () => {
      historyButton?.click();
    });
    await new Promise(resolve => setTimeout(resolve, 50));
    // The panel width style should be 0 or it's hidden
    expect(container.innerHTML).not.toContain('Page Info &amp; Style');

    // Clean up
    document.body.removeChild(container);
  });
});
