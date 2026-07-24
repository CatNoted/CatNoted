import { describe, it, expect } from 'vitest';
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AppLayout, Workspace } from '../AppLayout.js';

describe('AppLayout Component Integration Tests', () => {
  const workspaces: Workspace[] = [
    { id: 'personal', name: 'Personal Space', description: 'desc 1', emoji: '🏠' },
    { id: 'research', name: 'Research Lab', description: 'desc 2', emoji: '📚' }
  ];

  it('renders and allows toggling sidebar and switching workspaces', async () => {
    const div = document.createElement('div');
    document.body.appendChild(div);

    const TestWrapper = () => {
      const [activeWorkspace, setActiveWorkspace] = useState(workspaces[0]);
      return (
        <AppLayout
          activeMode="doc"
          onModeChange={() => {}}
          isDarkMode={true}
          onToggleTheme={() => {}}
          activeWorkspace={activeWorkspace}
          workspaces={workspaces}
          onWorkspaceChange={setActiveWorkspace}
        >
          <div>Content Node</div>
        </AppLayout>
      );
    };

    const root = createRoot(div);
    root.render(<TestWrapper />);

    // Wait a brief tick for rendering to complete in Happy DOM
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Check that Personal Space is rendered
    expect(div.innerHTML).toContain('Personal Space');
    expect(div.innerHTML).toContain('Content Node');

    // Find and click the workspace switcher button
    const switcherButton = div.querySelector('button[aria-haspopup="listbox"]');
    expect(switcherButton).toBeDefined();

    // Toggle the workspace dropdown
    switcherButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 50));

    // The dropdown options should be visible now
    expect(div.innerHTML).toContain('Research Lab');

    // Select the "Research Lab" option
    const options = div.querySelectorAll('button[role="option"]');
    const researchOption = Array.from(options).find(opt => opt.textContent?.includes('Research Lab'));
    expect(researchOption).toBeDefined();

    researchOption?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 50));

    // The active workspace should now update to "Research Lab"
    expect(div.innerHTML).toContain('Research Lab');

    root.unmount();
    document.body.removeChild(div);
  });
});
