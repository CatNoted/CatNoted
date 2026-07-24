import React, { useState } from 'react';
import { 
  FileText, 
  Layout, 
  Network, 
  Settings, 
  Moon, 
  Sun, 
  Send,
  Bot,
  Sparkles,
  User,
  Download,
  Upload
} from 'lucide-react';

export type ActiveMode = 'doc' | 'canvas' | 'graph' | 'settings';

interface AppLayoutProps {
  activeMode: ActiveMode;
  onModeChange: (mode: ActiveMode) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  zenMode?: boolean;
  children: React.ReactNode;
}

import { requestLlmWidget } from '@catnoted/agent-runtime';
import { useDocumentStore } from '@catnoted/editor';

export const AppLayout: React.FC<AppLayoutProps> = ({
  activeMode,
  onModeChange,
  isDarkMode,
  onToggleTheme,
  zenMode = false,
  children
}) => {
  const { blocks, addBlock, updateBlockType } = useDocumentStore();
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'agent'; text: string }>>([
    { sender: 'agent', text: "Hello! I am your Space Agent. What would you like to build or note down today?" }
  ]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setChatInput('');

    try {
      const response = await requestLlmWidget(userMsg);
      setMessages(prev => [...prev, { sender: 'agent', text: response.text }]);

      const newBlockId = addBlock(null, 'widget', '');
      updateBlockType(newBlockId, 'widget', {
        widgetId: `ai-widget-${Math.random().toString(36).substring(2, 6)}`,
        srcDoc: response.code
      });
    } catch (error) {
      setMessages(prev => [...prev, { sender: 'agent', text: 'Failed to request LLM widget sandbox compiles.' }]);
    }
  };

  // Export all widgets from the document store as JSON catalog
  const handleExportWidgets = () => {
    const widgets = blocks.filter(b => b.type === 'widget');
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(widgets, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "catnoted-widgets.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import widgets catalog and insert them into Yjs store
  const handleImportWidgets = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    fileReader.onload = event => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const widgetList = Array.isArray(parsed) ? parsed : [parsed];
        
        widgetList.forEach(widget => {
          if (widget.type === 'widget' && widget.properties?.srcDoc) {
            const newId = addBlock(null, 'widget', '');
            updateBlockType(newId, 'widget', {
              widgetId: widget.properties.widgetId || 'imported-widget',
              srcDoc: widget.properties.srcDoc
            });
          }
        });
        alert('Widgets catalog successfully imported to document!');
      } catch (err) {
        alert('Failed to parse widget catalog JSON file.');
      }
    };
    fileReader.readAsText(files[0]);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100">
      
      {/* Pane 1: Left Sidebar (Navigation) - Hidden in Zen Mode */}
      {!zenMode && (
        <aside className="w-16 flex flex-col items-center justify-between py-4 border-r border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 z-10 shrink-0">
          <div className="flex flex-col items-center gap-6 w-full">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-200 dark:shadow-none">
              CN
            </div>

            <nav className="flex flex-col gap-3 w-full px-2">
              {[
                { id: 'doc', icon: FileText, label: 'Doc Mode' },
                { id: 'canvas', icon: Layout, label: 'Canvas' },
                { id: 'graph', icon: Network, label: 'Graph' },
                { id: 'settings', icon: Settings, label: 'Settings' }
              ].map(item => {
                const Icon = item.icon;
                const isActive = activeMode === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onModeChange(item.id as ActiveMode)}
                    title={item.label}
                    className={`w-full py-3 rounded-xl flex items-center justify-center transition-all ${
                      isActive 
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold' 
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="flex flex-col items-center gap-4 w-full">
            <button
              onClick={onToggleTheme}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <div className="w-8 h-8 rounded-full bg-slate-300 dark:bg-zinc-700 flex items-center justify-center text-slate-600 dark:text-zinc-300 text-xs font-semibold">
              US
            </div>
          </div>
        </aside>
      )}

      {/* Pane 2: Middle Panel (Main Workspace) */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-zinc-950">
        <header className="h-14 px-6 border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-widest text-slate-400 dark:text-zinc-500 font-bold">Workspace</span>
            <span className="text-slate-300 dark:text-zinc-700">/</span>
            <span className="text-sm font-semibold capitalize">{activeMode} View</span>
            {zenMode && (
              <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded ml-2 font-mono font-semibold">
                Zen Active (Press Cmd+K to toggle sidebars)
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Local VFS Connected
            </span>
          </div>
        </header>

        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </main>

      {/* Pane 3: Right Sidebar (AI Space Agent & Context Panel) - Hidden in Zen Mode */}
      {!zenMode && (
        <aside className="w-80 border-l border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col h-full shrink-0 z-10">
          {/* Header */}
          <div className="h-14 px-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-900/50">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span className="font-semibold text-sm">Space Agent</span>
            </div>
            <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
          </div>

          {/* Widget sharing toolbar catalog */}
          <div className="px-3 py-2 border-b border-slate-100 dark:border-zinc-850 bg-slate-50/30 dark:bg-zinc-900/20 flex gap-2 justify-between">
            <button
              onClick={handleExportWidgets}
              title="Export widget codes"
              className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 border border-slate-200 dark:border-zinc-850 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg text-[10px] font-semibold text-slate-500 dark:text-zinc-400"
            >
              <Download className="w-3.5 h-3.5" /> Export Catalog
            </button>
            <label className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 border border-slate-200 dark:border-zinc-850 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg text-[10px] font-semibold text-slate-500 dark:text-zinc-400 cursor-pointer text-center">
              <Upload className="w-3.5 h-3.5" /> Import Catalog
              <input
                type="file"
                accept=".json"
                onChange={handleImportWidgets}
                className="hidden"
              />
            </label>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, index) => (
              <div 
                key={index} 
                className={`flex gap-2 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 ${
                  msg.sender === 'user' 
                    ? 'bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300' 
                    : 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                }`}>
                  {msg.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>
                <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-none'
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 rounded-tl-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Chat input form */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 dark:border-zinc-800">
            <div className="relative flex items-center">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask agent to generate a widget..."
                className="w-full pl-3 pr-10 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button 
                type="submit"
                className="absolute right-1.5 p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              >
                <Send className="w-3 h-3" />
              </button>
            </div>
          </form>
        </aside>
      )}
    </div>
  );
};
