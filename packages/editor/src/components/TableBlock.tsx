import React from 'react';
import { ChevronDown, GripHorizontal, Plus, Table as TableIcon } from 'lucide-react';

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
  const [expanded, setExpanded] = React.useState(false);
  const maxVisibleRows = 6;
  const hasMoreRows = currentRows.length > maxVisibleRows + 1;
  const visibleBodyRows = expanded
    ? currentRows.slice(1)
    : currentRows.slice(1, maxVisibleRows + 1);

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

  const handleRemoveColumn = (cIndex: number) => {
    if (currentRows[0].length <= 1) return;
    const updated = currentRows.map((row) => row.filter((_, c) => c !== cIndex));
    onUpdateProps({ rows: updated });
  };

  return (
    <div>
      <div className="w-full my-3 overflow-x-auto select-none group/table">
        <div className="flex items-center justify-between pb-1.5 mb-1.5 text-xs text-muted-foreground font-mono">
          <span className="flex items-center gap-1.5 font-semibold text-foreground">
            <TableIcon className="w-3.5 h-3.5" />
            Table ({currentRows.length}x{currentRows[0]?.length || 0})
          </span>
          <div className="flex items-center gap-2 opacity-0 group-hover/table:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={handleAddRow}
              className="px-2 py-0.5 rounded bg-card border border-border  text-muted-foreground hover:text-foreground text-[11px] font-medium flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3 h-3" /> Row
            </button>
            <button
              type="button"
              onClick={handleAddColumn}
              className="px-2 py-0.5 rounded bg-card border border-border  text-muted-foreground hover:text-foreground text-[11px] font-medium flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3 h-3" /> Column
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-border overflow-hidden text-xs shadow-sm bg-card">
          <div className="min-w-full overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  {currentRows[0]?.map((cell, cIndex) => (
                    <th
                      key={cIndex}
                      className="p-3 border-r border-border last:border-r-0 text-left text-[12px] font-semibold tracking-tight text-foreground relative group/th"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={cell}
                          onChange={(e) => handleCellChange(0, cIndex, e.target.value)}
                          className="w-full bg-transparent font-semibold text-foreground outline-none focus-visible:ring-1 focus-visible:ring-accent rounded px-0.5 placeholder:text-muted-foreground"
                        />
                      </div>
                      {currentRows[0].length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveColumn(cIndex)}
                          className="absolute right-1 top-1 opacity-0 group-hover/th:opacity-100 p-0.5 text-muted-foreground hover:text-destructive transition-colors"
                          title="Remove column"
                          aria-label="Remove column"
                        >
                          ×
                        </button>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleBodyRows.map((row, rIdx) => {
                  const actualRowIdx = rIdx + 1;
                  return (
                    <tr
                      key={actualRowIdx}
                      className="group/row border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors"
                    >
                      <td className="w-8 p-0 border-r border-border text-center align-middle">
                        <div className="flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity text-muted-foreground cursor-grab active:cursor-grabbing">
                          <GripHorizontal className="w-3.5 h-3.5" />
                        </div>
                      </td>
                      {row.map((cell, cIdx) => (
                        <td
                          key={cIdx}
                          className="p-3 border-r border-border last:border-r-0 align-top"
                        >
                          <input
                            type="text"
                            value={cell}
                            onChange={(e) => handleCellChange(actualRowIdx, cIdx, e.target.value)}
                            className="w-full bg-transparent text-foreground outline-none focus-visible:ring-1 focus-visible:ring-accent rounded px-0.5 placeholder:text-muted-foreground transition-colors"
                          />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {hasMoreRows && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="w-full flex items-center justify-center gap-1 py-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors border-t border-border hover:bg-muted"
              aria-expanded={expanded}
            >
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
              {expanded ? 'Show fewer rows' : `Show ${currentRows.length - 1 - maxVisibleRows} more rows`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
