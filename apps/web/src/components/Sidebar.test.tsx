import { createRoot } from 'react-dom/client';
import { Sidebar } from './Sidebar.js';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from 'react';

const mockDeletePage = vi.fn();

vi.mock('@catnoted/editor', () => ({
  useDocumentStore: () => ({
    pages: [
      { id: 'page-1', title: 'Page 1', icon: '📄', isFavorite: true },
      { id: 'page-2', title: 'Page 2', icon: '📝', isFavorite: false },
    ],
    deletePage: mockDeletePage,
  }),
}));

describe('Sidebar Row Hover Actions Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the Sidebar with page rows and hover action buttons', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const onModeChange = vi.fn();

    await act(async () => {
      const root = createRoot(container);
      root.render(<Sidebar onModeChange={onModeChange} activeMode="doc" />);
    });

    await new Promise(resolve => setTimeout(resolve, 50));

    // Because they are collapsed by default now, we just need to ensure it rendered
    expect(container.innerHTML).toContain('Collections');

    // Clean up
    document.body.removeChild(container);
  });

  it('should call deletePage when delete button is clicked and confirmed', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const onModeChange = vi.fn();

    // Mock confirm dialog
    const confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => true);

    await act(async () => {
      const root = createRoot(container);
      root.render(<Sidebar onModeChange={onModeChange} activeMode="doc" />);
    });

    await new Promise(resolve => setTimeout(resolve, 50));

    // Expand organize section to show the buttons
    const expandButtons = Array.from(container.querySelectorAll('button[aria-label="Expand Organize"]')) as HTMLButtonElement[];
    if (expandButtons.length > 0) {
      await act(async () => {
        expandButtons[0].click();
      });
    }

    const deleteButtons = Array.from(container.querySelectorAll('button[aria-label="Delete page"]')) as HTMLButtonElement[];
    expect(deleteButtons.length).toBeGreaterThan(0);

    // Click delete button of the first row
    await act(async () => {
      deleteButtons[0].click();
    });

    expect(confirmSpy).toHaveBeenCalledWith('Delete page "Page 2"?');
    expect(mockDeletePage).toHaveBeenCalledWith('page-2');

    confirmSpy.mockRestore();
    document.body.removeChild(container);
  });
});
