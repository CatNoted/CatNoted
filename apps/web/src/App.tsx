import React, { useState, useEffect } from 'react';
import { AppLayout, ActiveMode } from './layouts/AppLayout.js';
import { DocumentEditor, useDocumentStore } from '@catnoted/editor';
import { JournalsView } from './pages/Journals/JournalsView.js';
import { InfiniteCanvas } from '@catnoted/canvas';
import { GraphView, parseDocumentGraph } from '@catnoted/graph';
import { ydoc } from '@catnoted/editor';
import * as Y from 'yjs';
import { Share2, Edit2, BookOpen, LayoutGrid, Settings, Search, FileText } from 'lucide-react';

// E2EE sync utilities
import { encryptPayload, decryptPayload } from './utils/crypto.js';
import { mockSyncChannel } from './utils/supabase.js';
import { usePersistence } from './utils/sync/persistence.js';

// Modals & Panels
import { AuthModal } from './components/auth/AuthModal.js';
import { SettingsModal } from './components/settings/SettingsModal.js';
import { CommandPalette } from './components/CommandPalette.js';

const getModeFromPath = (path: string): ActiveMode => {
  const searchParams = new URLSearchParams(window.location.search);
  if (searchParams.has('date')) return 'journals';
  if (path.startsWith('/canvas')) return 'canvas';
  if (path.startsWith('/graph')) return 'graph';
  if (path.startsWith('/settings')) return 'settings';
  if (path.startsWith('/journals')) return 'journals';
  if (path.startsWith('/search')) return 'search';
  return 'doc';
};

function encodeBase64(bytes: Uint8Array): string {
  const binString = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
  return btoa(binString);
}

function decodeBase64(base64: string): Uint8Array {
  const binString = atob(base64);
  return Uint8Array.from(binString, (m) => m.codePointAt(0)!);
}

