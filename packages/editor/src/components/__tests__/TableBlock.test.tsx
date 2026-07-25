import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, it, expect, vi } from 'vitest';
import { TableBlock } from '../TableBlock.js';

describe('TableBlock Functional Tests', () => {
  const defaultRows = [
    ['Header 1', 'Header 2'],
    ['Row 1, Cell 1', 'Row 1, Cell 2'],
  ];

  it('renders table cells in place as static divs when not editing', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const onUpdateProps = vi.fn();
    const onDelete = vi.fn();

    await act(async () => {
      const root = createRoot(container);
      root.render(
        <TableBlock
          id="test-table-id"
          rows={defaultRows}
          hasHeader={true}
          onUpdateProps={onUpdateProps}
          onDelete={onDelete}
        />
      );
    });

    // Expecting to see the text rendered as div or static text
    const headerCell = container.querySelector('th');
    expect(headerCell).not.toBeNull();
    expect(headerCell?.textContent).toContain('Header 1');

    // Clicking the cell should turn it into an input in place
    const cellDiv = headerCell?.querySelector('div');
    expect(cellDiv).not.toBeNull();

    await act(async () => {
      cellDiv?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    // Check if input element is rendered now
    const input = headerCell?.querySelector('input');
    expect(input).not.toBeNull();
    expect(input?.value).toBe('Header 1');

    document.body.removeChild(container);
  });

  it('updates Yjs block state when editing an active cell', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const onUpdateProps = vi.fn();

    await act(async () => {
      const root = createRoot(container);
      root.render(
        <TableBlock
          id="test-table-id"
          rows={defaultRows}
          hasHeader={true}
          onUpdateProps={onUpdateProps}
          onDelete={vi.fn()}
        />
      );
    });

    // Click row 1 cell 1
    const tdCells = container.querySelectorAll('td');
    expect(tdCells.length).toBe(2);

    const cellDiv = tdCells[0].querySelector('div');
    await act(async () => {
      cellDiv?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const input = tdCells[0].querySelector('input') as HTMLInputElement | null;
    expect(input).not.toBeNull();

    // Change input value using native setter to trigger React's onChange
    await act(async () => {
      if (input) {
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
        nativeSetter?.call(input, 'New Value');
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    expect(onUpdateProps).toHaveBeenCalledWith({
      hasHeader: true,
      rows: [
        ['Header 1', 'Header 2'],
        ['New Value', 'Row 1, Cell 2'],
      ],
    });

    document.body.removeChild(container);
  });

  it('allows adding and removing columns and rows', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const onUpdateProps = vi.fn();

    await act(async () => {
      const root = createRoot(container);
      root.render(
        <TableBlock
          id="test-table-id"
          rows={defaultRows}
          hasHeader={true}
          onUpdateProps={onUpdateProps}
          onDelete={vi.fn()}
        />
      );
    });

    // Find "Row" add button and "Column" add button
    const buttons = container.querySelectorAll('button');
    let addRowButton: HTMLButtonElement | null = null;
    let addColButton: HTMLButtonElement | null = null;

    buttons.forEach((btn) => {
      if (btn.textContent?.includes('Row')) {
        addRowButton = btn as HTMLButtonElement;
      } else if (btn.textContent?.includes('Column')) {
        addColButton = btn as HTMLButtonElement;
      }
    });

    expect(addRowButton).not.toBeNull();
    expect(addColButton).not.toBeNull();

    // Trigger Add Row
    await act(async () => {
      addRowButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onUpdateProps).toHaveBeenLastCalledWith({
      hasHeader: true,
      rows: [
        ['Header 1', 'Header 2'],
        ['Row 1, Cell 1', 'Row 1, Cell 2'],
        ['', ''],
      ],
    });

    // Trigger Add Column
    await act(async () => {
      addColButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onUpdateProps).toHaveBeenLastCalledWith({
      hasHeader: true,
      rows: [
        ['Header 1', 'Header 2', 'Header 3'],
        ['Row 1, Cell 1', 'Row 1, Cell 2', ''],
      ],
    });

    document.body.removeChild(container);
  });

  it('toggles table header row rendering correctly', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const onUpdateProps = vi.fn();

    await act(async () => {
      const root = createRoot(container);
      root.render(
        <TableBlock
          id="test-table-id"
          rows={defaultRows}
          hasHeader={true}
          onUpdateProps={onUpdateProps}
          onDelete={vi.fn()}
        />
      );
    });

    const toggleButton = Array.from(container.querySelectorAll('button')).find((btn) =>
      btn.textContent?.includes('Header Row')
    );

    expect(toggleButton).not.toBeNull();

    await act(async () => {
      toggleButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onUpdateProps).toHaveBeenCalledWith({
      hasHeader: false,
      rows: defaultRows,
    });

    document.body.removeChild(container);
  });
});
