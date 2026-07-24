import React, { useState, useEffect } from 'react';
import { AppLayout, ActiveMode, Workspace } from './layouts/AppLayout.js';
import { DocumentEditor } from '@catnoted/editor';
import { InfiniteCanvas } from '@catnoted/canvas';
import { GraphView } from '@catnoted/graph';
import { ydoc } from '@catnoted/editor';
import * as Y from 'yjs';

// E2EE sync utilities
import { encryptPayload, decryptPayload } from './utils/crypto.js';
import { mockSyncChannel } from './utils/supabase.js';

// Modals & Panels
import { AuthModal } from './components/auth/AuthModal.js';
import { SettingsModal } from './components/settings/SettingsModal.js';
import { CommandPalette } from './components/CommandPalette.js';

const defaultWorkspaces: Workspace[] = [
  { id: 'personal', name: 'Personal Space', description: 'Your private notes and thoughts', emoji: '🏠' },
  { id: 'research', name: 'Research Lab', description: 'Academic papers & deep dives', emoji: '📚' },
  { id: 'agent-vfs', name: 'Agent Sandbox', description: 'AI Agent code, tools & widgets', emoji: '🤖' }
];

const App: React.FC = () => {
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace>(defaultWorkspaces[0]);
  const [activeMode, setActiveMode] = useState<ActiveMode>('doc');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [isZenMode, setIsZenMode] = useState<boolean>(false);
  
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
            {/* Document Topbar */}
            <div className="flex items-center justify-between px-10 py-4 border-b border-slate-100 dark:border-zinc-800/60">
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-zinc-50 flex items-center gap-2">
                  <span className="text-lg">{activeWorkspace.emoji}</span>
                  <span>{activeWorkspace.name} &mdash; Untitled Document</span>
                </h1>
                <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5 flex items-center gap-1.5">
                  Linear Editor &middot; E2EE Sync:
                  <span className="text-indigo-500 font-mono font-semibold">AES-GCM-256</span>
                </p>
              </div>
              <button
                onClick={() => setIsAuthOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg text-xs font-medium text-slate-600 dark:text-zinc-300 transition-colors"
              >
                <span className="w-5 h-5 rounded-full bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                  {userEmail.charAt(0).toUpperCase()}
                </span>
                {userEmail}
              </button>
            </div>

            {/* Document Body */}
            <div className="flex-1 overflow-auto">
              <DocumentEditor />
            </div>
          </div>
        );
      case 'canvas':
        return (
          <div className="h-full overflow-auto p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <div>
                  <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-zinc-50 flex items-center gap-2">
                    <span className="text-base">{activeWorkspace.emoji}</span>
                    <span>{activeWorkspace.name} &mdash; Edgeless Canvas</span>
                  </h1>
                  <p className="text-xs text-slate-400 dark:text-zinc-500">Spatial whiteboard view synced automatically with document nodes.</p>
                </div>
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg text-xs font-medium text-slate-600 dark:text-zinc-300 transition-colors"
                >
                  <span className="w-5 h-5 rounded-full bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                    {userEmail.charAt(0).toUpperCase()}
                  </span>
                  {userEmail}
                </button>
              </div>
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
        activeWorkspace={activeWorkspace}
        workspaces={defaultWorkspaces}
        onWorkspaceChange={setActiveWorkspace}
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
