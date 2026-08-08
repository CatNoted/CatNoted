import React, { useState, useEffect } from 'react';
import { AppLayout, ActiveMode } from './layouts/AppLayout.js';
import { DocumentEditor, useDocumentStore } from '@catnoted/editor';
import { JournalsView } from './pages/Journals/JournalsView.js';
import { InfiniteCanvas } from '@catnoted/canvas';
import { GraphView, parseDocumentGraph } from '@catnoted/graph';
import { AllDocsView } from './pages/AllDocs/AllDocsView';
import { ydoc } from '@catnoted/editor';
import * as Y from 'yjs';
import { Share2, Edit2, BookOpen, LayoutGrid } from 'lucide-react';

// E2EE sync utilities
import { encryptPayload, decryptPayload } from './utils/crypto.js';
import { mockSyncChannel } from './utils/supabase.js';
import { usePersistence } from './utils/sync/persistence.js';

// Modals & Panels
import { AuthModal } from './components/auth/AuthModal.js';
import { SettingsModal } from './components/settings/SettingsModal.js';
import { CommandPalette } from './components/CommandPalette.js';
import { useToast } from './components/primitives/Toast.js';

const App: React.FC = () => {
  const { toast } = useToast();
  const resolveRouteToMode = (): ActiveMode => {
    const path = window.location.pathname;
    if (path === '/') return 'doc';
    const mode = path.slice(1) as ActiveMode;
    // Handle valid modes or fallback
    const validModes: ActiveMode[] = ['doc', 'canvas', 'graph', 'journals', 'settings', 'search', 'trash', 'collections', 'tags', 'import', 'template'];
    return validModes.includes(mode) ? mode : 'doc';
  };

  const [activeMode, setActiveMode] = useState<ActiveMode>(resolveRouteToMode);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [isZenMode, setIsZenMode] = useState<boolean>(false);
  const [activePage, setActivePage] = useState<string>('root-doc-node');

  const { blocks: rootBlocks, pages, deletedPages, addBlock: addRootBlock } = useDocumentStore('root-doc-node');
  const { blocks: activeBlocks, updateBlockContent: updateActiveBlockContent, renamePage } = useDocumentStore(activePage);

  const graphData = React.useMemo(() => {
    const deletedSet = new Set((deletedPages || []).map(p => p.id));
    return parseDocumentGraph(rootBlocks, pages, deletedSet);
  }, [rootBlocks, pages, deletedPages]);

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

  useEffect(() => {
    const handlePopState = () => {
      const mode = resolveRouteToMode();

      if (mode === 'settings') {
        setIsSettingsOpen(true);
        setIsPaletteOpen(false);
        setActiveMode('doc'); // temporary set to doc
      } else if (mode === 'search') {
        setIsPaletteOpen(true);
        setIsSettingsOpen(false);
        setActiveMode('doc');
      } else {
        setIsSettingsOpen(false);
        setIsPaletteOpen(false);
        setActiveMode(mode);
      }
    };

    // Check initial route
    handlePopState();

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleRenamePage = (oldTitle: string, newTitle: string) => {
    if (activePage === 'root-doc-node') return;
    if (!oldTitle.trim() || !newTitle.trim() || oldTitle === newTitle) return;

    const newPageId = renamePage(activePage, newTitle);
    if (newPageId) {
      setActivePage(newPageId);
    }
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
    const searchParams = new URLSearchParams(window.location.search);
    const hasDate = searchParams.has('date');
    const isJournalsPath = window.location.pathname.startsWith('/journals');
    if (hasDate || isJournalsPath) {
      setActiveMode('journals');
    }
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

  const { status, conflictMsg, dismissConflict, resolveConflict, persistUpdate } = usePersistence();

  useEffect(() => {
    const handleUpdate = async (update: Uint8Array, origin: any) => {
      if (!passphrase || origin === 'remote-sync') return;
      try {
        const encrypted = await encryptPayload(update, passphrase);
        const payloadArray = Array.from(encrypted);
        mockSyncChannel.broadcast({ id: Math.random().toString(36).substring(2), sender: 'local-tab', payload: payloadArray });
        persistUpdate(payloadArray);
      } catch (e) {
        console.error('Encryption failed during local Yjs update');
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
        console.warn('Decryption failed for incoming sync update. Passphrase may be mismatched.');
      }
    });
    return () => {
      unsubscribe();
    };
  }, [passphrase]);

  const handleModeChange = (mode: ActiveMode) => {
    const newPath = mode === 'doc' ? '/' : `/${mode}`;
    if (window.location.pathname !== newPath) {
      window.history.pushState(null, '', newPath);
      window.dispatchEvent(new PopStateEvent('popstate'));
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
        <span className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
          Workspace
        </span>
        <span className="text-border font-light select-none">/</span>
        {activePage !== 'root-doc-node' && (
          <>
            <button
              type="button"
              onClick={() => setActivePage('root-doc-node')}
              className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors shrink-0"
              title="Back to root note"
            >
              Root
            </button>
            <span className="text-border font-light select-none">/</span>
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
        className="px-2 py-0.5 border border-accent rounded bg-secondary text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-accent w-36 sm:w-48"
        autoFocus
      />
    ) : (
      <div className="flex items-center gap-1.5 group/title min-w-0">
        <span
          onDoubleClick={() => setIsEditingTitle(true)}
          className="text-xs font-semibold text-foreground truncate min-w-0 flex-1 cursor-pointer hover:bg-secondary/60 px-1.5 py-0.5 rounded transition-colors"
          title="Double click to edit title"
        >
          {pageTitle}
        </span>
        <button
          type="button"
          onClick={() => setIsEditingTitle(true)}
          className="inline-flex items-center justify-center rounded-lg text-muted-foreground hover:text-accent hover:bg-secondary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent p-0.5 opacity-0 group-hover/title:opacity-100"
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
      <div className="flex items-center rounded-xl border border-border/60 bg-secondary/90 p-0.5">
        {[
          { id: 'doc', label: 'Doc', icon: BookOpen },
          { id: 'canvas', label: 'Canvas', icon: LayoutGrid },
        ].map((modeItem) => {
          const IconComponent = modeItem.icon;
          const isSelected = window.location.pathname === (modeItem.id === 'doc' ? '/' : `/${modeItem.id}`) || activeMode === modeItem.id;
          return (
            <button
              key={modeItem.id}
              type="button"
              onClick={() => handleModeChange(modeItem.id as ActiveMode)}
              className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all duration-150 ${
                isSelected
                  ? 'bg-background text-accent shadow-sm shadow-accent/5 font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
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
              ? 'border-transparent bg-warning-soft text-warning'
              : 'border-transparent text-muted-foreground hover:text-warning hover:bg-secondary'
          }`}
          title={pageMeta?.isFavorite ? 'Unstar page' : 'Star page'}
        >
          <span className="text-xs">⭐</span>
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowPageMenu(!showPageMenu)}
            className="inline-flex items-center justify-center rounded-lg p-1.5 border border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title="Page options"
          >
            <span className="text-xs font-bold px-1">•••</span>
          </button>
          {showPageMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-2xl shadow-2xl z-50 py-2 text-xs select-none">
              <div className="px-3 pb-2 mb-1 border-b border-border">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
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
                          ? 'bg-accent text-white font-bold'
                          : 'bg-secondary text-muted-foreground hover:bg-accent'
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
                  className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-secondary rounded-lg text-foreground"
                >
                  <span>Full Width Page</span>
                  <span className="text-xs">{pageMeta?.fullWidth ? '✓' : ''}</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportMarkdown}
                  className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-secondary text-foreground rounded-lg"
                >
                  <span>Export Markdown (.md)</span>
                </button>
                <div className="my-1 border-t border-border" />
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
                    className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-destructive/10 hover:dark:bg-destructive/40 text-destructive-foreground font-medium rounded-lg"
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
              .then(() => toast(`Share Link copied to clipboard! (Workspace passphrase required for E2EE room sync)`, { variant: 'success' }))
              .catch(() => {
                console.error('Failed to copy link');
                toast(`Share Link generated: ${link}. Anyone with the passphrase can join.`, { variant: 'warning' });
              });
          }}
          className="inline-flex items-center justify-center rounded-lg gap-1.5 p-1.5 border border-transparent hover:bg-secondary text-muted-foreground hover:text-accent transition-colors"
          title="Share document link"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span className="text-[10px] font-semibold hidden md:inline">Share</span>
        </button>

        <button
          type="button"
          onClick={() => setIsAuthOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg px-2 py-1 hover:bg-secondary text-xs font-medium text-muted-foreground border border-transparent hover:border-border/60"
          title="Auth Settings"
        >
          <span className="w-5 h-5 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
            {userEmail.charAt(0).toUpperCase()}
          </span>
          <span className="max-w-[100px] truncate min-w-0 text-[10px] font-semibold hidden sm:inline">{userEmail}</span>
        </button>
      </div>
    );

    const syncStatus =
      status === 'saving'
        ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-warning-soft text-warning border border-warning-soft">
              <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
              <span className="hidden sm:inline">Saving...</span>
            </span>
          )
        : status === 'saved'
          ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-success-soft text-success border border-success-soft">
                <span className="w-1.5 h-1.5 rounded-full bg-success" />
                <span className="hidden sm:inline">Saved</span>
              </span>
            )
          : status === 'offline'
            ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-muted/10 text-muted-foreground border border-muted-foreground/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                  <span className="hidden sm:inline">Offline</span>
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
      <header className="h-14 px-4 sm:px-6 border-b border-border/60 bg-background/90 backdrop-blur-md flex items-center justify-between z-20 shrink-0 w-full select-none">
        {left}
        {modeSwitcher}
        {right}
      </header>
    );
  };

  const renderActiveView = () => {
    switch (activeMode) {
      case 'doc':
        if (activePage === 'root-doc-node') {
          return <AllDocsView />;
        }
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
            <GraphView activePageId={activePage} onNavigateToNode={(nodeId) => { setActivePage(nodeId); setActiveMode('doc'); }} />
          </div>
        );
      case 'journals':
        return (
          <div className="h-full overflow-hidden">
            <JournalsView />
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
        syncStatus={status}
        conflictMsg={conflictMsg}
        onResolveConflict={resolveConflict}
        onDismissConflict={dismissConflict}
      >
        <div className="flex flex-col h-full w-full overflow-hidden">
          {renderTopBar()}
          {renderViewport()}
        </div>
      </AppLayout>

      {status === 'conflict' && conflictMsg ? (
        <div className="fixed bottom-4 right-4 max-w-sm w-full bg-destructive border border-destructive-border shadow-lg rounded-2xl p-4 z-50 flex items-start gap-3 backdrop-blur-sm animate-in slide-in-from-bottom-5">
          <div className="w-8 h-8 rounded-full bg-destructive-accent flex items-center justify-center shrink-0">
            <span className="text-destructive-foreground font-bold">!</span>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-destructive-foreground">Sync Conflict</h4>
            <p className="text-xs text-destructive-foreground/80 mt-1 break-words">{conflictMsg}</p>
          </div>
          <button
            onClick={dismissConflict}
            className="inline-flex items-center justify-center rounded-lg p-1 text-destructive-foreground/70 hover:text-destructive-foreground hover:bg-destructive-accent"
          >
            <span className="leading-none">✕</span>
          </button>
        </div>
      ) : null}

      <div data-root-modals="root">
        <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onAuthSuccess={setUserEmail} userEmail={userEmail} />
        <SettingsModal isOpen={isSettingsOpen} onClose={() => { setIsSettingsOpen(false); if (window.location.pathname === '/settings') { window.history.pushState(null, '', '/'); window.dispatchEvent(new PopStateEvent('popstate')); } }} passphrase={passphrase} onPassphraseChange={setPassphrase} />
        <CommandPalette
          isOpen={isPaletteOpen}
          onClose={() => { setIsPaletteOpen(false); if (window.location.pathname === '/search') { window.history.pushState(null, '', '/'); window.dispatchEvent(new PopStateEvent('popstate')); } }}
          onModeSelect={handleModeChange}
          onToggleTheme={() => setIsDarkMode(!isDarkMode)}
          onToggleZen={() => setIsZenMode((prev) => !prev)}
          onOpenSettings={() => { window.history.pushState(null, '', '/settings'); window.dispatchEvent(new PopStateEvent('popstate')); }}
          isDarkMode={isDarkMode}
        />
      </div>
    </>
  );
};

export default App;
