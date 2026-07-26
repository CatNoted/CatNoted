import React, { act, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, it, expect, vi } from 'vitest';
import { KanbanBlock } from '../KanbanBlock.js';
import { KanbanColumn } from '@catnoted/shared';

const initialColumns: KanbanColumn[] = [
  {
    id: 'col-todo',
    title: 'To Do',
    cards: [
      { id: 'card-1', title: 'Task A' },
    ],
  },
  {
    id: 'col-done',
    title: 'Done',
    cards: [],
  },
];

// Helper to simulate text input in React
const simulateInput = (element: HTMLInputElement | HTMLTextAreaElement, value: string) => {
  const nativeSetter = Object.getOwnPropertyDescriptor(
    element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype,
    'value'
  )?.set;
  nativeSetter?.call(element, value);
  element.dispatchEvent(new Event('input', { bubbles: true }));
};

describe('KanbanBlock Component Tests', () => {
  it('renders correctly with given title and columns', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    await act(async () => {
      const root = createRoot(container);
      root.render(
        <KanbanBlock
          id="b-kanban"
          title="My Sprint Board"
          columns={initialColumns}
          onUpdateProps={vi.fn()}
          onUpdateContent={vi.fn()}
        />
      );
    });

    // Check title in input value
    const titleInput = container.querySelector('input[placeholder="Untitled Kanban Board"]') as HTMLInputElement;
    expect(titleInput).not.toBeNull();
    expect(titleInput.value).toBe('My Sprint Board');

    // Check column titles in input values
    const colInputs = container.querySelectorAll('input[placeholder="Column Name"]');
    expect(colInputs.length).toBe(2);
    expect((colInputs[0] as HTMLInputElement).value).toBe('To Do');
    expect((colInputs[1] as HTMLInputElement).value).toBe('Done');

    // Check card titles in textarea values
    const cards = container.querySelectorAll('textarea[placeholder="Card Title"]');
    expect(cards.length).toBe(1);
    expect((cards[0] as HTMLTextAreaElement).value).toBe('Task A');

    document.body.removeChild(container);
  });

  it('supports editing the board title via TestWrapper', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const onUpdateContent = vi.fn();

    const Wrapper = () => {
      const [title, setTitle] = useState('My Sprint Board');
      return (
        <KanbanBlock
          id="b-kanban"
          title={title}
          columns={initialColumns}
          onUpdateProps={(p) => {
            if (p.title !== undefined) setTitle(p.title);
          }}
          onUpdateContent={onUpdateContent}
        />
      );
    };

    await act(async () => {
      const root = createRoot(container);
      root.render(<Wrapper />);
    });

    const titleInput = container.querySelector('input[placeholder="Untitled Kanban Board"]') as HTMLInputElement;
    expect(titleInput.value).toBe('My Sprint Board');

    await act(async () => {
      simulateInput(titleInput, 'New Title');
    });

    expect(titleInput.value).toBe('New Title');
    expect(onUpdateContent).toHaveBeenCalledWith('New Title');

    document.body.removeChild(container);
  });

  it('supports adding and editing columns via TestWrapper', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const Wrapper = () => {
      const [columns, setColumns] = useState(initialColumns);
      return (
        <KanbanBlock
          id="b-kanban"
          title="My Board"
          columns={columns}
          onUpdateProps={(p) => {
            if (p.columns !== undefined) setColumns(p.columns);
          }}
          onUpdateContent={vi.fn()}
        />
      );
    };

    await act(async () => {
      const root = createRoot(container);
      root.render(<Wrapper />);
    });

    // Verify initial column count
    let colInputs = container.querySelectorAll('input[placeholder="Column Name"]');
    expect(colInputs.length).toBe(2);

    // Add Column button
    const addColBtn = Array.from(container.querySelectorAll('button')).find(
      btn => btn.textContent?.includes('Add Column')
    );
    expect(addColBtn).toBeDefined();

    await act(async () => {
      addColBtn?.click();
    });

    // Check that we now have 3 columns
    colInputs = container.querySelectorAll('input[placeholder="Column Name"]');
    expect(colInputs.length).toBe(3);
    expect((colInputs[2] as HTMLInputElement).value).toBe('New Column');

    // Rename the new column
    await act(async () => {
      simulateInput(colInputs[2] as HTMLInputElement, 'In Progress');
    });

    expect((colInputs[2] as HTMLInputElement).value).toBe('In Progress');

    document.body.removeChild(container);
  });

  it('supports adding and deleting cards via TestWrapper', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const Wrapper = () => {
      const [columns, setColumns] = useState(initialColumns);
      return (
        <KanbanBlock
          id="b-kanban"
          title="My Board"
          columns={columns}
          onUpdateProps={(p) => {
            if (p.columns !== undefined) setColumns(p.columns);
          }}
          onUpdateContent={vi.fn()}
        />
      );
    };

    await act(async () => {
      const root = createRoot(container);
      root.render(<Wrapper />);
    });

    // Verify 1 initial card
    let cards = container.querySelectorAll('textarea[placeholder="Card Title"]');
    expect(cards.length).toBe(1);
    expect((cards[0] as HTMLTextAreaElement).value).toBe('Task A');

    // Add card to "To Do" (first column)
    const addCardBtns = Array.from(container.querySelectorAll('button')).filter(
      btn => btn.textContent?.includes('Add Card')
    );
    expect(addCardBtns.length).toBe(2);

    await act(async () => {
      addCardBtns[0].click();
    });

    // Verify we now have 2 cards
    cards = container.querySelectorAll('textarea[placeholder="Card Title"]');
    expect(cards.length).toBe(2);
    expect((cards[1] as HTMLTextAreaElement).value).toBe('New Card');

    // Edit the card title
    await act(async () => {
      simulateInput(cards[1] as HTMLTextAreaElement, 'Task B');
    });

    expect((cards[1] as HTMLTextAreaElement).value).toBe('Task B');

    // Delete card Task A
    const deleteCardBtns = container.querySelectorAll('button[title="Delete card"]');
    expect(deleteCardBtns.length).toBe(2);

    await act(async () => {
      (deleteCardBtns[0] as HTMLButtonElement).click();
    });

    // Verify 1 card remains
    cards = container.querySelectorAll('textarea[placeholder="Card Title"]');
    expect(cards.length).toBe(1);
    expect((cards[0] as HTMLTextAreaElement).value).toBe('Task B');

    document.body.removeChild(container);
  });
});
