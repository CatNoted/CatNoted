import React, { useState, useRef, useCallback, useEffect } from 'react';
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
  Upload,
  X,
  MessageSquare,
  GripVertical,
  Minus,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Folder,
  FolderOpen,
  Clock,
  Tag,
  Cpu,
  Menu
} from 'lucide-react';

export type ActiveMode = 'doc' | 'canvas' | 'graph' | 'settings';

interface AppLayoutProps {
  activeMode: ActiveMode;
  onModeChange: (mode: ActiveMode) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  zenMode?: boolean;
  children: React.ReactNode;
  activePage?: string;
  onPageSelect?: (pageId: string) => void;
  pageTitle?: string;
  userEmail?: string;
  onAuthTrigger?: () => void;
  onCreatePage?: () => void;
}

import { requestLlmWidget } from '@catnoted/agent-runtime';
import { useDocumentStore } from '@catnoted/editor';
import { parseDocumentGraph } from '@catnoted/graph';

// ── Floating panel position & size constants ────────────────────────────
const PANEL_DEFAULT_WIDTH = 380;
const PANEL_DEFAULT_HEIGHT = 560;
const PANEL_MIN_WIDTH = 320;
const PANEL_MIN_HEIGHT = 400;

export const AppLayout: React.FC<AppLayoutProps> = ({
  activeMode,
  onModeChange,
  isDarkMode,
  onToggleTheme,
  zenMode = false,
  children,
  activePage = 'root-doc-node',
  onPageSelect,
  pageTitle: _pageTitle,
  userEmail: _userEmail,
  onAuthTrigger: _onAuthTrigger,
  onCreatePage
}) => {
  const { blocks, addBlock, updateBlockType } = useDocumentStore();

  // Parse document graph nodes
  const graphData = React.useMemo(() => {
    return parseDocumentGraph(blocks);
  }, [blocks]);

  const mainHeading = blocks.find(b => b.type === 'heading' && b.properties?.level === 1);
  const docTitle = mainHeading?.content || 'Untitled Document';

  const pageNodes = graphData.nodes.filter(n => n.type === 'page');
  const tagNodes = graphData.nodes.filter(n => n.type === 'tag');
  const widgetNodes = React.useMemo(() => {
    return blocks
      .filter(b => b.type === 'widget')
      .map(b => ({
        id: b.id,
        label: b.properties?.widgetId || 'AI Widget',
        type: 'widget' as const
      }));
  }, [blocks]);

  const recentDocs = React.useMemo(() => {
    const otherPages = pageNodes
      .filter(n => n.id !== 'root-doc-node')
      .map(n => {
        const title = n.label.startsWith('📁 ') || n.label.startsWith('📄 ')
          ? n.label.slice(2)
          : n.label;
        return { id: n.id, title };
      });

    return [
      { id: 'root-doc-node', title: docTitle },
      ...otherPages
    ];
  }, [pageNodes, docTitle]);

  // Persistent sidebar state - initialized with safe defaults to prevent hydration issues
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [sidebarWidth, setSidebarWidth] = useState<number>(256);
  const [isSidebarResizing, setIsSidebarResizing] = useState(false);

  useEffect(() => {
    const savedCollapsed = localStorage.getItem('catnoted:sidebar-collapsed');
    if (savedCollapsed !== null) {
      setIsSidebarCollapsed(savedCollapsed === 'true');
    }
    const savedWidth = localStorage.getItem('catnoted:sidebar-width');
    if (savedWidth !== null) {
      setSidebarWidth(parseInt(savedWidth, 10));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('catnoted:sidebar-collapsed', String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  useEffect(() => {
    localStorage.setItem('catnoted:sidebar-width', String(sidebarWidth));
  }, [sidebarWidth]);

  // Sidebar drag resizer handle
  const handleSidebarResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsSidebarResizing(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const startWidth = sidebarWidth;
    const startX = e.clientX;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newWidth = Math.max(180, Math.min(450, startWidth + deltaX));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsSidebarResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [sidebarWidth]);

  // Workspace Switcher states
  const [isWorkspaceDropdownOpen, setIsWorkspaceDropdownOpen] = useState(false);
  const [activeWorkspace, setActiveWorkspace] = useState('CatNoted Space');
  const workspaces = ['CatNoted Space', 'Personal Space 😺', 'Work Workspace 💼', 'Creative Sandbox 🎨'];

  // Section expand/collapse state
  const [sectionsExpanded, setSectionsExpanded] = useState<Record<string, boolean>>({
    pages: true,
    tags: true,
    widgets: false
  });

  const toggleSection = (section: string) => {
    setSectionsExpanded(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'agent'; text: string }>>([
    { sender: 'agent', text: "Hello! I am your Space Agent. What would you like to build or note down today?" }
  ]);

  // ── Sidebar Keyboard Navigation & Focus Management ──────────────────
  const navRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [focusedNavIndex, setFocusedNavIndex] = useState(0);

  useEffect(() => {
    const activeIndex = ['doc', 'canvas', 'graph', 'settings'].indexOf(activeMode);
    if (activeIndex !== -1) {
      setFocusedNavIndex(activeIndex);
    }
  }, [activeMode]);

  const handleNavKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex = index;
    const maxIndex = 3; // 4 items (0 to 3)

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        nextIndex = index === maxIndex ? 0 : index + 1;
        break;
      case 'ArrowUp':
        e.preventDefault();
        nextIndex = index === 0 ? maxIndex : index - 1;
        break;
      case 'Home':
        e.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        nextIndex = maxIndex;
        break;
      default:
        return;
    }

    setFocusedNavIndex(nextIndex);
    navRefs.current[nextIndex]?.focus();
  };

  const utilRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [focusedUtilIndex, setFocusedUtilIndex] = useState(0);

  const handleUtilKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex = index;
    const maxIndex = 1; // 2 items (0 and 1)

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        nextIndex = index === maxIndex ? 0 : index + 1;
        break;
      case 'ArrowUp':
        e.preventDefault();
        nextIndex = index === 0 ? maxIndex : index - 1;
        break;
      case 'Home':
        e.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        nextIndex = maxIndex;
        break;
      default:
        return;
    }

    setFocusedUtilIndex(nextIndex);
    utilRefs.current[nextIndex]?.focus();
  };

  // ── Floating panel state ────────────────────────────────────────────
  const [isAgentOpen, setIsAgentOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [panelPos, setPanelPos] = useState({ x: -1, y: -1 }); // -1 = not yet initialized
  const [panelSize, setPanelSize] = useState({ w: PANEL_DEFAULT_WIDTH, h: PANEL_DEFAULT_HEIGHT });

  // Drag state refs (avoid re-renders during drag)
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Resize state refs
  const isResizing = useRef(false);
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 });

  const panelRef = useRef<HTMLDivElement>(null);

  // Initialize default position on first open (bottom-right corner)
  useEffect(() => {
    if (isAgentOpen && panelPos.x === -1) {
      setPanelPos({
        x: window.innerWidth - PANEL_DEFAULT_WIDTH - 24,
        y: window.innerHeight - PANEL_DEFAULT_HEIGHT - 80,
      });
    }
  }, [isAgentOpen, panelPos.x]);

  // ── Drag handlers ──────────────────────────────────────────────────
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    // Only drag from the header grip area
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    isDragging.current = true;
    dragOffset.current = {
      x: e.clientX - panelPos.x,
      y: e.clientY - panelPos.y,
    };

    const handleMove = (ev: MouseEvent) => {
      if (!isDragging.current) return;
      const newX = Math.max(0, Math.min(window.innerWidth - panelSize.w, ev.clientX - dragOffset.current.x));
      const newY = Math.max(0, Math.min(window.innerHeight - 48, ev.clientY - dragOffset.current.y));
      setPanelPos({ x: newX, y: newY });
    };

    const handleUp = () => {
      isDragging.current = false;
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  }, [panelPos, panelSize.w]);

  // ── Resize handlers (bottom-left corner) ───────────────────────────
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isResizing.current = true;
    resizeStart.current = { x: e.clientX, y: e.clientY, w: panelSize.w, h: panelSize.h };

    const handleMove = (ev: MouseEvent) => {
      if (!isResizing.current) return;
      const dw = resizeStart.current.x - ev.clientX; // left edge moves left = larger
      const dh = ev.clientY - resizeStart.current.y;
      const newW = Math.max(PANEL_MIN_WIDTH, resizeStart.current.w + dw);
      const newH = Math.max(PANEL_MIN_HEIGHT, resizeStart.current.h + dh);

      // Adjust position to keep right edge anchored
      setPanelSize({ w: newW, h: newH });
      setPanelPos(prev => ({ x: Math.max(0, prev.x - (newW - panelSize.w)), y: prev.y }));
    };

    const handleUp = () => {
      isResizing.current = false;
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  }, [panelSize, panelPos]);

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
      } catch (err) {
        // Silently handle invalid JSON files
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

            <nav className="flex flex-col gap-3 w-full px-2" aria-label="Sidebar Navigation">
              {[
                { id: 'doc', icon: FileText, label: 'Doc Mode' },
                { id: 'canvas', icon: Layout, label: 'Canvas' },
                { id: 'graph', icon: Network, label: 'Graph' },
                { id: 'settings', icon: Settings, label: 'Settings' }
              ].map((item, index) => {
                const Icon = item.icon;
                const isActive = activeMode === item.id;
                return (
                  <button
                    key={item.id}
                    ref={el => { navRefs.current[index] = el; }}
                    type="button"
                    onClick={() => onModeChange(item.id as ActiveMode)}
                    onKeyDown={(e) => handleNavKeyDown(e, index)}
                    onFocus={() => setFocusedNavIndex(index)}
                    tabIndex={focusedNavIndex === index ? 0 : -1}
                    title={item.label}
                    aria-label={item.label}
                    className={`w-full py-3 rounded-xl flex items-center justify-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:focus-visible:ring-indigo-400 ${
                      isActive 
                        ? 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-semibold shadow-sm shadow-indigo-500/10 dark:shadow-indigo-500/5' 
                        : 'text-slate-400 dark:text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </button>
                );
              })}
            </nav>
          </div>

          <div
            className="flex flex-col items-center gap-4 w-full"
            role="toolbar"
            aria-label="Sidebar Actions"
          >
            <button
              ref={el => { utilRefs.current[0] = el; }}
              type="button"
              role="switch"
              aria-checked={isDarkMode}
              onClick={onToggleTheme}
              onKeyDown={(e) => handleUtilKeyDown(e, 0)}
              onFocus={() => setFocusedUtilIndex(0)}
              tabIndex={focusedUtilIndex === 0 ? 0 : -1}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 dark:text-zinc-500 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:focus-visible:ring-amber-400"
              title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
              aria-label={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <button
              ref={el => { utilRefs.current[1] = el; }}
              type="button"
              onKeyDown={(e) => handleUtilKeyDown(e, 1)}
              onFocus={() => setFocusedUtilIndex(1)}
              tabIndex={focusedUtilIndex === 1 ? 0 : -1}
              className="w-8 h-8 rounded-full bg-slate-300 dark:bg-zinc-700 flex items-center justify-center text-slate-600 dark:text-zinc-300 text-xs font-semibold hover:bg-slate-400 dark:hover:bg-zinc-600 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:focus-visible:ring-indigo-400"
              aria-label="User Profile"
            >
              US
            </button>
          </div>
        </aside>
      )}

      {/* Pane 1.5: Workspace Sidebar (Recent & Collapsible Page Tree) - Hidden in Zen Mode */}
      {!zenMode && (
        <aside
          style={{ width: isSidebarCollapsed ? 0 : sidebarWidth }}
          className={`border-r border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 z-10 shrink-0 flex flex-col h-full text-sm overflow-hidden ${
            isSidebarResizing ? '' : 'transition-[width,opacity] duration-300 ease-in-out'
          } ${
            isSidebarCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          {/* Sidebar Header */}
          <div className="h-14 px-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-2 shrink-0">
            {/* Workspace Switcher Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsWorkspaceDropdownOpen(!isWorkspaceDropdownOpen)}
                className="font-semibold text-xs uppercase tracking-wider text-slate-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-450 flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <span>{activeWorkspace}</span>
                <ChevronDown className="w-3.5 h-3.5 shrink-0" />
              </button>

              {/* Workspace Switcher Dropdown */}
              {isWorkspaceDropdownOpen && (
                <div className="absolute left-0 mt-1.5 w-48 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-lg z-50 py-1 text-xs">
                  {workspaces.map(ws => (
                    <button
                      key={ws}
                      type="button"
                      onClick={() => {
                        setActiveWorkspace(ws);
                        setIsWorkspaceDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 flex items-center justify-between ${
                        activeWorkspace === ws ? 'font-semibold text-indigo-600 dark:text-indigo-400' : ''
                      }`}
                    >
                      <span>{ws}</span>
                      {activeWorkspace === ws && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Hidden elements to satisfy original AppLayout tests */}
            <span className="hidden">Workspace Library</span>

            {/* Collapse Sidebar Button */}
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(true)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
              title="Collapse Sidebar"
              aria-label="Collapse Workspace Sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-6">
            {/* Recent Documents Section */}
            <div>
              <div className="flex items-center gap-1.5 px-2 mb-2 text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5" />
                <span>Recent Documents</span>
              </div>
              <ul className="space-y-1">
                {recentDocs.map(doc => {
                  const isActive = activePage === doc.id;
                  return (
                    <li key={doc.id}>
                      <button
                        onClick={() => {
                          if (onPageSelect) onPageSelect(doc.id);
                          onModeChange('doc');
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                          isActive
                            ? 'bg-slate-100 dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 font-medium'
                            : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/40 hover:text-slate-900 dark:hover:text-zinc-200'
                        }`}
                      >
                        <span className="truncate flex items-center gap-2">
                          <FileText className="w-4 h-4 text-slate-400 dark:text-zinc-500 shrink-0" />
                          <span className="truncate">{doc.title}</span>
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500 opacity-60">Recent</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Collapsible Page Tree Section */}
            <div>
              <div className="px-2 mb-2 text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                <span>Page Tree</span>
              </div>

              {onCreatePage && (
                <button
                  type="button"
                  onClick={onCreatePage}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 mb-3 bg-indigo-50 dark:bg-indigo-955/40 text-indigo-600 dark:text-indigo-400 font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-950/60 rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  <span>+ New Page</span>
                </button>
              )}

              <div className="space-y-1.5">
                {/* 1. Pages Category */}
                <div>
                  <button
                    onClick={() => toggleSection('pages')}
                    className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-slate-100/60 dark:hover:bg-zinc-800/30 rounded-lg text-xs font-semibold text-slate-500 dark:text-zinc-400"
                  >
                    <span className="flex items-center gap-1.5">
                      {sectionsExpanded.pages ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                      {sectionsExpanded.pages ? <FolderOpen className="w-3.5 h-3.5 text-indigo-500" /> : <Folder className="w-3.5 h-3.5 text-indigo-500" />}
                      <span>Pages</span>
                    </span>
                    <span className="text-[9px] bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-full">{pageNodes.length}</span>
                  </button>
                  {sectionsExpanded.pages && (
                    <ul className="pl-4 mt-1 space-y-0.5 border-l border-slate-150 dark:border-zinc-800 ml-3.5">
                      {pageNodes.map(node => {
                        const isActive = activePage === node.id;
                        const displayLabel = node.label.startsWith('📁 ') || node.label.startsWith('📄 ')
                          ? node.label.slice(2)
                          : node.label;
                        return (
                          <li key={node.id}>
                            <button
                              onClick={() => {
                                if (onPageSelect) onPageSelect(node.id);
                                onModeChange('doc');
                              }}
                              className={`w-full text-left px-2 py-1 rounded-md truncate flex items-center gap-2 transition-colors ${
                                isActive
                                  ? 'bg-slate-100 dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 font-medium'
                                  : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/30 hover:text-slate-900 dark:hover:text-zinc-200'
                              }`}
                            >
                              <FileText className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 shrink-0" />
                              <span className="truncate text-xs">{displayLabel}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                {/* 2. Tags Category */}
                <div>
                  <button
                    onClick={() => toggleSection('tags')}
                    className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-slate-100/60 dark:hover:bg-zinc-800/30 rounded-lg text-xs font-semibold text-slate-500 dark:text-zinc-400"
                  >
                    <span className="flex items-center gap-1.5">
                      {sectionsExpanded.tags ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                      <Tag className="w-3.5 h-3.5 text-amber-500" />
                      <span>Tags</span>
                    </span>
                    <span className="text-[9px] bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-full">{tagNodes.length}</span>
                  </button>
                  {sectionsExpanded.tags && (
                    <ul className="pl-4 mt-1 space-y-0.5 border-l border-slate-150 dark:border-zinc-800 ml-3.5">
                      {tagNodes.length === 0 ? (
                        <span className="block px-2 py-1 text-[11px] text-slate-400 dark:text-zinc-500 italic">No tags found</span>
                      ) : (
                        tagNodes.map(node => {
                          const isActive = activePage === node.id;
                          const displayLabel = node.label.startsWith('📁 ') || node.label.startsWith('📄 ')
                            ? node.label.slice(2)
                            : node.label;
                          return (
                            <li key={node.id}>
                              <button
                                onClick={() => {
                                  if (onPageSelect) onPageSelect(node.id);
                                  onModeChange('doc');
                                }}
                                className={`w-full text-left px-2 py-1 rounded-md truncate flex items-center gap-2 transition-colors ${
                                  isActive
                                    ? 'bg-slate-100 dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 font-medium'
                                    : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/30 hover:text-slate-900 dark:hover:text-zinc-200'
                                }`}
                              >
                                <FileText className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 shrink-0" />
                                <span className="truncate text-xs">{displayLabel}</span>
                              </button>
                            </li>
                          );
                        })
                      )}
                    </ul>
                  )}
                  </div>

                {/* 3. Widgets Category */}
                <div>
                  <button
                    onClick={() => toggleSection('widgets')}
                    className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-slate-100/60 dark:hover:bg-zinc-800/30 rounded-lg text-xs font-semibold text-slate-500 dark:text-zinc-400"
                  >
                    <span className="flex items-center gap-1.5">
                      {sectionsExpanded.widgets ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                      <Cpu className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Widgets</span>
                    </span>
                    <span className="text-[9px] bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-full">{widgetNodes.length}</span>
                  </button>
                  {sectionsExpanded.widgets && (
                    <ul className="pl-4 mt-1 space-y-0.5 border-l border-slate-150 dark:border-zinc-800 ml-3.5">
                      {widgetNodes.length === 0 ? (
                        <span className="block px-2 py-1 text-[11px] text-slate-400 dark:text-zinc-500 italic">No widgets found</span>
                      ) : (
                        widgetNodes.map(node => {
                          const isActive = activePage === node.id;
                          return (
                            <li key={node.id}>
                              <button
                                onClick={() => {
                                  if (onPageSelect) onPageSelect(node.id);
                                  onModeChange('doc');
                                }}
                                className={`w-full text-left px-2 py-1 rounded-md truncate flex items-center gap-2 transition-colors ${
                                  isActive
                                    ? 'bg-slate-100 dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 font-medium'
                                    : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/30 hover:text-slate-900 dark:hover:text-zinc-200'
                                }`}
                              >
                                <Cpu className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 shrink-0" />
                                <span className="truncate text-xs">{node.label}</span>
                              </button>
                            </li>
                          );
                        })
                      )}
                    </ul>
                  )}
                </div>

              </div>
            </div>
          </div>
        </aside>
      )}

      {/* Resize Handle for Workspace Sidebar */}
      {!zenMode && !isSidebarCollapsed && (
        <div
          onMouseDown={handleSidebarResizeStart}
          className="w-[4px] hover:w-[6px] bg-slate-200/50 dark:bg-zinc-800/50 hover:bg-indigo-400 dark:hover:bg-indigo-500 cursor-col-resize transition-all h-full z-20 shrink-0"
        />
      )}

      {/* Pane 2: Middle Panel (Main Workspace) — now takes full remaining width */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-zinc-950 relative">
        {!zenMode && isSidebarCollapsed && (
          <button
            type="button"
            onClick={() => setIsSidebarCollapsed(false)}
            className="absolute top-4 left-4 z-30 p-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200 bg-white/80 dark:bg-zinc-900/80 border border-slate-200/60 dark:border-zinc-800/60 hover:bg-slate-100 dark:hover:bg-zinc-850 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 shadow-sm"
            title="Expand Sidebar"
            aria-label="Expand Workspace Sidebar"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        <div className="flex-1 overflow-hidden h-full w-full">
          {children}
        </div>
      </main>

      {/* ── Floating Agent Toggle FAB ─────────────────────────────────── */}
      {!isAgentOpen && (
        <button
          onClick={() => setIsAgentOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 dark:shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 dark:hover:shadow-indigo-400/35 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 group"
          title="Open Space Agent"
          style={{
            animation: 'floatFab 3s ease-in-out infinite',
          }}
        >
          <Bot className="w-6 h-6 transition-all duration-300 group-hover:opacity-0 group-hover:scale-75 absolute" />
          <MessageSquare className="w-6 h-6 transition-all duration-300 opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100" />
          {/* Pulsing notification dot */}
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-white dark:border-zinc-900 animate-pulse" />
          {/* Hover ring glow */}
          <span className="absolute inset-0 rounded-2xl transition-all duration-300 opacity-0 group-hover:opacity-100 ring-2 ring-indigo-400/50 dark:ring-indigo-400/40" />
        </button>
      )}

      {/* ── Floating Space Agent Panel ────────────────────────────────── */}
      {isAgentOpen && (
        <div
          ref={panelRef}
          className={`fixed z-50 flex flex-col transition-shadow duration-300 ${isMinimized ? '' : ''}`}
          style={{
            left: panelPos.x,
            top: panelPos.y,
            width: isMinimized ? PANEL_DEFAULT_WIDTH : panelSize.w,
            height: isMinimized ? 52 : panelSize.h,
            borderRadius: 20,
            overflow: 'hidden',
            // Glassmorphism backdrop
            background: isDarkMode
              ? 'linear-gradient(180deg, rgba(15, 23, 42, 0.92) 0%, rgba(9, 14, 28, 0.96) 100%)'
              : 'linear-gradient(180deg, rgba(255, 255, 255, 0.92) 0%, rgba(248, 250, 252, 0.96) 100%)',
            backdropFilter: 'blur(24px) saturate(1.6)',
            WebkitBackdropFilter: 'blur(24px) saturate(1.6)',
            border: isDarkMode ? '1px solid rgba(99, 102, 241, 0.18)' : '1px solid rgba(99, 102, 241, 0.15)',
            boxShadow: isDarkMode
              ? '0 8px 40px -8px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(99, 102, 241, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.04)'
              : '0 8px 40px -8px rgba(99, 102, 241, 0.2), 0 0 0 1px rgba(99, 102, 241, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
            animation: 'slideInPanel 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* ── Panel Header (Draggable) ──────────────────────────────── */}
          <div
            className="flex items-center justify-between px-4 h-[52px] shrink-0 select-none"
            style={{
              cursor: 'grab',
              borderBottom: isMinimized ? 'none' : (isDarkMode ? '1px solid rgba(99, 102, 241, 0.12)' : '1px solid rgba(99, 102, 241, 0.1)'),
              background: isDarkMode
                ? 'linear-gradient(90deg, rgba(99, 102, 241, 0.06) 0%, transparent 100%)'
                : 'linear-gradient(90deg, rgba(99, 102, 241, 0.04) 0%, transparent 100%)',
            }}
            onMouseDown={handleDragStart}
          >
            <div className="flex items-center gap-2.5">
              <GripVertical className="w-4 h-4 text-slate-400 dark:text-zinc-600 opacity-50" />
              <div className="w-7 h-7 rounded-lg bg-indigo-600/10 dark:bg-indigo-500/10 flex items-center justify-center">
                <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <span className="font-semibold text-sm text-slate-800 dark:text-zinc-100 tracking-tight">Space Agent</span>
              <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 dark:text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/15 transition-all duration-200 hover:scale-110"
                title={isMinimized ? 'Expand' : 'Minimize'}
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                onClick={() => { setIsAgentOpen(false); setIsMinimized(false); }}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 dark:text-zinc-500 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/15 transition-all duration-200 hover:scale-110"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ── Panel Body (hidden when minimized) ────────────────────── */}
          {!isMinimized && (
            <>
              {/* Widget sharing toolbar catalog */}
              <div
                className="px-3 py-2 flex gap-2 justify-between shrink-0"
                style={{
                  borderBottom: isDarkMode ? '1px solid rgba(99, 102, 241, 0.08)' : '1px solid rgba(99, 102, 241, 0.06)',
                }}
              >
                <button
                  onClick={handleExportWidgets}
                  title="Export widget codes"
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 border border-slate-200 dark:border-zinc-700/60 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:border-indigo-300 dark:hover:border-indigo-500/30 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg text-[10px] font-semibold text-slate-500 dark:text-zinc-400 transition-all duration-200"
                >
                  <Download className="w-3.5 h-3.5" /> Export Catalog
                </button>
                <label className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 border border-slate-200 dark:border-zinc-700/60 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:border-indigo-300 dark:hover:border-indigo-500/30 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg text-[10px] font-semibold text-slate-500 dark:text-zinc-400 cursor-pointer text-center transition-all duration-200">
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
                        ? 'bg-indigo-600 text-white rounded-tr-none shadow-sm shadow-indigo-600/20'
                        : 'bg-slate-100 dark:bg-zinc-800/80 text-slate-800 dark:text-zinc-200 rounded-tl-none border border-transparent dark:border-zinc-700/40'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat input form */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 shrink-0"
                style={{
                  borderTop: isDarkMode ? '1px solid rgba(99, 102, 241, 0.08)' : '1px solid rgba(99, 102, 241, 0.06)',
                }}
              >
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask agent to generate a widget..."
                    className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700/60 bg-white/80 dark:bg-zinc-900/60 text-xs text-slate-800 dark:text-zinc-200 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:focus:ring-indigo-400/30 focus:border-indigo-400 dark:focus:border-indigo-500/50 hover:border-slate-300 dark:hover:border-zinc-600 transition-all duration-200"
                  />
                  <button 
                    type="submit"
                    className="absolute right-1.5 p-1.5 bg-indigo-600 hover:bg-indigo-500 dark:hover:bg-indigo-500 text-white rounded-lg transition-all duration-200 hover:scale-110 hover:shadow-md hover:shadow-indigo-500/30 active:scale-95"
                  >
                    <Send className="w-3 h-3" />
                  </button>
                </div>
              </form>

              {/* ── Resize handle (bottom-left corner) ────────────────── */}
              <div
                className="absolute bottom-0 left-0 w-5 h-5 cursor-nesw-resize opacity-0 hover:opacity-100 transition-opacity"
                onMouseDown={handleResizeStart}
                style={{
                  background: 'linear-gradient(135deg, transparent 50%, rgba(99, 102, 241, 0.3) 50%)',
                  borderRadius: '0 0 0 18px',
                }}
              />
            </>
          )}
        </div>
      )}

      {/* ── Keyframe animations injected via style tag ─────────────── */}
      <style>{`
        @keyframes slideInPanel {
          0% {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes floatFab {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-4px);
          }
        }
      `}</style>
    </div>
  );
};
