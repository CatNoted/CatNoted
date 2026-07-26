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
        <div className="p-3 bg-secondary/50 border border-border rounded-xl flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary shrink-0" />
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
            }}
            placeholder="Paste Web Link URL (e.g. https://github.com)..."
            className="flex-1 bg-transparent text-xs font-mono text-foreground outline-none"
            autoFocus
          />
          <button
            type="button"
            onClick={handleSave}
            className="px-3 py-1 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium rounded-lg transition-colors"
          >
            Create Bookmark
          </button>
        </div>
      ) : (
        <div className="group/bookmark relative flex items-center justify-between p-3.5 bg-card border border-border rounded-2xl shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0 overflow-hidden p-2 border border-border/60">
              {bookmarkFavicon ? (
                <img src={bookmarkFavicon} alt="favicon" className="w-full h-full object-contain" />
              ) : (
                <BookmarkIcon className="w-5 h-5 text-primary" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-semibold text-foreground truncate">
                {bookmarkTitle || bookmarkUrl}
              </h4>
              <p className="text-[11px] text-foreground/60 truncate mt-0.5">
                {bookmarkDescription || bookmarkUrl}
              </p>
              <span className="text-[10px] font-mono text-primary truncate block mt-1">
                {bookmarkUrl}
              </span>
            </div>
          </div>

          <a
            href={bookmarkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-foreground/50 hover:text-primary hover:bg-accent rounded-xl transition-colors shrink-0 ml-3"
            title="Open external link"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      )}
    </div>
  );
};
