import { describe, expect, it } from "vitest";
import type { Board, GameState, Player } from "../types";
import {
  computeNextState,
  createEmptyBoard,
  getLegalMoves,
  getWinner,
  isDraw,
} from "../rules";

function makeState(
  overrides: Partial<GameState> & { turn?: Player } = {},
): GameState {
  return {
    board: createEmptyBoard(),
    turn: "X",
    status: "playing",
    winner: undefined,
    ...overrides,
  };
}

describe("rules", () => {
  it("creates an empty board", () => {
    const b = createEmptyBoard();
    expect(b).toHaveLength(9);
    expect(b.every((c) => c === null)).toBe(true);
  });

  it("finds winners for all lines (basic check)", () => {
    const b: Board = ["X", "X", "X", null, null, null, null, null, null];
    expect(getWinner(b)).toBe("X");
  });

  it("returns draw when board is full with no winner", () => {
    const b: Board = ["X", "O", "X", "X", "O", "O", "O", "X", "X"];
    expect(isDraw(b)).toBe(true);
    expect(getWinner(b)).toBe(null);
  });

  it("returns legal moves only on empty cells", () => {
    const b: Board = ["X", null, "O", null, null, null, null, null, null];
    expect(getLegalMoves(b)).toEqual([1, 3, 4, 5, 6, 7, 8]);
  });

  it("computes next state for a win and toggles turn while playing", () => {
    let state = makeState({ turn: "X" });

    state = computeNextState(state, 0);
    expect(state.turn).toBe("O");
    expect(state.status).toBe("playing");

    state = computeNextState(state, 3); // O
    state = computeNextState(state, 1); // X
    state = computeNextState(state, 4); // O

    const won = computeNextState(state, 2); // X wins 0-1-2
    expect(won.status).toBe("won");
    expect(won.winner).toBe("X");
  });

  it("ignores moves after win", () => {
    const state: GameState = {
      board: ["X", "X", "X", null, null, null, null, null, null],
      turn: "O",
      status: "won",
      winner: "X",
    };

    const next = computeNextState(state, 3);
    expect(next).toBe(state);
  });
});
