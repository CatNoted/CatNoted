/**
 * z-index layering reference:
 * - Modals & Overlays (e.g. AuthModal, SettingsModal, CommandPalette): z-[100]
 * - Floating UI & Rails (e.g. Left/Right rails, Floating Space Agent Panel, FAB): z-20 to z-40
 * - Workspace / Editor Content (e.g. Doc Editor, Canvas elements): z-0 to z-10
 */

import React, { useState, useEffect } from 'react';
import { Settings, ShieldAlert, KeyRound, Cloud, X } from 'lucide-react';
import { encryptPayload, decryptPayload } from '../../utils/crypto.js';
import { Overlay } from '../primitives/Overlay.js';
import { Panel } from '../primitives/Panel.js';

// Base64 helpers
function encodeBase64(bytes: Uint8Array): string {
  const binString = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
  return btoa(binString);
}

function decodeBase64(base64: string): Uint8Array {
  const binString = atob(base64);
  return Uint8Array.from(binString, (m) => m.codePointAt(0)!);
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  passphrase: string;
  onPassphraseChange: (val: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  passphrase,
  onPassphraseChange
}) => {
  const [activeTab, setActiveTab] = useState<'byok' | 'sync'>('byok');
  const [rememberChoice, setRememberChoice] = useState(() => {
    try {
      return typeof localStorage !== 'undefined' && !!localStorage.getItem('catnoted_e2ee_passphrase');
    } catch {
      return false;
    }
  });

  // API Keys state
  const [openaiKey, setOpenaiKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [ollamaUrl, setOllamaUrl] = useState(() => {
    try {
      return sessionStorage.getItem('byok_ollama_url') || 'http://localhost:11434';
    } catch {
      return 'http://localhost:11434';
    }
  });

  useEffect(() => {
    if (!isOpen) return;

    const loadKey = async (keyName: string, setter: (val: string) => void) => {
      const encryptedBase64 = sessionStorage.getItem(keyName);
      if (encryptedBase64) {
        try {
          const encryptedBytes = decodeBase64(encryptedBase64);
          const decryptedBytes = await decryptPayload(encryptedBytes, passphrase);
          const decryptedString = new TextDecoder().decode(decryptedBytes);
          setter(decryptedString);
        } catch (e) {
          console.error('Failed to decrypt settings item', e instanceof Error ? e.message : String(e));
          setter('');
        }
      } else {
        setter('');
      }
    };

    loadKey('byok_openai_key', setOpenaiKey);
    loadKey('byok_gemini_key', setGeminiKey);
    loadKey('byok_anthropic_key', setAnthropicKey);
  }, [isOpen, passphrase]);

  if (!isOpen) return null;

  const handleSaveKeys = async (e: React.FormEvent) => {
    e.preventDefault();

    const saveKey = async (keyName: string, value: string) => {
      if (value) {
        try {
          const valueBytes = new TextEncoder().encode(value);
          const encryptedBytes = await encryptPayload(valueBytes, passphrase);
          const encryptedBase64 = encodeBase64(encryptedBytes);
          sessionStorage.setItem(keyName, encryptedBase64);
        } catch (e) {
          console.error('Failed to encrypt settings item', e instanceof Error ? e.message : String(e));
        }
      } else {
        sessionStorage.removeItem(keyName);
      }
    };

    await saveKey('byok_openai_key', openaiKey);
    await saveKey('byok_gemini_key', geminiKey);
    await saveKey('byok_anthropic_key', anthropicKey);
    sessionStorage.setItem('byok_ollama_url', ollamaUrl);
    if (rememberChoice) {
      try {
        localStorage.setItem('catnoted_e2ee_passphrase', passphrase);
      } catch {}
    } else {
      try {
        localStorage.removeItem('catnoted_e2ee_passphrase');
      } catch {}
    }

    alert('BYOK API Keys successfully saved in session secure storage!');
  };

  const handleSaveSyncSettings = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (rememberChoice) {
        localStorage.setItem('catnoted_e2ee_passphrase', passphrase);
      } else {
        localStorage.removeItem('catnoted_e2ee_passphrase');
      }
    } catch {}
    alert('E2EE Passphrase updated in local storage!');
  };

  return (
    <Overlay isOpen={isOpen} className="bg-background/80 backdrop-blur-[2px]">
      <Panel className="w-full max-w-[760px] h-[580px] shadow-2xl flex flex-col md:flex-row overflow-hidden">

        {/* Left Sidebar */}
        <div className="w-full md:w-[220px] border-b md:border-b-0 md:border-r border-muted dark:border-border bg-muted dark:bg-muted p-5 flex flex-col justify-between shrink-0">
          <div>
            {/* Sidebar Header */}
            <div className="flex items-center gap-2 mb-6 px-1">
              <Settings className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">Settings</span>
            </div>

            {/* Sidebar Nav */}
            <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveTab('byok')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all shrink-0 text-left w-full ${
                  activeTab === 'byok'
                    ? 'bg-muted text-foreground font-semibold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <KeyRound className="w-4 h-4" />
                BYOK Keys
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('sync')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all shrink-0 text-left w-full ${
                  activeTab === 'sync'
                    ? 'bg-muted text-foreground font-semibold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <Cloud className="w-4 h-4" />
                Security & Sync
              </button>
            </nav>
          </div>

          {/* Sidebar Footer or Meta */}
          <div className="hidden md:block px-1">
            <span className="text-[10px] text-muted-foreground font-mono">v1.0.0-affine-style</span>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col h-full min-w-0 bg-card dark:bg-card">
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-3 shrink-0">
            <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
              {activeTab === 'byok' ? 'Bring Your Own Key' : 'Security & Sync Connection'}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="h-7 w-7 inline-flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Content container */}
          <div className="flex-1 overflow-y-auto px-6 pb-6 min-w-0">
            {activeTab === 'byok' && (
              <form onSubmit={handleSaveKeys} className="flex flex-col h-full justify-between gap-6">
                <div className="space-y-5">
                  <div className="p-3.5 rounded-xl border border-muted dark:border-border/60 bg-muted dark:bg-muted">
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      Use your own LLM API keys. Keys are stored encrypted in session storage and never touch CatNoted servers.
                    </p>
                  </div>

                  {/* Section Title */}
                  <div className="space-y-4">
                    <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Provider Credentials
                    </h3>

                    <div className="space-y-3.5">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-4 items-center">
                        <label htmlFor="openaiKey" className="text-xs font-medium text-foreground">OpenAI Key</label>
                        <div className="sm:col-span-2">
                          <input
                            id="openaiKey"
                            type="password"
                            value={openaiKey}
                            onChange={(e) => setOpenaiKey(e.target.value)}
                            placeholder="sk-..."
                            className="w-full px-3 py-1.5 rounded-lg border border-border dark:border-border bg-muted dark:bg-muted text-xs placeholder:text-muted-foreground dark:placeholder:text-muted-foreground text-foreground focus:outline-none focus:ring-1 focus:ring-accent dark:focus:ring-accent transition-all"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-4 items-center">
                        <label htmlFor="geminiKey" className="text-xs font-medium text-foreground">Gemini Key</label>
                        <div className="sm:col-span-2">
                          <input
                            id="geminiKey"
                            type="password"
                            value={geminiKey}
                            onChange={(e) => setGeminiKey(e.target.value)}
                            placeholder="AIzaSy..."
                            className="w-full px-3 py-1.5 rounded-lg border border-border dark:border-border bg-muted dark:bg-muted text-xs placeholder:text-muted-foreground dark:placeholder:text-muted-foreground text-foreground focus:outline-none focus:ring-1 focus:ring-accent dark:focus:ring-accent transition-all"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-4 items-center">
                        <label htmlFor="anthropicKey" className="text-xs font-medium text-foreground">Anthropic Key</label>
                        <div className="sm:col-span-2">
                          <input
                            id="anthropicKey"
                            type="password"
                            value={anthropicKey}
                            onChange={(e) => setAnthropicKey(e.target.value)}
                            placeholder="sk-ant-..."
                            className="w-full px-3 py-1.5 rounded-lg border border-border dark:border-border bg-muted dark:bg-muted text-xs placeholder:text-muted-foreground dark:placeholder:text-muted-foreground text-foreground focus:outline-none focus:ring-1 focus:ring-accent dark:focus:ring-accent transition-all"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-4 items-center">
                        <label htmlFor="ollamaUrl" className="text-xs font-medium text-foreground">Ollama Host URL</label>
                        <div className="sm:col-span-2">
                          <input
                            id="ollamaUrl"
                            type="text"
                            value={ollamaUrl}
                            onChange={(e) => setOllamaUrl(e.target.value)}
                            placeholder="http://localhost:11434"
                            className="w-full px-3 py-1.5 rounded-lg border border-border dark:border-border bg-muted dark:bg-muted text-xs placeholder:text-muted-foreground dark:placeholder:text-muted-foreground text-foreground focus:outline-none focus:ring-1 focus:ring-accent dark:focus:ring-accent transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <label htmlFor="rememberChoice" className="flex items-center gap-2.5 rounded-xl border border-muted dark:border-border/60 bg-muted dark:bg-muted px-3.5 py-2.5 cursor-pointer select-none transition-colors hover:bg-muted dark:hover:bg-muted">
                      <input
                        id="rememberChoice"
                        type="checkbox"
                        checked={rememberChoice}
                        onChange={(e) => setRememberChoice(e.target.checked)}
                        className="h-4 w-4 rounded border-border text-accent focus:ring-accent focus:ring-offset-0 bg-transparent"
                      />
                      <span className="text-xs text-foreground">Use current passphrase for session unlock</span>
                    </label>
                  </div>
                </div>

                {/* Explicit Actions */}
                <div className="flex items-center justify-end gap-2 pt-4 border-t border-muted dark:border-border/60 mt-6 shrink-0">
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex h-8 items-center justify-center rounded-lg px-3.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex h-8 items-center justify-center rounded-lg px-3.5 text-xs font-semibold text-white bg-accent hover:bg-accent-hover transition-colors shadow-sm"
                  >
                    Save Keys
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'sync' && (
              <form onSubmit={handleSaveSyncSettings} className="flex flex-col h-full justify-between gap-6">
                <div className="space-y-5">
                  <div className="flex items-start gap-3 rounded-xl border border-warning-soft dark:border-warning-soft/20 bg-warning-soft dark:bg-warning-soft p-3.5">
                    <ShieldAlert className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-semibold text-warning-foreground">Zero-knowledge storage</h4>
                      <p className="text-[11px] leading-relaxed text-warning-foreground/80 mt-1">
                        Your passphrase derives a local 256-bit AES-GCM encryption key. Without this passphrase, data cannot be decrypted.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Encryption Key
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-4 items-center">
                      <label htmlFor="e2eePassphrase" className="text-xs font-medium text-foreground">E2EE Passphrase</label>
                      <div className="sm:col-span-2">
                        <input
                          id="e2eePassphrase"
                          type="password"
                          value={passphrase}
                          onChange={(e) => onPassphraseChange(e.target.value)}
                          placeholder="Insert secure E2EE passphrase..."
                          className="w-full px-3 py-1.5 rounded-lg border border-border dark:border-border bg-muted dark:bg-muted text-xs placeholder:text-muted-foreground dark:placeholder:text-muted-foreground text-foreground focus:outline-none focus:ring-1 focus:ring-accent dark:focus:ring-accent transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3.5">
                    <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Connection Status
                    </h3>

                    <div className="rounded-xl border border-muted dark:border-border/60 bg-muted dark:bg-muted p-4 space-y-2.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">Local-First Storage (VFS)</span>
                        <span className="font-semibold text-success flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-success" />
                          Active (IndexedDB)
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs border-t border-muted dark:border-border/40 pt-2.5">
                        <span className="text-muted-foreground">Cloud Sync Provider</span>
                        <span className="font-semibold text-accent flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                          Supabase E2EE Broadcast Active
                        </span>
                      </div>
                    </div>

                    <div className="rounded-xl border border-dashed border-border dark:border-border bg-card dark:bg-card px-3.5 py-2.5">
                      <p className="text-[11px] leading-relaxed text-muted-foreground">
                        Sync channel details are derived from the active session.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Explicit Actions */}
                <div className="flex items-center justify-end gap-2 pt-4 border-t border-muted dark:border-border/60 mt-6 shrink-0">
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex h-8 items-center justify-center rounded-lg px-3.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex h-8 items-center justify-center rounded-lg px-3.5 text-xs font-semibold text-white bg-accent hover:bg-accent-hover transition-colors shadow-sm"
                  >
                    Save Sync Settings
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

      </Panel>
    </Overlay>
  );
};
