import type { GameState, MoveIndex, Player } from "./types";
import { computeNextState, getLegalMoves } from "./rules";

function pickRandom<T>(arr: readonly T[]): T | null {
  if (arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

// "Easy" AI:
// 1) If it can win immediately, do it.
// 2) Otherwise, try to block any immediate opponent win.
// 3) Otherwise, pick a random legal move.
export function pickEasyAiMove(
  state: GameState,
  aiPlayer: Player,
): MoveIndex | null {
  if (state.status !== "playing") return null;
  if (state.turn !== aiPlayer) return null;

  const legal = getLegalMoves(state.board);
  if (legal.length === 0) return null;

  // 1) Winning move?
  const winningMoves: MoveIndex[] = [];
  for (const idx of legal) {
    const next = computeNextState(state, idx);
    if (next.status === "won" && next.winner === aiPlayer)
      winningMoves.push(idx);
  }
  const winPick = pickRandom(winningMoves);
  if (winPick !== null) return winPick;

  const opponent: Player = aiPlayer === "X" ? "O" : "X";

  // 2) Blocking move?
  const blockingMoves: MoveIndex[] = [];
  for (const idx of legal) {
    const nextAfterAi = computeNextState(state, idx);
    // If we didn't win, and the opponent could still win, we block only moves
    // that remove all opponent immediate wins.
    const opponentLegal = getLegalMoves(nextAfterAi.board);
    const opponentWinningMoves = opponentLegal.filter((oppIdx) => {
      const afterOpponent = computeNextState(nextAfterAi, oppIdx);
      return (
        afterOpponent.status === "won" && afterOpponent.winner === opponent
      );
    });

    if (opponentWinningMoves.length === 0) blockingMoves.push(idx);
  }

  const blockPick = pickRandom(blockingMoves);
  if (blockPick !== null) return blockPick;

  // 3) Random fallback.
  return pickRandom(legal);
}
