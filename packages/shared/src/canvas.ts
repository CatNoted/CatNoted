export type CanvasElementType = 'card' | 'shape' | 'connector';

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
  color?: string;
  blockId?: string;
  shapeType?: 'rectangle' | 'circle' | 'triangle' | 'star';
  text?: string;
  connector?: ConnectorInfo;
}
