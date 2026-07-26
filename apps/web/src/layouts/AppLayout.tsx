/**
 * z-index layering reference:
 * - Modals & Overlays (e.g. AuthModal, SettingsModal, CommandPalette): z-[100]
 * - Floating UI & Rails (e.g. Left/Right rails, Floating Space Agent Panel, FAB): z-20 to z-40
 * - Workspace / Editor Content (e.g. Doc Editor, Canvas elements): z-0 to z-10
 */

import React, { useState, useRef, useCallback, useEffect } from "react";
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
  Trash2,
  Menu,
  Copy,
  Info,
  List,
  Star,
  History,
  Calendar,
  RefreshCw,
  CloudOff,
  AlertTriangle,
  AlertCircle,
  Cloud
} from 'lucide-react';

export type ActiveMode = "doc" | "canvas" | "graph" | "journals" | "settings";

const WIDGET_TEMPLATES = {
  clock: `
    <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
      <div id="clock-face" style="width: 100px; height: 100px; border-radius: 50%; border: 3px solid var(--primary); position: relative; background: transparent;">
        <div id="hour-hand" style="width: 4px; height: 30px; background: var(--foreground); position: absolute; left: 48px; top: 20px; transform-origin: bottom center; border-radius: 2px;"></div>
        <div id="minute-hand" style="width: 2.5px; height: 40px; background: var(--foreground); position: absolute; left: 48.75px; top: 10px; transform-origin: bottom center; border-radius: 1px;"></div>
        <div id="second-hand" style="width: 1px; height: 45px; background: #ef4444; position: absolute; left: 49.5px; top: 5px; transform-origin: bottom center;"></div>
        <div style="width: 6px; height: 6px; background: var(--primary); border-radius: 50%; position: absolute; left: 47px; top: 47px;"></div>
      </div>
      <div id="digital-time" style="font-size: 14px; font-weight: bold; font-family: monospace;">12:00:00 PM</div>
    </div>
    <script>
      function updateClock() {
        const now = new Date();
        const hrs = now.getHours();
        const mins = now.getMinutes();
        const secs = now.getSeconds();

        const hrDeg = (hrs % 12) * 30 + mins * 0.5;
        const minDeg = mins * 6;
        const secDeg = secs * 6;

        document.getElementById('hour-hand').style.transform = 'rotate(' + hrDeg + 'deg)';
        document.getElementById('minute-hand').style.transform = 'rotate(' + minDeg + 'deg)';
        document.getElementById('second-hand').style.transform = 'rotate(' + secDeg + 'deg)';

        document.getElementById('digital-time').innerText = now.toLocaleTimeString();
      }
      setInterval(updateClock, 1000);
      updateClock();
    </script>
  `,
  calculator: `
    <div style="background: var(--background); border: 1px solid var(--border); border-radius: 12px; padding: 12px; display: grid; gap: 8px; width: 180px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
      <input id="calc-display" type="text" readonly style="width: 100%; border: 1px solid var(--border); background: var(--background); color: var(--foreground); text-align: right; padding: 8px; border-radius: 6px; font-size: 14px; box-sizing: border-box;" value="0" />
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px;">
        <button onclick="press('C')" style="grid-column: span 2; background: #ef4444; color: white; border: none; padding: 8px; border-radius: 6px; font-size: 11px; cursor: pointer;">C</button>
        <button onclick="press('/')" style="background: var(--primary); color: white; border: none; padding: 8px; border-radius: 6px; font-size: 11px; cursor: pointer;">/</button>
        <button onclick="press('*')" style="background: var(--primary); color: white; border: none; padding: 8px; border-radius: 6px; font-size: 11px; cursor: pointer;">*</button>

        <button onclick="press('7')" style="background: var(--border); color: var(--foreground); border: none; padding: 8px; border-radius: 6px; font-size: 11px; cursor: pointer;">7</button>
        <button onclick="press('8')" style="background: var(--border); color: var(--foreground); border: none; padding: 8px; border-radius: 6px; font-size: 11px; cursor: pointer;">8</button>
        <button onclick="press('9')" style="background: var(--border); color: var(--foreground); border: none; padding: 8px; border-radius: 6px; font-size: 11px; cursor: pointer;">9</button>
        <button onclick="press('-')" style="background: var(--primary); color: white; border: none; padding: 8px; border-radius: 6px; font-size: 11px; cursor: pointer;">-</button>

        <button onclick="press('4')" style="background: var(--border); color: var(--foreground); border: none; padding: 8px; border-radius: 6px; font-size: 11px; cursor: pointer;">4</button>
        <button onclick="press('5')" style="background: var(--border); color: var(--foreground); border: none; padding: 8px; border-radius: 6px; font-size: 11px; cursor: pointer;">5</button>
        <button onclick="press('6')" style="background: var(--border); color: var(--foreground); border: none; padding: 8px; border-radius: 6px; font-size: 11px; cursor: pointer;">6</button>
        <button onclick="press('+')" style="background: var(--primary); color: white; border: none; padding: 8px; border-radius: 6px; font-size: 11px; cursor: pointer;">+</button>

        <button onclick="press('1')" style="background: var(--border); color: var(--foreground); border: none; padding: 8px; border-radius: 6px; font-size: 11px; cursor: pointer;">1</button>
        <button onclick="press('2')" style="background: var(--border); color: var(--foreground); border: none; padding: 8px; border-radius: 6px; font-size: 11px; cursor: pointer;">2</button>
        <button onclick="press('3')" style="background: var(--border); color: var(--foreground); border: none; padding: 8px; border-radius: 6px; font-size: 11px; cursor: pointer;">3</button>
        <button onclick="press('=')" style="grid-row: span 2; background: #10b981; color: white; border: none; padding: 8px; border-radius: 6px; font-size: 11px; cursor: pointer;">=</button>

        <button onclick="press('0')" style="grid-column: span 2; background: var(--border); color: var(--foreground); border: none; padding: 8px; border-radius: 6px; font-size: 11px; cursor: pointer;">0</button>
        <button onclick="press('.')" style="background: var(--border); color: var(--foreground); border: none; padding: 8px; border-radius: 6px; font-size: 11px; cursor: pointer;">.</button>
      </div>
    </div>
    <script>
      const display = document.getElementById('calc-display');
      window.press = function(val) {
        if (val === 'C') {
          display.value = '0';
        } else if (val === '=') {
          try {
            if (/^[0-9+*/. -]+$/.test(display.value)) {
              display.value = new Function('return (' + display.value + ')')() || '0';
            } else {
              display.value = 'Error';
            }
          } catch(e) {
            display.value = 'Error';
          }
        } else {
          if (display.value === '0' || display.value === 'Error') {
            display.value = val;
          } else {
            display.value += val;
          }
        }
      }
    </script>
  `,
  todo: `
    <div style="width: 100%; max-width: 220px; border: 1px solid var(--border); padding: 12px; border-radius: 12px; display: flex; flex-direction: column; gap: 8px;">
      <h4 style="margin: 0; font-size: 12px; font-weight: bold;">Quick Tasks</h4>
      <div style="display: flex; gap: 4px;">
        <input id="todo-in" type="text" style="flex: 1; border: 1px solid var(--border); background: var(--background); color: var(--foreground); font-size: 10px; padding: 4px; border-radius: 4px;" placeholder="Add new task..." />
        <button onclick="addTodo()" style="background: var(--primary); border: none; color: white; padding: 4px 8px; border-radius: 4px; font-size: 10px; cursor: pointer;">Add</button>
      </div>
      <ul id="todo-list" style="margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 4px; max-height: 80px; overflow-y: auto; font-size: 10px;">
        <li style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding: 2px 0;">
          <span>Draft proposal</span>
          <button onclick="this.parentNode.remove()" style="background: none; border: none; color: red; font-size: 9px; cursor: pointer;">✕</button>
        </li>
      </ul>
    </div>
    <script>
      window.addTodo = function() {
        const input = document.getElementById('todo-in');
        if (!input.value.trim()) return;
        const li = document.createElement('li');
        li.style.display = 'flex';
        li.style.justifyContent = 'space-between';
        li.style.alignItems = 'center';
        li.style.borderBottom = '1px solid var(--border)';
        li.style.padding = '2px 0';
        const sanitizedVal = input.value.replace(/[&<>"']/g, function(m) {
          return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
        });
        li.innerHTML = '<span>' + sanitizedVal + '</span><button onclick="this.parentNode.remove()" style="background: none; border: none; color: red; font-size: 9px; cursor: pointer;">✕</button>';
        document.getElementById('todo-list').appendChild(li);
        input.value = '';
      }
    </script>
  `
};

