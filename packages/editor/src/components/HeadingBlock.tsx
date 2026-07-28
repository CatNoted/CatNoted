import React, { useRef, useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { SlashCommandMenu, buildSlashCommands } from './SlashCommandMenu.js';

interface HeadingBlockProps {
  id: string;
  type?: string;
  content: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
  onChange: (value: string) => void;
  onEnter: () => void;
  onBackspace: () => void;
  onSetType?: (type: string, properties?: Record<string, unknown>) => void;
  onAddWidget?: () => void;
  focusOnMount?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

const HeadingBlockBase: React.FC<HeadingBlockProps> = ({
  content,
  type: _type,
  level,
  onChange,
  onEnter,
  onBackspace,
  onSetType,
  onAddWidget,
  focusOnMount = false,
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

    // Detect slash at the very start of the block
    const cursorPos = e.target.selectionStart ?? val.length;
    const textBeforeCursor = val.slice(0, cursorPos);

    // Find the slash at the start of the text
    const slashMatch = textBeforeCursor.match(/^\/(\S*)$/);

    if (slashMatch) {
      const query = slashMatch[1]; // text after the slash (group 1)
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
      // Remove the slash trigger text from content
      const cleaned = content.replace(/^\/\S*\s*/, '');
      onChange(cleaned);
      if (onSetType) onSetType(type, properties);
      closeMenu();
    },
    [content, onChange, onSetType, closeMenu]
  );

  const handleAddWidget = useCallback(() => {
    const cleaned = content.replace(/^\/\S*\s*/, '');
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
    if (slashActive) {
      if (['Enter', 'ArrowUp', 'ArrowDown', 'Escape'].includes(e.key)) {
        return;
      }
      if (['ArrowLeft', 'ArrowRight'].includes(e.key)) {
        closeMenu();
      }
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
        return 'text-3xl font-semibold tracking-tight text-foreground';
      case 2:
        return 'text-2xl font-semibold tracking-tight text-foreground';
      case 3:
        return 'text-xl font-semibold tracking-tight text-foreground';
      default:
        return 'text-lg font-semibold tracking-tight text-foreground';
    }
  };

  const getContainerClassName = () => {
    switch (level) {
      case 1:
        return 'relative w-full pb-3';
      case 2:
        return 'relative w-full pb-2';
      case 3:
        return 'relative w-full pb-1.5';
      default:
        return 'relative w-full pb-1';
    }
  };

  return (
    <div className={getContainerClassName()}>
      <textarea
        aria-label={`Heading level ${level}`}
        role="textbox"
        ref={textareaRef}
        value={content}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={`Heading ${level}`}
        rows={1}
        className={`w-full bg-transparent resize-none border-none outline-none focus:ring-0 p-0 leading-snug placeholder-muted-foreground ${getHeadingClassName()}`}
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

export const HeadingBlock = React.memo(HeadingBlockBase);
