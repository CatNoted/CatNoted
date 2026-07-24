import React, { useRef, useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { SlashCommandMenu, buildSlashCommands } from './SlashCommandMenu.js';

interface HeadingBlockProps {
  id: string;
  content: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
  onChange: (value: string) => void;
  onEnter: () => void;
  onBackspace: () => void;
  onSetType?: (type: string, properties?: Record<string, unknown>) => void;
  onAddWidget?: () => void;
  focusOnMount?: boolean;
}

export const HeadingBlock: React.FC<HeadingBlockProps> = ({
  content,
  level,
  onChange,
  onEnter,
  onBackspace,
  onSetType,
  onAddWidget,
  focusOnMount = false,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Slash-command state
  const [slashActive, setSlashActive] = useState(false);
  const [slashQuery, setSlashQuery] = useState('');
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

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

  /** Compute position just below the caret / textarea */
  const getMenuPosition = useCallback(() => {
    if (!textareaRef.current) return { top: 0, left: 0 };
    const rect = textareaRef.current.getBoundingClientRect();
    return {
      top: rect.bottom + 4,
      left: rect.left,
    };
  }, []);

  const closeMenu = useCallback(() => {
    setSlashActive(false);
    setSlashQuery('');
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    onChange(val);

    if (!onSetType) return;

    // Detect slash at start or after whitespace
    const cursorPos = e.target.selectionStart ?? val.length;
    const textBeforeCursor = val.slice(0, cursorPos);

    const slashMatch = textBeforeCursor.match(/(^|\s)\/(\S*)$/);

    if (slashMatch) {
      const query = slashMatch[2]; // text after the slash
      setSlashQuery(query);
      setMenuPos(getMenuPosition());
      setSlashActive(true);
    } else {
      setSlashActive(false);
      setSlashQuery('');
    }
  };

  /** When user picks a command, strip the "/" + query from content */
  const handleSetType = useCallback(
    (type: string, properties?: Record<string, unknown>) => {
      const cleaned = content.replace(/(^|\s)\/\S*$/, (_, prefix) => prefix);
      onChange(cleaned);
      if (onSetType) onSetType(type, properties);
      closeMenu();
    },
    [content, onChange, onSetType, closeMenu]
  );

  const handleAddWidget = useCallback(() => {
    const cleaned = content.replace(/(^|\s)\/\S*$/, (_, prefix) => prefix);
    onChange(cleaned);
    if (onAddWidget) onAddWidget();
    closeMenu();
  }, [content, onChange, onAddWidget, closeMenu]);

  const slashCommands = buildSlashCommands({
    onSetType: handleSetType,
    onAddWidget: handleAddWidget,
    onClose: closeMenu,
  });

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (slashActive && ['Enter', 'ArrowUp', 'ArrowDown', 'Escape'].includes(e.key)) {
      return;
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onEnter();
    } else if (e.key === 'Backspace') {
      if (slashActive) {
        if (slashQuery.length === 0) {
          closeMenu();
        }
      } else if (content.length === 0) {
        e.preventDefault();
        onBackspace();
      }
    }
  };

  const getHeadingClassName = () => {
    switch (level) {
      case 1:
        return 'text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-50';
      case 2:
        return 'text-xl font-bold tracking-tight text-slate-900 dark:text-zinc-100';
      case 3:
        return 'text-lg font-semibold tracking-tight text-slate-900 dark:text-zinc-100';
      default:
        return 'text-base font-semibold tracking-tight text-slate-900 dark:text-zinc-100';
    }
  };

  return (
    <div className="relative w-full">
      <textarea
        ref={textareaRef}
        value={content}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={`Heading ${level}`}
        rows={1}
        className={`w-full bg-transparent resize-none border-none outline-none focus:ring-0 p-0 leading-snug placeholder-slate-300 dark:placeholder-zinc-700 ${getHeadingClassName()}`}
      />

      {slashActive &&
        createPortal(
          <SlashCommandMenu
            query={slashQuery}
            position={menuPos}
            onClose={closeMenu}
            commands={slashCommands}
          />,
          document.body
        )}
    </div>
  );
};