interface AppLayoutProps {
  activeMode: ActiveMode;
  onModeChange: (mode: ActiveMode) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  zenMode?: boolean;
  currentWorkspace?: string;
  onWorkspaceChange?: (workspace: string) => void;
  children: React.ReactNode;
  activePage?: string;
  onPageSelect?: (pageId: string) => void;
  pageTitle?: string;
  userEmail?: string;
  onAuthTrigger?: () => void;
  onCreatePage?: () => void;
  syncStatus?: 'saved' | 'saving' | 'offline' | 'error' | 'conflict';
  conflictMsg?: string | null;
  onResolveConflict?: (resolution: 'local' | 'remote') => void;
  onDismissConflict?: () => void;
}

import { requestLlmWidget, SandboxFrame } from '@catnoted/agent-runtime';
import { useDocumentStore, renderPageIcon } from '@catnoted/editor';
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
  onCreatePage,
  syncStatus = 'saved',
  conflictMsg = null,
  onResolveConflict,
  onDismissConflict
}) => {
  const { blocks, addBlock, updateBlockType, pages, createPage, deletePage, deleteBlock, pageMeta, updatePageMeta } = useDocumentStore(activePage);
  const favoritePages = (pages || []).filter((p: any) => p?.isFavorite);

  const [activeAgentTab, setActiveAgentTab] = useState<'chat' | 'widgets'>('chat');

  const handleDeletePage = (pageId: string, pageTitle: string) => {
    if (pageId === 'root-doc-node') return;
    if (confirm(`Hapus halaman "${pageTitle}"? Tindakan ini tidak dapat dibatalkan.`)) {
      deletePage(pageId);
      if (onPageSelect) onPageSelect('root-doc-node');
    }
  };

  // Parse document graph nodes
  const graphData = React.useMemo(() => {
    return parseDocumentGraph(blocks, pages);
  }, [blocks, pages]);

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
        return { id: n.id, title: n.rawName || n.label, icon: n.icon };
      });

    const rootPageMeta = pages?.find(p => p.id === 'root-doc-node');

    return [
      { id: 'root-doc-node', title: docTitle, icon: rootPageMeta?.icon || '📁' },
      ...otherPages
    ];
  }, [pageNodes, docTitle, pages]);

  // Right Sidebar State
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState<boolean>(false);
  const [activeRightSidebarTab, setActiveRightSidebarTab] = useState<'info' | 'outline' | 'agent' | 'history'>('info');

  useEffect(() => {
    const savedRightOpen = localStorage.getItem('catnoted:right-sidebar-open');
    if (savedRightOpen !== null) {
      setIsRightSidebarOpen(savedRightOpen === 'true');
    }
    const savedRightTab = localStorage.getItem('catnoted:right-sidebar-tab');
    if (savedRightTab !== null) {
      setActiveRightSidebarTab(savedRightTab as any);
    }
  }, []);

  const toggleRightSidebar = (tab: 'info' | 'outline' | 'agent' | 'history') => {
    if (isRightSidebarOpen && activeRightSidebarTab === tab) {
      setIsRightSidebarOpen(false);
      localStorage.setItem('catnoted:right-sidebar-open', 'false');
    } else {
      setActiveRightSidebarTab(tab);
      setIsRightSidebarOpen(true);
      localStorage.setItem('catnoted:right-sidebar-open', 'true');
      localStorage.setItem('catnoted:right-sidebar-tab', tab);
    }
  };

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
    favorites: true,
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

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'agent'; text: string; code?: string; editProposal?: string }>>([
    { sender: 'agent', text: "Hello! I am your Space Agent. What would you like to build or note down today?" }
  ]);

  // ── Sidebar Keyboard Navigation & Focus Management ──────────────────
  const navRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [focusedNavIndex, setFocusedNavIndex] = useState(0);

  useEffect(() => {
    const activeIndex = ['doc', 'canvas', 'graph', 'journals', 'settings'].indexOf(activeMode);
    if (activeIndex !== -1) {
      setFocusedNavIndex(activeIndex);
    }
  }, [activeMode]);

  const handleNavKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex = index;
    const maxIndex = 4; // 5 items (0 to 4)

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
  const [panelSize, setPanelSize] = useState({
    w: PANEL_DEFAULT_WIDTH,
    h: PANEL_DEFAULT_HEIGHT,
  });

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
  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      // Only drag from the header grip area
      if ((e.target as HTMLElement).closest("button")) return;
      e.preventDefault();
      isDragging.current = true;
      dragOffset.current = {
        x: e.clientX - panelPos.x,
        y: e.clientY - panelPos.y,
      };

      const handleMove = (ev: MouseEvent) => {
        if (!isDragging.current) return;
        const newX = Math.max(
          0,
          Math.min(
            window.innerWidth - panelSize.w,
            ev.clientX - dragOffset.current.x,
          ),
        );
        const newY = Math.max(
          0,
          Math.min(window.innerHeight - 48, ev.clientY - dragOffset.current.y),
        );
        setPanelPos({ x: newX, y: newY });
      };

      const handleUp = () => {
        isDragging.current = false;
        document.removeEventListener("mousemove", handleMove);
        document.removeEventListener("mouseup", handleUp);
      };

      document.addEventListener("mousemove", handleMove);
      document.addEventListener("mouseup", handleUp);
    },
    [panelPos, panelSize.w],
  );

  // ── Resize handlers (bottom-left corner) ───────────────────────────
  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      isResizing.current = true;
      resizeStart.current = {
        x: e.clientX,
        y: e.clientY,
        w: panelSize.w,
        h: panelSize.h,
      };

      const handleMove = (ev: MouseEvent) => {
        if (!isResizing.current) return;
        const dw = resizeStart.current.x - ev.clientX; // left edge moves left = larger
        const dh = ev.clientY - resizeStart.current.y;
        const newW = Math.max(PANEL_MIN_WIDTH, resizeStart.current.w + dw);
        const newH = Math.max(PANEL_MIN_HEIGHT, resizeStart.current.h + dh);

        // Adjust position to keep right edge anchored
        setPanelSize({ w: newW, h: newH });
        setPanelPos((prev) => ({
          x: Math.max(0, prev.x - (newW - panelSize.w)),
          y: prev.y,
        }));
      };

      const handleUp = () => {
        isResizing.current = false;
        document.removeEventListener("mousemove", handleMove);
        document.removeEventListener("mouseup", handleUp);
      };

      document.addEventListener("mousemove", handleMove);
      document.addEventListener("mouseup", handleUp);
    },
    [panelSize, panelPos],
  );

    const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    setMessages((prev) => [...prev, { sender: "user", text: userMsg }]);
    setChatInput("");

    try {
      const response = await requestLlmWidget(userMsg);
      setMessages((prev) => [
        ...prev,
        { sender: "agent", text: response.text },
      ]);

      const newBlockId = addBlock(null, "widget", "");
      updateBlockType(newBlockId, "widget", {
        widgetId: `ai-widget-${Math.random().toString(36).substring(2, 6)}`,
        srcDoc: response.code,
      });
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "agent",
          text: "Failed to request LLM widget sandbox compiles.",
        },
      ]);
    }
  };

  // Export all widgets from the document store as JSON catalog
  const handleExportWidgets = () => {
    const widgets = blocks.filter((b) => b.type === "widget");
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(widgets, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "catnoted-widgets.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Cache parsed graph nodes based on block updates, not search query

  // Search filtering logic
// Search filtering logic

const parsedGraphNodes = React.useMemo(() => {
  return parseDocumentGraph(blocks).nodes;
}, [blocks]);

const searchResults = React.useMemo(() => {
  if (!searchQuery.trim()) return [];

  const query = searchQuery.toLowerCase();
  const results: Array<{ id: string; type: string; content: string; icon: React.ElementType }> = [];

  // Search in headings / text
  blocks.forEach(block => {
    if ((block.type === 'heading' || block.type === 'text') && block.content.toLowerCase().includes(query)) {
      results.push({
        id: block.id,
        type: block.type,
        content: block.content,
        icon: FileText
      });
    }
  });

  // Search in graph nodes (pages/tags)
  parsedGraphNodes.forEach(node => {
    if (node.label.toLowerCase().includes(query) && node.id !== 'root-doc-node') {
      if (!results.some(r => r.content.includes(node.label.replace(/[📄#]/g, '').trim()))) {
        results.push({
          id: node.id,
          type: node.type,
          content: node.label,
          icon: FileText
        });
      }
    }
  });

  return results;
}, [blocks, parsedGraphNodes, searchQuery]);

if (isSearchOpen && searchQuery) {
  console.log(searchResults, setSearchQuery, setIsSearchOpen);
}

  // Import widgets catalog and insert them into Yjs store
  const handleImportWidgets = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const files = e.target.files;
    if (!files || files.length === 0) return;

    fileReader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const widgetList = Array.isArray(parsed) ? parsed : [parsed];

        widgetList.forEach((widget) => {
          if (widget.type === "widget" && widget.properties?.srcDoc) {
            const newId = addBlock(null, "widget", "");
            updateBlockType(newId, "widget", {
              widgetId: widget.properties.widgetId || "imported-widget",
              srcDoc: widget.properties.srcDoc,
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
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-[#141416] text-slate-900 dark:text-zinc-100 relative">
      {/* Minimal Conflict Resolution Dialog */}
      {syncStatus === 'conflict' && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" data-testid="conflict-resolution-modal">
          <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 max-w-md w-full shadow-2xl animate-in fade-in-50 zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Version Divergence Detected</h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
                  {conflictMsg || 'Your local edits conflict with newer revisions already saved on the server. Please resolve the conflict below.'}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => onResolveConflict?.('local')}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-semibold transition-all hover:shadow-lg hover:shadow-indigo-500/10 active:scale-98"
                data-testid="resolve-local-btn"
              >
                Keep Local Changes (Overwrite Remote)
              </button>
              <button
                type="button"
                onClick={() => onResolveConflict?.('remote')}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 text-slate-700 dark:text-zinc-300 rounded-2xl text-xs font-semibold transition-all active:scale-98"
                data-testid="resolve-remote-btn"
              >
                Discard Local Changes (Accept Remote)
              </button>
            </div>

            <div className="mt-4 flex justify-end border-t border-slate-100 dark:border-zinc-900 pt-3">
              <button
                type="button"
                onClick={onDismissConflict}
                className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors"
                data-testid="dismiss-conflict-btn"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pane 1: Left Sidebar (Navigation) - Hidden in Zen Mode */}
      {!zenMode && (
        <aside className="w-14 flex flex-col items-center justify-between py-3 border-r border-soft dark:border-soft bg-surface z-20 shrink-0">
          <div className="flex flex-col items-center gap-4 w-full">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white font-bold text-xs shadow-sm dark:shadow-none">
              CN
            </div>

            <nav className="flex flex-col gap-2 w-full px-1.5" aria-label="Sidebar Navigation">
              {[
                { id: 'doc', icon: FileText, label: 'Doc Mode' },
                { id: 'canvas', icon: Layout, label: 'Canvas' },
                { id: 'graph', icon: Network, label: 'Graph' },
                { id: 'journals', icon: Calendar, label: 'Journals' },
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
                      aria-expanded={isActive}
                    className={`w-full py-2.5 rounded-lg flex items-center justify-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent dark:focus-visible:ring-accent ${
                      isActive 
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold'
                        : 'text-slate-400 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                );
              })}
            </nav>
          </div>

          <div
            className="flex flex-col items-center gap-3 w-full px-1.5"
            role="toolbar"
            aria-label="Sidebar Actions"
          >
            {/* Sync Status Indicator Icon Rail */}
            <div className="w-full flex flex-col items-center justify-center py-2 border-t border-slate-200/50 dark:border-zinc-800/50 gap-1.5">
              {syncStatus === 'saving' && (
                <div className="text-amber-500 hover:text-amber-600 transition-colors p-1" title="Syncing / Saving updates" data-testid="sync-status-saving">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                </div>
              )}
              {syncStatus === 'saved' && (
                <div className="text-emerald-500 hover:text-emerald-600 transition-colors p-1" title="All changes synced" data-testid="sync-status-saved">
                  <Cloud className="w-4 h-4" />
                </div>
              )}
              {syncStatus === 'offline' && (
                <div className="text-slate-400 dark:text-zinc-500 hover:text-slate-500 transition-colors p-1" title="Offline mode" data-testid="sync-status-offline">
                  <CloudOff className="w-4 h-4" />
                </div>
              )}
              {syncStatus === 'conflict' && (
                <div className="text-rose-500 hover:text-rose-600 transition-colors p-1" title="Sync Version Conflict" data-testid="sync-status-conflict">
                  <AlertTriangle className="w-4 h-4 animate-pulse" />
                </div>
              )}
              {syncStatus === 'error' && (
                <div className="text-rose-500 hover:text-rose-600 transition-colors p-1" title="Sync Error" data-testid="sync-status-error">
                  <AlertCircle className="w-4 h-4" />
                </div>
              )}
            </div>

            <button
              ref={el => { utilRefs.current[0] = el; }}
              type="button"
              role="switch"
              aria-checked={isDarkMode}
              onClick={onToggleTheme}
              onKeyDown={(e) => handleUtilKeyDown(e, 0)}
              onFocus={() => setFocusedUtilIndex(0)}
              tabIndex={focusedUtilIndex === 0 ? 0 : -1}
              className="w-full py-2.5 rounded-lg flex items-center justify-center text-ink-muted hover:text-warning hover:bg-warning-soft transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:focus-visible:ring-amber-400"
              title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
              aria-label={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              ref={el => { utilRefs.current[1] = el; }}
              type="button"
              onKeyDown={(e) => handleUtilKeyDown(e, 1)}
              onFocus={() => setFocusedUtilIndex(1)}
              tabIndex={focusedUtilIndex === 1 ? 0 : -1}
              className="w-7 h-7 rounded-full bg-surface-hover flex items-center justify-center text-ink text-[10px] font-semibold hover:bg-surface transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent dark:focus-visible:ring-accent"
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
          style={{ width: isSidebarCollapsed ? 56 : sidebarWidth }}
          className={`border-r border-soft dark:border-soft bg-surface dark:bg-surface z-20 shrink-0 flex flex-col h-full text-sm overflow-hidden ${
            isSidebarResizing ? '' : 'transition-[width,opacity] duration-300 ease-in-out'
          }`}
        >
          <div className="h-14 px-3 border-b border-soft dark:border-soft flex items-center justify-between gap-2 shrink-0">
            {isSidebarCollapsed ? (
              <button
                type="button"
                onClick={() => setIsSidebarCollapsed(false)}
                className="mx-auto flex items-center justify-center w-8 h-8 rounded-lg text-ink hover:bg-surface-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                title="Expand Sidebar"
                aria-label="Expand Workspace Sidebar"
                aria-expanded={false}
              >
                <span className="w-6 h-6 rounded-md bg-accent text-white text-[10px] font-bold flex items-center justify-center shadow-sm">CN</span>
              </button>
            ) : (
              <>
                <div className="relative flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => setIsWorkspaceDropdownOpen(!isWorkspaceDropdownOpen)}
                    title={activeWorkspace}
                    className="font-semibold text-xs text-ink hover:text-ink flex items-center justify-between w-full gap-1.5 py-1 px-2 rounded-lg hover:bg-surface-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <span className="truncate min-w-0" title={activeWorkspace}>{activeWorkspace}</span>
                    <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                  </button>

                  {isWorkspaceDropdownOpen && (
                    <div className="absolute left-0 mt-1.5 w-48 bg-surface dark:bg-surface border border-soft rounded-xl shadow-lg z-50 py-1 text-xs">
                      {workspaces.map(ws => (
                        <button
                          key={ws}
                          type="button"
                          onClick={() => {
                            setActiveWorkspace(ws);
                            setIsWorkspaceDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2 text-left hover:bg-surface-soft text-ink flex items-center justify-between ${
                            activeWorkspace === ws ? 'font-semibold text-ink' : ''
                          }`}
                        >
                          <span>{ws}</span>
                          {activeWorkspace === ws && <span className="w-1.5 h-1.5 rounded-full bg-accent" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsSidebarCollapsed(true)}
                  className="p-1 rounded-lg text-ink-muted hover:text-ink dark:hover:text-ink-muted hover:bg-surface-hover transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                  title="Collapse Sidebar"
                  aria-label="Collapse Workspace Sidebar"
                  aria-expanded={true}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-hidden min-w-[160px]">
            <div className="p-3 space-y-6">
            {/* Workspace Views Navigation Indicator Section */}
            <div>
              <div className="flex items-center gap-1.5 px-2 mb-2 text-[10px] font-bold text-ink-muted uppercase tracking-wider">
                <span>Workspace Views</span>
              </div>
              <ul className="space-y-1">
                {[
                  { id: 'doc' as const, icon: FileText, label: 'Doc Mode' },
                  { id: 'canvas' as const, icon: Layout, label: 'Canvas' },
                  { id: 'graph' as const, icon: Network, label: 'Graph' },
                  { id: 'journals' as const, icon: Calendar, label: 'Journals' },
                  { id: 'settings' as const, icon: Settings, label: 'Settings' }
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeMode === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => onModeChange(item.id)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 transition-colors ${
                          isActive
                            ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold'
                            : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/40 hover:text-slate-900 dark:hover:text-zinc-200'
                        }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-accent' : 'text-ink-muted'}`} />
                        <span className="truncate">{item.label}</span>
                        {isActive && (
                          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accent dark:bg-accent" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Recent Documents Section */}
            <div>
              <div className="flex items-center gap-1.5 px-2 mb-2 text-[10px] font-bold text-ink-muted uppercase tracking-wider">
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
                            ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold'
                            : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/40 hover:text-slate-900 dark:hover:text-zinc-200'
                        }`}
                      >
                        <div className="flex items-center min-w-0 flex-1 gap-x-2.5" title={doc.title}>
                          {renderPageIcon(doc.icon, "w-4 h-4 text-slate-400 dark:text-zinc-500 shrink-0 flex items-center justify-center")}
                          <span className="truncate min-w-0">{doc.title}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500 opacity-60 shrink-0 ml-1">Recent</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Collapsible Page Tree Section */}
            <div>
              <div className="px-2 mb-2 flex items-center justify-between">
                <div className="text-[10px] font-bold text-ink-muted uppercase tracking-wider">
                  <span>Page Tree</span>
                </div>
                <button onClick={() => {
                    const title = prompt('Enter page title', 'Untitled');
                    if (title && createPage) {
                        const newId = createPage(title);
                        if (onPageSelect) onPageSelect(newId);
                    }
                }} className="text-xs text-accent hover:text-accent font-semibold cursor-pointer px-1">+ Add</button>
              </div>

              {onCreatePage && (
                <button
                  type="button"
                  id="tour-new-page"
                  onClick={onCreatePage}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 mb-3 bg-surface-soft dark:bg-surface-hover text-ink font-medium hover:bg-surface-hover rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <span>+ New Page</span>
                </button>
              )}

              <div className="space-y-1.5">
                {/* 0. Favorites Category */}
                {favoritePages.length > 0 && (
                  <div>
                    <button
                      onClick={() => toggleSection('favorites')}
                      className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-surface-hover/60 dark:hover:bg-surface-hover/30 rounded-lg text-xs font-semibold text-ink-secondary"
                    >
                      <span className="flex items-center gap-1.5">
                        {sectionsExpanded.favorites ? <ChevronDown className="w-3.5 h-3.5 text-ink-muted" /> : <ChevronRight className="w-3.5 h-3.5 text-ink-muted" />}
                        <span className="text-xs">⭐</span>
                        <span>Favorites</span>
                      </span>
                      <span className="text-[9px] bg-warning-soft text-warning px-1.5 py-0.5 rounded-full font-bold">{favoritePages.length}</span>
                    </button>
                    {sectionsExpanded.favorites && (
                      <ul className="pl-4 mt-1 space-y-0.5 border-l border-warning-soft dark:border-warning-soft/40 ml-3.5">
                        {favoritePages.map((node: any) => {
                          const isActive = activePage === node.id;
                          const displayLabel = node.title || 'Untitled';
                          return (
                            <li key={node.id}>
                              <button
                                onClick={() => {
                                  if (onPageSelect) onPageSelect(node.id);
                                  onModeChange('doc');
                                }}
                                className={`w-full text-left px-2 py-1 rounded-md truncate flex items-center gap-2 transition-colors ${
                                  isActive
                                    ? 'bg-warning-soft dark:bg-warning-soft/30 text-warning-foreground font-medium'
                                    : 'text-ink hover:bg-surface-soft dark:hover:bg-surface-hover/30 hover:text-ink dark:hover:text-ink'
                                }`}
                              >
                                {renderPageIcon(node.icon, "w-3.5 h-3.5 shrink-0 flex items-center justify-center")}
                                <span className="truncate text-xs min-w-0" title={displayLabel}>{displayLabel}</span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                )}

                {/* 1. Pages Category */}
                <div>
                  <button
                    onClick={() => toggleSection('pages')}
                    id="tour-command-palette"
            className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-surface-hover/60 dark:hover:bg-surface-hover/30 rounded-lg text-xs font-semibold text-ink-secondary"
                  >
                    <span className="flex items-center gap-1.5">
                      {sectionsExpanded.pages ? <ChevronDown className="w-3.5 h-3.5 text-ink-muted" /> : <ChevronRight className="w-3.5 h-3.5 text-ink-muted" />}
                      {sectionsExpanded.pages ? <FolderOpen className="w-3.5 h-3.5 text-accent" /> : <Folder className="w-3.5 h-3.5 text-accent" />}
                      <span>Pages</span>
                    </span>
                    <span className="text-[9px] bg-surface-hover px-1.5 py-0.5 rounded-full">{Object.keys(pages || {}).length}</span>
                  </button>
                  {sectionsExpanded.pages && (
                    <ul className="pl-4 mt-1 space-y-0.5 border-l border-soft dark:border-soft ml-3.5">
                      {Object.values(pages || {}).map((node: any) => {
                        const isActive = activePage === node.id;
                        const displayLabel = node.title || 'Untitled';
                        return (
                          <li key={node.id} className="group/pageitem">
                            <div className="flex items-center">
                              <button
                                onClick={() => {
                                  if (onPageSelect) onPageSelect(node.id);
                                  onModeChange('doc');
                                }}
                                className={`flex-1 text-left px-2 py-1 rounded-md truncate flex items-center gap-2 transition-colors ${
                                  isActive
                                    ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold'
                                    : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/30 hover:text-slate-900 dark:hover:text-zinc-200'
                                }`}
                              >
                                {renderPageIcon(node.icon, "w-3.5 h-3.5 shrink-0 flex items-center justify-center")}
                                <span className="truncate text-xs min-w-0" title={displayLabel}>{displayLabel}</span>
                              </button>
                              {node.id !== 'root-doc-node' && (
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); handleDeletePage(node.id, displayLabel); }}
                                  className="opacity-0 group-hover/pageitem:opacity-100 p-1 mr-1 rounded text-ink-muted hover:text-danger hover:bg-danger-soft transition-all shrink-0"
                                  title={`Hapus "${displayLabel}"`}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
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
                    className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-surface-hover/60 dark:hover:bg-surface-hover/30 rounded-lg text-xs font-semibold text-ink-secondary"
                  >
                    <span className="flex items-center gap-1.5">
                      {sectionsExpanded.tags ? <ChevronDown className="w-3.5 h-3.5 text-ink-muted" /> : <ChevronRight className="w-3.5 h-3.5 text-ink-muted" />}
                      <Tag className="w-3.5 h-3.5 text-warning" />
                      <span>Tags</span>
                    </span>
                    <span className="text-[9px] bg-surface-hover px-1.5 py-0.5 rounded-full">{tagNodes.length}</span>
                  </button>
                  {sectionsExpanded.tags && (
                    <ul className="pl-4 mt-1 space-y-0.5 border-l border-soft dark:border-soft ml-3.5">
                      {tagNodes.length === 0 ? (
                        <div className="px-2 py-3 flex flex-col items-center justify-center text-center gap-1.5 opacity-85">
                          <Tag className="w-4 h-4 text-ink-secondary" />
                          <span className="text-[10px] text-ink">Type #tag in editor</span>
                        </div>
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
                                    ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold'
                                    : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/30 hover:text-slate-900 dark:hover:text-zinc-200'
                                }`}
                              >
                                <FileText className="w-3.5 h-3.5 text-ink-muted shrink-0" />
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
                    className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-surface-hover/60 dark:hover:bg-surface-hover/30 rounded-lg text-xs font-semibold text-ink-secondary"
                  >
                    <span className="flex items-center gap-1.5">
                      {sectionsExpanded.widgets ? <ChevronDown className="w-3.5 h-3.5 text-ink-muted" /> : <ChevronRight className="w-3.5 h-3.5 text-ink-muted" />}
                      <Cpu className="w-3.5 h-3.5 text-success" />
                      <span>Widgets</span>
                    </span>
                    <span className="text-[9px] bg-surface-hover px-1.5 py-0.5 rounded-full">{widgetNodes.length}</span>
                  </button>
                  {sectionsExpanded.widgets && (
                    <ul className="pl-4 mt-1 space-y-0.5 border-l border-soft dark:border-soft ml-3.5">
                      {widgetNodes.length === 0 ? (
                        <div className="px-2 py-3 flex flex-col items-center justify-center text-center gap-1.5 opacity-60">
                          <Cpu className="w-4 h-4 text-ink-muted" />
                          <span className="text-[10px] text-ink-secondary">Add AI widget</span>
                        </div>
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
                                    ? 'bg-surface-hover dark:bg-surface-hover text-ink font-medium'
                                    : 'text-ink hover:bg-surface-soft dark:hover:bg-surface-hover/30 hover:text-ink dark:hover:text-ink'
                                }`}
                              >
                                <Cpu className="w-3.5 h-3.5 text-ink-muted shrink-0" />
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
          </div>
        </aside>
      )}

      {/* Resize Handle for Workspace Sidebar */}
      {!zenMode && !isSidebarCollapsed && (
        <div
          onMouseDown={handleSidebarResizeStart}
          className="w-[4px] hover:w-[6px] bg-surface-hover/50 dark:bg-surface-hover/50 hover:bg-surface dark:hover:bg-surface-hover cursor-col-resize transition-all h-full z-20 shrink-0"
        />
      )}

      {/* Pane 2: Middle Panel (Main Workspace) — now takes full remaining width */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-surface-soft dark:bg-[#141416] relative">
        {!zenMode && isSidebarCollapsed && (
          <button
            type="button"
            onClick={() => setIsSidebarCollapsed(false)}
            className="absolute top-4 left-4 z-30 p-1.5 rounded-lg text-ink-secondary hover:text-ink bg-surface/80 dark:bg-surface/80 border border-soft/60 dark:border-soft/60 hover:bg-surface-hover dark:hover:bg-surface-hover transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent shadow-sm"
            title="Expand Sidebar"
            aria-label="Expand Workspace Sidebar"
            aria-expanded={false}
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        <div className="flex-1 overflow-hidden h-full w-full">
          {children}
        </div>
      </main>

      {/* ── Right Tool Rail & Sidebar Panel (AFFiNE-style) ──────────────── */}
      {!zenMode && (
        <div className="flex h-full shrink-0 z-30 relative">
          {/* Right Sidebar Panel */}
          <aside
            style={{ width: isRightSidebarOpen ? 320 : 0 }}
            className={`border-l border-soft dark:border-soft bg-white dark:bg-[#16161a] flex flex-col h-full text-sm overflow-hidden transition-[width,opacity] duration-200 ease-in-out ${
              isRightSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
            } md:relative absolute right-12 top-0 bottom-0 shadow-lg md:shadow-none z-30`}
          >
            {/* Header */}
            <div className="h-14 px-4 border-b border-soft dark:border-soft flex items-center justify-between shrink-0 bg-[#fbfbfb] dark:bg-[#18181c]">
              <span className="font-semibold text-xs uppercase tracking-wider text-ink-secondary">
                {activeRightSidebarTab === 'info' && 'Page Info & Style'}
                {activeRightSidebarTab === 'outline' && 'Document Outline'}
                {activeRightSidebarTab === 'agent' && 'Docked Space Agent'}
                {activeRightSidebarTab === 'history' && 'Version History'}
              </span>
              <button
                type="button"
                onClick={() => setIsRightSidebarOpen(false)}
                className="p-1 rounded-md text-ink-muted hover:text-ink dark:hover:text-ink-muted hover:bg-surface-hover"
                aria-label="Close panel"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Sidebar Body */}
            <div className="flex-1 overflow-y-auto p-4 select-text">
              {activeRightSidebarTab === 'info' && (
                <div className="space-y-6">
                  {/* Title & Star Toggler */}
                  <div className="flex items-center justify-between p-3 bg-surface-soft dark:bg-surface-hover/40 border border-soft dark:border-soft/60 rounded-xl">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xl shrink-0">{pageMeta?.icon || '📄'}</span>
                      <span className="font-semibold truncate text-slate-800 dark:text-zinc-200 min-w-0" title={pageMeta?.title || docTitle}>{pageMeta?.title || docTitle}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => updatePageMeta({ isFavorite: !pageMeta?.isFavorite })}
                      className={`p-1.5 rounded-lg transition-all ${
                        pageMeta?.isFavorite
                          ? 'text-warning hover:bg-warning-soft'
                          : 'text-ink-muted hover:text-warning hover:bg-surface-hover'
                      }`}
                      title={pageMeta?.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Star className={`w-4 h-4 ${pageMeta?.isFavorite ? 'fill-amber-500' : ''}`} />
                    </button>
                  </div>

                  {/* Formatting / Style Controls */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold text-ink-muted uppercase tracking-wider">Page Style Settings</h4>

                    {/* Font Style */}
                    <div className="space-y-1.5">
                      <label className="text-xs text-ink-secondary">Typography Style</label>
                      <div className="grid grid-cols-3 gap-1">
                        {(['sans', 'serif', 'mono'] as const).map((font) => (
                          <button
                            key={font}
                            type="button"
                            onClick={() => updatePageMeta({ fontStyle: font })}
                            className={`py-1.5 text-xs rounded-lg border capitalize font-medium transition-all ${
                              (pageMeta?.fontStyle || 'sans') === font
                                ? 'bg-accent-soft text-accent border-accent dark:border-accent'
                                : 'bg-transparent text-ink border-soft dark:border-soft hover:bg-surface-soft'
                            }`}
                          >
                            {font}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Page Width */}
                    <div className="flex items-center justify-between py-2 border-b border-muted dark:border-soft/40">
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-ink">Wide Mode</span>
                        <span className="text-[10px] text-ink-muted">Let blocks take full horizontal layout</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => updatePageMeta({ fullWidth: !pageMeta?.fullWidth })}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          pageMeta?.fullWidth ? 'bg-accent' : 'bg-surface-hover dark:bg-surface-hover'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            pageMeta?.fullWidth ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Document Statistics */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold text-ink-muted uppercase tracking-wider">Document Statistics</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-lg bg-surface-soft dark:bg-surface-hover border border-muted dark:border-soft/40">
                        <div className="text-[10px] text-ink-muted">Total Blocks</div>
                        <div className="text-base font-bold text-ink mt-0.5">{blocks.length}</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-surface-soft dark:bg-surface-hover border border-muted dark:border-soft/40">
                        <div className="text-[10px] text-ink-muted">Heading Nodes</div>
                        <div className="text-base font-bold text-ink mt-0.5">{blocks.filter(b => b.type === 'heading').length}</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-surface-soft dark:bg-surface-hover border border-muted dark:border-soft/40">
                        <div className="text-[10px] text-ink-muted">Text Nodes</div>
                        <div className="text-base font-bold text-ink mt-0.5">{blocks.filter(b => b.type === 'text').length}</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-surface-soft dark:bg-surface-hover border border-muted dark:border-soft/40">
                        <div className="text-[10px] text-ink-muted">Custom Widgets</div>
                        <div className="text-base font-bold text-ink mt-0.5">{blocks.filter(b => b.type === 'widget').length}</div>
                      </div>
                    </div>
                  </div>

                  {/* Timestamps */}
                  <div className="space-y-1.5 pt-2 text-[11px] text-ink-muted">
                    <div className="flex justify-between">
                      <span>Created Date:</span>
                      <span className="font-medium text-ink">
                        {pageMeta?.createdAt ? new Date(pageMeta.createdAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Last Modified:</span>
                      <span className="font-medium text-ink">
                        {pageMeta?.updatedAt ? new Date(pageMeta.updatedAt).toLocaleTimeString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {activeRightSidebarTab === 'outline' && (
                <div className="space-y-4">
                  <p className="text-[11px] text-ink-muted">
                    Click an outline heading below to quickly navigate and scroll to its position in the document.
                  </p>

                  {blocks.filter(b => b.type === 'heading').length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-soft rounded-xl">
                      <List className="w-6 h-6 mx-auto text-ink-muted mb-1.5" />
                      <span className="text-xs text-ink-muted">No headings in document outline.</span>
                    </div>
                  ) : (
                    <nav className="flex flex-col gap-1">
                      {blocks.filter(b => b.type === 'heading').map(block => {
                        const level = block.properties?.level || 1;
                        let indentClass = 'pl-0 font-semibold';
                        if (level === 2) indentClass = 'pl-4 text-xs font-medium';
                        if (level >= 3) indentClass = 'pl-8 text-xs';
                        return (
                          <button
                            key={block.id}
                            type="button"
                            onClick={() => {
                              const el = document.getElementById(block.id);
                              if (el) {
                                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              }
                            }}
                            className={`w-full text-left py-1.5 px-2 rounded-lg hover:bg-surface-soft dark:hover:bg-surface-hover/40 text-ink hover:text-accent dark:hover:text-accent transition-colors truncate ${indentClass}`}
                          >
                            {block.content || 'Untitled Heading'}
                          </button>
                        );
                      })}
                    </nav>
                  )}
                </div>
              )}

              {activeRightSidebarTab === 'agent' && (
                <div className="flex flex-col h-full min-h-[300px]">
                  {/* Space Agent tab inside sidebar panel */}
                  <div className="flex border-b border-soft dark:border-soft text-xs shrink-0 mb-3 bg-surface-soft/50 dark:bg-surface-soft/30 rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setActiveAgentTab('chat')}
                      className={`flex-1 py-1.5 text-center font-medium transition-colors cursor-pointer ${
                        activeAgentTab === 'chat'
                          ? 'text-accent border-b-2 border-accent font-semibold bg-accent/5'
                          : 'text-ink-secondary hover:text-ink'
                      }`}
                    >
                      AI Chat
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveAgentTab('widgets')}
                      className={`flex-1 py-1.5 text-center font-medium transition-colors cursor-pointer ${
                        activeAgentTab === 'widgets'
                          ? 'text-accent border-b-2 border-accent font-semibold bg-accent/5'
                          : 'text-ink-secondary hover:text-ink'
                      }`}
                    >
                      Widgets
                    </button>
                  </div>

                  {activeAgentTab === 'chat' ? (
                    <div className="flex flex-col flex-1 h-full min-h-0">
                      {/* Messages */}
                      <div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1 max-h-[350px]">
                        {messages.map((msg, index) => (
                          <div
                            key={index}
                            className={`flex gap-2 max-w-[90%] ${msg.sender === "user" ? "ml-auto flex-row-reverse" : ""}`}
                          >
                            <div
                              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
                                msg.sender === "user"
                                  ? "bg-surface-hover text-ink"
                                  : "bg-accent-soft dark:bg-accent-soft text-accent"
                              }`}
                            >
                              {msg.sender === "user" ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                            </div>
                            <div
                              className={`p-2.5 rounded-xl text-xs leading-relaxed ${
                                msg.sender === "user"
                                  ? "bg-accent text-white rounded-tr-none shadow-sm"
                                  : "bg-surface-hover dark:bg-surface-hover text-ink rounded-tl-none border border-transparent dark:border-ink-secondary"
                              }`}
                            >
                              {msg.text}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Input form */}
                      <form onSubmit={handleSendMessage} className="relative flex items-center mt-auto">
                        <input
                          type="text"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          placeholder="Ask Space Agent docked..."
                          className="w-full pl-3 pr-8 py-2 rounded-lg border border-soft bg-white dark:bg-surface text-xs text-ink focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <button
                          type="submit"
                          className="absolute right-1.5 p-1 bg-accent text-white rounded-md hover:bg-accent"
                        >
                          <Send className="w-3 h-3" />
                        </button>
                      </form>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[400px] overflow-y-auto">
                      <div className="grid grid-cols-1 gap-2">
                        {[
                          { title: 'Analog Clock', desc: 'Live time analog clock widget', template: WIDGET_TEMPLATES.clock, id: 'clock' },
                          { title: 'Mini Calculator', desc: 'Grid based calculator widget', template: WIDGET_TEMPLATES.calculator, id: 'calc' },
                          { title: 'Quick Tasks Todo', desc: 'Interactive task tracker', template: WIDGET_TEMPLATES.todo, id: 'todo' }
                        ].map((item) => (
                          <div key={item.id} className="p-2 rounded-lg bg-surface-soft dark:bg-surface-hover/30 border border-soft dark:border-soft/60 flex items-center justify-between text-xs">
                            <div className="min-w-0 pr-1 flex flex-col">
                              <span className="font-semibold text-ink dark:text-ink truncate">{item.title}</span>
                              <span className="text-[10px] text-ink-muted truncate">{item.desc}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const newId = addBlock(null, 'widget', '');
                                updateBlockType(newId, 'widget', {
                                  widgetId: `${item.id}-${Math.random().toString(36).substring(2, 6)}`,
                                  srcDoc: item.template
                                });
                              }}
                              className="px-2 py-1 bg-accent hover:bg-accent text-white rounded text-[10px] font-semibold transition-colors cursor-pointer shrink-0"
                            >
                              Insert
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeRightSidebarTab === 'history' && (
                <div className="space-y-4">
                  <p className="text-[11px] text-ink-muted">
                    Locally persisted document snapshots are updated automatically during edit sessions.
                  </p>

                  <div className="relative pl-4 border-l-2 border-muted dark:border-soft ml-1.5 space-y-4">
                    {/* Item 1 */}
                    <div className="relative">
                      <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-success ring-4 ring-surface dark:ring-surface" />
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-ink">Current active version</span>
                        <span className="text-[10px] text-ink-muted">Just now — Auto-saved local session</span>
                      </div>
                    </div>

                    {/* Item 2 */}
                    <div className="relative group">
                      <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-accent ring-4 ring-white dark:ring-zinc-900" />
                      <button
                        type="button"
                        onClick={() => alert("Restored page backup to: 10 minutes ago")}
                        className="text-left w-full hover:bg-surface-soft dark:hover:bg-surface-hover/40 p-1.5 rounded-lg transition-colors"
                      >
                        <span className="text-xs font-semibold text-ink group-hover:text-accent dark:group-hover:text-accent">10 minutes ago</span>
                        <div className="text-[10px] text-ink-muted">Backup snapshot auto-save</div>
                      </button>
                    </div>

                    {/* Item 3 */}
                    <div className="relative group">
                      <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-surface dark:bg-surface-hover ring-4 ring-white dark:ring-zinc-900" />
                      <button
                        type="button"
                        onClick={() => alert("Restored page backup to original created state")}
                        className="text-left w-full hover:bg-surface-soft dark:hover:bg-surface-hover/40 p-1.5 rounded-lg transition-colors"
                      >
                        <span className="text-xs font-semibold text-ink group-hover:text-accent dark:group-hover:text-accent">Page Created</span>
                        <div className="text-[10px] text-ink-muted">
                          {pageMeta?.createdAt ? new Date(pageMeta.createdAt).toLocaleString() : 'Initial blank slate'}
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* Right Tool Rail */}
          <aside className="w-12 flex flex-col items-center justify-between py-3 border-l border-soft dark:border-soft bg-[#fbfbfb] dark:bg-[#18181c] shrink-0 z-30 h-full">
            <div className="flex flex-col items-center gap-4 w-full">
              <nav className="flex flex-col gap-4 w-full px-1.5" aria-label="Right Rail Navigation">
                {[
                  { id: 'info' as const, icon: Info, label: 'Page Info' },
                  { id: 'outline' as const, icon: List, label: 'Outline' },
                  { id: 'agent' as const, icon: Bot, label: 'Space Agent' },
                  { id: 'history' as const, icon: History, label: 'Page History' }
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = isRightSidebarOpen && activeRightSidebarTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleRightSidebar(item.id)}
                      title={item.label}
                      aria-label={item.label}
                      aria-expanded={isActive}
                      className={`w-full py-2.5 rounded-lg flex items-center justify-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent dark:focus-visible:ring-accent ${
                        isActive
                          ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold'
                          : 'text-slate-400 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="flex flex-col items-center gap-3 w-full px-1.5">
              <button
                type="button"
                onClick={() => alert("CatNoted Workspace - AFFiNE-style Right Rail")}
                className="w-full py-2.5 rounded-lg flex items-center justify-center text-ink-muted hover:text-ink hover:bg-surface-hover/10 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                title="Workspace Help"
                aria-label="Workspace Help"
              >
                <span className="text-xs font-semibold">?</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ── Floating Agent Toggle FAB ─────────────────────────────────── */}
      {!isAgentOpen && (
        <button
          onClick={() => setIsAgentOpen(true)}
          className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-2xl bg-accent hover:bg-accent dark:bg-accent dark:hover:bg-accent text-white shadow-lg shadow-indigo-600/25 dark:shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 dark:hover:shadow-indigo-400/35 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 group"
          title="Open Space Agent"
          style={{
            animation: "floatFab 3s ease-in-out infinite",
          }}
        >
          <Bot className="w-6 h-6 transition-all duration-300 group-hover:opacity-0 group-hover:scale-75 absolute" />
          <MessageSquare className="w-6 h-6 transition-all duration-300 opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100" />
          {/* Pulsing notification dot */}
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-success border-2 border-white dark:border-soft animate-pulse" />
          {/* Hover ring glow */}
          <span className="absolute inset-0 rounded-2xl transition-all duration-300 opacity-0 group-hover:opacity-100 ring-2 ring-indigo-400/50 dark:ring-indigo-400/40" />
        </button>
      )}

      {/* ── Floating Space Agent Panel ────────────────────────────────── */}
      {isAgentOpen && (
        <div
          ref={panelRef}
          className={`fixed z-40 flex flex-col transition-shadow duration-300 ${isMinimized ? "" : ""}`}
          style={{
            left: panelPos.x,
            top: panelPos.y,
            width: isMinimized ? PANEL_DEFAULT_WIDTH : panelSize.w,
            height: isMinimized ? 52 : panelSize.h,
            borderRadius: 20,
            overflow: "hidden",
            // Glassmorphism backdrop
            background: isDarkMode
              ? "linear-gradient(180deg, rgba(15, 23, 42, 0.92) 0%, rgba(9, 14, 28, 0.96) 100%)"
              : "linear-gradient(180deg, rgba(255, 255, 255, 0.92) 0%, rgba(248, 250, 252, 0.96) 100%)",
            backdropFilter: "blur(24px) saturate(1.6)",
            WebkitBackdropFilter: "blur(24px) saturate(1.6)",
            border: isDarkMode
              ? "1px solid rgba(99, 102, 241, 0.18)"
              : "1px solid rgba(99, 102, 241, 0.15)",
            boxShadow: isDarkMode
              ? "0 8px 40px -8px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(99, 102, 241, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.04)"
              : "0 8px 40px -8px rgba(99, 102, 241, 0.2), 0 0 0 1px rgba(99, 102, 241, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.6)",
            animation: "slideInPanel 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {/* ── Panel Header (Draggable) ──────────────────────────────── */}
          <div
            className="flex items-center justify-between px-4 h-[52px] shrink-0 select-none"
            style={{
              cursor: "grab",
              borderBottom: isMinimized
                ? "none"
                : isDarkMode
                  ? "1px solid rgba(99, 102, 241, 0.12)"
                  : "1px solid rgba(99, 102, 241, 0.1)",
              background: isDarkMode
                ? "linear-gradient(90deg, rgba(99, 102, 241, 0.06) 0%, transparent 100%)"
                : "linear-gradient(90deg, rgba(99, 102, 241, 0.04) 0%, transparent 100%)",
            }}
            onMouseDown={handleDragStart}
          >
            <div className="flex items-center gap-2.5">
              <GripVertical className="w-4 h-4 text-ink-muted dark:text-ink-secondary opacity-50" />
              <div className="w-7 h-7 rounded-lg bg-accent/10 dark:bg-accent/10 flex items-center justify-center">
                <Bot className="w-4 h-4 text-accent" />
              </div>
              <span className="font-semibold text-sm text-ink dark:text-ink tracking-tight">
                Space Agent
              </span>
              <Sparkles className="w-3.5 h-3.5 text-accent animate-pulse" />
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-ink-muted hover:text-accent dark:hover:text-accent hover:bg-accent-soft dark:hover:bg-accent/15 transition-all duration-200 hover:scale-110"
                title={isMinimized ? "Expand" : "Minimize"}
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setIsAgentOpen(false);
                  setIsMinimized(false);
                }}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-ink-muted hover:text-danger dark:hover:text-rose-400 hover:bg-danger-soft dark:hover:bg-danger-soft0/15 transition-all duration-200 hover:scale-110"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ── Panel Body (hidden when minimized) ────────────────────── */}
          {!isMinimized && (
            <>
              {/* Tab Switcher */}
              <div className="flex border-b border-soft dark:border-soft text-xs shrink-0 bg-surface-soft/50 dark:bg-surface-soft/30">
                <button
                  type="button"
                  onClick={() => setActiveAgentTab('chat')}
                  className={`flex-1 py-2 text-center font-medium transition-colors cursor-pointer ${
                    activeAgentTab === 'chat'
                      ? 'text-accent border-b-2 border-accent font-semibold bg-accent/5'
                      : 'text-ink-secondary hover:text-ink'
                  }`}
                >
                  AI Chat
                </button>
                <button
                  type="button"
                  onClick={() => setActiveAgentTab('widgets')}
                  className={`flex-1 py-2 text-center font-medium transition-colors cursor-pointer ${
                    activeAgentTab === 'widgets'
                      ? 'text-accent border-b-2 border-accent font-semibold bg-accent/5'
                      : 'text-ink-secondary hover:text-ink'
                  }`}
                >
                  Widgets List & Tools
                </button>
              </div>

              {activeAgentTab === 'chat' ? (
                <>
                  {/* Widget sharing toolbar catalog */}
                  <div
                    className="px-3 py-2 flex gap-2 justify-between shrink-0"
                    style={{
                      borderBottom: isDarkMode
                        ? "1px solid rgba(99, 102, 241, 0.08)"
                        : "1px solid rgba(99, 102, 241, 0.06)",
                    }}
                  >
                    <button
                      onClick={handleExportWidgets}
                      title="Export widget codes"
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 border border-soft/60 hover:bg-accent-soft dark:hover:bg-accent/10 hover:border-accent-soft dark:hover:border-accent/30 hover:text-accent dark:hover:text-accent rounded-lg text-[10px] font-semibold text-ink-secondary transition-all duration-200"
                    >
                      <Download className="w-3.5 h-3.5" /> Export Catalog
                    </button>
                    <label className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 border border-soft/60 hover:bg-accent-soft dark:hover:bg-accent/10 hover:border-accent-soft dark:hover:border-accent/30 hover:text-accent dark:hover:text-accent rounded-lg text-[10px] font-semibold text-ink-secondary cursor-pointer text-center transition-all duration-200">
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
                        className={`flex gap-2 max-w-[85%] ${msg.sender === "user" ? "ml-auto flex-row-reverse" : ""}`}
                      >
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 ${
                            msg.sender === "user"
                              ? "bg-surface-hover dark:bg-surface-hover text-ink"
                              : "bg-accent-soft dark:bg-accent-soft/40 text-accent"
                          }`}
                        >
                          {msg.sender === "user" ? (
                            <User className="w-3.5 h-3.5" />
                          ) : (
                            <Bot className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div
                          className={`p-3 rounded-2xl text-xs leading-relaxed ${
                            msg.sender === "user"
                              ? "bg-accent text-white rounded-tr-none shadow-sm shadow-indigo-600/20"
                              : "bg-surface-hover dark:bg-surface-hover/80 text-ink rounded-tl-none border border-transparent dark:border-ink-secondary/40"
                          }`}
                        >
                          {msg.text}
                        </div>
                        {msg.code && (
                          <div className="w-full mt-1 border border-accent-soft dark:border-accent/30 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-surface">
                            <div className="h-[150px] w-full">
                              <SandboxFrame srcDoc={msg.code} theme={isDarkMode ? 'dark' : 'light'} height="150px" />
                            </div>
                            <div className="p-2 border-t border-accent-soft dark:border-accent/20 bg-surface-soft dark:bg-surface-hover flex justify-end">
                              <button
                                onClick={() => {
                                  const newBlockId = addBlock(null, 'widget', '');
                                  updateBlockType(newBlockId, 'widget', {
                                    widgetId: `ai-widget-${Math.random().toString(36).substring(2, 6)}`,
                                    srcDoc: msg.code!
                                  });
                                }}
                                className="px-2.5 py-1 bg-accent hover:bg-accent text-white rounded-md text-[10px] font-semibold transition-colors"
                              >
                                Insert Widget
                              </button>
                            </div>
                          </div>
                        )}
                        {msg.editProposal && (
                          <div className="w-full mt-1 border border-success-soft dark:border-success/30 rounded-xl overflow-hidden shadow-sm bg-success-soft/50 dark:bg-success-soft/10">
                            <div className="p-3 text-xs text-ink whitespace-pre-wrap font-mono">
                              {msg.editProposal}
                            </div>
                            <div className="p-2 border-t border-success-soft dark:border-success/20 flex justify-end">
                              <button
                                onClick={() => {
                                  // Just append the proposed edit as a text block
                                  addBlock(null, 'text', msg.editProposal!);
                                }}
                                className="px-2.5 py-1 bg-success hover:bg-success text-white rounded-md text-[10px] font-semibold transition-colors"
                              >
                                Append to Document
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Chat input form */}
                  <form
                    onSubmit={handleSendMessage}
                    className="p-3 shrink-0"
                    style={{
                      borderTop: isDarkMode
                        ? "1px solid rgba(99, 102, 241, 0.08)"
                        : "1px solid rgba(99, 102, 241, 0.06)",
                    }}
                  >
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Ask agent to generate a widget..."
                        className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-soft/60 bg-white/80 dark:bg-surface/60 text-xs text-ink placeholder:text-ink-muted dark:placeholder:text-ink-secondary focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:focus:ring-indigo-400/30 focus:border-accent dark:focus:border-accent/50 hover:border-soft dark:hover:border-ink-secondary transition-all duration-200"
                      />
                      <button
                        type="submit"
                        className="absolute right-1.5 p-1.5 bg-accent hover:bg-accent dark:hover:bg-accent text-white rounded-lg transition-all duration-200 hover:scale-110 hover:shadow-md hover:shadow-indigo-500/30 active:scale-95"
                      >
                        <Send className="w-3 h-3" />
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex-1 overflow-y-auto flex flex-col h-full select-text text-ink">
                  {/* Widget sharing toolbar catalog */}
                  <div
                    className="px-3 py-2 flex gap-2 justify-between shrink-0"
                    style={{
                      borderBottom: isDarkMode
                        ? "1px solid rgba(99, 102, 241, 0.08)"
                        : "1px solid rgba(99, 102, 241, 0.06)",
                    }}
                  >
                    <button
                      onClick={handleExportWidgets}
                      title="Export widget codes"
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 border border-soft/60 hover:bg-accent-soft dark:hover:bg-accent/10 hover:border-accent-soft dark:hover:border-accent/30 hover:text-accent dark:hover:text-accent rounded-lg text-[10px] font-semibold text-ink-secondary transition-all duration-200"
                    >
                      <Download className="w-3.5 h-3.5" /> Export Catalog
                    </button>
                    <label className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 border border-soft/60 hover:bg-accent-soft dark:hover:bg-accent/10 hover:border-accent-soft dark:hover:border-accent/30 hover:text-accent dark:hover:text-accent rounded-lg text-[10px] font-semibold text-ink-secondary cursor-pointer text-center transition-all duration-200">
                      <Upload className="w-3.5 h-3.5" /> Import Catalog
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImportWidgets}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="p-4 space-y-5 flex-1">
                    {/* Preset Library */}
                    <div>
                      <h4 className="text-[10px] font-bold text-ink-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-accent" /> Preset Library
                      </h4>
                      <div className="grid grid-cols-1 gap-2">
                        <div className="p-3 rounded-xl bg-surface-soft dark:bg-surface/50 border border-soft dark:border-soft/60 flex items-center justify-between text-xs transition-all hover:border-accent/30">
                          <div className="flex flex-col">
                            <span className="font-semibold text-ink dark:text-ink">Analog Clock</span>
                            <span className="text-[10px] text-ink-muted">Live time widget with smooth animation</span>
                          </div>
                          <button
                            onClick={() => {
                              const newId = addBlock(null, 'widget', '');
                              updateBlockType(newId, 'widget', {
                                widgetId: `clock-${Math.random().toString(36).substring(2, 6)}`,
                                srcDoc: WIDGET_TEMPLATES.clock
                              });
                            }}
                            className="px-2.5 py-1 bg-accent hover:bg-accent text-white rounded-md text-[10px] font-semibold transition-colors cursor-pointer shrink-0"
                          >
                            Insert
                          </button>
                        </div>

                        <div className="p-3 rounded-xl bg-surface-soft dark:bg-surface/50 border border-soft dark:border-soft/60 flex items-center justify-between text-xs transition-all hover:border-accent/30">
                          <div className="flex flex-col">
                            <span className="font-semibold text-ink dark:text-ink">Mini Calculator</span>
                            <span className="text-[10px] text-ink-muted">Grid based mathematical calculator</span>
                          </div>
                          <button
                            onClick={() => {
                              const newId = addBlock(null, 'widget', '');
                              updateBlockType(newId, 'widget', {
                                widgetId: `calc-${Math.random().toString(36).substring(2, 6)}`,
                                srcDoc: WIDGET_TEMPLATES.calculator
                              });
                            }}
                            className="px-2.5 py-1 bg-accent hover:bg-accent text-white rounded-md text-[10px] font-semibold transition-colors cursor-pointer shrink-0"
                          >
                            Insert
                          </button>
                        </div>

                        <div className="p-3 rounded-xl bg-surface-soft dark:bg-surface/50 border border-soft dark:border-soft/60 flex items-center justify-between text-xs transition-all hover:border-accent/30">
                          <div className="flex flex-col">
                            <span className="font-semibold text-ink dark:text-ink">Quick Tasks Todo</span>
                            <span className="text-[10px] text-ink-muted">Interactive todo list with state</span>
                          </div>
                          <button
                            onClick={() => {
                              const newId = addBlock(null, 'widget', '');
                              updateBlockType(newId, 'widget', {
                                widgetId: `todo-${Math.random().toString(36).substring(2, 6)}`,
                                srcDoc: WIDGET_TEMPLATES.todo
                              });
                            }}
                            className="px-2.5 py-1 bg-accent hover:bg-accent text-white rounded-md text-[10px] font-semibold transition-colors cursor-pointer shrink-0"
                          >
                            Insert
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Current Page Widgets List */}
                    <div>
                      <h4 className="text-[10px] font-bold text-ink-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Cpu className="w-3 h-3 text-success" /> Page Widgets List
                      </h4>
                      {blocks.filter(b => b.type === 'widget').length === 0 ? (
                        <div className="p-6 text-center border border-dashed border-soft rounded-xl text-xs text-ink-muted">
                          No widgets on this page yet.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {blocks.filter(b => b.type === 'widget').map(block => {
                            const widgetId = block.properties?.widgetId || 'unassigned';
                            return (
                              <div key={block.id} className="p-3 rounded-xl bg-surface-soft dark:bg-surface/40 border border-soft dark:border-soft/60 flex items-center justify-between text-xs">
                                <div className="flex flex-col min-w-0 pr-2">
                                  <span className="font-semibold truncate text-ink dark:text-ink">ID: {widgetId}</span>
                                  <span className="text-[9px] text-ink-muted truncate">Block ID: {block.id}</span>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(block.properties?.srcDoc || '');
                                      alert('Widget code copied to clipboard!');
                                    }}
                                    title="Copy Code"
                                    className="p-1 hover:bg-surface-hover dark:hover:bg-surface-hover rounded text-ink-secondary cursor-pointer"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      const newId = addBlock(block.id, 'widget', '');
                                      updateBlockType(newId, 'widget', {
                                        widgetId: `${widgetId}-copy`,
                                        srcDoc: block.properties?.srcDoc || ''
                                      });
                                    }}
                                    title="Duplicate Widget"
                                    className="p-1 hover:bg-surface-hover dark:hover:bg-surface-hover rounded text-ink-secondary cursor-pointer"
                                  >
                                    <Minus className="w-3.5 h-3.5 rotate-90" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      deleteBlock(block.id);
                                    }}
                                    title="Delete Widget"
                                    className="p-1 hover:bg-surface-hover dark:hover:bg-surface-hover rounded text-danger cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Resize handle (bottom-left corner) ────────────────── */}
              <div
                className="absolute bottom-0 left-0 w-5 h-5 cursor-nesw-resize opacity-0 hover:opacity-100 transition-opacity"
                onMouseDown={handleResizeStart}
                style={{
                  background:
                    "linear-gradient(135deg, transparent 50%, rgba(99, 102, 241, 0.3) 50%)",
                  borderRadius: "0 0 0 18px",
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
