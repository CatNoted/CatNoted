import React, { useState } from 'react';
import { Copy, Check, Code2 } from 'lucide-react';

interface CodeBlockProps {
  id: string;
  content: string;
  language?: string;
  onChange: (val: string) => void;
  onUpdateProps: (props: { language?: string }) => void;
  onDelete: () => void;
}

const LANGUAGES = [
  'javascript',
  'typescript',
  'python',
  'html',
  'css',
  'json',
  'rust',
  'go',
  'sql',
  'bash',
  'markdown',
  'cpp',
];

export const CodeBlock: React.FC<CodeBlockProps> = ({
  id: _id,
  content,
  language = 'javascript',
  onChange,
  onUpdateProps,
  onDelete: _onDelete,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full my-2 rounded-xl bg-card border border-border overflow-hidden shadow-md group/code">
      {/* Code Header Bar */}
      <div className="h-9 px-3 bg-card/80 border-b border-border/80 flex items-center justify-between text-xs font-mono select-none">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Code2 className="w-3.5 h-3.5 text-accent" />
          <select
            value={language}
            onChange={(e) => onUpdateProps({ language: e.target.value })}
            className="bg-transparent border-none text-xs font-mono text-foreground focus:outline-none focus:ring-0 cursor-pointer capitalize hover:text-accent transition-colors"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang} className="bg-card text-foreground">
                {lang}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="px-2 py-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded flex items-center gap-1 transition-colors text-[11px]"
            title="Copy code"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-accent" />
                <span className="text-accent">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Content Input */}
      <div className="p-3">
        <textarea
          value={content}
          onChange={(e) => onChange(e.target.value)}
          placeholder="// Type or paste code here..."
          rows={Math.max(3, content.split('\n').length)}
          className="w-full bg-transparent resize-y border-none outline-none focus:ring-0 p-0 text-xs font-mono text-foreground placeholder-muted-foreground leading-relaxed font-medium"
          style={{ tabSize: 2 }}
        />
      </div>
    </div>
  );
};
