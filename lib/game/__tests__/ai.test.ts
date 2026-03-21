import { describe, expect, it } from "vitest";
import type { GameState, MoveIndex } from "../types";
import { pickAiMove, pickEasyAiMove, pickHardAiMove } from "../ai";

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
      // X threatens 0-1-2 on the next turn; O must play 2.
      board: ["X", "X", null, "O", null, null, null, null, null],
      turn: "O",
      status: "playing",
      winner: undefined,
    };

    const move = pickEasyAiMove(state, "O");
    expect(move).toBe(2 as MoveIndex);
  });
});

describe("pickHardAiMove", () => {
  it("chooses an immediate winning move", () => {
    const state: GameState = {
      board: ["X", null, null, "O", "O", null, "X", null, "X"],
      turn: "O",
      status: "playing",
      winner: undefined,
    };

    const move = pickHardAiMove(state, "O");
    expect(move).toBe(5 as MoveIndex);
  });

  it("blocks when X can win next on the top row", () => {
    // X=2, O=1, O to move — only legal way to stop X winning at 2 is to play 2.
    const state: GameState = {
      board: ["X", "X", null, "O", null, null, null, null, null],
      turn: "O",
      status: "playing",
      winner: undefined,
    };

    const move = pickHardAiMove(state, "O");
    expect(move).toBe(2 as MoveIndex);
  });
});

describe("pickAiMove", () => {
  it("uses easy and hard on a forced block", () => {
    const state: GameState = {
      board: ["X", "X", null, "O", null, null, null, null, null],
      turn: "O",
      status: "playing",
      winner: undefined,
    };
    expect(pickAiMove(state, "O", "easy")).toBe(2 as MoveIndex);
    expect(pickAiMove(state, "O", "hard")).toBe(2 as MoveIndex);
  });
});
