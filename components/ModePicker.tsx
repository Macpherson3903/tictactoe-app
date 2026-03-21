"use client";

import { useEffect, useMemo, useReducer, useState } from "react";
import TicTacToeBoard from "./TicTacToeBoard";
import RoomControls from "./RoomControls";
import type { GameState, MoveIndex, Player } from "@/lib/game/types";
import { gameReducer, makeInitialState } from "@/lib/game/reducer";
import {
  difficultyFromIndex,
  difficultyToIndex,
  pickAiMove,
  type AiDifficulty,
} from "@/lib/game/ai";

type Mode = "local" | "ai" | "online";

type LocalScore = {
  X: number;
  O: number;
  draws: number;
};

const AI_DELAY_MS = 550;

function ResultLine({
  status,
  winner,
  turn,
}: {
  status: GameState["status"];
  winner?: Player;
  turn: Player;
}) {
  if (status === "won")
    return <p className="text-lg font-semibold">{winner} wins!</p>;
  if (status === "draw") return <p className="text-lg font-semibold">Draw!</p>;
  return <p className="text-lg font-semibold">{turn} turn</p>;
}

type ModeState = {
  game: GameState;
  score: LocalScore;
};

type ModeAction =
  | { type: "MOVE"; index: MoveIndex }
  | { type: "RESET_GAME"; startingPlayer?: Player }
  | { type: "RESET_MATCH"; startingPlayer?: Player }
  | { type: "SET_SCORE"; score: LocalScore };

function modeReducer(state: ModeState, action: ModeAction): ModeState {
  switch (action.type) {
    case "MOVE": {
      const prevStatus = state.game.status;
      const nextGame = gameReducer(state.game, {
        type: "MOVE",
        index: action.index,
      });

      // Score only when a terminal state is reached.
      if (prevStatus === "playing" && nextGame.status !== "playing") {
        if (nextGame.status === "draw") {
          return {
            game: nextGame,
            score: { ...state.score, draws: state.score.draws + 1 },
          };
        }
        if (nextGame.winner) {
          return {
            game: nextGame,
            score: {
              ...state.score,
              [nextGame.winner]: state.score[nextGame.winner] + 1,
            },
          };
        }
      }

      return { ...state, game: nextGame };
    }
    case "SET_SCORE":
      return { ...state, score: action.score };
    case "RESET_GAME": {
      return {
        ...state,
        game: gameReducer(state.game, {
          type: "RESET",
          startingPlayer: action.startingPlayer,
        }),
      };
    }
    case "RESET_MATCH": {
      return {
        game: gameReducer(state.game, {
          type: "RESET",
          startingPlayer: action.startingPlayer,
        }),
        score: { X: 0, O: 0, draws: 0 },
      };
    }
    default:
      return state;
  }
}

