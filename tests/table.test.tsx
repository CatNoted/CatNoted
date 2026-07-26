import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, it, expect, vi } from 'vitest';
import { TableBlock } from '../packages/editor/src/components/TableBlock.js';

const setNativeValue = (element: HTMLInputElement, value: string) => {
  const valueSetter = Object.getOwnPropertyDescriptor(element.constructor.prototype, 'value')?.set;
  const prototype = Object.getPrototypeOf(element);
  const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;

  const setter = valueSetter || prototypeValueSetter;
  if (setter) {
    setter.call(element, value);
  } else {
    element.value = value;
  }
};

describe('TableBlock Component Tests', () => {
  it('renders standard table with correct headers and rows', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const onUpdateProps = vi.fn();
    const onDelete = vi.fn();

    await act(async () => {
      const root = createRoot(container);
      root.render(
        <TableBlock
          id="table-1"
          onUpdateProps={onUpdateProps}
          onDelete={onDelete}
        />
      );
    });

    const inputs = container.querySelectorAll('input');
    // DEFAULT_ROWS has 3 columns * 3 rows (1 header + 2 body) = 9 inputs
    expect(inputs.length).toBe(9);
    expect(inputs[0].value).toBe('Header 1');
    expect(inputs[3].value).toBe('Row 1, Cell 1');

    document.body.removeChild(container);
  });

  it('handles editing a header cell', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const onUpdateProps = vi.fn();

    await act(async () => {
      const root = createRoot(container);
      root.render(
        <TableBlock
          id="table-1"
          onUpdateProps={onUpdateProps}
          onDelete={vi.fn()}
        />
      );
    });

    const inputs = container.querySelectorAll('input');
    await act(async () => {
      setNativeValue(inputs[0] as HTMLInputElement, 'New Header');
      inputs[0].dispatchEvent(new Event('change', { bubbles: true }));
    });

    expect(onUpdateProps).toHaveBeenCalled();
    const updatedRows = onUpdateProps.mock.calls[0][0].rows;
    expect(updatedRows[0][0]).toBe('New Header');

    document.body.removeChild(container);
  });

  it('handles editing a body cell', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const onUpdateProps = vi.fn();

    await act(async () => {
      const root = createRoot(container);
      root.render(
        <TableBlock
          id="table-1"
          onUpdateProps={onUpdateProps}
          onDelete={vi.fn()}
        />
      );
    });

    const inputs = container.querySelectorAll('input');
    await act(async () => {
      setNativeValue(inputs[3] as HTMLInputElement, 'Updated Cell Content');
      inputs[3].dispatchEvent(new Event('change', { bubbles: true }));
    });

    expect(onUpdateProps).toHaveBeenCalled();
    const updatedRows = onUpdateProps.mock.calls[0][0].rows;
    expect(updatedRows[1][0]).toBe('Updated Cell Content');

    document.body.removeChild(container);
  });

  it('triggers adding a new row', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const onUpdateProps = vi.fn();

    await act(async () => {
      const root = createRoot(container);
      root.render(
        <TableBlock
          id="table-1"
          onUpdateProps={onUpdateProps}
          onDelete={vi.fn()}
        />
      );
    });

    // Find the Row addition button
    const buttons = container.querySelectorAll('button');
    let addRowButton: HTMLButtonElement | null = null;
    buttons.forEach((btn) => {
      if (btn.textContent?.includes('Row')) {
        addRowButton = btn as HTMLButtonElement;
      }
    });

    expect(addRowButton).not.toBeNull();

    await act(async () => {
      addRowButton?.click();
    });

    expect(onUpdateProps).toHaveBeenCalled();
    const updatedRows = onUpdateProps.mock.calls[0][0].rows;
    // Original rows count = 3, after adding = 4
    expect(updatedRows.length).toBe(4);
    expect(updatedRows[3]).toEqual(['', '', '']);

    document.body.removeChild(container);
  });

  it('triggers adding a new column', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const onUpdateProps = vi.fn();

    await act(async () => {
      const root = createRoot(container);
      root.render(
        <TableBlock
          id="table-1"
          onUpdateProps={onUpdateProps}
          onDelete={vi.fn()}
        />
      );
    });

    // Find the Column addition button
    const buttons = container.querySelectorAll('button');
    let addColButton: HTMLButtonElement | null = null;
    buttons.forEach((btn) => {
      if (btn.textContent?.includes('Column')) {
        addColButton = btn as HTMLButtonElement;
      }
    });

    expect(addColButton).not.toBeNull();

    await act(async () => {
      addColButton?.click();
    });

    expect(onUpdateProps).toHaveBeenCalled();
    const updatedRows = onUpdateProps.mock.calls[0][0].rows;
    // Column count of header should increase from 3 to 4
    expect(updatedRows[0].length).toBe(4);
    expect(updatedRows[0][3]).toBe('Header 4');

    document.body.removeChild(container);
  });

  it('handles expanding and collapsing row counts when they exceed maxVisibleRows', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    // 1 header + 8 body rows = 9 rows total
    const largeRows = [
      ['H1', 'H2'],
      ['R1C1', 'R1C2'],
      ['R2C1', 'R2C2'],
      ['R3C1', 'R3C2'],
      ['R4C1', 'R4C2'],
      ['R5C1', 'R5C2'],
      ['R6C1', 'R6C2'],
      ['R7C1', 'R7C2'],
      ['R8C1', 'R8C2'],
    ];

    await act(async () => {
      const root = createRoot(container);
      root.render(
        <TableBlock
          id="table-1"
          rows={largeRows}
          onUpdateProps={vi.fn()}
          onDelete={vi.fn()}
        />
      );
    });

    // Initially, max body rows visible is 6. With 1 header + 6 body rows, total visible rows is 7.
    // The table body rows should only contain 6 rows.
    let tableRows = container.querySelectorAll('tbody tr');
    expect(tableRows.length).toBe(6);

    // Find the expand button by text content "Show"
    const buttons = container.querySelectorAll('button');
    let expandButton: HTMLButtonElement | null = null;
    buttons.forEach((btn) => {
      if (btn.textContent?.includes('Show')) {
        expandButton = btn as HTMLButtonElement;
      }
    });

    expect(expandButton).not.toBeNull();
    expect(expandButton?.textContent).toContain('Show 2 more rows');

    await act(async () => {
      expandButton?.click();
    });

    // All 8 body rows should be visible now
    tableRows = container.querySelectorAll('tbody tr');
    expect(tableRows.length).toBe(8);

    // Click again to collapse
    await act(async () => {
      expandButton?.click();
    });

    // Should collapse back to 6 body rows
    tableRows = container.querySelectorAll('tbody tr');
    expect(tableRows.length).toBe(6);

    document.body.removeChild(container);
  });
});
