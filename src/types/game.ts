export interface GameElement {
  id: string;
  name: string;
  emoji: string;
  discovered: boolean;
  isNew?: boolean;
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

export type GameMode = "discovery" | "sandbox";

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  emoji: string;
  date: string;
}

export interface ChallengeStatus {
  challengeId: string;
  completed: boolean;
  completedAt?: string;
}
