import React, { useState } from 'react';
import { KanbanColumn } from '@catnoted/shared';
import { Plus, Trash2, GripVertical, GripHorizontal, Columns } from 'lucide-react';

interface KanbanBlockProps {
  id: string;
  title?: string;
  columns?: KanbanColumn[];
  onUpdateProps: (props: { kanbanTitle?: string; columns?: KanbanColumn[] }) => void;
  onUpdateContent?: (content: string) => void;
  onDelete?: () => void;
}

const DEFAULT_COLUMNS: KanbanColumn[] = [
  {
    id: 'col-todo',
    title: 'To Do',
    cards: [
      { id: 'card-1', title: 'Draft project proposal' },
      { id: 'card-2', title: 'Review mockups' }
    ]
  },
  {
    id: 'col-progress',
    title: 'In Progress',
    cards: [
      { id: 'card-3', title: 'Implement core editor features' }
    ]
  },
  {
    id: 'col-done',
    title: 'Done',
    cards: [
      { id: 'card-4', title: 'Setup monorepo workspace' }
    ]
  }
];

export const KanbanBlock: React.FC<KanbanBlockProps> = ({
  id: _id,
  title = '',
  columns,
  onUpdateProps,
  onUpdateContent,
  onDelete: _onDelete,
}) => {
  const currentColumns = columns && columns.length > 0 ? columns : DEFAULT_COLUMNS;
  const boardTitle = title || '';

  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [draggedColId, setDraggedColId] = useState<string | null>(null);

  // Drag over states to apply visual styling
  const [dragOverColId, setDragOverColId] = useState<string | null>(null);
  const [dragOverCardId, setDragOverCardId] = useState<string | null>(null);

  const handleBoardTitleChange = (newTitle: string) => {
    onUpdateProps({ kanbanTitle: newTitle });
    if (onUpdateContent) {
      onUpdateContent(newTitle);
    }
  };

  // Columns Actions
  const handleAddColumn = () => {
    const newColId = `col-${Math.random().toString(36).substring(2, 6)}`;
    const updated = [
      ...currentColumns,
      {
        id: newColId,
        title: 'New Column',
        cards: []
      }
    ];
    onUpdateProps({ columns: updated });
  };

  const handleRenameColumn = (colId: string, newTitle: string) => {
    const updated = currentColumns.map(col =>
      col.id === colId ? { ...col, title: newTitle } : col
    );
    onUpdateProps({ columns: updated });
  };

  const handleDeleteColumn = (colId: string) => {
    const updated = currentColumns.filter(col => col.id !== colId);
    onUpdateProps({ columns: updated });
  };

  // Cards Actions
  const handleAddCard = (colId: string) => {
    const newCardId = `card-${Math.random().toString(36).substring(2, 6)}`;
    const updated = currentColumns.map(col => {
      if (col.id === colId) {
        return {
          ...col,
          cards: [
            ...col.cards,
            { id: newCardId, title: 'New Card' }
          ]
        };
      }
      return col;
    });
    onUpdateProps({ columns: updated });
  };

  const handleRenameCard = (colId: string, cardId: string, newTitle: string) => {
    const updated = currentColumns.map(col => {
      if (col.id === colId) {
        return {
          ...col,
          cards: col.cards.map(card =>
            card.id === cardId ? { ...card, title: newTitle } : card
          )
        };
      }
      return col;
    });
    onUpdateProps({ columns: updated });
  };

  const handleDeleteCard = (colId: string, cardId: string) => {
    const updated = currentColumns.map(col => {
      if (col.id === colId) {
        return {
          ...col,
          cards: col.cards.filter(card => card.id !== cardId)
        };
      }
      return col;
    });
    onUpdateProps({ columns: updated });
  };

  // HTML5 Drag and Drop handlers for Columns
  const handleColDragStart = (e: React.DragEvent, colId: string) => {
    setDraggedColId(colId);
    e.dataTransfer.setData('type', 'column');
    e.dataTransfer.setData('columnId', colId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleColDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    if (draggedColId && draggedColId !== colId) {
      setDragOverColId(colId);
    }
  };

  const handleColDrop = (e: React.DragEvent, targetColId: string) => {
    e.preventDefault();
    setDragOverColId(null);
    const type = e.dataTransfer.getData('type');

    if (type === 'column') {
      const colId = e.dataTransfer.getData('columnId');
      if (!colId || colId === targetColId) return;

      const sourceIndex = currentColumns.findIndex(c => c.id === colId);
      const targetIndex = currentColumns.findIndex(c => c.id === targetColId);
      if (sourceIndex === -1 || targetIndex === -1) return;

      const updated = [...currentColumns];
      const [removed] = updated.splice(sourceIndex, 1);
      updated.splice(targetIndex, 0, removed);

      onUpdateProps({ columns: updated });
      setDraggedColId(null);
    }
  };

  // HTML5 Drag and Drop handlers for Cards
  const handleCardDragStart = (e: React.DragEvent, cardId: string, colId: string) => {
    e.stopPropagation();
    setDraggedCardId(cardId);
    e.dataTransfer.setData('type', 'card');
    e.dataTransfer.setData('cardId', cardId);
    e.dataTransfer.setData('sourceColumnId', colId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleCardDragOver = (e: React.DragEvent, colId: string, cardId?: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedCardId) {
      if (cardId && draggedCardId !== cardId) {
        setDragOverCardId(cardId);
      }
      setDragOverColId(colId);
    }
  };

  const handleCardDrop = (e: React.DragEvent, targetColId: string, targetCardId?: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverColId(null);
    setDragOverCardId(null);

    const type = e.dataTransfer.getData('type');
    if (type === 'card') {
      const cardId = e.dataTransfer.getData('cardId');
      const fromColId = e.dataTransfer.getData('sourceColumnId');

      if (!cardId || !fromColId) return;

      // Copy columns
      const updated = currentColumns.map(col => ({
        ...col,
        cards: [...col.cards]
      }));

      // Find source column and card index
      const sourceCol = updated.find(c => c.id === fromColId);
      if (!sourceCol) return;

      const cardIdx = sourceCol.cards.findIndex(c => c.id === cardId);
      if (cardIdx === -1) return;

      // Extract target card index
      const targetCol = updated.find(c => c.id === targetColId);
      if (!targetCol) return;

      let targetIdx = targetCol.cards.length;
      if (targetCardId) {
        targetIdx = targetCol.cards.findIndex(c => c.id === targetCardId);
        if (targetIdx === -1) {
          targetIdx = targetCol.cards.length;
        }
      }

      // Remove card from source
      const [movedCard] = sourceCol.cards.splice(cardIdx, 1);

      // Insert card into target
      targetCol.cards.splice(targetIdx, 0, movedCard);

      onUpdateProps({ columns: updated });
      setDraggedCardId(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedColId(null);
    setDraggedCardId(null);
    setDragOverColId(null);
    setDragOverCardId(null);
  };

  return (
    <div className="w-full my-6 p-4 rounded-2xl border border-border bg-slate-50/20 bg-card/30 shadow-sm select-none">
      {/* Board Header */}
      <div className="flex items-center gap-2 mb-4 group/header">
        <Columns className="w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={boardTitle}
          onChange={(e) => handleBoardTitleChange(e.target.value)}
          placeholder="Untitled Kanban Board"
          className="text-sm font-semibold bg-transparent text-foreground border-none outline-none focus:ring-1 focus:ring-accent rounded px-1.5 py-0.5 placeholder:text-muted-foreground dark:placeholder:text-zinc-500 w-64 transition-all"
        />
        <button
          type="button"
          onClick={handleAddColumn}
          className="ml-auto flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-accent hover:text-accent hover:bg-indigo-50 dark:hover:bg-indigo-950/20 rounded-md transition-colors border border-dashed border-indigo-200 dark:border-indigo-800/40"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Column</span>
        </button>
      </div>

      {/* Columns Container */}
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
        {currentColumns.map((col) => {
          const isOverCol = dragOverColId === col.id && !draggedColId;

          return (
            <div
              key={col.id}
              draggable
              onDragStart={(e) => handleColDragStart(e, col.id)}
              onDragOver={(e) => handleColDragOver(e, col.id)}
              onDrop={(e) => {
                const type = e.dataTransfer.getData('type');
                if (type === 'column') {
                  handleColDrop(e, col.id);
                } else if (type === 'card') {
                  handleCardDrop(e, col.id);
                }
              }}
              onDragEnd={handleDragEnd}
              className={`flex-shrink-0 w-64 rounded-xl border p-3 flex flex-col max-h-[420px] transition-all ${
                draggedColId === col.id
                  ? 'opacity-40 border-slate-300/40 dark:border-zinc-800/40 bg-transparent'
                  : isOverCol
                  ? 'border-indigo-400 dark:border-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/10'
                  : 'border-slate-200/60 dark:border-zinc-800/50 bg-slate-50/75 dark:bg-zinc-900/40'
              }`}
            >
              {/* Column Header */}
              <div className="flex items-center gap-1.5 mb-3 group/col-header">
                <span className="cursor-grab active:cursor-grabbing p-0.5 rounded text-muted-foreground hover:bg-slate-150 dark:hover:bg-zinc-800 transition-colors">
                  <GripHorizontal className="w-3.5 h-3.5" />
                </span>

                <input
                  type="text"
                  value={col.title}
                  onChange={(e) => handleRenameColumn(col.id, e.target.value)}
                  placeholder="Column Name"
                  className="text-xs font-semibold bg-transparent text-foreground border-none outline-none focus:ring-1 focus:ring-accent rounded px-1 py-0.5 placeholder:text-muted-foreground dark:placeholder:text-zinc-500 flex-1 min-w-0 transition-colors focus:bg-white dark:focus:bg-zinc-800"
                />

                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-200/50 dark:bg-zinc-800 text-muted-foreground font-mono">
                  {col.cards.length}
                </span>

                <button
                  type="button"
                  onClick={() => handleDeleteColumn(col.id)}
                  className="opacity-0 group-hover/col-header:opacity-100 p-1 rounded hover:bg-muted text-muted-foreground hover:text-destructive dark:hover:text-red-400 transition-all cursor-pointer"
                  title="Delete column"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>

              {/* Cards List */}
              <div
                className="flex-1 overflow-y-auto space-y-2 min-h-[80px] pb-2 scrollbar-none"
                onDragOver={(e) => handleCardDragOver(e, col.id)}
                onDrop={(e) => {
                  const type = e.dataTransfer.getData('type');
                  if (type === 'card') {
                    handleCardDrop(e, col.id);
                  }
                }}
              >
                {col.cards.map((card) => {
                  const isCardDragged = draggedCardId === card.id;
                  const isCardOver = dragOverCardId === card.id;

                  return (
                    <div
                      key={card.id}
                      draggable
                      onDragStart={(e) => handleCardDragStart(e, card.id, col.id)}
                      onDragOver={(e) => handleCardDragOver(e, col.id, card.id)}
                      onDrop={(e) => {
                        const type = e.dataTransfer.getData('type');
                        if (type === 'card') {
                          handleCardDrop(e, col.id, card.id);
                        }
                      }}
                      onDragEnd={handleDragEnd}
                      className={`group/card relative rounded-lg border p-2.5 flex flex-col gap-1.5 shadow-sm transition-all ${
                        isCardDragged
                          ? 'opacity-35 border-slate-300/40 dark:border-zinc-800/40 bg-transparent shadow-none'
                          : isCardOver
                          ? 'border-indigo-500 dark:border-indigo-400 ring-2 ring-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-950/20 scale-[0.98]'
                          : 'border-border/60 bg-white dark:bg-zinc-800 hover:border-slate-300 dark:hover:border-zinc-600'
                      }`}
                    >
                      <div className="flex items-start gap-1.5">
                        <span className="cursor-grab active:cursor-grabbing p-0.5 rounded text-muted-foreground hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors mt-0.5 flex-shrink-0 opacity-0 group-hover/card:opacity-100">
                          <GripVertical className="w-3 h-3" />
                        </span>

                        <textarea
                          rows={1}
                          value={card.title}
                          onChange={(e) => handleRenameCard(col.id, card.id, e.target.value)}
                          placeholder="Card Title"
                          className="w-full resize-none text-[11px] leading-relaxed bg-transparent text-foreground border-none outline-none focus:ring-1 focus:ring-accent rounded p-0.5 placeholder:text-muted-foreground dark:placeholder:text-zinc-500 focus:bg-slate-50 dark:focus:bg-zinc-900 transition-all"
                          style={{ height: 'auto' }}
                          onInput={(e) => {
                            const target = e.target as HTMLTextAreaElement;
                            target.style.height = 'auto';
                            target.style.height = `${target.scrollHeight}px`;
                          }}
                        />

                        <button
                          type="button"
                          onClick={() => handleDeleteCard(col.id, card.id)}
                          className="opacity-0 group-hover/card:opacity-100 p-1 rounded hover:bg-slate-100 dark:hover:bg-zinc-700 text-muted-foreground hover:text-destructive dark:hover:text-red-400 transition-all cursor-pointer flex-shrink-0"
                          title="Delete card"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {col.cards.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-4 border border-dashed border-border rounded-lg text-muted-foreground text-[10px]">
                    Empty Column
                  </div>
                )}
              </div>

              {/* Add Card Button */}
              <button
                type="button"
                onClick={() => handleAddCard(col.id)}
                className="mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-muted-foreground hover:text-accent hover:bg-slate-100/50 dark:hover:bg-zinc-800/40 rounded-lg transition-colors border border-transparent hover:border-slate-200/50 dark:hover:border-zinc-800/40"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Card</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
