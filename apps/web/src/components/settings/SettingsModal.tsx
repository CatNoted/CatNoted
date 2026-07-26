import React, { useState, useEffect } from 'react';
import { Settings, ShieldAlert, KeyRound, Cloud, X } from 'lucide-react';
import { encryptPayload, decryptPayload } from '../../utils/crypto.js';

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
          console.error(`Failed to decrypt ${keyName}`, e);
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
    <div className="fixed inset-0 bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-[520px] shadow-xl relative flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-slate-500 dark:text-zinc-400" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">Settings</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switchers */}
        <div className="px-5">
          <div className="flex gap-1 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/60 p-1">
            <button
              type="button"
              onClick={() => setActiveTab('byok')}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg text-xs font-medium h-8 transition-colors ${
                activeTab === 'byok'
                  ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 shadow-sm border border-slate-200 dark:border-zinc-800'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              BYOK
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('sync')}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg text-xs font-medium h-8 transition-colors ${
                activeTab === 'sync'
                  ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 shadow-sm border border-slate-200 dark:border-zinc-800'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200'
              }`}
            >
              <Cloud className="w-3.5 h-3.5" />
              Security & Sync
            </button>
          </div>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {activeTab === 'byok' && (
            <form onSubmit={handleSaveKeys} className="space-y-4">
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Use your own LLM API keys. Keys are stored encrypted in session storage and never touch CatNoted servers.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-zinc-300 mb-1">OpenAI API Key</label>
                  <input
                    type="password"
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                    placeholder="sk-..."
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-xs placeholder:text-slate-400 dark:placeholder:text-zinc-500 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-zinc-300 mb-1">Gemini API Key</label>
                  <input
                    type="password"
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-xs placeholder:text-slate-400 dark:placeholder:text-zinc-500 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-zinc-300 mb-1">Anthropic API Key</label>
                  <input
                    type="password"
                    value={anthropicKey}
                    onChange={(e) => setAnthropicKey(e.target.value)}
                    placeholder="sk-ant-..."
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-xs placeholder:text-slate-400 dark:placeholder:text-zinc-500 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-zinc-300 mb-1">Ollama Host URL</label>
                  <input
                    type="text"
                    value={ollamaUrl}
                    onChange={(e) => setOllamaUrl(e.target.value)}
                    placeholder="http://localhost:11434"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-xs placeholder:text-slate-400 dark:placeholder:text-zinc-500 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-950/50 px-3 py-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberChoice}
                  onChange={(e) => setRememberChoice(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs text-slate-600 dark:text-zinc-300">Use current passphrase for session unlock</span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex h-9 items-center justify-center rounded-lg px-4 text-xs font-medium text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex h-9 items-center justify-center rounded-lg px-4 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  Save Keys
                </button>
              </div>
            </form>
          )}

          {activeTab === 'sync' && (
            <form onSubmit={handleSaveSyncSettings} className="space-y-4">
              <div className="flex items-start gap-3 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/20 p-3">
                <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-medium text-amber-800 dark:text-amber-300">Zero-knowledge storage</h4>
                  <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-1">
                    Your passphrase derives a local 256-bit AES-GCM encryption key. Without this passphrase, data cannot be decrypted.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-zinc-300 mb-1">E2EE Passphrase</label>
                  <input
                    type="password"
                    value={passphrase}
                    onChange={(e) => onPassphraseChange(e.target.value)}
                    placeholder="Insert secure E2EE passphrase..."
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-xs placeholder:text-slate-400 dark:placeholder:text-zinc-500 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="rounded-xl border border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/50 p-4">
                  <h4 className="text-xs font-medium text-slate-700 dark:text-zinc-200 mb-2">Sync Network Connection Status</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500 dark:text-zinc-400">Local-First Storage (VFS):</span>
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">Active (IndexedDB)</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500 dark:text-zinc-400">Cloud Sync Provider:</span>
                      <span className="font-medium text-blue-600 dark:text-blue-400">Supabase E2EE Broadcast Active</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-dashed border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2">
                  <p className="text-[11px] text-slate-400 dark:text-zinc-500">Sync channel details are derived from the active session.</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex h-9 items-center justify-center rounded-lg px-4 text-xs font-medium text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex h-9 items-center justify-center rounded-lg px-4 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  Save Sync Settings
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

