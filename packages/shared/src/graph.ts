export interface GraphNode {
  id: string;
  label: string;
  type: 'page' | 'tag' | 'widget';
  val?: number;
  color?: string;
  [key: string]: any;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: 'link' | 'tag' | 'widget';
  label?: string;
}
