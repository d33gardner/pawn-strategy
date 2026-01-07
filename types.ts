export enum Player {
  WHITE = 'WHITE',
  BLACK = 'BLACK',
}

export enum Phase {
  CONFIG = 'CONFIG',
  PLAYING = 'PLAYING',
  ADVANCEMENT = 'ADVANCEMENT',
  SPAWNING = 'SPAWNING',
  GAME_OVER = 'GAME_OVER',
}

export enum PlacementMethod {
  RANDOM = 'RANDOM',
  CHOICE = 'CHOICE',
}

export interface Position {
  x: number;
  y: number;
}

export interface Pawn {
  id: string;
  owner: Player;
  position: Position;
  isNew?: boolean; // For animation/highlighting
  hasMoved: boolean; // Tracks if the pawn has made its first manual move (for 2-step logic)
}

export interface Move {
  from: Position;
  to: Position;
  isCapture: boolean;
}

export interface GameConfig {
  totalRounds: number;
  pawnsPerSpawn: number;
  placementMethod: PlacementMethod;
  vsAI: boolean;
  difficulty: 'EASY' | 'MEDIUM';
}

export interface GameState {
  board: Pawn[];
  phase: Phase;
  currentRound: number;
  currentPlayer: Player;
  movesMadeInTurn: number;
  movedPawnIds: string[]; // Track pawns moved this turn
  scores: { [key in Player]: number };
  winner: Player | 'DRAW' | null;
  winReason: string | null;
  moveHistory: string[];
  config: GameConfig;
  spawnQueue: { [key in Player]: number }; // Number of pawns left to spawn manually
}