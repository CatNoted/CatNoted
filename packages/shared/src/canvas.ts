export type CanvasElementType = 'card' | 'shape' | 'connector' | 'frame' | 'note';

export interface ConnectorInfo {
  id: string;
  from: string;
  to: string;
  label?: string;
  color?: string;
  type?: 'straight' | 'bezier' | 'orthogonal';
}

export interface CanvasElement {
  id: string;
  type: CanvasElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  rotation: number;
  color?: string; // background / fill color
  borderColor?: string;
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'none';
  opacity?: number; // 0 to 100 or 0 to 1
  textAlignment?: 'left' | 'center' | 'right';
  blockId?: string;
  shapeType?: 'rectangle' | 'circle' | 'triangle' | 'star';
  text?: string;
  connector?: ConnectorInfo;
}
