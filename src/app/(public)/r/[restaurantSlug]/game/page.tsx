"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, RotateCcw, Trophy, Gamepad2, Eraser } from "lucide-react";

const PUZZLES = {
  easy: {
    initial: [
      [5, 3, 0, 0, 7, 0, 0, 0, 0],
      [6, 0, 0, 1, 9, 5, 0, 0, 0],
      [0, 9, 8, 0, 0, 0, 0, 6, 0],
      [8, 0, 0, 0, 6, 0, 0, 0, 3],
      [4, 0, 0, 8, 0, 3, 0, 0, 1],
      [7, 0, 0, 0, 2, 0, 0, 0, 6],
      [0, 6, 0, 0, 0, 0, 2, 8, 0],
      [0, 0, 0, 4, 1, 9, 0, 0, 5],
      [0, 0, 0, 0, 8, 0, 0, 7, 9],
    ],
    solution: [
      [5, 3, 4, 6, 7, 8, 9, 1, 2],
      [6, 7, 2, 1, 9, 5, 3, 4, 8],
      [1, 9, 8, 3, 4, 2, 5, 6, 7],
      [8, 5, 9, 7, 6, 1, 4, 2, 3],
      [4, 2, 6, 8, 5, 3, 7, 9, 1],
      [7, 1, 3, 9, 2, 4, 8, 5, 6],
      [9, 6, 1, 5, 3, 7, 2, 8, 4],
      [2, 8, 7, 4, 1, 9, 6, 3, 5],
      [3, 4, 5, 2, 8, 6, 1, 7, 9],
    ],
  },
};

