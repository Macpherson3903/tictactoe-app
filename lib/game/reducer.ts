import type { GameState, MoveIndex, Player } from "./types";
import { computeNextState, createEmptyBoard } from "./rules";

export type GameAction =
  | { type: "MOVE"; index: MoveIndex }
  | { type: "RESET"; startingPlayer?: Player }
  | { type: "SET_STATE"; state: GameState };

export function makeInitialState(startingPlayer: Player = "X"): GameState {
  return {
    board: createEmptyBoard(),
    turn: startingPlayer,
    status: "playing",
    winner: undefined,
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "MOVE":
      return computeNextState(state, action.index);
    case "RESET": {
      const starting = action.startingPlayer ?? "X";
      return makeInitialState(starting);
    }
    case "SET_STATE":
      return action.state;
    default:
      return state;
  }
}
