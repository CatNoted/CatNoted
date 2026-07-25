import React from 'react';
import { Plus, Table as TableIcon } from 'lucide-react';

interface TableBlockProps {
  id: string;
  rows?: string[][];
  onUpdateProps: (props: { rows?: string[][] }) => void;
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
  onUpdateProps,
  onDelete: _onDelete,
}) => {
  const currentRows = rows && rows.length > 0 ? rows : DEFAULT_ROWS;

  const handleCellChange = (rIndex: number, cIndex: number, value: string) => {
    const updated = currentRows.map((row, r) =>
      row.map((cell, c) => (r === rIndex && c === cIndex ? value : cell))
    );
    onUpdateProps({ rows: updated });
  };

  const handleAddRow = () => {
    const colCount = currentRows[0]?.length || 3;
    const newRow = Array(colCount).fill('');
    onUpdateProps({ rows: [...currentRows, newRow] });
  };

  const handleAddColumn = () => {
    const updated = currentRows.map((row, i) => [...row, i === 0 ? `Header ${row.length + 1}` : '']);
    onUpdateProps({ rows: updated });
  };

  const _handleRemoveRow = (rIndex: number) => {
    if (currentRows.length <= 1) return;
    const updated = currentRows.filter((_, r) => r !== rIndex);
    onUpdateProps({ rows: updated });
  };

  const handleRemoveColumn = (cIndex: number) => {
    if (currentRows[0].length <= 1) return;
    const updated = currentRows.map((row) => row.filter((_, c) => c !== cIndex));
    onUpdateProps({ rows: updated });
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
            onClick={handleAddRow}
            className="px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 hover:bg-indigo-50 text-slate-600 dark:text-zinc-300 hover:text-indigo-600 text-[11px] font-medium flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3 h-3" /> Row
          </button>
          <button
            type="button"
            onClick={handleAddColumn}
            className="px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 hover:bg-indigo-50 text-slate-600 dark:text-zinc-300 hover:text-indigo-600 text-[11px] font-medium flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3 h-3" /> Column
          </button>
        </div>
      </div>

      <table className="w-full border-collapse border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden text-xs">
        <thead>
          <tr className="bg-slate-100/80 dark:bg-zinc-900/80 text-slate-700 dark:text-zinc-300 font-semibold border-b border-slate-200 dark:border-zinc-800">
            {currentRows[0]?.map((cell, cIndex) => (
              <th key={cIndex} className="p-2 border-r border-slate-200 dark:border-zinc-800 relative group/th">
                <input
                  type="text"
                  value={cell}
                  onChange={(e) => handleCellChange(0, cIndex, e.target.value)}
                  className="w-full bg-transparent font-bold text-slate-900 dark:text-zinc-100 outline-none focus:ring-1 focus:ring-indigo-400 rounded px-1"
                />
                {currentRows[0].length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveColumn(cIndex)}
                    className="absolute right-1 top-1 opacity-0 group-hover/th:opacity-100 p-0.5 text-rose-400 hover:text-rose-600"
                    title="Remove column"
                  >
                    ×
                  </button>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {currentRows.slice(1).map((row, rIdx) => {
            const actualRowIdx = rIdx + 1;
            return (
              <tr
                key={actualRowIdx}
                className="border-b border-slate-200/60 dark:border-zinc-800/60 hover:bg-slate-50/50 dark:hover:bg-zinc-850/50 transition-colors group/tr"
              >
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="p-2 border-r border-slate-200/60 dark:border-zinc-800/60 relative">
                    <input
                      type="text"
                      value={cell}
                      onChange={(e) => handleCellChange(actualRowIdx, cIdx, e.target.value)}
                      className="w-full bg-transparent text-slate-700 dark:text-zinc-300 outline-none focus:ring-1 focus:ring-indigo-400 rounded px-1 pr-6"
                    />
                    {cIdx === row.length - 1 && currentRows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => _handleRemoveRow(actualRowIdx)}
                        className="absolute right-1 top-2.5 opacity-0 group-hover/tr:opacity-100 p-0.5 text-rose-400 hover:text-rose-600"
                        title="Remove row"
                      >
                        ×
                      </button>
                    )}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
