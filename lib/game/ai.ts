import type { GameState, MoveIndex, Player } from "./types";
import {
  computeNextState,
  getLegalMoves,
  getWinner,
  isDraw,
} from "./rules";

export type AiDifficulty = "easy" | "medium" | "hard";

const CENTER: MoveIndex = 4;
const CORNERS: readonly MoveIndex[] = [0, 2, 6, 8];
const EDGES: readonly MoveIndex[] = [1, 3, 5, 7];

function pickRandom<T>(arr: readonly T[]): T | null {
  if (arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

function winningMovesFor(
  state: GameState,
  player: Player,
): MoveIndex[] {
  if (state.status !== "playing" || state.turn !== player) return [];
  const legal = getLegalMoves(state.board);
  const out: MoveIndex[] = [];
  for (const idx of legal) {
    const next = computeNextState(state, idx);
    if (next.status === "won" && next.winner === player) out.push(idx);
  }
  return out;
}

function blockingMovesFor(
  state: GameState,
  aiPlayer: Player,
): MoveIndex[] {
  if (state.status !== "playing" || state.turn !== aiPlayer) return [];
  const opponent: Player = aiPlayer === "X" ? "O" : "X";
  const legal = getLegalMoves(state.board);
  const out: MoveIndex[] = [];
  for (const idx of legal) {
    const nextAfterAi = computeNextState(state, idx);
    const opponentLegal = getLegalMoves(nextAfterAi.board);
    const opponentCouldWin = opponentLegal.some((oppIdx) => {
      const afterOpponent = computeNextState(nextAfterAi, oppIdx);
      return (
        afterOpponent.status === "won" && afterOpponent.winner === opponent
      );
    });
    if (!opponentCouldWin) out.push(idx);
  }
  return out;
}

// Easy: win if possible, else block immediate loss, else random legal move.
export function pickEasyAiMove(
  state: GameState,
  aiPlayer: Player,
): MoveIndex | null {
  if (state.status !== "playing") return null;
  if (state.turn !== aiPlayer) return null;

  const legal = getLegalMoves(state.board);
  if (legal.length === 0) return null;

  const winPick = pickRandom(winningMovesFor(state, aiPlayer));
  if (winPick !== null) return winPick;

  const blockPick = pickRandom(blockingMovesFor(state, aiPlayer));
  if (blockPick !== null) return blockPick;

  return pickRandom(legal);
}

// Medium: win > block > center > corner > edge > random.
export function pickMediumAiMove(
  state: GameState,
  aiPlayer: Player,
): MoveIndex | null {
  if (state.status !== "playing") return null;
  if (state.turn !== aiPlayer) return null;

  const legal = getLegalMoves(state.board);
  if (legal.length === 0) return null;

  const winPick = pickRandom(winningMovesFor(state, aiPlayer));
  if (winPick !== null) return winPick;

  const blockPick = pickRandom(blockingMovesFor(state, aiPlayer));
  if (blockPick !== null) return blockPick;

  if (legal.includes(CENTER)) return CENTER;

  const corners = legal.filter((i) => CORNERS.includes(i));
  const cornerPick = pickRandom(corners);
  if (cornerPick !== null) return cornerPick;

  const edges = legal.filter((i) => EDGES.includes(i));
  const edgePick = pickRandom(edges);
  if (edgePick !== null) return edgePick;

  return pickRandom(legal);
}

function minimaxScore(state: GameState, aiPlayer: Player): number {
  const boardWinner = getWinner(state.board);
  if (boardWinner) {
    return boardWinner === aiPlayer ? 1 : -1;
  }
  if (isDraw(state.board)) return 0;

  if (state.status === "won" && state.winner) {
    return state.winner === aiPlayer ? 1 : -1;
  }
  if (state.status === "draw") return 0;

  const maximizing = state.turn === aiPlayer;
  const moves = getLegalMoves(state.board);
  if (moves.length === 0) return 0;

  if (maximizing) {
    let best = -Infinity;
    for (const m of moves) {
      const next = computeNextState(state, m);
      const s = minimaxScore(next, aiPlayer);
      best = Math.max(best, s);
    }
    return best;
  }

  let best = Infinity;
  for (const m of moves) {
    const next = computeNextState(state, m);
    const s = minimaxScore(next, aiPlayer);
    best = Math.min(best, s);
  }
  return best;
}

export function pickHardAiMove(
  state: GameState,
  aiPlayer: Player,
): MoveIndex | null {
  if (state.status !== "playing") return null;
  if (state.turn !== aiPlayer) return null;

  const legal = getLegalMoves(state.board);
  if (legal.length === 0) return null;

  let bestMoves: MoveIndex[] = [];
  let bestScore = -Infinity;

  for (const m of legal) {
    const next = computeNextState(state, m);
    const score = minimaxScore(next, aiPlayer);
    if (score > bestScore) {
      bestScore = score;
      bestMoves = [m];
    } else if (score === bestScore) {
      bestMoves.push(m);
    }
  }

  bestMoves.sort((a, b) => a - b);
  return bestMoves[0] ?? null;
}

export function pickAiMove(
  state: GameState,
  aiPlayer: Player,
  difficulty: AiDifficulty,
): MoveIndex | null {
  switch (difficulty) {
    case "easy":
      return pickEasyAiMove(state, aiPlayer);
    case "medium":
      return pickMediumAiMove(state, aiPlayer);
    case "hard":
      return pickHardAiMove(state, aiPlayer);
    default:
      return pickEasyAiMove(state, aiPlayer);
  }
}

/** Map 0=easy, 1=medium, 2=hard with clamping. */
export function difficultyFromIndex(index: number): AiDifficulty {
  const i = Math.max(0, Math.min(2, Math.floor(index)));
  return (["easy", "medium", "hard"] as const)[i];
}

export function difficultyToIndex(d: AiDifficulty): number {
  return ({ easy: 0, medium: 1, hard: 2 } as const)[d];
}
