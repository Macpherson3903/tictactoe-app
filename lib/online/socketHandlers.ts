import type { Server } from "socket.io";

import type {
  Board,
  GameState,
  GameStatus,
  MoveIndex,
  Player,
} from "@/lib/game/types";
import { computeNextState, createEmptyBoard } from "@/lib/game/rules";

type PlayerSlots = {
  X: string | null;
  O: string | null;
};

type RoomState = {
  roomId: string;
  game: GameState;
  players: PlayerSlots;
};

const rooms = new Map<string, RoomState>();

function makeInitialGame(): GameState {
  return {
    board: createEmptyBoard(),
    turn: "X",
    status: "playing",
    winner: undefined,
  };
}

function sanitizeRoomId(roomId: string): string | null {
  const trimmed = roomId.trim();
  if (!/^[A-Za-z0-9_-]{3,32}$/.test(trimmed)) return null;
  return trimmed;
}

function getOrCreateRoom(roomId: string): RoomState {
  const existing = rooms.get(roomId);
  if (existing) return existing;

  const room: RoomState = {
    roomId,
    game: makeInitialGame(),
    players: { X: null, O: null },
  };
  rooms.set(roomId, room);
  return room;
}

function publicRoomState(room: RoomState) {
  return {
    roomId: room.roomId,
    board: room.game.board,
    turn: room.game.turn,
    status: room.game.status as GameStatus,
    winner: room.game.winner,
    players: { X: room.players.X !== null, O: room.players.O !== null },
  };
}

function isLegalMove(board: Board, idx: number): idx is MoveIndex {
  if (idx < 0 || idx > 8) return false;
  return board[idx] === null;
}

export function attachSocketHandlers(io: Server) {
  io.on("connection", (socket) => {
    socket.on("room:join", (payload: { roomId?: string }) => {
      const roomIdRaw = payload?.roomId ?? "";
      const roomId = sanitizeRoomId(roomIdRaw);
      if (!roomId) {
        socket.emit("room:error", { message: "Invalid room id." });
        return;
      }

      const room = getOrCreateRoom(roomId);

      // Assign player slot (first join -> X, second join -> O).
      let assigned: Player | null = null;
      if (room.players.X === null && socket.id !== room.players.X) {
        room.players.X = socket.id;
        assigned = "X";
      } else if (room.players.O === null && socket.id !== room.players.O) {
        room.players.O = socket.id;
        assigned = "O";
      } else if (room.players.X === socket.id) {
        assigned = "X";
      } else if (room.players.O === socket.id) {
        assigned = "O";
      } else {
        socket.emit("room:error", { message: "Room is full." });
        return;
      }

      socket.join(roomId);
      socket.data.roomId = roomId;
      socket.data.player = assigned;

      socket.emit("room:joined", { roomId, player: assigned });
      io.to(roomId).emit("room:state", publicRoomState(room));
    });

    socket.on("move", (payload: { roomId?: string; index?: number }) => {
      const roomId = payload?.roomId;
      const idx = payload?.index;

      const joinedRoomId = socket.data.roomId as string | undefined;
      if (!roomId || roomId !== joinedRoomId) return;
      if (typeof idx !== "number") return;

      const room = rooms.get(roomId);
      if (!room) return;
      if (room.game.status !== "playing") return;

      const expectedSocketId = room.players[room.game.turn];
      if (!expectedSocketId) return;
      if (socket.id !== expectedSocketId) {
        socket.emit("move:error", { message: "Not your turn." });
        return;
      }

      if (!isLegalMove(room.game.board, idx)) return;

      const moveIndex = idx as MoveIndex;
      const next = computeNextState(room.game, moveIndex);
      room.game = next;

      io.to(roomId).emit("room:state", publicRoomState(room));
    });

    socket.on(
      "reset",
      (payload: { roomId?: string; startingPlayer?: Player }) => {
        const roomId = payload?.roomId;
        const joinedRoomId = socket.data.roomId as string | undefined;
        if (!roomId || roomId !== joinedRoomId) return;

        const room = rooms.get(roomId);
        if (!room) return;

        const startingPlayer = payload?.startingPlayer ?? "X";
        room.game = {
          board: createEmptyBoard(),
          turn: startingPlayer,
          status: "playing",
          winner: undefined,
        };

        io.to(roomId).emit("room:state", publicRoomState(room));
      },
    );

    socket.on("disconnect", () => {
      const roomId = socket.data.roomId as string | undefined;
      const player = socket.data.player as Player | undefined;
      if (!roomId || !player) return;

      const room = rooms.get(roomId);
      if (!room) return;

      if (room.players[player] === socket.id) {
        room.players[player] = null;
      }

      // Cleanup if both players left.
      if (!room.players.X && !room.players.O) {
        rooms.delete(roomId);
        return;
      }

      io.to(roomId).emit("room:state", publicRoomState(room));
    });
  });
}
