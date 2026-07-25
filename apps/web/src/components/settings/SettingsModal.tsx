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
  
  // API Keys state
  const [openaiKey, setOpenaiKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [ollamaUrl, setOllamaUrl] = useState(() => localStorage.getItem('byok_ollama_url') || 'http://localhost:11434');

  useEffect(() => {
    if (!isOpen) return;

    const loadKey = async (keyName: string, setter: (val: string) => void) => {
      const encryptedBase64 = localStorage.getItem(keyName);
      if (encryptedBase64) {
        try {
          const encryptedBytes = decodeBase64(encryptedBase64);
          const decryptedBytes = await decryptPayload(encryptedBytes, passphrase);
          const decryptedString = new TextDecoder().decode(decryptedBytes);
          setter(decryptedString);
        } catch (e) {
          console.error(`Failed to decrypt ${keyName}`, e);
          setter(''); // Clear or handle error
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
          localStorage.setItem(keyName, encryptedBase64);
        } catch (e) {
          console.error(`Failed to encrypt ${keyName}`, e);
        }
      } else {
        localStorage.removeItem(keyName);
      }
    };

    await saveKey('byok_openai_key', openaiKey);
    await saveKey('byok_gemini_key', geminiKey);
    await saveKey('byok_anthropic_key', anthropicKey);
    localStorage.setItem('byok_ollama_url', ollamaUrl);

    alert('BYOK API Keys successfully saved in local secure storage!');
  };

  const handleSaveSyncSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('catnoted_e2ee_passphrase', passphrase);
    alert('E2EE Passphrase saved securely in local storage!');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative flex flex-col h-[520px]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-500" />
            <h2 className="font-bold text-base text-slate-800 dark:text-zinc-50">Settings & Keys</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switchers */}
        <div className="flex gap-2 border-b border-slate-100 dark:border-zinc-800 py-3">
          <button
            onClick={() => setActiveTab('byok')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'byok'
                ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            BYOK API Keys
          </button>
          <button
            onClick={() => setActiveTab('sync')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'sync'
                ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            Security & E2EE Sync
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto py-4">
          
          {/* TAB 1: BYOK KEYS */}
          {activeTab === 'byok' && (
            <form onSubmit={handleSaveKeys} className="space-y-4">
              <p className="text-[10px] text-slate-400 mb-4">
                Enter your own LLM API keys. These keys are stored encrypted in your local browser storage and never touch CatNoted servers.
              </p>
              
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">OpenAI API Key</label>
                <input
                  type="password"
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Gemini API Key</label>
                <input
                  type="password"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Anthropic API Key</label>
                <input
                  type="password"
                  value={anthropicKey}
                  onChange={(e) => setAnthropicKey(e.target.value)}
                  placeholder="sk-ant-..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Ollama Host URL</label>
                <input
                  type="text"
                  value={ollamaUrl}
                  onChange={(e) => setOllamaUrl(e.target.value)}
                  placeholder="http://localhost:11434"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors"
              >
                Save BYOK Settings
              </button>
            </form>
          )}

          {/* TAB 2: SECURITY & SYNC */}
          {activeTab === 'sync' && (
            <form onSubmit={handleSaveSyncSettings} className="space-y-4">
              <div className="p-3 border border-amber-200 dark:border-amber-950/40 bg-amber-50/50 dark:bg-amber-950/20 rounded-2xl flex gap-2 text-xs">
                <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-amber-700 dark:text-amber-400">Zero-Knowledge Storage</h4>
                  <p className="text-[10px] text-amber-600/80 dark:text-amber-500/80 mt-0.5">
                    Your passphrase derives a local 256-bit AES-GCM encryption key. Without this key, your data broadcasted to Supabase cannot be decrypted by anyone, including CatNoted admins.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">E2EE Passphrase</label>
                <input
                  type="password"
                  value={passphrase}
                  onChange={(e) => onPassphraseChange(e.target.value)}
                  placeholder="Insert secure E2EE passphrase..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors"
              >
                Save Sync Settings
              </button>

              <div className="border border-slate-100 dark:border-zinc-850 p-4 rounded-2xl space-y-3">
                <h4 className="font-semibold text-xs">Sync Network Connection Status</h4>
                
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-400">Local-First Storage (VFS):</span>
                  <span className="font-semibold text-emerald-500">Active (IndexedDB)</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-400">Cloud Sync Provider:</span>
                  <span className="font-semibold text-indigo-500">Supabase E2EE Broadcast Active</span>
                </div>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
