import React, { useState, useRef } from 'react';
import { useDocumentStore, ydoc, yblocks } from '@catnoted/editor';
import { UploadCloud, CheckCircle2, ArrowRight, AlertCircle } from 'lucide-react';
import { BlockNode } from '@catnoted/shared';

interface ImportViewProps {
  onNavigateToPage?: (id: string) => void;
}

export const ImportView: React.FC<ImportViewProps> = ({ onNavigateToPage }) => {
  const { createPage } = useDocumentStore();
  const [isDragActive, setIsDragActive] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [importedPageId, setImportedPageId] = useState<string | null>(null);
  const [importedPageTitle, setImportedPageTitle] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (file: File) => {
    const filename = file.name;
    const isMarkdown = filename.endsWith('.md') || filename.endsWith('.txt');
    const isJson = filename.endsWith('.json');

    if (!isMarkdown && !isJson) {
      setErrorMessage('Unsupported file format. Please upload a Markdown (.md) or JSON (.json) file.');
      setImportStatus('error');
      return;
    }

    try {
      const textContent = await file.text();

      if (isMarkdown) {
        // Parse Markdown
        const cleanTitle = filename.replace(/\.(md|txt)$/i, '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

        // 1. Create a new page
        const newPageId = createPage(cleanTitle, '📥');

        // 2. Parse lines into blocks
        const lines = textContent.split('\n');
        const parsedBlocks: BlockNode[] = [];
        let headingFound = false;
        let actualTitle = cleanTitle;

        lines.forEach((line) => {
          const trimmed = line.trim();
          if (!trimmed) return;

          // Check if heading
          if (trimmed.startsWith('#')) {
            const levelMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
            if (levelMatch) {
              const level = Math.min(6, levelMatch[1].length) as any;
              const content = levelMatch[2];

              if (level === 1 && !headingFound) {
                actualTitle = content;
                headingFound = true;
              }

              parsedBlocks.push({
                id: `block-${Math.random().toString(36).substring(2, 11)}`,
                type: 'heading',
                content,
                properties: { level },
                parentId: newPageId
              });
              return;
            }
          }

          // Check if quote
          if (trimmed.startsWith('>')) {
            const content = trimmed.slice(1).trim();
            parsedBlocks.push({
              id: `block-${Math.random().toString(36).substring(2, 11)}`,
              type: 'quote',
              content,
              parentId: newPageId
            });
            return;
          }

          // Check if todo
          if (trimmed.startsWith('- [ ]') || trimmed.startsWith('- [x]')) {
            const checked = trimmed.startsWith('- [x]');
            const content = trimmed.slice(5).trim();
            parsedBlocks.push({
              id: `block-${Math.random().toString(36).substring(2, 11)}`,
              type: 'todo',
              content,
              properties: { checked },
              parentId: newPageId
            });
            return;
          }

          // Check if list item
          if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
            const content = trimmed.slice(1).trim();
            parsedBlocks.push({
              id: `block-${Math.random().toString(36).substring(2, 11)}`,
              type: 'bullet',
              content,
              parentId: newPageId
            });
            return;
          }

          // Regular text block
          parsedBlocks.push({
            id: `block-${Math.random().toString(36).substring(2, 11)}`,
            type: 'text',
            content: trimmed,
            parentId: newPageId
          });
        });

        // Insert blocks into Yjs array
        ydoc.transact(() => {
          if (parsedBlocks.length > 0) {
            yblocks.insert(yblocks.length, parsedBlocks);
          } else {
            // Empty document fallback
            yblocks.insert(yblocks.length, [{
              id: `block-${Math.random().toString(36).substring(2, 11)}`,
              type: 'text',
              content: 'Successfully imported empty markdown note.',
              parentId: newPageId
            }]);
          }
        });

        setImportedPageId(newPageId);
        setImportedPageTitle(actualTitle);
        setImportStatus('success');
      } else if (isJson) {
        // Parse JSON workspace schema
        const parsed = JSON.parse(textContent);
        const title = parsed.title || 'Imported Workspace JSON';

        const newPageId = createPage(title, '⚙️');

        let importedCount = 0;
        const newBlocks: BlockNode[] = [];

        // Check for blocks array or widgets list
        const blocksList = parsed.blocks || parsed;
        if (Array.isArray(blocksList)) {
          blocksList.forEach((b: any) => {
            if (b.type) {
              newBlocks.push({
                id: `block-${Math.random().toString(36).substring(2, 11)}`,
                type: b.type,
                content: b.content || '',
                properties: b.properties || {},
                parentId: newPageId
              });
              importedCount++;
            }
          });
        }

        ydoc.transact(() => {
          if (newBlocks.length > 0) {
            yblocks.insert(yblocks.length, newBlocks);
          } else {
            yblocks.insert(yblocks.length, [{
              id: `block-${Math.random().toString(36).substring(2, 11)}`,
              type: 'text',
              content: 'No valid JSON blocks found. File parsed successfully.',
              parentId: newPageId
            }]);
          }
        });

        setImportedPageId(newPageId);
        setImportedPageTitle(title);
        setImportStatus('success');
      }
    } catch (e: any) {
      setErrorMessage(`Failed to parse file: ${e.message}`);
      setImportStatus('error');
    }
  };

  const handleBrowseFiles = () => {
    fileInputRef.current?.click();
  };

  const resetUploader = () => {
    setImportStatus('idle');
    setImportedPageId(null);
    setImportedPageTitle('');
    setErrorMessage('');
  };

  return (
    <div className="h-full w-full bg-slate-50 dark:bg-[#141416] p-6 md:p-8 overflow-y-auto select-text">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-850 pb-4 shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <UploadCloud className="w-6 h-6 text-indigo-500" />
              Import Documents
            </h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              Upload your Markdown files or workspace JSON catalogs to dynamically build and populate your editor pages.
            </p>
          </div>
        </div>

        {importStatus === 'idle' && (
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`p-12 border-2 border-dashed rounded-3xl text-center flex flex-col items-center justify-center gap-4 transition-all min-h-[320px] bg-white dark:bg-[#16161a] ${
              isDragActive
                ? 'border-indigo-500 bg-indigo-500/5 dark:bg-indigo-500/10 scale-98 shadow-inner shadow-indigo-500/5'
                : 'border-slate-250 dark:border-zinc-800 hover:border-slate-350 dark:hover:border-zinc-700'
            }`}
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform ${isDragActive ? 'scale-110 text-indigo-500 bg-indigo-50' : 'text-slate-400 bg-slate-50 dark:bg-zinc-850'}`}>
              <UploadCloud className="w-8 h-8" />
            </div>

            <div className="space-y-1.5 max-w-md">
              <h3 className="text-base font-bold text-slate-800 dark:text-zinc-200">
                Drag and drop your file here, or{' '}
                <button
                  type="button"
                  onClick={handleBrowseFiles}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                >
                  browse files
                </button>
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Supports standard Markdown (<code>.md</code>, <code>.txt</code>) or JSON workspace files (<code>.json</code>).
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".md,.txt,.json"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        )}

        {importStatus === 'success' && (
          <div className="p-8 bg-white dark:bg-[#16161a] border border-slate-200 dark:border-zinc-800 rounded-3xl flex flex-col items-center text-center gap-5 shadow-lg animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-100">Document Imported Successfully!</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                We successfully parsed and created a new editor page titled: <strong className="text-indigo-600 dark:text-indigo-400 font-bold">"{importedPageTitle}"</strong>.
              </p>
            </div>
            <div className="flex gap-3 mt-2">
              <button
                type="button"
                onClick={resetUploader}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-850 transition-colors"
              >
                Import another file
              </button>
              <button
                type="button"
                onClick={() => onNavigateToPage?.(importedPageId!)}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all flex items-center gap-1.5 shadow-md shadow-blue-600/10"
              >
                Open imported page
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {importStatus === 'error' && (
          <div className="p-8 bg-white dark:bg-[#16161a] border border-rose-200 dark:border-rose-950/30 rounded-3xl flex flex-col items-center text-center gap-5 shadow-lg animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-9 h-9" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-100">Import Failed</h3>
              <p className="text-xs text-rose-600 dark:text-rose-400 max-w-md">
                {errorMessage}
              </p>
            </div>
            <button
              type="button"
              onClick={resetUploader}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-800 dark:hover:bg-zinc-750 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
