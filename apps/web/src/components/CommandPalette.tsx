import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  FileText, 
  Layout, 
  Network, 
  Settings, 
  Moon, 
  Sun, 
  EyeOff,
  Terminal
} from 'lucide-react';
import { ActiveMode } from '../layouts/AppLayout.js';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onModeSelect: (mode: ActiveMode) => void;
  onToggleTheme: () => void;
  onToggleZen: () => void;
  onOpenSettings: () => void;
  isDarkMode: boolean;
}

interface CommandItem {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<any>;
  action: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onModeSelect,
  onToggleTheme,
  onToggleZen,
  onOpenSettings,
  isDarkMode
}) => {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const commands: CommandItem[] = [
    {
      id: 'doc',
      title: 'Beralih ke Doc Mode',
      subtitle: 'Buka editor dokumen berbasis blok',
      icon: FileText,
      action: () => onModeSelect('doc')
    },
    {
      id: 'canvas',
      title: 'Beralih ke Canvas Mode',
      subtitle: 'Buka spatial whiteboard canvas tak terbatas',
      icon: Layout,
      action: () => onModeSelect('canvas')
    },
    {
      id: 'graph',
      title: 'Beralih ke Graph Mode',
      subtitle: 'Visualisasikan backlinks & tags dalam peta pikiran',
      icon: Network,
      action: () => onModeSelect('graph')
    },
    {
      id: 'zen',
      title: 'Toggle Zen Mode',
      subtitle: 'Sembunyikan sidebar navigasi & panel AI samping',
      icon: EyeOff,
      action: onToggleZen
    },
    {
      id: 'theme',
      title: isDarkMode ? 'Ubah ke Mode Terang' : 'Ubah ke Mode Gelap',
      subtitle: 'Sesuaikan gaya visual antarmuka',
      icon: isDarkMode ? Sun : Moon,
      action: onToggleTheme
    },
    {
      id: 'settings',
      title: 'Buka Pengaturan',
      subtitle: 'Konfigurasi BYOK API Keys & passphrase E2EE',
      icon: Settings,
      action: onOpenSettings
    }
  ];

  const filteredCommands = commands.filter(cmd =>
    cmd.title.toLowerCase().includes(search.toLowerCase()) ||
    cmd.subtitle.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
          onClose();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm z-[100] flex items-start justify-center p-4 pt-[15vh]">
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[360px]">
        {/* Search input */}
        <div className="p-4 border-b border-slate-100 dark:border-zinc-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or search workspace..."
            className="w-full bg-transparent border-none outline-none focus:ring-0 text-sm text-slate-800 dark:text-zinc-100 placeholder-slate-350"
          />
          <span className="text-[10px] font-mono bg-slate-100 dark:bg-zinc-850 px-2 py-0.5 rounded text-slate-400 shrink-0">ESC</span>
        </div>

        {/* Command list */}
        <div className="flex-1 overflow-y-auto p-2">
          {filteredCommands.length > 0 ? (
            filteredCommands.map((cmd, idx) => {
              const Icon = cmd.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={cmd.id}
                  onClick={() => {
                    cmd.action();
                    onClose();
                  }}
                  className={`w-full p-3 rounded-2xl flex items-center gap-3 text-left transition-colors ${
                    isSelected 
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-medium' 
                      : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-850'
                  }`}
                >
                  <div className={`p-2 rounded-xl shrink-0 ${isSelected ? 'bg-indigo-100 dark:bg-indigo-950/60' : 'bg-slate-100 dark:bg-zinc-800'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold">{cmd.title}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">{cmd.subtitle}</p>
                  </div>
                  {isSelected && (
                    <Terminal className="w-3.5 h-3.5 text-indigo-500 animate-pulse shrink-0" />
                  )}
                </button>
              );
            })
          ) : (
            <div className="py-6 text-center text-xs text-slate-400">
              No matching command found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
