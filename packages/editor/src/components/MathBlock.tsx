import React, { useState } from 'react';
import { Sigma, Edit3, Check } from 'lucide-react';

interface MathBlockProps {
  id: string;
  content: string;
  onChange: (val: string) => void;
  onDelete: () => void;
}

export const MathBlock: React.FC<MathBlockProps> = ({
  id: _id,
  content,
  onChange,
  onDelete: _onDelete,
}) => {
  const [isEditing, setIsEditing] = useState(content === '');

  const defaultFormula = content || 'E = mc^2';

  return (
    <div className="w-full my-2 p-3 bg-muted/50 border border-border rounded-xl transition-all group/math">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-border text-xs text-muted-foreground font-mono">
        <span className="flex items-center gap-1.5 font-semibold text-accent">
          <Sigma className="w-3.5 h-3.5" />
          Math Formula (LaTeX)
        </span>
        <button
          type="button"
          onClick={() => setIsEditing(!isEditing)}
          className="px-2 py-0.5 rounded hover:bg-muted text-muted-foreground flex items-center gap-1 transition-colors"
        >
          {isEditing ? (
            <>
              <Check className="w-3 h-3 text-emerald-500" />
              <span className="text-emerald-500 font-semibold">Done</span>
            </>
          ) : (
            <>
              <Edit3 className="w-3 h-3" />
              <span>Edit</span>
            </>
          )}
        </button>
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <textarea
            value={content}
            onChange={(e) => onChange(e.target.value)}
            placeholder="e.g. \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}"
            rows={2}
            className="w-full bg-card p-2.5 rounded-lg border border-border text-xs font-mono text-foreground outline-none focus:ring-1 focus:ring-accent"
            autoFocus
          />
          <p className="text-[10px] text-muted-foreground">
            Supports standard LaTeX math syntax (e.g., \sum, \int, \frac, \sqrt)
          </p>
        </div>
      ) : (
        <div
          onDoubleClick={() => setIsEditing(true)}
          className="py-3 px-4 text-center cursor-pointer hover:bg-muted rounded-lg transition-colors overflow-x-auto"
        >
          <div className="inline-block text-lg font-serif italic text-foreground tracking-wide font-medium">
            $${defaultFormula}$$
          </div>
        </div>
      )}
    </div>
  );
};
