import React, { useRef, useEffect } from 'react';

interface TextBlockProps {
  id: string;
  content: string;
  onChange: (value: string) => void;
  onEnter: () => void;
  onBackspace: () => void;
  focusOnMount?: boolean;
}

export const TextBlock: React.FC<TextBlockProps> = ({
  content,
  onChange,
  onEnter,
  onBackspace,
  focusOnMount = false
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (focusOnMount && textareaRef.current) {
      textareaRef.current.focus();
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
    } else if (e.key === 'Backspace' && content.length === 0) {
      e.preventDefault();
      onBackspace();
    }
  };

  return (
    <textarea
      ref={textareaRef}
      value={content}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder="Type '/' for commands..."
      rows={1}
      className="w-full bg-transparent resize-none text-slate-800 dark:text-zinc-200 border-none outline-none focus:ring-0 p-0 text-sm leading-relaxed placeholder-slate-300 dark:placeholder-zinc-700"
    />
  );
};
