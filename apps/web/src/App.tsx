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
  ChevronRight,
  BookOpen,
  LayoutGrid
} from 'lucide-react';

// E2EE sync utilities
import { encryptPayload, decryptPayload } from './utils/crypto.js';
import { mockSyncChannel } from './utils/supabase.js';

// Modals & Panels
import { AuthModal } from './components/auth/AuthModal.js';
import { SettingsModal } from './components/settings/SettingsModal.js';
import { CommandPalette } from './components/CommandPalette.js';

const App: React.FC = () => {
  const [activeMode, setActiveMode] = useState<ActiveMode>('doc');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [isZenMode, setIsZenMode] = useState<boolean>(false);
  const [activePage, setActivePage] = useState<string>('root-doc-node');

  const { pages, renamePage } = useDocumentStore(activePage);

  const currentPage = pages.find(p => p.id === activePage) || {
    id: activePage,
    title: activePage === 'root-doc-node' ? 'Selamat Datang di CatNoted! 🐱' : 'Untitled Document'
  };
  const pageTitle = currentPage.title;

  // Title inline editing state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState('');

  useEffect(() => {
    if (!isEditingTitle) {
      setEditTitleValue(pageTitle);
    }
  }, [pageTitle, isEditingTitle]);

  const handleSaveTitle = () => {
    setIsEditingTitle(false);
    if (editTitleValue.trim()) {
      renamePage(activePage, editTitleValue);
    }
  };
  
  // E2EE Sync credentials
  const [passphrase, setPassphrase] = useState('super-secret-default-passphrase');
  const [userEmail, setUserEmail] = useState('guest@catnoted.com');

  // Modals state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  // Initialize theme class on documentElement
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Bind command palette global Cmd+K / Ctrl+K keyboard shortcut listener
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // 1. Local E2EE Sync Loop: Listen to local Yjs changes, encrypt them, and broadcast
  useEffect(() => {
    const handleUpdate = async (update: Uint8Array, origin: any) => {
      if (origin === 'remote-sync') return; // Ignore updates received from other devices to prevent loops
      
      try {
        const encrypted = await encryptPayload(update, passphrase);
        mockSyncChannel.broadcast({
          id: Math.random().toString(36).substring(2),
          sender: 'local-tab',
          payload: Array.from(encrypted) // Convert Uint8Array to plain array for JSON transit
        });
      } catch (e) {
        console.error('Encryption failed during local Yjs update:', e);
      }
    };

    ydoc.on('update', handleUpdate);
    return () => {
      ydoc.off('update', handleUpdate);
    };
  }, [passphrase]);

  // 2. Incoming Sync Loop: Listen to incoming messages, decrypt, and merge
  useEffect(() => {
    const unsubscribe = mockSyncChannel.subscribe(async (msg) => {
      if (msg.sender === 'local-tab') return; // Ignore own changes

      try {
        const encryptedBytes = new Uint8Array(msg.payload);
        const decryptedBytes = await decryptPayload(encryptedBytes, passphrase);
        
        // Merge decrypted CRDT delta into local Yjs document
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
    if (mode === 'settings') {
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
          <span className="text-xs text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors">Workspace</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-zinc-700 shrink-0" />

          {activePage !== 'root-doc-node' && (
            <>
              <button
                type="button"
                onClick={() => setActivePage('root-doc-node')}
                className="text-xs text-slate-400 dark:text-zinc-500 hover:text-indigo-550 transition-colors shrink-0 font-medium"
                title="Back to root note"
              >
                Root
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-zinc-700 shrink-0" />
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
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Connected
          </span>

          <button
            type="button"
            onClick={() => alert(`Share Link: catnoted.app/space/default`)}
            className="p-1.5 border border-slate-200/60 dark:border-zinc-800/60 hover:bg-slate-50 dark:hover:bg-zinc-850 text-slate-500 hover:text-indigo-500 rounded-lg text-xs flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 shadow-sm"
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
      case 'doc':
        return (
          <div className="h-full overflow-auto">
            <DocumentEditor activePageId={activePage} onPageSelect={setActivePage} />
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
            <GraphView onNavigateToNode={(nodeLabel) => alert(`Navigating to reference node: "${nodeLabel}"`)} />
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
      >
        {renderContent()}
      </AppLayout>

      {/* Modals Container */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={setUserEmail}
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
        onToggleZen={() => setIsZenMode(prev => !prev)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isDarkMode={isDarkMode}
      />
    </>
  );
};

export default App;
