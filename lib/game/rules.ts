import type { Board, Cell, GameState, MoveIndex, Player } from "./types";

const WINNING_LINES: ReadonlyArray<readonly [number, number, number]> = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export function createEmptyBoard(): Board {
  return Array.from({ length: 9 }, () => null) as Board;
}

export function getLegalMoves(board: Board): MoveIndex[] {
  const result: MoveIndex[] = [];
  for (let i = 0 as MoveIndex; i < 9; i = (i + 1) as MoveIndex) {
    if (board[i] === null) result.push(i);
  }
  return result;
}

export function getWinner(board: Board): Player | null {
  for (const [a, b, c] of WINNING_LINES) {
    const v = board[a];
    if (v && v === board[b] && v === board[c]) return v;
  }
  return null;
}

export function isDraw(board: Board): boolean {
  return getWinner(board) === null && board.every((c) => c !== null);
}

export function applyMoveToBoard(
  board: Board,
  index: MoveIndex,
  player: Player,
): Board {
  if (board[index] !== null) return board;
  const next = board.slice() as Board;
  next[index] = player as Cell;
  return next;
}

export function computeNextState(
  state: GameState,
  index: MoveIndex,
): GameState {
  if (state.status !== "playing") return state;
  if (state.board[index] !== null) return state;

  const board = applyMoveToBoard(state.board, index, state.turn);
  const winner = getWinner(board);
  if (winner) {
    return {
      ...state,
      board,
      status: "won",
      winner,
    };
  }

  if (isDraw(board)) {
    return {
      ...state,
      board,
      status: "draw",
      winner: undefined,
    };
  }

  const nextTurn: Player = state.turn === "X" ? "O" : "X";
  return {
    ...state,
    board,
    turn: nextTurn,
    status: "playing",
    winner: undefined,
  };
}
