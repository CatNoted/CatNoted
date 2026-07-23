import React, { useRef, useEffect } from 'react';

interface HeadingBlockProps {
  id: string;
  content: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
  onChange: (value: string) => void;
  onEnter: () => void;
  onBackspace: () => void;
  focusOnMount?: boolean;
}

export const HeadingBlock: React.FC<HeadingBlockProps> = ({
  content,
  level,
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

  const getHeadingClassName = () => {
    switch (level) {
      case 1:
        return 'text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-50';
      case 2:
        return 'text-xl font-bold tracking-tight text-slate-800 dark:text-zinc-100';
      case 3:
        return 'text-lg font-semibold tracking-tight text-slate-800 dark:text-zinc-200';
      default:
        return 'text-base font-semibold tracking-tight text-slate-800 dark:text-zinc-200';
    }
  };

  return (
    <textarea
      ref={textareaRef}
      value={content}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder={`Heading ${level}`}
      rows={1}
      className={`w-full bg-transparent resize-none border-none outline-none focus:ring-0 p-0 leading-snug placeholder-slate-300 dark:placeholder-zinc-700 ${getHeadingClassName()}`}
    />
  );
};
