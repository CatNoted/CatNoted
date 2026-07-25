import React, { useRef, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';

interface ToggleBlockProps {
  id: string;
  content: string;
  expanded?: boolean;
  onChange: (val: string) => void;
  onUpdateProps: (props: { expanded?: boolean }) => void;
  onEnter: () => void;
  onBackspace: () => void;
  onFocus: () => void;
  focusOnMount?: boolean;
}

export const ToggleBlock: React.FC<ToggleBlockProps> = ({
  id: _id,
  content,
  expanded = true,
  onChange,
  onUpdateProps,
  onEnter,
  onBackspace,
  onFocus,
  focusOnMount,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (focusOnMount && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(content.length, content.length);
    }
  }, [focusOnMount]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onEnter();
    } else if (e.key === 'Backspace' && content === '') {
      e.preventDefault();
      onBackspace();
    }
  };

  return (
    <div className="flex items-start gap-1.5 my-0.5 group/toggle">
      <button
        type="button"
        onClick={() => onUpdateProps({ expanded: !expanded })}
        className="p-1 mt-0.5 rounded hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 transition-transform"
        title={expanded ? 'Collapse' : 'Expand'}
      >
        <ChevronRight
          className={`w-3.5 h-3.5 transition-transform duration-200 ${
            expanded ? 'rotate-90 text-indigo-500' : ''
          }`}
        />
      </button>

      <div className="flex-1 min-w-0">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={onFocus}
          placeholder="Toggle list item..."
          rows={1}
          className="w-full bg-transparent resize-none border-none outline-none focus:ring-0 p-0 text-sm font-semibold text-slate-800 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-zinc-500 leading-relaxed"
        />
      </div>
    </div>
  );
};