export default function ModePicker() {
  const [mode, setMode] = useState<Mode | null>(null);
  const [baseDifficulty, setBaseDifficulty] = useState<AiDifficulty>("easy");
  const [progressiveDifficulty, setProgressiveDifficulty] = useState(true);

  const [state, dispatch] = useReducer(modeReducer, undefined, () => ({
    game: makeInitialState("X"),
    score: { X: 0, O: 0, draws: 0 },
  }));

  // Persist local/AI score across refreshes.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("tictactoe:score");
      if (!raw) return;
      const parsed: unknown = JSON.parse(raw);
      if (
        parsed &&
        typeof parsed === "object" &&
        "X" in parsed &&
        "O" in parsed &&
        "draws" in parsed
      ) {
        const maybe = parsed as Partial<LocalScore>;
        if (
          typeof maybe.X === "number" &&
          typeof maybe.O === "number" &&
          typeof maybe.draws === "number"
        ) {
          dispatch({
            type: "SET_SCORE",
            score: { X: maybe.X, O: maybe.O, draws: maybe.draws },
          });
        }
      }
    } catch {
      // Ignore storage/parsing errors.
    }
  }, [dispatch]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        "tictactoe:score",
        JSON.stringify(state.score),
      );
    } catch {
      // Ignore storage errors.
    }
  }, [state.score]);

  const disabledIndices = useMemo(() => {
    const set = new Set<MoveIndex>();
    state.game.board.forEach((cell, i) => {
      if (cell !== null) set.add(i as MoveIndex);
    });
    return set;
  }, [state.game.board]);

  const isTerminal = state.game.status !== "playing";

  const aiPlayer: Player = "O";
  const humanPlayer: Player = "X";

  const effectiveAiDifficulty = useMemo((): AiDifficulty => {
    if (!progressiveDifficulty) return baseDifficulty;
    const bumped = difficultyToIndex(baseDifficulty) + state.score.X;
    return difficultyFromIndex(bumped);
  }, [baseDifficulty, progressiveDifficulty, state.score.X]);

  useEffect(() => {
    if (mode !== "ai") return;
    if (isTerminal) return;
    if (state.game.turn !== aiPlayer) return;

    const t = window.setTimeout(() => {
      const pick = pickAiMove(state.game, aiPlayer, effectiveAiDifficulty);
      if (pick === null) return;
      dispatch({ type: "MOVE", index: pick });
    }, AI_DELAY_MS);

    return () => window.clearTimeout(t);
  }, [dispatch, state.game, isTerminal, mode, effectiveAiDifficulty]);

  const resetGame = (startingPlayer: Player = "X") => {
    dispatch({ type: "RESET_GAME", startingPlayer });
  };

  const resetMatch = (startingPlayer: Player = "X") => {
    dispatch({ type: "RESET_MATCH", startingPlayer });
  };

  const canInteract =
    mode === "local" ||
    (mode === "ai" && !isTerminal && state.game.turn === humanPlayer) ||
    (mode === "online" && false);

  const onCellMove = (index: MoveIndex) => {
    if (mode === "online") return;
    dispatch({ type: "MOVE", index });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-zinc-50 dark:bg-black">
      <div className="w-full max-w-3xl">
        <header className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Tic Tac Toe
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-300">
            Pick a mode, then play.
          </p>
        </header>

        {!mode ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              type="button"
              onClick={() => {
                setMode("local");
                resetMatch("X");
              }}
              className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/60 p-5 text-left hover:bg-white/80 dark:hover:bg-zinc-950/40 transition-colors"
            >
              <div className="font-semibold text-zinc-900 dark:text-zinc-50">
                Local 2-player
              </div>
              <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                Pass the device between turns.
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode("ai");
                resetMatch("X");
              }}
              className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/60 p-5 text-left hover:bg-white/80 dark:hover:bg-zinc-950/40 transition-colors"
            >
              <div className="font-semibold text-zinc-900 dark:text-zinc-50">
                Vs AI
              </div>
              <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                Easy, medium, or hard — optional ramp-up as you win.
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode("online");
              }}
              className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/60 p-5 text-left hover:bg-white/80 dark:hover:bg-zinc-950/40 transition-colors"
            >
              <div className="font-semibold text-zinc-900 dark:text-zinc-50">
                Online Multiplayer
              </div>
              <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                Create or join a room and play in real time.
              </div>
            </button>
          </div>
        ) : mode === "online" ? (
          <div className="flex flex-col gap-4">
            <RoomControls />
            <button
              type="button"
              onClick={() => {
                setMode(null);
              }}
              className="mt-1 self-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/40 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-950"
            >
              Back to modes
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-[420px_1fr] gap-6">
            <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/60 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-300">
                    Mode
                  </div>
                  <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                    {mode === "local"
                      ? "Local 2-player"
                      : mode === "ai"
                        ? "Vs AI"
                        : "Online"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-zinc-600 dark:text-zinc-300">
                    Starting
                  </div>
                  <div className="font-semibold">
                    {state.game.turn === "X" ? "X" : "O"}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <ResultLine
                    status={state.game.status}
                    winner={state.game.winner}
                    turn={state.game.turn}
                  />
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                    {mode === "ai"
                      ? "Click only when it's your turn."
                      : "Tap a square to move."}
                  </p>
                  {mode === "ai" && (
                    <div className="mt-4 space-y-3">
                      <div>
                        <div className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                          Difficulty
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {(
                            [
                              ["easy", "Easy"],
                              ["medium", "Medium"],
                              ["hard", "Hard"],
                            ] as const
                          ).map(([id, label]) => (
                            <button
                              key={id}
                              type="button"
                              onClick={() => setBaseDifficulty(id)}
                              className={[
                                "rounded-lg px-3 py-1.5 text-sm font-medium border transition-colors",
                                baseDifficulty === id
                                  ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                                  : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/40 hover:bg-zinc-50 dark:hover:bg-zinc-950",
                              ].join(" ")}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-zinc-700 dark:text-zinc-300">
                        <input
                          type="checkbox"
                          checked={progressiveDifficulty}
                          onChange={(e) =>
                            setProgressiveDifficulty(e.target.checked)
                          }
                          className="rounded border-zinc-300 dark:border-zinc-600"
                        />
                        <span>
                          Ramp up after each win (caps at hard; uses match
                          score)
                        </span>
                      </label>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Active:{" "}
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                          {effectiveAiDifficulty}
                        </span>
                        {progressiveDifficulty &&
                          baseDifficulty !== effectiveAiDifficulty && (
                            <span>
                              {" "}
                              (started {baseDifficulty}, raised by wins)
                            </span>
                          )}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5">
                <TicTacToeBoard
                  board={state.game.board}
                  onMove={canInteract ? onCellMove : undefined}
                  disabled={isTerminal}
                  disabledIndices={disabledIndices}
                />
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    resetMatch("X");
                  }}
                  className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/40 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-950 transition-colors"
                >
                  Restart match
                </button>
                <button
                  type="button"
                  onClick={() => resetGame(state.game.turn)}
                  className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/40 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-950 transition-colors"
                >
                  Play again
                </button>
              </div>
            </section>

            <aside className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/60 p-5">
              <div className="font-semibold text-zinc-900 dark:text-zinc-50">
                Score
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <div className="text-zinc-600 dark:text-zinc-300">X</div>
                  <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                    {state.score.X}
                  </div>
                </div>
                <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <div className="text-zinc-600 dark:text-zinc-300">O</div>
                  <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                    {state.score.O}
                  </div>
                </div>
                <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 col-span-2">
                  <div className="text-zinc-600 dark:text-zinc-300">Draws</div>
                  <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                    {state.score.draws}
                  </div>
                </div>
              </div>

              <div className="mt-5 text-sm text-zinc-600 dark:text-zinc-300 leading-6">
                {mode === "ai" ? (
                  <>
                    You are{" "}
                    <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                      X
                    </span>
                    . The AI plays{" "}
                    <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                      O
                    </span>{" "}
                    at <span className="font-semibold">{effectiveAiDifficulty}</span>{" "}
                    {progressiveDifficulty && "(with ramp-up)"}.
                  </>
                ) : (
                  <>Two humans alternate turns.</>
                )}
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
