import { createRoot } from 'react-dom/client';
import { Sidebar } from './Sidebar.js';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from 'react';

const mockDeletePage = vi.fn();
const mockRenamePage = vi.fn();
const mockUpdatePageMetaById = vi.fn();

vi.mock('@catnoted/editor', () => ({
  useDocumentStore: () => ({
    pages: [
      { id: 'page-1', title: 'Page 1', icon: '📄', isFavorite: true },
      { id: 'page-2', title: 'Page 2', icon: '📝', isFavorite: false },
    ],
    deletePage: mockDeletePage,
    renamePage: mockRenamePage,
    updatePageMetaById: mockUpdatePageMetaById,
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

  it('should call updatePageMetaById with toggle favorite value when star button is clicked', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const onModeChange = vi.fn();

    await act(async () => {
      const root = createRoot(container);
      root.render(<Sidebar onModeChange={onModeChange} activeMode="doc" />);
    });

    await new Promise(resolve => setTimeout(resolve, 50));

    // Find star buttons by their aria-labels
    const addFavoriteBtn = container.querySelector('button[aria-label="Add to favorites"]') as HTMLButtonElement;
    const removeFavoriteBtn = container.querySelector('button[aria-label="Remove from favorites"]') as HTMLButtonElement;

    expect(addFavoriteBtn).toBeDefined();
    expect(removeFavoriteBtn).toBeDefined();

    // Click "Add to favorites" on Page 2
    await act(async () => {
      addFavoriteBtn.click();
    });
    expect(mockUpdatePageMetaById).toHaveBeenCalledWith('page-2', { isFavorite: true });

    // Click "Remove from favorites" on Page 1
    await act(async () => {
      removeFavoriteBtn.click();
    });
    expect(mockUpdatePageMetaById).toHaveBeenCalledWith('page-1', { isFavorite: false });

    document.body.removeChild(container);
  });

  it('should render calm empty state message when no favorites exist', async () => {
    // Override the mock to return zero favorites
    const useDocumentStoreSpy = vi.spyOn(await import('@catnoted/editor'), 'useDocumentStore').mockReturnValue({
      pages: [
        { id: 'page-1', title: 'Page 1', icon: '📄', isFavorite: false },
        { id: 'page-2', title: 'Page 2', icon: '📝', isFavorite: false },
      ],
      deletePage: mockDeletePage,
      renamePage: mockRenamePage,
      updatePageMetaById: mockUpdatePageMetaById,
    } as any);

    const container = document.createElement('div');
    document.body.appendChild(container);

    await act(async () => {
      const root = createRoot(container);
      root.render(<Sidebar onModeChange={vi.fn()} activeMode="doc" />);
    });

    await new Promise(resolve => setTimeout(resolve, 50));

    expect(container.innerHTML).toContain('Star pages to pin them here.');

    useDocumentStoreSpy.mockRestore();
    document.body.removeChild(container);
  });

  it('should apply active highlight styles to support selection semantics', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    await act(async () => {
      const root = createRoot(container);
      root.render(<Sidebar onModeChange={vi.fn()} activeMode="doc" activePage="page-1" />);
    });

    await new Promise(resolve => setTimeout(resolve, 50));

    // Page 1 is active, so its container should have the 'font-semibold' class or 'text-white' or 'bg-slate-100' class
    const pageRows = Array.from(container.querySelectorAll('.group\\/sidebar-row'));
    const activeRow = pageRows.find(row => row.textContent?.includes('Page 1'));
    expect(activeRow).toBeDefined();
    expect(activeRow?.className).toContain('font-semibold');

    document.body.removeChild(container);
  });
});
