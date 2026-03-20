export type Player = "X" | "O";

export type Cell = Player | null;

// Board indexes:
// 0 | 1 | 2
// 3 | 4 | 5
// 6 | 7 | 8
export type Board = Cell[];

export type GameStatus = "playing" | "won" | "draw";

export interface GameState {
  board: Board;
  turn: Player;
  status: GameStatus;
  winner?: Player;
}

export interface GameSnapshot {
  board: Board;
  turn: Player;
  status: GameStatus;
  winner?: Player;
}

export type MoveIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
