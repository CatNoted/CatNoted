import React, { useRef, useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { SlashCommandMenu, buildSlashCommands } from './SlashCommandMenu.js';

interface TextBlockProps {
  id: string;
  content: string;
  onChange: (value: string) => void;
  onEnter: () => void;
  onBackspace: () => void;
  onSetType: (type: string, properties?: Record<string, unknown>) => void;
  onAddWidget: () => void;
  focusOnMount?: boolean;
  blockType?: string;
  onFocus?: () => void;
  onBlur?: () => void;
}

export const TextBlock: React.FC<TextBlockProps> = ({
  content,
  onChange,
  onEnter,
  onBackspace,
  onSetType,
  onAddWidget,
  focusOnMount = false,
  blockType,
  onFocus,
  onBlur,
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

  // Handle auto-resize
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

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    onChange(val);

    // Detect slash at start or after whitespace
    const cursorPos = e.target.selectionStart ?? val.length;
    const textBeforeCursor = val.slice(0, cursorPos);

    // Find the last slash that's either at position 0 or preceded by whitespace
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

  const closeMenu = useCallback(() => {
    setSlashActive(false);
    setSlashQuery('');
  }, []);

  /** When user picks a command, strip the "/" + query from content */
  const handleSetType = useCallback(
    (type: string, properties?: Record<string, unknown>) => {
      // Remove the slash trigger text from content
      const cleaned = content.replace(/(^|\s)\/\S*$/, (_, prefix) => prefix);
      onChange(cleaned);
      onSetType(type, properties);
      closeMenu();
    },
    [content, onChange, onSetType, closeMenu]
  );

  const handleAddWidget = useCallback(() => {
    const cleaned = content.replace(/(^|\s)\/\S*$/, (_, prefix) => prefix);
    onChange(cleaned);
    onAddWidget();
    closeMenu();
  }, [content, onChange, onAddWidget, closeMenu]);

  const slashCommands = buildSlashCommands({
    onSetType: handleSetType,
    onAddWidget: handleAddWidget,
    onClose: closeMenu,
  });

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Let the slash menu consume Enter/Arrow keys when open
    if (slashActive) {
      if (['Enter', 'ArrowUp', 'ArrowDown', 'Escape'].includes(e.key)) {
        // The SlashCommandMenu handles these via window keydown (capture phase)
        return;
      }
      if (['ArrowLeft', 'ArrowRight'].includes(e.key)) {
        closeMenu();
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (blockType === 'bullet') {
        const textarea = textareaRef.current;
        if (textarea) {
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;

          const textBefore = content.substring(0, start);
          const textAfter = content.substring(end);

          const lastNewline = textBefore.lastIndexOf('\n');
          const nextNewline = textAfter.indexOf('\n');

          const currentLineStart = lastNewline === -1 ? 0 : lastNewline + 1;
          const currentLineEnd = nextNewline === -1 ? content.length : start + nextNewline;

          const currentLineText = content.substring(currentLineStart, currentLineEnd);

          if (currentLineText.trim() === '') {
            // Current line is empty, so we breakout
            let cleanedContent = content;
            if (lastNewline !== -1) {
              cleanedContent = content.substring(0, lastNewline) + textAfter;
            } else {
              cleanedContent = textAfter;
            }

            onChange(cleanedContent);
            onEnter();
          } else {
            // Insert a newline at cursor position
            const newContent = textBefore + '\n' + textAfter;
            onChange(newContent);

            // Move the cursor to the next line in the next frame
            setTimeout(() => {
              if (textareaRef.current) {
                textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 1;
              }
            }, 0);
          }
        }
      } else {
        onEnter();
      }
    } else if (e.key === 'Backspace') {
      if (slashActive) {
        // If query is empty (just typed '/'), close the menu
        if (slashQuery.length === 0) {
          closeMenu();
        }
      } else if (content.length === 0) {
        e.preventDefault();
        onBackspace();
      }
    }
  };

  return (
    <div className="relative w-full">
      <textarea
        ref={textareaRef}
        value={content}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder="Type '/' for commands..."
        rows={1}
        className="w-full bg-transparent resize-none text-slate-900 dark:text-zinc-100 border-none outline-none focus:ring-0 p-0 text-[15px] leading-7 placeholder-slate-300 dark:placeholder-zinc-600"
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
