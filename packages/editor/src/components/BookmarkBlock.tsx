import React, { useState } from 'react';
import { ExternalLink, Bookmark as BookmarkIcon, Globe } from 'lucide-react';

interface BookmarkBlockProps {
  id: string;
  bookmarkUrl?: string;
  bookmarkTitle?: string;
  bookmarkDescription?: string;
  bookmarkFavicon?: string;
  onUpdateProps: (props: {
    bookmarkUrl?: string;
    bookmarkTitle?: string;
    bookmarkDescription?: string;
    bookmarkFavicon?: string;
  }) => void;
  onDelete: () => void;
}

export const BookmarkBlock: React.FC<BookmarkBlockProps> = ({
  id: _id,
  bookmarkUrl = '',
  bookmarkTitle = '',
  bookmarkDescription = '',
  bookmarkFavicon = '',
  onUpdateProps,
  onDelete: _onDelete,
}) => {
  const [urlInput, setUrlInput] = useState(bookmarkUrl);
  const [isEditing, setIsEditing] = useState(!bookmarkUrl);

  const handleSave = () => {
    if (!urlInput.trim()) return;
    let url = urlInput.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }

    try {
      const parsed = new URL(url);
      const domain = parsed.hostname;
      const favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
      const title = bookmarkTitle || domain;
      const description = bookmarkDescription || `Web resource bookmark from ${domain}`;

      onUpdateProps({
        bookmarkUrl: url,
        bookmarkTitle: title,
        bookmarkDescription: description,
        bookmarkFavicon: favicon,
      });
      setIsEditing(false);
    } catch {
      alert('Invalid URL format');
    }
  };

  return (
    <div className="w-full my-2 select-none">
      {isEditing ? (
        <div className="p-3 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800/60 rounded-xl flex items-center gap-2">
          <Globe className="w-4 h-4 text-indigo-500 shrink-0" />
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
            }}
            placeholder="Paste Web Link URL (e.g. https://github.com)..."
            className="flex-1 bg-transparent text-xs font-mono text-slate-800 dark:text-zinc-200 outline-none"
            autoFocus
          />
          <button
            type="button"
            onClick={handleSave}
            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition-colors"
          >
            Create Bookmark
          </button>
        </div>
      ) : (
        <div className="group/bookmark relative flex items-center justify-between p-3.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800/60 rounded-2xl shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 overflow-hidden p-2 border border-slate-200/60 dark:border-zinc-700/60">
              {bookmarkFavicon ? (
                <img src={bookmarkFavicon} alt="favicon" className="w-full h-full object-contain" />
              ) : (
                <BookmarkIcon className="w-5 h-5 text-indigo-500" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-semibold text-slate-900 dark:text-zinc-100 truncate">
                {bookmarkTitle || bookmarkUrl}
              </h4>
              <p className="text-[11px] text-slate-400 dark:text-zinc-500 truncate mt-0.5">
                {bookmarkDescription || bookmarkUrl}
              </p>
              <span className="text-[10px] font-mono text-indigo-500 dark:text-indigo-400 truncate block mt-1">
                {bookmarkUrl}
              </span>
            </div>
          </div>

          <a
            href={bookmarkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors shrink-0 ml-3"
            title="Open external link"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      )}
    </div>
  );
};
