export type BlockType = 'text' | 'heading' | 'list' | 'image' | 'widget' | 'bullet' | 'ordered' | 'todo' | 'quote' | 'code' | 'divider';

export interface BlockProperties {
  // Heading properties
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  
  // List properties
  listType?: 'bullet' | 'ordered' | 'todo';
  checked?: boolean;
  
  // Image properties
  url?: string;
  caption?: string;
  width?: number;
  height?: number;

  // Widget properties
  widgetId?: string;
  
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
