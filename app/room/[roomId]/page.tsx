"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import TicTacToeBoard from "@/components/TicTacToeBoard";
import type { GameState, MoveIndex, Player } from "@/lib/game/types";
import { makeInitialState } from "@/lib/game/reducer";
import { createRoomSocket } from "@/lib/online/client";

type RoomStatePayload = {
  roomId: string;
  board: GameState["board"];
  turn: Player;
  status: GameState["status"];
  winner?: Player;
  players: { X: boolean; O: boolean };
};

type OnlineScore = { X: number; O: number; draws: number };

type OnlineScoreAction = { type: "DRAW" } | { type: "WIN"; winner: Player };

function onlineScoreReducer(
  state: OnlineScore,
  action: OnlineScoreAction,
): OnlineScore {
  switch (action.type) {
    case "DRAW":
      return { ...state, draws: state.draws + 1 };
    case "WIN":
      return { ...state, [action.winner]: state[action.winner] + 1 };
    default:
      return state;
  }
}

export default function RoomPage() {
  const params = useParams<{ roomId: string }>();
  const router = useRouter();

  const roomId = params?.roomId;

  const socketRef = useRef<ReturnType<typeof createRoomSocket> | null>(null);

  const [connected, setConnected] = useState(false);
  const [myPlayer, setMyPlayer] = useState<Player | null>(null);
  const [game, setGame] = useState<GameState>(() => makeInitialState("X"));

  const [players, setPlayers] = useState<{ X: boolean; O: boolean }>({
    X: false,
    O: false,
  });

  const [matchScore, dispatchMatchScore] = useReducer(onlineScoreReducer, {
    X: 0,
    O: 0,
    draws: 0,
  });
  const lastCountedTerminalRef = useRef<GameState["status"]>("playing");

  const disabledIndices = useMemo(() => {
    const set = new Set<MoveIndex>();
    game.board.forEach((cell, i) => {
      if (cell !== null) set.add(i as MoveIndex);
    });
    return set;
  }, [game.board]);

  const canInteract =
    connected &&
    myPlayer !== null &&
    game.status === "playing" &&
    game.turn === myPlayer;

  useEffect(() => {
    if (!roomId || typeof roomId !== "string") return;

    const socket = createRoomSocket();
    socketRef.current = socket;
    socket.connect();

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("room:join", { roomId });
    });

    socket.on("room:joined", (payload: { player: Player }) => {
      setMyPlayer(payload.player);
    });

    socket.on("room:state", (payload: RoomStatePayload) => {
      setGame({
        board: payload.board,
        turn: payload.turn,
        status: payload.status,
        winner: payload.winner,
      });
      setPlayers(payload.players);
    });

    socket.on("room:error", () => {
      // If the room is invalid/full, just bounce back to the lobby.
      router.push("/");
    });

    socket.on("disconnect", () => {
      setConnected(false);
      setMyPlayer(null);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [roomId, router]);

  // Update match score once per finished round.
  useEffect(() => {
    if (game.status === "playing") {
      lastCountedTerminalRef.current = "playing";
      return;
    }

    if (lastCountedTerminalRef.current === game.status) return;

    if (game.status === "draw") {
      dispatchMatchScore({ type: "DRAW" });
    } else if (game.status === "won" && game.winner) {
      dispatchMatchScore({ type: "WIN", winner: game.winner });
    }

    lastCountedTerminalRef.current = game.status;
  }, [game.status, game.winner]);

  const onMove = (index: MoveIndex) => {
    if (!socketRef.current) return;
    if (!canInteract) return;
    socketRef.current.emit("move", { roomId, index });
  };

  const resetMatch = () => {
    if (!socketRef.current) return;
    socketRef.current.emit("reset", { roomId, startingPlayer: "X" });
  };

  const statusText = useMemo(() => {
    if (!connected) return "Connecting...";
    if (myPlayer === null) return "Waiting for your player slot...";
    if (!players.X || !players.O) return "Waiting for opponent...";
    if (game.status === "won") return `${game.winner} wins!`;
    if (game.status === "draw") return "Draw!";
    if (game.turn === myPlayer) return "Your move";
    return "Opponent's turn";
  }, [
    connected,
    myPlayer,
    players.O,
    players.X,
    game.status,
    game.turn,
    game.winner,
  ]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-zinc-50 dark:bg-black">
      <div className="w-full max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/40 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-950"
          >
            Back
          </button>
          <div className="text-right">
            <div className="text-sm text-zinc-600 dark:text-zinc-300">Room</div>
            <div className="font-semibold">{roomId}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[420px_1fr] gap-6">
          <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/60 p-5">
            <div className="text-zinc-900 dark:text-zinc-50 font-semibold text-lg">
              Tic Tac Toe
            </div>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
              {statusText}
            </p>

            <div className="mt-5">
              <TicTacToeBoard
                board={game.board}
                onMove={canInteract ? onMove : undefined}
                disabled={game.status !== "playing"}
                disabledIndices={disabledIndices}
              />
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={resetMatch}
                className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/40 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-950"
              >
                Restart
              </button>
            </div>
          </section>

          <aside className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/60 p-5">
            <div className="font-semibold text-zinc-900 dark:text-zinc-50">
              Match score
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <div className="text-zinc-600 dark:text-zinc-300">X</div>
                <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                  {matchScore.X}
                </div>
              </div>
              <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <div className="text-zinc-600 dark:text-zinc-300">O</div>
                <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                  {matchScore.O}
                </div>
              </div>
              <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 col-span-2">
                <div className="text-zinc-600 dark:text-zinc-300">Draws</div>
                <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                  {matchScore.draws}
                </div>
              </div>
            </div>

            <div className="font-semibold text-zinc-900 dark:text-zinc-50">
              Players
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <div className="text-zinc-600 dark:text-zinc-300">X</div>
                <div className="font-semibold">
                  {players.X ? "Connected" : "Waiting"}
                </div>
              </div>
              <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <div className="text-zinc-600 dark:text-zinc-300">O</div>
                <div className="font-semibold">
                  {players.O ? "Connected" : "Waiting"}
                </div>
              </div>
            </div>

            <div className="mt-5 text-sm text-zinc-600 dark:text-zinc-300 leading-6">
              {myPlayer ? (
                <>
                  You are{" "}
                  <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                    {myPlayer}
                  </span>
                  . Make a move when it is your turn.
                </>
              ) : (
                <>Joining...</>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
