import { describe, expect, it } from "vitest";
import type { GameState, MoveIndex } from "../types";
import { pickEasyAiMove } from "../ai";

describe("pickEasyAiMove", () => {
  it("chooses an immediate winning move", () => {
    const state: GameState = {
      board: ["X", null, null, "O", "O", null, "X", null, "X"],
      turn: "O",
      status: "playing",
      winner: undefined,
    };

    const move = pickEasyAiMove(state, "O");
    expect(move).toBe(5 as MoveIndex);
  });

  it("blocks an immediate opponent win", () => {
    const state: GameState = {
      // X threatens to win next turn with index 2 (0-1-2).
      // O must block at index 2; O has no immediate winning move.
      board: ["X", "X", null, "O", null, null, "O", null, null],
      turn: "O",
      status: "playing",
      winner: undefined,
    };

    const move = pickEasyAiMove(state, "O");
    // X threatens 0-1-2 next turn, so AI blocks at index 2.
    expect(move).toBe(2 as MoveIndex);
  });
});
