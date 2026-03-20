import { describe, expect, it } from "vitest";
import type { GameState, MoveIndex } from "../types";
import { gameReducer, makeInitialState } from "../reducer";

describe("reducer", () => {
  it("creates initial state with empty board", () => {
    const state = makeInitialState("O");
    expect(state.turn).toBe("O");
    expect(state.status).toBe("playing");
    expect(state.board).toHaveLength(9);
    expect(state.board.every((c) => c === null)).toBe(true);
  });

  it("applies MOVE actions and toggles turn", () => {
    let state: GameState = makeInitialState("X");
    const firstMove: MoveIndex = 0;
    state = gameReducer(state, { type: "MOVE", index: firstMove });
    expect(state.board[0]).toBe("X");
    expect(state.turn).toBe("O");
    expect(state.status).toBe("playing");
  });

  it("does not apply illegal moves (occupied cell)", () => {
    let state: GameState = makeInitialState("X");
    state = gameReducer(state, { type: "MOVE", index: 0 });
    const afterFirst = state;

    // Attempt to play on the same occupied index
    state = gameReducer(state, { type: "MOVE", index: 0 });
    expect(state).toBe(afterFirst);
  });

  it("resets state on RESET", () => {
    let state = makeInitialState("X");
    state = gameReducer(state, { type: "MOVE", index: 0 });
    expect(state.board[0]).toBe("X");

    state = gameReducer(state, { type: "RESET", startingPlayer: "O" });
    expect(state.turn).toBe("O");
    expect(state.status).toBe("playing");
    expect(state.board[0]).toBe(null);
  });
});
