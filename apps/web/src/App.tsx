import React, { useState, useEffect } from 'react';
import { AppLayout, ActiveMode } from './layouts/AppLayout.js';
import { DocumentEditor, useDocumentStore } from '@catnoted/editor';
import { InfiniteCanvas } from '@catnoted/canvas';
import { GraphView, parseDocumentGraph } from '@catnoted/graph';
import { ydoc } from '@catnoted/editor';
import * as Y from 'yjs';

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

  const { blocks } = useDocumentStore();

  const graphData = React.useMemo(() => {
    return parseDocumentGraph(blocks);
  }, [blocks]);

  const mainHeading = blocks.find(b => b.type === 'heading' && b.properties?.level === 1);
  const docTitle = mainHeading?.content || 'Untitled Document';

  const activePageNode = graphData.nodes.find(n => n.id === activePage);
  const pageTitle = activePage === 'root-doc-node'
    ? docTitle
    : (activePageNode
        ? (activePageNode.label.startsWith('📁 ') || activePageNode.label.startsWith('📄 ') ? activePageNode.label.slice(2) : activePageNode.label)
        : activePage);
  
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

  const renderContent = () => {
    switch (activeMode) {
      case 'doc':
        return (
          <div className="flex flex-col h-full">
            {/* Quick Navigation helper when inside sub-pages */}
            {activePage !== 'root-doc-node' && (
              <div className="px-10 pt-4 flex shrink-0">
                <button
                  onClick={() => setActivePage('root-doc-node')}
                  className="text-xs px-2.5 py-1 bg-slate-100 dark:bg-zinc-850 hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400 rounded-lg transition-colors flex items-center gap-1"
                  title="Back to root note"
                >
                  <span>← Back to root:</span>
                  <span className="font-semibold">{docTitle}</span>
                </button>
              </div>
            )}

            {/* Document Body */}
            <div className="flex-1 overflow-auto">
              <DocumentEditor />
            </div>
          </div>
        );
      case 'canvas':
        return (
          <div className="h-full overflow-auto p-4 md:p-6">
            <div className="space-y-4">
              <InfiniteCanvas />
            </div>
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
