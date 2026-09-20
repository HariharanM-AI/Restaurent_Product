"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, RotateCcw, Trophy, Gamepad2, Play, Eraser, CheckCircle } from "lucide-react";

// Classic valid Sudoku boards and solutions
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

  // Timer
  useEffect(() => {
    if (isWon) return;
    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isWon]);

  const handleCellClick = (r: number, c: number) => {
    if (PUZZLES.easy.initial[r][c] !== 0) return; // initial clue, non-editable
    setSelectedCell([r, c]);
  };

  const handleNumberInput = (num: number) => {
    if (!selectedCell || isWon) return;
    const [r, c] = selectedCell;
    if (PUZZLES.easy.initial[r][c] !== 0) return;

    const newGrid = grid.map((row) => [...row]);
    newGrid[r][c] = num;
    setGrid(newGrid);

    // Check completion
    let solved = true;
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (newGrid[i][j] !== PUZZLES.easy.solution[i][j]) {
          solved = false;
          break;
        }
      }
    }

    if (solved) {
      setIsWon(true);
    }
  };

  const handleErase = () => {
    if (!selectedCell || isWon) return;
    const [r, c] = selectedCell;
    if (PUZZLES.easy.initial[r][c] !== 0) return;

    const newGrid = grid.map((row) => [...row]);
    newGrid[r][c] = 0;
    setGrid(newGrid);
  };

  const handleRestart = () => {
    setGrid(PUZZLES.easy.initial.map((row) => [...row]));
    setSelectedCell(null);
    setSeconds(0);
    setIsWon(false);
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Top App Bar */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 flex items-center justify-between">
        <Link
          href={`/r/${slug}`}
          className="p-2 -ml-2 rounded-xl text-slate-600 hover:bg-slate-100 transition flex items-center gap-1.5 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </Link>
        <span className="text-xs font-semibold text-slate-700 truncate max-w-[180px]">
          {restaurantName}
        </span>
        <div className="w-8" />
      </div>

      <div className="flex-1 max-w-md mx-auto w-full p-4 flex flex-col justify-between">
        {/* Game Stats Bar */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                style={{ backgroundColor: brandColor }}
              >
                <Gamepad2 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 leading-tight">Sudoku</h2>
                <span className="text-[10px] text-slate-500 font-medium">Casual Difficulty</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-xs font-mono font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
                {formatTimer(seconds)}
              </div>
              <button
                onClick={handleRestart}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                title="Restart puzzle"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Victory Alert */}
          {isWon && (
            <div className="mb-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center animate-in zoom-in-95 duration-200">
              <Trophy className="w-8 h-8 text-emerald-600 mx-auto mb-1.5" />
              <h3 className="font-bold text-sm text-emerald-900">Puzzle Solved!</h3>
              <p className="text-xs text-emerald-700">Completed in {formatTimer(seconds)}.</p>
            </div>
          )}

          {/* Sudoku 9x9 Grid */}
          <div className="aspect-square w-full max-w-[370px] mx-auto bg-slate-900 p-1.5 rounded-2xl shadow-md grid grid-cols-9 gap-[1px]">
            {grid.map((row, r) =>
              row.map((val, c) => {
                const isInitial = PUZZLES.easy.initial[r][c] !== 0;
                const isSelected = selectedCell?.[0] === r && selectedCell?.[1] === c;
                const inSameRowOrCol =
                  selectedCell && (selectedCell[0] === r || selectedCell[1] === c);

                // Thick borders for 3x3 blocks
                const borderRight = (c + 1) % 3 === 0 && c !== 8 ? "border-r-2 border-slate-700" : "";
                const borderBottom = (r + 1) % 3 === 0 && r !== 8 ? "border-b-2 border-slate-700" : "";

                return (
                  <button
                    key={`${r}-${c}`}
                    type="button"
                    onClick={() => handleCellClick(r, c)}
                    className={`aspect-square flex items-center justify-center text-sm font-semibold transition-colors ${borderRight} ${borderBottom} ${
                      isSelected
                        ? "bg-teal-500 text-white font-bold"
                        : inSameRowOrCol
                        ? "bg-slate-100 text-slate-900"
                        : "bg-white text-slate-900"
                    } ${isInitial ? "text-slate-900 font-bold" : "text-teal-700 font-medium"}`}
                  >
                    {val !== 0 ? val : ""}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Number Keypad & Controls */}
        <div className="py-4">
          <div className="grid grid-cols-5 gap-2 max-w-[370px] mx-auto mb-2">
            {[1, 2, 3, 4, 5].map((num) => (
              <button
                key={num}
                onClick={() => handleNumberInput(num)}
                disabled={!selectedCell || isWon}
                className="h-12 rounded-xl bg-white hover:bg-slate-100 active:bg-slate-200 border border-slate-200 text-base font-bold text-slate-900 shadow-sm transition disabled:opacity-40"
              >
                {num}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-5 gap-2 max-w-[370px] mx-auto">
            {[6, 7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={() => handleNumberInput(num)}
                disabled={!selectedCell || isWon}
                className="h-12 rounded-xl bg-white hover:bg-slate-100 active:bg-slate-200 border border-slate-200 text-base font-bold text-slate-900 shadow-sm transition disabled:opacity-40"
              >
                {num}
              </button>
            ))}
            <button
              onClick={handleErase}
              disabled={!selectedCell || isWon}
              className="h-12 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 border border-slate-200 flex items-center justify-center text-slate-700 shadow-sm transition disabled:opacity-40"
              title="Erase cell"
            >
              <Eraser className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
