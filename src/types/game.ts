export interface GameElement {
  id: string;
  name: string;
  emoji: string;
  discovered: boolean;
}

export interface CanvasElement {
  id: string;
  elementId: string;
  x: number;
  y: number;
}

export interface Position {
  x: number;
  y: number;
}
