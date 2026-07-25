import React, { useState, useEffect } from 'react';
import { AppLayout, ActiveMode } from './layouts/AppLayout.js';
import { DocumentEditor, useDocumentStore } from '@catnoted/editor';
import { InfiniteCanvas } from '@catnoted/canvas';
import { GraphView } from '@catnoted/graph';
import { ydoc } from '@catnoted/editor';
import * as Y from 'yjs';
import {
  Share2,
  Edit2,
  BookOpen,
  LayoutGrid
} from 'lucide-react';

// E2EE sync utilities
import { encryptPayload, decryptPayload } from "./utils/crypto.js";
import { mockSyncChannel } from "./utils/supabase.js";

// Modals & Panels
import { AuthModal } from "./components/auth/AuthModal.js";
import { SettingsModal } from "./components/settings/SettingsModal.js";
import { CommandPalette } from "./components/CommandPalette.js";

const App: React.FC = () => {
  const [activeMode, setActiveMode] = useState<ActiveMode>("doc");
  const [currentWorkspace, setCurrentWorkspace] =
    useState<string>("Personal Space");
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [isZenMode, setIsZenMode] = useState<boolean>(false);
  const [activePage, setActivePage] = useState<string>('root-doc-node');

  const { blocks: rootBlocks, addBlock: addRootBlock, updateBlockContent: updateRootBlockContent } = useDocumentStore('root-doc-node');
  const { blocks: activeBlocks, updateBlockContent: updateActiveBlockContent } = useDocumentStore(activePage);

  const graphData = React.useMemo(() => {
    return parseDocumentGraph(rootBlocks);
  }, [rootBlocks]);

  const activeHeading = activeBlocks.find(b => b.type === 'heading' && b.properties?.level === 1);
  const docTitle = activeHeading?.content || 'Untitled Document';

  const activePageNode = graphData.nodes.find(n => n.id === activePage);
  const pageTitle = activePage === 'root-doc-node'
    ? docTitle
    : (activePageNode
        ? (activePageNode.label.startsWith('📁 ') || activePageNode.label.startsWith('📄 ') ? activePageNode.label.slice(2) : activePageNode.label)
        : activePage);

  // Title inline editing state
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

    // 1. Rename wiki link in rootBlocks
    const targetBlock = rootBlocks.find(b => b.content.includes(`[[${oldTitle}]]`));
    if (targetBlock) {
      const updatedContent = targetBlock.content.replace(`[[${oldTitle}]]`, `[[${newTitle}]]`);
      updateRootBlockContent(targetBlock.id, updatedContent);
    }

    // 2. Migrate blocks in Yjs
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
      .filter(n => n.type === 'page')
      .map(n => {
        return n.label.startsWith('📁 ') || n.label.startsWith('📄 ')
          ? n.label.slice(2)
          : n.label;
      });

    let index = 1;
    let newTitle = `Untitled Page ${index}`;
    while (existingTitles.includes(newTitle)) {
      index++;
      newTitle = `Untitled Page ${index}`;
    }

    // Add wiki link to the root document blocks
    addRootBlock(null, 'text', `[[${newTitle}]]`);

    // Navigate to the newly created page
    const pageId = `page-${newTitle.toLowerCase().replace(/\s+/g, '-')}`;
    setActivePage(pageId);
    setActiveMode('doc');
  };
  
  // E2EE Sync credentials
  const [passphrase, setPassphrase] = useState("");
  const [userEmail, setUserEmail] = useState("guest@catnoted.com");

  // Modals state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  useEffect(() => {
    const savedPassphrase = localStorage.getItem("catnoted_e2ee_passphrase");
    if (savedPassphrase) {
      setPassphrase(savedPassphrase);
    }
  }, []);

  // Initialize theme class on documentElement
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [isDarkMode]);

  // Bind command palette global Cmd+K / Ctrl+K keyboard shortcut listener
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  const { status, conflictMsg, dismissConflict, persistUpdate } = usePersistence();

  // 1. Local E2EE Sync Loop: Listen to local Yjs changes, encrypt them, and broadcast
  useEffect(() => {
    const handleUpdate = async (update: Uint8Array, origin: any) => {
      if (!passphrase) return;

      if (origin === "remote-sync") return; // Ignore updates received from other devices to prevent loops

      try {
        const encrypted = await encryptPayload(update, passphrase);
        const payloadArray = Array.from(encrypted);
        mockSyncChannel.broadcast({
          id: Math.random().toString(36).substring(2),
          sender: "local-tab",
          payload: Array.from(encrypted), // Convert Uint8Array to plain array for JSON transit
        });
        persistUpdate(payloadArray);
      } catch (e) {
        console.error("Encryption failed during local Yjs update:", e);
      }
    };

    ydoc.on("update", handleUpdate);
    return () => {
      ydoc.off("update", handleUpdate);
    };
  }, [passphrase, persistUpdate]);

  // 2. Incoming Sync Loop: Listen to incoming messages, decrypt, and merge
  useEffect(() => {
    if (!passphrase) return;

    const unsubscribe = mockSyncChannel.subscribe(async (msg) => {
      if (msg.sender === "local-tab") return; // Ignore own changes

      try {
        const encryptedBytes = new Uint8Array(msg.payload);
        const decryptedBytes = await decryptPayload(encryptedBytes, passphrase);

        // Merge decrypted CRDT delta into local Yjs document
        Y.applyUpdate(ydoc, decryptedBytes, "remote-sync");
      } catch (e) {
        console.warn(
          "Decryption failed for incoming sync update. Passphrase may be mismatched.",
          e,
        );
      }
    });

    return () => {
      unsubscribe();
    };
  }, [passphrase]);

  const handleModeChange = (mode: ActiveMode) => {
    if (mode === "settings") {
      setIsSettingsOpen(true);
      return;
    }
    setActiveMode(mode);
  };

  const renderHeader = () => {
    return (
      <header className="h-14 px-6 border-b border-slate-200/50 dark:border-zinc-800/50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md flex items-center justify-between z-20 shrink-0 w-full select-none">
        {/* Left: Breadcrumbs + Inline Editable Title */}
        <div className="flex items-center gap-2 max-w-[40%]">
          <span className="text-sm font-medium text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 transition-colors cursor-pointer">Workspace</span>
          <span className="text-slate-300 dark:text-zinc-600 font-light select-none">/</span>

          {activePage !== 'root-doc-node' && (
            <>
              <button
                type="button"
                onClick={() => setActivePage('root-doc-node')}
                className="text-sm font-medium text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 transition-colors shrink-0"
                title="Back to root note"
              >
                Root
              </button>
              <span className="text-slate-300 dark:text-zinc-600 font-light select-none">/</span>
            </>
          )}

          {isEditingTitle ? (
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
            <div className="flex items-center gap-1.5 group/title truncate">
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
                className="opacity-0 group-hover/title:opacity-100 p-0.5 rounded text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all shrink-0"
                title="Edit page title"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Center: Mode Switcher Toggle (Doc / Canvas) */}
        <div className="flex items-center bg-slate-100/80 dark:bg-zinc-800 p-0.5 rounded-xl border border-slate-200/30 dark:border-zinc-800/25">
          {[
            { id: 'doc', label: 'Doc', icon: BookOpen },
            { id: 'canvas', label: 'Canvas', icon: LayoutGrid }
          ].map((modeItem) => {
            const IconComponent = modeItem.icon;
            const isSelected = activeMode === modeItem.id;
            return (
              <button
                key={modeItem.id}
                type="button"
                onClick={() => handleModeChange(modeItem.id as ActiveMode)}
                className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all duration-200 ${
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

        {/* Right: Actions, Sync Indicator, User profile */}
        <div className="flex items-center gap-3">
          {status === 'saving' && (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Saving...
            </span>
          )}
          {status === 'saved' && (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Saved
            </span>
          )}
          {status === 'offline' && (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
              Offline
            </span>
          )}
          {status === 'conflict' && (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-bounce" />
              Conflict
            </span>
          )}
          {status === 'error' && (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              Error
            </span>
          )}

          <button
            type="button"
            onClick={() => {
              const link = `${window.location.origin}/space/${session?.user?.id || 'guest'}`;
              navigator.clipboard.writeText(link)
                .then(() => {
                  alert(`Share Link copied to clipboard:\n${link}\n\n(Anyone with this link and the workspace passphrase can access the E2EE sync room)`);
                })
                .catch(err => {
                  console.error('Failed to copy link: ', err);
                  alert(`Share Link generated:\n${link}\n\n(Anyone with this link and the workspace passphrase can access the E2EE sync room)`);
                });
            }}
            className="p-1.5 border border-slate-200/60 dark:border-zinc-800/60 hover:bg-slate-50 dark:hover:bg-zinc-850 text-slate-500 hover:text-indigo-550 rounded-lg text-xs flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 shadow-sm"
            title="Share document link"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="text-[10px] font-semibold hidden md:inline">Share</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAuthOpen(true)}
            className="flex items-center gap-2 px-2.5 py-1 hover:bg-slate-50 dark:hover:bg-zinc-850 rounded-lg text-xs font-medium text-slate-600 dark:text-zinc-300 transition-colors border border-transparent hover:border-slate-200/60 dark:hover:border-zinc-800/60"
            title="Auth Settings"
          >
            <span className="w-5 h-5 rounded-full bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 shadow-sm">
              {userEmail.charAt(0).toUpperCase()}
            </span>
            <span className="max-w-[100px] truncate text-[10px] font-semibold hidden sm:inline">{userEmail}</span>
          </button>
        </div>
      </header>
    );
  };

  const renderActiveView = () => {
    switch (activeMode) {
      case "doc":
        return (
          <div className="h-full overflow-auto">
            <DocumentEditor activePage={activePage} onRenamePage={handleRenamePage} />
          </div>
        );
      case "canvas":
        return (
          <div className="h-full overflow-auto p-6">
            <InfiniteCanvas />
          </div>
        );
      case "graph":
        return (
          <div className="h-full overflow-hidden">
            <GraphView onNavigateToNode={(nodeId) => { setActivePage(nodeId); setActiveMode("doc"); }} />
          </div>
        );
      default:
        return null;
    }
  };

  const renderContent = () => {
    return (
      <div className="flex flex-col h-full w-full overflow-hidden">
        {renderHeader()}
        <div className="flex-1 overflow-hidden h-full w-full">
          {renderActiveView()}
        </div>
      </div>
    );
  };

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
        {renderContent()}
      </AppLayout>

      {/* Conflict Warning UI */}
      {status === 'conflict' && conflictMsg && (
        <div className="fixed bottom-4 right-4 max-w-sm w-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 shadow-lg rounded-2xl p-4 z-50 flex items-start gap-3 backdrop-blur-sm animate-in slide-in-from-bottom-5">
          <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center shrink-0">
            <span className="text-rose-600 dark:text-rose-400 font-bold">!</span>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-rose-800 dark:text-rose-300">Sync Conflict</h4>
            <p className="text-xs text-rose-600/80 dark:text-rose-400/80 mt-1">{conflictMsg}</p>
          </div>
          <button
            onClick={dismissConflict}
            className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      {/* Modals Container */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={setUserEmail}
        userEmail={userEmail}
      />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        passphrase={passphrase}
        onPassphraseChange={setPassphrase}
      />
      <CommandPalette
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        onModeSelect={handleModeChange}
        onToggleTheme={() => setIsDarkMode(!isDarkMode)}
        onToggleZen={() => setIsZenMode((prev) => !prev)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isDarkMode={isDarkMode}
      />
    </>
  );
};

export default App;