const App: React.FC = () => {
  const [activeMode, setActiveMode] = useState<ActiveMode>(() => {
    return getModeFromPath(window.location.pathname);
  });
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [isZenMode, setIsZenMode] = useState<boolean>(false);
  const [activePage, setActivePage] = useState<string>('root-doc-node');
  const [searchQuery, setSearchQuery] = useState('');

  const [openaiKey, setOpenaiKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');

  const { blocks: rootBlocks, pages, addBlock: addRootBlock, updateBlockContent: updateRootBlockContent } = useDocumentStore('root-doc-node');
  const { blocks: activeBlocks, updateBlockContent: updateActiveBlockContent } = useDocumentStore(activePage);

  const graphData = React.useMemo(() => parseDocumentGraph(rootBlocks, pages), [rootBlocks, pages]);

  const parsedGraphNodes = React.useMemo(() => {
    return parseDocumentGraph(rootBlocks, pages).nodes;
  }, [rootBlocks, pages]);

  const searchResults = React.useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    const results: Array<{ id: string; type: string; content: string; icon: any }> = [];

    // Search in headings / text blocks
    rootBlocks.forEach(block => {
      if ((block.type === 'heading' || block.type === 'text') && block.content.toLowerCase().includes(query)) {
        results.push({
          id: block.id,
          type: block.type,
          content: block.content,
          icon: FileText
        });
      }
    });

    // Search in graph nodes (pages/tags)
    parsedGraphNodes.forEach(node => {
      if (node.label.toLowerCase().includes(query) && node.id !== 'root-doc-node') {
        const cleanedLabel = node.label.replace(/[📄#]/g, '').trim();
        if (!results.some(r => r.content.includes(cleanedLabel))) {
          results.push({
            id: node.id,
            type: node.type,
            content: node.label,
            icon: FileText
          });
        }
      }
    });

    return results;
  }, [rootBlocks, parsedGraphNodes, searchQuery]);

  const activeHeading = activeBlocks.find(b => b.type === 'heading' && b.properties?.level === 1);
  const docTitle = activeHeading?.content || 'Untitled Document';

  const activePageNode = graphData.nodes.find((n: any) => n.id === activePage);
  const pageTitle = activePage === 'root-doc-node'
    ? docTitle
    : (activePageNode
        ? (activePageNode.label.startsWith('📁 ') || activePageNode.label.startsWith('📄 ') ? activePageNode.label.slice(2) : activePageNode.label)
        : activePage);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState('');

  useEffect(() => {
    if (!isEditingTitle) {
      setEditTitleValue(pageTitle);
    }
  }, [pageTitle, isEditingTitle]);

  const handleRenamePage = (oldTitle: string, newTitle: string) => {
    if (activePage === 'root-doc-node') return;
    if (!oldTitle.trim() || !newTitle.trim() || oldTitle === newTitle) return;

    const targetBlock = rootBlocks.find(b => b.content.includes(`[[${oldTitle}]]`));
    if (targetBlock) {
      const updatedContent = targetBlock.content.replace(`[[${oldTitle}]]`, `[[${newTitle}]]`);
      updateRootBlockContent(targetBlock.id, updatedContent);
    }

    const oldPageId = activePage;
    const newPageId = `page-${newTitle.toLowerCase().replace(/\s+/g, '-')}`;

    const oldYarr = ydoc.getArray<any>(`blocks:${oldPageId}`);
    const newYarr = ydoc.getArray<any>(`blocks:${newPageId}`);

    ydoc.transact(() => {
      if (newYarr.length === 0 && oldYarr.length > 0) {
        newYarr.insert(0, oldYarr.toArray());
        oldYarr.delete(0, oldYarr.length);
      }
    });

    setActivePage(newPageId);
  };

  const handleSaveTitle = () => {
    setIsEditingTitle(false);
    if (editTitleValue.trim()) {
      if (activePage === 'root-doc-node') {
        if (activeHeading) {
          updateActiveBlockContent(activeHeading.id, editTitleValue);
        } else {
          const firstBlock = activeBlocks[0];
          if (firstBlock) {
            updateActiveBlockContent(firstBlock.id, editTitleValue);
          }
        }
      } else {
        const oldTitle = pageTitle;
        const newTitle = editTitleValue.trim();
        if (oldTitle !== newTitle) {
          if (activeHeading) {
            updateActiveBlockContent(activeHeading.id, newTitle);
          }
          handleRenamePage(oldTitle, newTitle);
        }
      }
    }
  };

  const handleCreatePage = () => {
    const existingTitles = graphData.nodes
      .filter((n: any) => n.type === 'page')
      .map((n: any) => (n.label.startsWith('📁 ') || n.label.startsWith('📄 ') ? n.label.slice(2) : n.label));

    let index = 1;
    let newTitle = `Untitled Page ${index}`;
    while (existingTitles.includes(newTitle)) {
      index++;
      newTitle = `Untitled Page ${index}`;
    }

    addRootBlock(null, 'text', `[[${newTitle}]]`);
    const pageId = `page-${newTitle.toLowerCase().replace(/\s+/g, '-')}`;
    setActivePage(pageId);
    setActiveMode('doc');
  };

  const [passphrase, setPassphrase] = useState('');
  const [userEmail, setUserEmail] = useState('guest@catnoted.com');

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  useEffect(() => {
    const handlePopState = () => {
      const mode = getModeFromPath(window.location.pathname);
      setActiveMode(mode);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const savedPassphrase = localStorage.getItem('catnoted_e2ee_passphrase');
    if (savedPassphrase) {
      setPassphrase(savedPassphrase);
    }
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  useEffect(() => {
    if (activeMode !== 'settings' || !passphrase) return;

    const loadKey = async (keyName: string, setter: (val: string) => void) => {
      const encryptedBase64 = sessionStorage.getItem(keyName);
      if (encryptedBase64) {
        try {
          const encryptedBytes = decodeBase64(encryptedBase64);
          const decryptedBytes = await decryptPayload(encryptedBytes, passphrase);
          const decryptedString = new TextDecoder().decode(decryptedBytes);
          setter(decryptedString);
        } catch (e) {
          console.error(`Failed to decrypt ${keyName}`, e);
          setter('');
        }
      } else {
        setter('');
      }
    };

    const ollamaHost = sessionStorage.getItem('byok_ollama_url') || 'http://localhost:11434';
    setOllamaUrl(ollamaHost);

    loadKey('byok_openai_key', setOpenaiKey);
    loadKey('byok_gemini_key', setGeminiKey);
    loadKey('byok_anthropic_key', setAnthropicKey);
  }, [activeMode, passphrase]);

  const { status, conflictMsg, dismissConflict, persistUpdate } = usePersistence();

  useEffect(() => {
    const handleUpdate = async (update: Uint8Array, origin: any) => {
      if (!passphrase || origin === 'remote-sync') return;
      try {
        const encrypted = await encryptPayload(update, passphrase);
        const payloadArray = Array.from(encrypted);
        mockSyncChannel.broadcast({ id: Math.random().toString(36).substring(2), sender: 'local-tab', payload: payloadArray });
        persistUpdate(payloadArray);
      } catch (e) {
        console.error('Encryption failed during local Yjs update:', e);
      }
    };

    ydoc.on('update', handleUpdate);
    return () => {
      ydoc.off('update', handleUpdate);
    };
  }, [passphrase, persistUpdate]);

  useEffect(() => {
    if (!passphrase) return;
    const unsubscribe = mockSyncChannel.subscribe(async (msg) => {
      if (msg.sender === 'local-tab') return;
      try {
        const decryptedBytes = await decryptPayload(new Uint8Array(msg.payload), passphrase);
        Y.applyUpdate(ydoc, decryptedBytes, 'remote-sync');
      } catch (e) {
        console.warn('Decryption failed for incoming sync update. Passphrase may be mismatched.', e);
      }
    });
    return () => {
      unsubscribe();
    };
  }, [passphrase]);

  const handleModeChange = (mode: ActiveMode) => {
    setActiveMode(mode);
    let path = '/';
    if (mode !== 'doc') {
      path = `/${mode}`;
    }
    if (mode === 'journals') {
      const searchParams = new URLSearchParams(window.location.search);
      const date = searchParams.get('date');
      path = date ? `/journals?date=${date}` : '/journals';
    }
    if (window.location.pathname + window.location.search !== path) {
      window.history.pushState(null, '', path);
    }
  };

  const { pageMeta, updatePageMeta, deletePage } = useDocumentStore(activePage);
  const [showPageMenu, setShowPageMenu] = useState(false);

  const handleExportMarkdown = () => {
    const markdownContent = activeBlocks
      .map((b) => {
        if (b.type === 'heading') return `${'#'.repeat(b.properties?.level || 1)} ${b.content}`;
        if (b.type === 'bullet') return `- ${b.content}`;
        if (b.type === 'ordered') return `1. ${b.content}`;
        if (b.type === 'todo') return `- [${b.properties?.checked ? 'x' : ' '}] ${b.content}`;
        if (b.type === 'quote') return `> ${b.content}`;
        if (b.type === 'code') return `\`\`\`${b.properties?.language || ''}\n${b.content}\n\`\`\``;
        if (b.type === 'callout') return `> ${b.properties?.calloutIcon || '💡'} ${b.content}`;
        if (b.type === 'divider') return `---`;
        return b.content;
      })
      .join('\n\n');

    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${pageTitle.toLowerCase().replace(/\s+/g, '-')}.md`;
    link.click();
    URL.revokeObjectURL(url);
    setShowPageMenu(false);
  };

  const renderTopBar = () => {
    const breadcrumbs = (
      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
        <span className="text-xs font-medium text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 transition-colors cursor-pointer">
          Workspace
        </span>
        <span className="text-slate-300 dark:text-zinc-600 font-light select-none">/</span>
        {activePage !== 'root-doc-node' && (
          <>
            <button
              type="button"
              onClick={() => setActivePage('root-doc-node')}
              className="text-xs font-medium text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 transition-colors shrink-0"
              title="Back to root note"
            >
              Root
            </button>
            <span className="text-slate-300 dark:text-zinc-600 font-light select-none">/</span>
          </>
        )}
      </div>
    );

    const titleField = isEditingTitle ? (
      <input
        type="text"
        value={editTitleValue}
        onChange={(e) => setEditTitleValue(e.target.value)}
        onBlur={handleSaveTitle}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSaveTitle();
          if (e.key === 'Escape') {
            setEditTitleValue(pageTitle);
            setIsEditingTitle(false);
          }
        }}
        className="px-2 py-0.5 border border-indigo-400 dark:border-indigo-500 rounded bg-slate-50 dark:bg-zinc-850 text-xs font-semibold text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-36 sm:w-48"
        autoFocus
      />
    ) : (
      <div className="flex items-center gap-1.5 group/title min-w-0 truncate">
        <span
          onDoubleClick={() => setIsEditingTitle(true)}
          className="text-xs font-semibold text-slate-800 dark:text-zinc-200 truncate cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800/60 px-1.5 py-0.5 rounded transition-colors"
          title="Double click to edit title"
        >
          {pageTitle}
        </span>
        <button
          type="button"
          onClick={() => setIsEditingTitle(true)}
          className="inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 p-0.5 opacity-0 group-hover/title:opacity-100"
          title="Edit page title"
        >
          <Edit2 className="w-3 h-3" />
        </button>
      </div>
    );

    const left = (
      <div className="flex items-center gap-2 min-w-0">
        {breadcrumbs}
        <div className="min-w-0 truncate">{titleField}</div>
      </div>
    );

    const modeSwitcher = (
      <div className="flex items-center rounded-xl border border-slate-200/60 dark:border-zinc-800/60 bg-slate-50/90 dark:bg-zinc-800/70 p-0.5">
        {[
          { id: 'doc', label: 'Doc', icon: BookOpen },
          { id: 'canvas', label: 'Canvas', icon: LayoutGrid },
        ].map((modeItem) => {
          const IconComponent = modeItem.icon;
          const isSelected = activeMode === modeItem.id;
          return (
            <button
              key={modeItem.id}
              type="button"
              onClick={() => handleModeChange(modeItem.id as ActiveMode)}
              className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all duration-150 ${
                isSelected
                  ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm shadow-indigo-500/5 font-semibold'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
              }`}
            >
              <IconComponent className="w-3.5 h-3.5" />
              <span>{modeItem.label}</span>
            </button>
          );
        })}
      </div>
    );

    const actions = (
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => updatePageMeta({ isFavorite: !pageMeta?.isFavorite })}
          className={`inline-flex items-center justify-center rounded-lg p-1.5 border transition-colors ${
            pageMeta?.isFavorite
              ? 'border-transparent bg-amber-400/10 text-amber-500'
              : 'border-transparent text-slate-400 hover:text-amber-500 hover:bg-slate-50 dark:hover:bg-[#16161a]'
          }`}
          title={pageMeta?.isFavorite ? 'Unstar page' : 'Star page'}
        >
          <span className="text-xs">⭐</span>
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowPageMenu(!showPageMenu)}
            className="inline-flex items-center justify-center rounded-lg p-1.5 border border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 hover:bg-slate-50 dark:hover:bg-[#16161a] transition-colors"
            title="Page options"
          >
            <span className="text-xs font-bold px-1">•••</span>
          </button>
          {showPageMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl z-50 py-2 text-xs select-none">
              <div className="px-3 pb-2 mb-1 border-b border-slate-100 dark:border-zinc-800">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  Font Style
                </p>
                <div className="grid grid-cols-3 gap-1 mt-1">
                  {['sans', 'serif', 'mono'].map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => updatePageMeta({ fontStyle: f as any })}
                      className={`py-1 rounded text-center transition-colors ${
                        pageMeta?.fontStyle === f || (!pageMeta?.fontStyle && f === 'sans')
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200'
                      }`}
                    >
                      {f[0].toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="px-1 py-1">
                <button
                  type="button"
                  onClick={() => updatePageMeta({ fullWidth: !pageMeta?.fullWidth })}
                  className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg text-slate-700 dark:text-zinc-300"
                >
                  <span>Full Width Page</span>
                  <span className="text-xs">{pageMeta?.fullWidth ? '✓' : ''}</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportMarkdown}
                  className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-lg"
                >
                  <span>Export Markdown (.md)</span>
                </button>
                <div className="my-1 border-t border-slate-100 dark:border-zinc-800" />
                {activePage !== 'root-doc-node' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Delete page "${pageTitle}"?`)) {
                        deletePage(activePage);
                        setActivePage('root-doc-node');
                        setShowPageMenu(false);
                      }
                    }}
                    className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-medium rounded-lg"
                  >
                    Delete Page
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            const link = `${window.location.origin}/space/${userEmail || 'guest'}`;
            navigator.clipboard.writeText(link)
              .then(() => alert(`Share Link copied to clipboard:\n${link}\n\n(Anyone with this link and the workspace passphrase can access the E2EE sync room)`))
              .catch((err) => {
                console.error('Failed to copy link: ', err);
                alert(`Share Link generated:\n${link}\n\n(Anyone with this link and the workspace passphrase can access the E2EE sync room)`);
              });
          }}
          className="inline-flex items-center justify-center rounded-lg gap-1.5 p-1.5 border border-transparent hover:bg-slate-50 dark:hover:bg-[#16161a] text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          title="Share document link"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span className="text-[10px] font-semibold hidden md:inline">Share</span>
        </button>

        <button
          type="button"
          onClick={() => setIsAuthOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg px-2 py-1 hover:bg-slate-50 dark:hover:bg-zinc-850 text-xs font-medium text-slate-600 dark:text-zinc-300 border border-transparent hover:border-slate-200/60 dark:hover:border-zinc-800/60"
          title="Auth Settings"
        >
          <span className="w-5 h-5 rounded-full bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
            {userEmail.charAt(0).toUpperCase()}
          </span>
          <span className="max-w-[100px] truncate text-[10px] font-semibold hidden sm:inline">{userEmail}</span>
        </button>
      </div>
    );

    const syncStatus =
      status === 'saving'
        ? (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Saving...
            </span>
          )
        : status === 'saved'
          ? (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Saved
              </span>
            )
          : status === 'offline'
            ? (
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                  Offline
                </span>
              )
            : null;

    const right = (
      <div className="flex items-center gap-4 sm:gap-5">
        {syncStatus}
        {actions}
      </div>
    );

    return (
      <header className="h-14 px-4 sm:px-6 border-b border-slate-200/60 dark:border-zinc-800/60 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md flex items-center justify-between z-20 shrink-0 w-full select-none">
        {left}
        {modeSwitcher}
        {right}
      </header>
    );
  };

  const handleSaveSettingsPage = async () => {
    const saveKey = async (keyName: string, value: string) => {
      if (value) {
        try {
          const valueBytes = new TextEncoder().encode(value);
          const encryptedBytes = await encryptPayload(valueBytes, passphrase);
          const encryptedBase64 = encodeBase64(encryptedBytes);
          sessionStorage.setItem(keyName, encryptedBase64);
        } catch (e) {
          console.error(`Failed to encrypt ${keyName}`, e);
        }
      } else {
        sessionStorage.removeItem(keyName);
      }
    };

    await saveKey('byok_openai_key', openaiKey);
    await saveKey('byok_gemini_key', geminiKey);
    await saveKey('byok_anthropic_key', anthropicKey);
    sessionStorage.setItem('byok_ollama_url', ollamaUrl);

    if (passphrase) {
      localStorage.setItem('catnoted_e2ee_passphrase', passphrase);
    }
    alert('Settings saved successfully!');
  };

  const renderActiveView = () => {
    switch (activeMode) {
      case 'doc':
        return (
          <div className="h-full overflow-auto">
            <DocumentEditor activePage={activePage} onRenamePage={handleRenamePage} onPageSelect={setActivePage} />
          </div>
        );
      case 'canvas':
        return (
          <div className="h-full overflow-auto p-6">
            <InfiniteCanvas />
          </div>
        );
      case 'graph':
        return (
          <div className="h-full overflow-hidden">
            <GraphView onNavigateToNode={(nodeId) => { setActivePage(nodeId); handleModeChange('doc'); }} />
          </div>
        );
      case 'journals':
        return (
          <div className="h-full overflow-hidden">
            <JournalsView />
          </div>
        );
      case 'settings':
        return (
          <div className="h-full overflow-auto p-6 max-w-4xl mx-auto flex flex-col gap-6 select-none">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-zinc-100 flex items-center gap-2">
              <Settings className="w-6 h-6 text-indigo-500" /> Settings
            </h1>
            <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
              <p className="text-xs leading-relaxed text-slate-500 dark:text-zinc-400 mb-6">
                Use your own LLM API keys and configure end-to-end encryption. Settings are stored securely in your browser and never touch CatNoted servers.
              </p>

              {/* Settings Form */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Security & Encryption</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                    <label className="text-xs font-medium text-slate-600 dark:text-zinc-300">E2EE Passphrase</label>
                    <div className="sm:col-span-2">
                      <input
                        type="password"
                        value={passphrase}
                        onChange={(e) => {
                          setPassphrase(e.target.value);
                          localStorage.setItem('catnoted_e2ee_passphrase', e.target.value);
                        }}
                        placeholder="Insert secure E2EE passphrase..."
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/30 dark:bg-[#16161a]/30 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-zinc-800 pt-6 space-y-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Provider Credentials</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                      <label className="text-xs font-medium text-slate-600 dark:text-zinc-300">OpenAI Key</label>
                      <div className="sm:col-span-2">
                        <input
                          type="password"
                          value={openaiKey}
                          onChange={(e) => setOpenaiKey(e.target.value)}
                          placeholder="sk-..."
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/30 dark:bg-[#16161a]/30 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                      <label className="text-xs font-medium text-slate-600 dark:text-zinc-300">Gemini Key</label>
                      <div className="sm:col-span-2">
                        <input
                          type="password"
                          value={geminiKey}
                          onChange={(e) => setGeminiKey(e.target.value)}
                          placeholder="AIzaSy..."
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/30 dark:bg-[#16161a]/30 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                      <label className="text-xs font-medium text-slate-600 dark:text-zinc-300">Anthropic Key</label>
                      <div className="sm:col-span-2">
                        <input
                          type="password"
                          value={anthropicKey}
                          onChange={(e) => setAnthropicKey(e.target.value)}
                          placeholder="sk-ant-..."
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/30 dark:bg-[#16161a]/30 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                      <label className="text-xs font-medium text-slate-600 dark:text-zinc-300">Ollama Host URL</label>
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          value={ollamaUrl}
                          onChange={(e) => setOllamaUrl(e.target.value)}
                          placeholder="http://localhost:11434"
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/30 dark:bg-[#16161a]/30 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveSettingsPage}
                    className="inline-flex h-9 items-center justify-center rounded-xl px-4 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-sm"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      case 'search':
        return (
          <div className="h-full overflow-auto p-6 max-w-4xl mx-auto flex flex-col gap-6">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-zinc-100 flex items-center gap-2 select-none">
              <Search className="w-6 h-6 text-indigo-500" /> Search Workspace
            </h1>
            <div className="relative">
              <Search className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400 dark:text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search text, headings, pages or tags..."
                className="w-full pl-11 pr-4 py-3 border border-slate-200/80 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                autoFocus
              />
            </div>

            <div className="flex-1 min-h-0">
              {searchQuery.trim() === '' ? (
                <div className="text-center py-12 text-slate-400 dark:text-zinc-500">
                  Type something above to search your workspace.
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-12 text-slate-400 dark:text-zinc-500">
                  No results found for "{searchQuery}".
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-slate-400 dark:text-zinc-500 mb-4 font-semibold select-none">
                    Found {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'}
                  </p>
                  {searchResults.map((result) => {
                    return (
                      <button
                        key={result.id}
                        onClick={() => {
                          if (result.type === 'page' || result.type === 'tag') {
                            setActivePage(result.id);
                            handleModeChange('doc');
                          } else {
                            // Text block or heading block search
                            setActivePage('root-doc-node');
                            handleModeChange('doc');
                            setTimeout(() => {
                              const el = document.getElementById(result.id);
                              if (el) {
                                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              }
                            }, 100);
                          }
                        }}
                        className="w-full text-left p-4 rounded-xl border border-slate-150 dark:border-zinc-850 bg-white dark:bg-zinc-900/60 hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition-colors flex items-start gap-3 group"
                      >
                        <div className="p-2 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-500 group-hover:text-indigo-500 transition-colors shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 select-none uppercase tracking-wider mb-1">
                            {result.type}
                          </p>
                          <p className="text-sm text-slate-800 dark:text-zinc-200 font-medium truncate">
                            {result.content}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const renderViewport = () => (
    <div className="flex-1 overflow-hidden h-full w-full">
      {renderActiveView()}
    </div>
  );

  return (
    <>
      <AppLayout
        activeMode={activeMode}
        onModeChange={handleModeChange}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode(!isDarkMode)}
        zenMode={isZenMode}
        activePage={activePage}
        onPageSelect={setActivePage}
        pageTitle={pageTitle}
        userEmail={userEmail}
        onAuthTrigger={() => setIsAuthOpen(true)}
        onCreatePage={handleCreatePage}
      >
        <div className="flex flex-col h-full w-full overflow-hidden">
          {renderTopBar()}
          {renderViewport()}
        </div>
      </AppLayout>

      {status === 'conflict' && conflictMsg ? (
        <div className="fixed bottom-4 right-4 max-w-sm w-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 shadow-lg rounded-2xl p-4 z-50 flex items-start gap-3 backdrop-blur-sm animate-in slide-in-from-bottom-5">
          <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center shrink-0">
            <span className="text-rose-600 dark:text-rose-400 font-bold">!</span>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-rose-800 dark:text-rose-300">Sync Conflict</h4>
            <p className="text-xs text-rose-600/80 dark:text-rose-400/80 mt-1 break-words">{conflictMsg}</p>
          </div>
          <button
            onClick={dismissConflict}
            className="inline-flex items-center justify-center rounded-lg p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-100 dark:hover:bg-rose-900/50"
          >
            <span className="leading-none">✕</span>
          </button>
        </div>
      ) : null}

      <div data-root-modals="root">
        <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onAuthSuccess={setUserEmail} userEmail={userEmail} />
        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} passphrase={passphrase} onPassphraseChange={setPassphrase} />
        <CommandPalette
          isOpen={isPaletteOpen}
          onClose={() => setIsPaletteOpen(false)}
          onModeSelect={handleModeChange}
          onToggleTheme={() => setIsDarkMode(!isDarkMode)}
          onToggleZen={() => setIsZenMode((prev) => !prev)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          isDarkMode={isDarkMode}
        />
      </div>
    </>
  );
};

export default App;
