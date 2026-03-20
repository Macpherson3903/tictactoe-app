"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RoomControls() {
  const router = useRouter();
  const [roomId, setRoomId] = useState("");

  const createRoom = () => {
    const id = `room-${Math.random().toString(36).slice(2, 10)}`;
    router.push(`/room/${id}`);
  };

  const joinRoom = () => {
    const trimmed = roomId.trim();
    if (!trimmed) return;
    router.push(`/room/${trimmed}`);
  };

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/60 p-5">
      <div className="font-semibold text-zinc-900 dark:text-zinc-50 text-lg">
        Online Room
      </div>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
        Create a room, then share the room code with a friend.
      </p>

      <div className="mt-5 flex flex-col gap-3">
        <button
          type="button"
          onClick={createRoom}
          className="rounded-xl bg-zinc-900 text-white px-4 py-2 text-sm font-medium hover:bg-zinc-800 transition-colors"
        >
          Create room
        </button>

        <div className="flex items-center gap-2">
          <input
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder="Enter room code"
            className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/40 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400"
          />
          <button
            type="button"
            onClick={joinRoom}
            className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/40 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-950 transition-colors"
          >
            Join
          </button>
        </div>
      </div>
    </div>
  );
}
