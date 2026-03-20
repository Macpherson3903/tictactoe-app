"use client";

import type { Board, MoveIndex, Player } from "@/lib/game/types";

export default function TicTacToeBoard({
  board,
  onMove,
  disabled = false,
  disabledIndices,
}: {
  board: Board;
  onMove?: (index: MoveIndex) => void;
  disabled?: boolean;
  disabledIndices?: Set<MoveIndex>;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 w-full max-w-[360px]">
      {board.map((cell, i) => {
        const idx = i as MoveIndex;
        const cellDisabled =
          disabled || disabledIndices?.has(idx) || cell !== null || !onMove;
        const player = cell as Player | null;

        return (
          <button
            key={i}
            type="button"
            onClick={() => onMove?.(idx)}
            disabled={cellDisabled}
            className={[
              "aspect-square rounded-xl border text-center select-none",
              "transition-colors",
              "bg-white/80 dark:bg-black/40",
              "border-zinc-200 dark:border-zinc-800",
              "hover:bg-white dark:hover:bg-black",
              "disabled:cursor-not-allowed disabled:opacity-70",
              "focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-black",
            ].join(" ")}
            aria-label={
              player ? `Cell ${i + 1}: ${player}` : `Cell ${i + 1}: empty`
            }
          >
            <span className="text-4xl font-semibold leading-none">
              {cell ? cell : ""}
            </span>
          </button>
        );
      })}
    </div>
  );
}
