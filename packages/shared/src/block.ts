export interface KanbanCard {
  id: string;
  title: string;
  description?: string;
}

export interface KanbanColumn {
  id: string;
  title: string;
  cards: KanbanCard[];
}

export type BlockType =
  | 'text'
  | 'heading'
  | 'list'
  | 'image'
  | 'widget'
  | 'bullet'
  | 'ordered'
  | 'todo'
  | 'quote'
  | 'code'
  | 'divider'
  | 'toggle'
  | 'callout'
  | 'math'
  | 'table'
  | 'bookmark'
  | 'embed'
  | 'kanban';

export interface BlockProperties {
  // Kanban properties
  columns?: KanbanColumn[];
  kanbanTitle?: string;

  // Embed properties
  refPageId?: string;
  // Heading properties
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  
  // List & Toggle properties
  listType?: 'bullet' | 'ordered' | 'todo';
  checked?: boolean;
  expanded?: boolean;
  
  // Callout properties
  calloutIcon?: string;
  calloutBg?: string; // e.g. 'indigo', 'emerald', 'amber', 'rose', 'sky', 'purple'

  // Code block properties
  language?: string;
  lineNumbers?: boolean;

  // Math block properties
  formula?: string;

  // Table block properties
  rows?: string[][];
  hasHeader?: boolean;

  // Bookmark properties
  bookmarkUrl?: string;
  bookmarkTitle?: string;
  bookmarkDescription?: string;
  bookmarkFavicon?: string;

  // Image properties
  url?: string;
  caption?: string;
  width?: number;
  height?: number;
  align?: 'left' | 'center' | 'right';

  // Widget properties
  widgetId?: string;
  srcDoc?: string;
  
  // Generic fallback
  [key: string]: any;
}

export interface BlockNode {
  id: string;
  type: BlockType;
  content: string;
  properties?: BlockProperties;
  children?: string[];
  parentId?: string | null;
}

export interface PageMeta {
  id: string;
  title: string;
  icon?: string;
  coverUrl?: string;
  fontStyle?: 'sans' | 'serif' | 'mono';
  fullWidth?: boolean;
  isFavorite?: boolean;
  createdAt?: number;
  updatedAt?: number;
  isInfoExpanded?: boolean;
  isDeleted?: boolean;
  journalDate?: string;
}

