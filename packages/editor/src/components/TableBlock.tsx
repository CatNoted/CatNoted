import React, { useState } from 'react';
import { Plus, Table as TableIcon } from 'lucide-react';

interface TableBlockProps {
  id: string;
  rows?: string[][];
  hasHeader?: boolean;
  onUpdateProps: (props: { rows?: string[][]; hasHeader?: boolean }) => void;
  onDelete: () => void;
}

const DEFAULT_ROWS = [
  ['Header 1', 'Header 2', 'Header 3'],
  ['Row 1, Cell 1', 'Row 1, Cell 2', 'Row 1, Cell 3'],
  ['Row 2, Cell 1', 'Row 2, Cell 2', 'Row 2, Cell 3'],
];

export const TableBlock: React.FC<TableBlockProps> = ({
  id: _id,
  rows = DEFAULT_ROWS,
  hasHeader = true,
  onUpdateProps,
  onDelete: _onDelete,
}) => {
  const currentRows = rows && rows.length > 0 ? rows : DEFAULT_ROWS;
  const showHeader = hasHeader !== false;

  const [editingCell, setEditingCell] = useState<{ r: number; c: number } | null>(null);

  const handleCellChange = (rIndex: number, cIndex: number, value: string) => {
    const updated = currentRows.map((row, r) =>
      row.map((cell, c) => (r === rIndex && c === cIndex ? value : cell))
    );
    onUpdateProps({ rows: updated, hasHeader });
  };

  const handleAddRow = () => {
    const colCount = currentRows[0]?.length || 3;
    const newRow = Array(colCount).fill('');
    onUpdateProps({ rows: [...currentRows, newRow], hasHeader });
  };

  const handleAddColumn = () => {
    const updated = currentRows.map((row, i) => [...row, i === 0 && showHeader ? `Header ${row.length + 1}` : '']);
    onUpdateProps({ rows: updated, hasHeader });
  };

  const handleRemoveRow = (rIndex: number) => {
    if (currentRows.length <= 1) return;
    const updated = currentRows.filter((_, r) => r !== rIndex);
    onUpdateProps({ rows: updated, hasHeader });
    if (editingCell && editingCell.r === rIndex) {
      setEditingCell(null);
    } else if (editingCell && editingCell.r > rIndex) {
      setEditingCell({ r: editingCell.r - 1, c: editingCell.c });
    }
  };

  const handleRemoveColumn = (cIndex: number) => {
    if (currentRows[0].length <= 1) return;
    const updated = currentRows.map((row) => row.filter((_, c) => c !== cIndex));
    onUpdateProps({ rows: updated, hasHeader });
    if (editingCell && editingCell.c === cIndex) {
      setEditingCell(null);
    } else if (editingCell && editingCell.c > cIndex) {
      setEditingCell({ r: editingCell.r, c: editingCell.c - 1 });
    }
  };

  const toggleHeader = () => {
    onUpdateProps({ rows: currentRows, hasHeader: !showHeader });
  };

  const renderCell = (rIdx: number, cIdx: number, value: string, isHeaderCell: boolean) => {
    const isEditing = editingCell?.r === rIdx && editingCell?.c === cIdx;

    if (isEditing) {
      return (
        <input
          type="text"
          value={value}
          onChange={(e) => handleCellChange(rIdx, cIdx, e.target.value)}
          onBlur={() => setEditingCell(null)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === 'Escape') {
              setEditingCell(null);
            }
          }}
          autoFocus
          className={`w-full bg-transparent outline-none focus:ring-1 focus:ring-indigo-400 rounded px-1 py-0.5 ${
            isHeaderCell
              ? 'font-bold text-slate-900 dark:text-zinc-100'
              : 'text-slate-700 dark:text-zinc-300'
          }`}
        />
      );
    }

    return (
      <div
        onClick={() => setEditingCell({ r: rIdx, c: cIdx })}
        className={`w-full min-h-[24px] px-1 py-0.5 rounded cursor-pointer transition-colors ${
          isHeaderCell
            ? 'font-bold text-slate-900 dark:text-zinc-100 hover:bg-slate-200/50 dark:hover:bg-zinc-800/50'
            : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100/50 dark:hover:bg-zinc-800/30'
        } ${!value ? 'text-slate-300 dark:text-zinc-600 italic font-normal' : ''}`}
      >
        {value || (isHeaderCell ? `Header ${cIdx + 1}` : '(Empty)')}
      </div>
    );
  };

  return (
    <div className="w-full my-3 overflow-x-auto select-none group/table">
      <div className="flex items-center justify-between pb-1.5 mb-1.5 text-xs text-slate-400 font-mono">
        <span className="flex items-center gap-1.5 font-semibold text-indigo-600 dark:text-indigo-400">
          <TableIcon className="w-3.5 h-3.5" />
          Table ({currentRows.length}x{currentRows[0]?.length || 0})
        </span>
        <div className="flex items-center gap-2 opacity-0 group-hover/table:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={toggleHeader}
            className={`px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1 transition-colors ${
              showHeader
                ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30'
                : 'bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300'
            }`}
          >
            Header Row: {showHeader ? 'On' : 'Off'}
          </button>
          <button
            type="button"
            onClick={handleAddRow}
            className="px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 text-slate-600 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 text-[11px] font-medium flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3 h-3" /> Row
          </button>
          <button
            type="button"
            onClick={handleAddColumn}
            className="px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 text-slate-600 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 text-[11px] font-medium flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3 h-3" /> Column
          </button>
        </div>
      </div>

      <table className="w-full border-collapse border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden text-xs">
        {showHeader ? (
          <thead>
            <tr className="bg-slate-100/80 dark:bg-zinc-900/80 text-slate-700 dark:text-zinc-300 font-semibold border-b border-slate-200 dark:border-zinc-800 group/tr">
              {currentRows[0]?.map((cell, cIndex) => {
                const isLastCol = cIndex === currentRows[0].length - 1;
                return (
                  <th
                    key={cIndex}
                    className={`p-2 border-r border-slate-200 dark:border-zinc-800 relative group/th ${
                      isLastCol ? 'pr-10' : 'pr-6'
                    }`}
                  >
                    {renderCell(0, cIndex, cell, true)}
                    {currentRows[0].length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveColumn(cIndex)}
                        className={`absolute top-1 opacity-0 group-hover/th:opacity-100 p-0.5 text-rose-400 hover:text-rose-600 text-xs font-semibold ${
                          isLastCol ? 'right-6' : 'right-1'
                        }`}
                        title="Remove column"
                      >
                        ×
                      </button>
                    )}
                    {isLastCol && currentRows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(0)}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover/tr:opacity-100 p-0.5 text-rose-400 hover:text-rose-600 text-sm font-bold transition-opacity"
                        title="Remove row"
                      >
                        ×
                      </button>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
        ) : null}
        <tbody>
          {currentRows.map((row, rIdx) => {
            // If header is shown, skip row index 0 as it is in the thead
            if (showHeader && rIdx === 0) return null;

            return (
              <tr
                key={rIdx}
                className="border-b border-slate-200/60 dark:border-zinc-800/60 hover:bg-slate-50/50 dark:hover:bg-zinc-850/50 transition-colors group/tr"
              >
                {row.map((cell, cIdx) => {
                  const isLastCol = cIdx === row.length - 1;
                  const isFirstRowAndNoHeader = !showHeader && rIdx === 0;

                  return (
                    <td
                      key={cIdx}
                      className={`p-2 border-r border-slate-200/60 dark:border-zinc-800/60 relative group/td ${
                        isLastCol ? (isFirstRowAndNoHeader ? 'pr-10' : 'pr-6') : (isFirstRowAndNoHeader ? 'pr-6' : '')
                      }`}
                    >
                      {renderCell(rIdx, cIdx, cell, false)}

                      {/* If no header, allow column removal from the first row */}
                      {isFirstRowAndNoHeader && currentRows[0].length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveColumn(cIdx)}
                          className={`absolute top-1 opacity-0 group-hover/td:opacity-100 p-0.5 text-rose-400 hover:text-rose-600 text-xs font-semibold ${
                            isLastCol ? 'right-6' : 'right-1'
                          }`}
                          title="Remove column"
                        >
                          ×
                        </button>
                      )}

                      {/* Row removal from the last column of any row */}
                      {isLastCol && currentRows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(rIdx)}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover/tr:opacity-100 p-0.5 text-rose-400 hover:text-rose-600 text-sm font-bold transition-opacity"
                          title="Remove row"
                        >
                          ×
                        </button>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
