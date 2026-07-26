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

  // Handle auto-resize
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

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
    <div className="flex flex-col w-full my-1 group/toggle">
      <div className="flex items-start gap-2 w-full">
        <button
          type="button"
          onClick={() => onUpdateProps({ expanded: !expanded })}
          className="w-5 h-5 flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-200 transition-all duration-150 self-start mt-0.5"
          title={expanded ? 'Collapse' : 'Expand'}
          aria-label={expanded ? 'Collapse' : 'Expand'}
          aria-expanded={expanded}
        >
          <ChevronRight
            className={`w-3.5 h-3.5 transition-transform duration-200 ${
              expanded ? 'rotate-90 text-slate-700 dark:text-zinc-300' : 'text-slate-400 dark:text-zinc-500'
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

      {/* Thin vertical guide line separator when expanded */}
      {expanded && (
        <div className="pl-6 ml-[10px] border-l border-slate-200/50 dark:border-zinc-800/40 mt-1 min-h-[1.5rem] flex flex-col justify-center text-xs text-slate-400 dark:text-zinc-500 select-none">
          <div className="opacity-0 group-hover/toggle:opacity-60 transition-opacity duration-200 font-normal italic">
            Empty toggle container. Drag blocks here or type below.
          </div>
        </div>
      )}
    </div>
  );
};
