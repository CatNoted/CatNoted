import React, { useRef, useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { SlashCommandMenu, buildSlashCommands } from './SlashCommandMenu.js';
import { WikiLinkMenu } from './WikiLinkMenu.js';

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
  pages?: Array<{ id: string; title: string }>;
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
  pages = [],
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Slash-command state
  const [slashActive, setSlashActive] = useState(false);
  const [slashQuery, setSlashQuery] = useState('');
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

  // Wiki-link state
  const [wikiActive, setWikiActive] = useState(false);
  const [wikiQuery, setWikiQuery] = useState('');

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
    setWikiActive(false);
    setWikiQuery('');
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    onChange(val);

    // Detect triggers
    const cursorPos = e.target.selectionStart ?? val.length;
    const textBeforeCursor = val.slice(0, cursorPos);

    const slashMatch = onSetType ? textBeforeCursor.match(/(^|\s)\/(\S*)$/) : null;
    const wikiMatch = textBeforeCursor.match(/(?:^|\s)\[\[([^\]]*)$/);

    if (wikiMatch) {
      const query = wikiMatch[1];
      setWikiQuery(query);
      setMenuPos(getMenuPosition());
      setWikiActive(true);
      setSlashActive(false);
    } else if (slashMatch) {
      const query = slashMatch[2];
      setSlashQuery(query);
      setMenuPos(getMenuPosition());
      setSlashActive(true);
      setWikiActive(false);
    } else {
      setSlashActive(false);
      setSlashQuery('');
      setWikiActive(false);
      setWikiQuery('');
    }
  };

  const handleSelectWikiPage = useCallback(
    (pageTitle: string) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const cursorPos = textarea.selectionStart ?? content.length;
      const textBeforeCursor = content.slice(0, cursorPos);
      const textAfterCursor = content.slice(cursorPos);

      const wikiMatch = textBeforeCursor.match(/(?:^|\s)\[\[([^\]]*)$/);
      if (wikiMatch) {
        const matchStr = wikiMatch[0];
        const isWhitespacePrefix = /^\s/.test(matchStr);
        const prefix = isWhitespacePrefix ? matchStr[0] : '';
        const startIndex = wikiMatch.index ?? 0;

        const newTextBefore = content.slice(0, startIndex) + prefix + `[[${pageTitle}]]`;
        const updated = newTextBefore + textAfterCursor;
        onChange(updated);

        const newCursorPos = newTextBefore.length;
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = textareaRef.current.selectionEnd = newCursorPos;
            textareaRef.current.focus();
          }
        }, 0);
      }
      setWikiActive(false);
      setWikiQuery('');
    },
    [content, onChange]
  );

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
    if (slashActive || wikiActive) {
      if (['Enter', 'ArrowUp', 'ArrowDown', 'Escape'].includes(e.key)) {
        return;
      }
      if (['ArrowLeft', 'ArrowRight'].includes(e.key)) {
        closeMenu();
      }
    }

    if (e.key === 'Backspace') {
      if (slashActive || wikiActive) {
        if (slashQuery.length === 0 && wikiQuery.length === 0) {
          closeMenu();
        }
      } else if (content.length === 0) {
        e.preventDefault();
        onBackspace();
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onEnter();
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

      {wikiActive &&
        createPortal(
          <WikiLinkMenu
            query={wikiQuery}
            position={menuPos}
            onClose={closeMenu}
            pages={pages}
            onSelect={handleSelectWikiPage}
          />,
          document.body
        )}
    </div>
  );
};

export const HeadingBlock = React.memo(HeadingBlockBase);