export default function SudokuGamePage() {
  const params = useParams();
  const slug = params.restaurantSlug as string;

  const [grid, setGrid] = useState<number[][]>(() =>
    PUZZLES.easy.initial.map((row) => [...row])
  );
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [isWon, setIsWon] = useState(false);
  const [restaurantName, setRestaurantName] = useState("Restaurant");
  const [brandColor, setBrandColor] = useState("#0F766E");

  useEffect(() => {
    fetch(`/api/restaurants/by-slug/${slug}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setRestaurantName(json.data.restaurant.name);
          setBrandColor(json.data.restaurant.primaryColor || "#0F766E");
        }
      })
      .catch(() => {});
  }, [slug]);

  useEffect(() => {
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++)
        if (PUZZLES.easy.initial[r][c] === 0) { setSelectedCell([r, c]); return; }
  }, []);

  useEffect(() => {
    if (isWon) return;
    const interval = setInterval(() => setSeconds((p) => p + 1), 1000);
    return () => clearInterval(interval);
  }, [isWon]);

  const handleNumberInput = React.useCallback(
    (num: number) => {
      if (!selectedCell || isWon) return;
      const [r, c] = selectedCell;
      if (PUZZLES.easy.initial[r][c] !== 0) return;
      const newGrid = grid.map((row) => [...row]);
      newGrid[r][c] = num;
      setGrid(newGrid);
      let solved = true;
      outer: for (let i = 0; i < 9; i++)
        for (let j = 0; j < 9; j++)
          if (newGrid[i][j] !== PUZZLES.easy.solution[i][j]) { solved = false; break outer; }
      if (solved) setIsWon(true);
    },
    [selectedCell, isWon, grid]
  );

  const handleErase = React.useCallback(() => {
    if (!selectedCell || isWon) return;
    const [r, c] = selectedCell;
    if (PUZZLES.easy.initial[r][c] !== 0) return;
    const newGrid = grid.map((row) => [...row]);
    newGrid[r][c] = 0;
    setGrid(newGrid);
  }, [selectedCell, isWon, grid]);

  const handleRestart = () => {
    setGrid(PUZZLES.easy.initial.map((row) => [...row]));
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++)
        if (PUZZLES.easy.initial[r][c] === 0) { setSelectedCell([r, c]); break; }
    setSeconds(0);
    setIsWon(false);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isWon) return;
      if (e.key >= "1" && e.key <= "9") { handleNumberInput(parseInt(e.key, 10)); return; }
      if (["Backspace","Delete","0"].includes(e.key)) { handleErase(); return; }
      if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)) {
        e.preventDefault();
        setSelectedCell((prev) => {
          if (!prev) return [0, 0];
          let [r, c] = prev;
          if (e.key === "ArrowUp") r = Math.max(0, r - 1);
          if (e.key === "ArrowDown") r = Math.min(8, r + 1);
          if (e.key === "ArrowLeft") c = Math.max(0, c - 1);
          if (e.key === "ArrowRight") c = Math.min(8, c + 1);
          return [r, c];
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleNumberInput, handleErase, isWon]);

  const fmt = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
  const isClue = selectedCell ? PUZZLES.easy.initial[selectedCell[0]][selectedCell[1]] !== 0 : false;

  return (
    <div
      className="w-full flex flex-col bg-slate-50 dark:bg-slate-900 select-none touch-manipulation overflow-hidden"
      style={{ height: "100dvh" }}
    >
      {/* Top Bar */}
      <div className="shrink-0 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-700 shadow-sm px-3 py-2 flex items-center justify-between w-full z-30">
        <Link
          href={`/r/${slug}`}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold transition active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </Link>
        <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate max-w-[130px] sm:max-w-[180px] text-center">
          {restaurantName}
        </span>
        <div className="flex items-center gap-1.5">
          <div className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-600 flex items-center gap-1">
            <span className="text-[10px] text-slate-400">⏱</span>
            <span>{fmt(seconds)}</span>
          </div>
          <button
            type="button"
            onClick={handleRestart}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 transition cursor-pointer"
            aria-label="Restart"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Sub-Header */}
      <div className="shrink-0 px-3 pt-1.5 pb-1 flex items-center justify-between max-w-[420px] mx-auto w-full">
        <div className="flex items-center gap-1.5">
          <div
            className="w-5 h-5 rounded-md flex items-center justify-center text-white shadow-sm"
            style={{ backgroundColor: brandColor }}
          >
            <Gamepad2 className="w-3 h-3" />
          </div>
          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Sudoku</span>
          <span className="text-[10px] text-slate-500 font-medium bg-slate-100 dark:bg-slate-700 dark:text-slate-400 px-1.5 py-0.5 rounded">
            Casual
          </span>
        </div>
        {selectedCell && (
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            {isClue ? "Fixed clue" : "Tap a number to place"}
          </span>
        )}
      </div>

      {/* Grid */}
      <div className="flex-1 min-h-0 flex items-center justify-center px-2">
        <div
          className="aspect-square bg-slate-900 rounded-2xl shadow-md grid grid-cols-9 gap-[1px] p-1"
          style={{
            width: "min(360px, calc(100vw - 1rem), calc(100dvh - 210px))",
            height: "min(360px, calc(100vw - 1rem), calc(100dvh - 210px))",
          }}
        >
          {grid.map((row, r) =>
            row.map((val, c) => {
              const isInitial = PUZZLES.easy.initial[r][c] !== 0;
              const isSel = selectedCell?.[0] === r && selectedCell?.[1] === c;
              const selVal = selectedCell ? grid[selectedCell[0]][selectedCell[1]] : 0;
              const isSame = selVal !== 0 && val === selVal && !isSel;
              const inLine = selectedCell && (selectedCell[0] === r || selectedCell[1] === c);
              const inBox =
                selectedCell &&
                Math.floor(selectedCell[0] / 3) === Math.floor(r / 3) &&
                Math.floor(selectedCell[1] / 3) === Math.floor(c / 3);
              const bR = (c + 1) % 3 === 0 && c !== 8 ? "border-r-2 border-slate-700" : "";
              const bB = (r + 1) % 3 === 0 && r !== 8 ? "border-b-2 border-slate-700" : "";
              return (
                <button
                  key={`${r}-${c}`}
                  type="button"
                  onClick={() => setSelectedCell([r, c])}
                  style={isSel ? { backgroundColor: brandColor } : undefined}
                  className={`aspect-square flex items-center justify-center text-sm font-semibold transition-colors ${bR} ${bB} ${
                    isSel
                      ? "text-white font-black ring-2 ring-white/70 ring-inset shadow-inner"
                      : isSame
                      ? "bg-amber-100 text-amber-950 font-black ring-1 ring-amber-300"
                      : inLine || inBox
                      ? "bg-slate-100 text-slate-800"
                      : "bg-white text-slate-900"
                  } ${isInitial ? "text-slate-950 font-black" : "text-teal-700 font-bold"}`}
                >
                  {val !== 0 ? val : ""}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Number Keypad */}
      <div className="shrink-0 px-3 pt-2 pb-3 max-w-[420px] mx-auto w-full">
        <div className="grid grid-cols-5 gap-2 mb-2">
          {[1, 2, 3, 4, 5].map((num) => {
            const active = selectedCell && grid[selectedCell[0]][selectedCell[1]] === num;
            return (
              <button
                key={num}
                type="button"
                onClick={() => handleNumberInput(num)}
                disabled={!selectedCell || isClue || isWon}
                className={`h-10 rounded-xl text-base font-bold border transition-all active:scale-95 flex items-center justify-center shadow-sm ${
                  active
                    ? "bg-teal-50 border-teal-500 text-teal-800 ring-1 ring-teal-400"
                    : "bg-white dark:bg-slate-700 hover:bg-slate-50 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-100"
                } disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100`}
              >
                {num}
              </button>
            );
          })}
        </div>
        <div className="grid grid-cols-5 gap-2">
          {[6, 7, 8, 9].map((num) => {
            const active = selectedCell && grid[selectedCell[0]][selectedCell[1]] === num;
            return (
              <button
                key={num}
                type="button"
                onClick={() => handleNumberInput(num)}
                disabled={!selectedCell || isClue || isWon}
                className={`h-10 rounded-xl text-base font-bold border transition-all active:scale-95 flex items-center justify-center shadow-sm ${
                  active
                    ? "bg-teal-50 border-teal-500 text-teal-800 ring-1 ring-teal-400"
                    : "bg-white dark:bg-slate-700 hover:bg-slate-50 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-100"
                } disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100`}
              >
                {num}
              </button>
            );
          })}
          <button
            type="button"
            onClick={handleErase}
            disabled={!selectedCell || isClue || isWon}
            className="h-10 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 border border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-700 dark:text-slate-300 transition-all active:scale-95 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 gap-1"
            aria-label="Erase"
          >
            <Eraser className="w-4 h-4" />
            <span className="text-xs font-semibold">Del</span>
          </button>
        </div>
      </div>

      {/* Victory Modal */}
      {isWon && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 max-w-xs w-full shadow-2xl text-center border border-slate-100 dark:border-slate-700 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
              <Trophy className="w-8 h-8 animate-bounce" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mb-1">Puzzle Solved!</h3>
            <p className="text-xs text-slate-500 mb-4">
              Completed in <span className="font-bold text-slate-800 dark:text-slate-200">{fmt(seconds)}</span>
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleRestart}
                className="w-full py-2.5 px-4 rounded-xl text-white font-bold text-sm shadow-md transition active:scale-95"
                style={{ backgroundColor: brandColor }}
              >
                Play Again
              </button>
              <Link
                href={`/r/${slug}`}
                className="w-full py-2 px-4 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold text-xs transition text-center"
              >
                Back to Restaurant
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}