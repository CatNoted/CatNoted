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

    // Check if the page title "Page 1" is rendered
    expect(container.innerHTML).toContain('Page 1');
    expect(container.innerHTML).toContain('Page 2');

    // Find hover buttons
    const deleteButtons = Array.from(container.querySelectorAll('button[aria-label="Delete page"]'));
    expect(deleteButtons.length).toBeGreaterThan(0);

    const moreButtons = Array.from(container.querySelectorAll('button[aria-label="More options"]'));
    expect(moreButtons.length).toBeGreaterThan(0);

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

    const deleteButtons = Array.from(container.querySelectorAll('button[aria-label="Delete page"]')) as HTMLButtonElement[];
    expect(deleteButtons.length).toBeGreaterThan(0);

    // Click delete button of the first row
    await act(async () => {
      deleteButtons[0].click();
    });

    expect(confirmSpy).toHaveBeenCalledWith('Delete page "Page 1"?');
    expect(mockDeletePage).toHaveBeenCalledWith('page-1');

    confirmSpy.mockRestore();
    document.body.removeChild(container);
  });
});
