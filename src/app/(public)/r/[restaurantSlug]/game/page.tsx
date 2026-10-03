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
  const [brandColor, setBrandColor] = useState("var(--brand-primary, #0F766E)");

  useEffect(() => {
    fetch(`/api/restaurants/by-slug/${slug}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setRestaurantName(json.data.restaurant.name);
          setBrandColor(json.data.restaurant.primaryColor || "var(--brand-primary, #0F766E)");
        }
      })
      .catch(() => {});
  }, [slug]);

  // Ensure page starts at top and prevent background scrolling on mobile
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Auto-select first editable cell on mount so keypad is immediately active
  useEffect(() => {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (PUZZLES.easy.initial[r][c] === 0) {
          setSelectedCell([r, c]);
          return;
        }
      }
    }
  }, []);

  // Timer
  useEffect(() => {
    if (isWon) return;
    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isWon]);

  const handleCellClick = (r: number, c: number) => {
    setSelectedCell([r, c]);
  };

  const handleNumberInput = React.useCallback(
    (num: number) => {
      if (!selectedCell || isWon) return;
      const [r, c] = selectedCell;
      if (PUZZLES.easy.initial[r][c] !== 0) return; // Clue cells are fixed

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
    // Select first empty cell
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (PUZZLES.easy.initial[r][c] === 0) {
          setSelectedCell([r, c]);
          break;
        }
      }
    }
    setSeconds(0);
    setIsWon(false);
  };

  // Keyboard navigation & number input support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isWon) return;

      if (e.key >= "1" && e.key <= "9") {
        handleNumberInput(parseInt(e.key, 10));
        return;
      }

      if (e.key === "Backspace" || e.key === "Delete" || e.key === "0") {
        handleErase();
        return;
      }

      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
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

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNumberInput, handleErase, isWon]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const isClueSelected = selectedCell
    ? PUZZLES.easy.initial[selectedCell[0]][selectedCell[1]] !== 0
    : false;

  return (
    <div className="fixed inset-0 z-20 w-full max-w-md mx-auto h-[100dvh] max-h-[100dvh] h-[100svh] max-h-[100svh] bg-slate-50 border-x border-slate-200/60 shadow-2xl flex flex-col items-center justify-start select-none touch-manipulation overflow-hidden">
      {/* 1. Compact Top Bar */}
      <div className="w-full bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-3 py-1.5 flex items-center justify-between shrink-0 shadow-2xs">
        <Link
          href={`/r/${slug}`}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </Link>
        <span className="text-xs font-bold text-slate-800 truncate max-w-[130px] sm:max-w-[160px] text-center">
          {restaurantName}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-800 border border-slate-200/80 shadow-2xs flex items-center gap-1">
            <span className="text-[10px] text-slate-400 font-sans font-medium">Time:</span>
            <span>{formatTimer(seconds)}</span>
          </div>
          <button
            type="button"
            onClick={handleRestart}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-600 transition cursor-pointer"
            title="Restart puzzle"
            aria-label="Restart puzzle"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Compact Sub-Header: Game Title & Helper */}
      <div className="w-full max-w-[330px] px-2 pt-1.5 pb-0.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5">
          <div
            className="w-4 h-4 rounded-md flex items-center justify-center text-white shadow-xs"
            style={{ backgroundColor: brandColor }}
          >
            <Gamepad2 className="w-2.5 h-2.5" />
          </div>
          <span className="text-xs font-bold text-slate-900">Sudoku</span>
          <span className="text-[9px] text-slate-500 font-medium bg-slate-100 px-1 py-0.5 rounded">
            Casual
          </span>
        </div>
        {selectedCell && (
          <span className="text-[10.5px] text-slate-500 font-medium">
            {isClueSelected ? "Fixed clue" : "Tap number to place"}
          </span>
        )}
      </div>

      {/* 3. Sudoku Grid (Tight, no unwanted empty space) */}
      <div className="w-full flex items-center justify-center px-2 py-1 shrink-0">
        <div
          className="aspect-square bg-slate-900 p-1 rounded-xl shadow-md grid grid-cols-9 gap-[1px]"
          style={{
            width: "min(330px, calc(100vw - 20px), calc(100svh - 195px))",
            height: "min(330px, calc(100vw - 20px), calc(100svh - 195px))",
          }}
        >
          {grid.map((row, r) =>
            row.map((val, c) => {
              const isInitial = PUZZLES.easy.initial[r][c] !== 0;
              const isSelected = selectedCell?.[0] === r && selectedCell?.[1] === c;
              const selectedVal = selectedCell ? grid[selectedCell[0]][selectedCell[1]] : 0;
              const isSameNumber = selectedVal !== 0 && val === selectedVal && !isSelected;
              const inSameRowOrCol =
                selectedCell && (selectedCell[0] === r || selectedCell[1] === c);
              const inSameBox =
                selectedCell &&
                Math.floor(selectedCell[0] / 3) === Math.floor(r / 3) &&
                Math.floor(selectedCell[1] / 3) === Math.floor(c / 3);

              // Thick borders for 3x3 blocks
              const borderRight =
                (c + 1) % 3 === 0 && c !== 8 ? "border-r-2 border-slate-700" : "";
              const borderBottom =
                (r + 1) % 3 === 0 && r !== 8 ? "border-b-2 border-slate-700" : "";

              return (
                <button
                  key={`${r}-${c}`}
                  type="button"
                  onClick={() => handleCellClick(r, c)}
                  style={isSelected ? { backgroundColor: brandColor } : undefined}
                  className={`aspect-square flex items-center justify-center text-xs sm:text-sm font-semibold transition-colors ${borderRight} ${borderBottom} ${
                    isSelected
                      ? "text-white font-black ring-2 ring-white/70 ring-inset shadow-inner"
                      : isSameNumber
                      ? "bg-amber-100 text-amber-950 font-black ring-1 ring-amber-300"
                      : inSameRowOrCol || inSameBox
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

      {/* 4. Number Keypad (Directly below grid, zero scroll needed) */}
      <div className="w-full max-w-[330px] px-2 pt-1 pb-2 shrink-0">
        <div className="grid grid-cols-5 gap-1 mb-1">
          {[1, 2, 3, 4, 5].map((num) => {
            const isCurrentlySelectedNum =
              selectedCell && grid[selectedCell[0]][selectedCell[1]] === num;
            return (
              <button
                key={num}
                type="button"
                onClick={() => handleNumberInput(num)}
                disabled={!selectedCell || isClueSelected || isWon}
                className={`h-8 sm:h-9 rounded-lg text-sm sm:text-base font-bold border transition-all active:scale-95 flex items-center justify-center select-none shadow-2xs ${
                  isCurrentlySelectedNum
                    ? "bg-teal-50 border-teal-500 text-teal-800 ring-1 ring-teal-400"
                    : "bg-white hover:bg-slate-50 border-slate-200 text-slate-800 active:bg-slate-100"
                } disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100`}
              >
                {num}
              </button>
            );
          })}
        </div>
        <div className="grid grid-cols-5 gap-1">
          {[6, 7, 8, 9].map((num) => {
            const isCurrentlySelectedNum =
              selectedCell && grid[selectedCell[0]][selectedCell[1]] === num;
            return (
              <button
                key={num}
                type="button"
                onClick={() => handleNumberInput(num)}
                disabled={!selectedCell || isClueSelected || isWon}
                className={`h-8 sm:h-9 rounded-lg text-sm sm:text-base font-bold border transition-all active:scale-95 flex items-center justify-center select-none shadow-2xs ${
                  isCurrentlySelectedNum
                    ? "bg-teal-50 border-teal-500 text-teal-800 ring-1 ring-teal-400"
                    : "bg-white hover:bg-slate-50 border-slate-200 text-slate-800 active:bg-slate-100"
                } disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100`}
              >
                {num}
              </button>
            );
          })}
          <button
            type="button"
            onClick={handleErase}
            disabled={!selectedCell || isClueSelected || isWon}
            className="h-8 sm:h-9 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-700 transition-all active:scale-95 shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
            title="Erase cell"
            aria-label="Erase cell"
          >
            <Eraser className="w-3.5 h-3.5 mr-1" />
            <span className="text-[11px] font-semibold">Clear</span>
          </button>
        </div>
      </div>

      {/* 5. Victory Celebration Modal (Overlay so it never disrupts grid layout) */}
      {isWon && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-xs w-full shadow-2xl text-center border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
              <Trophy className="w-8 h-8 animate-bounce" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 mb-1">Puzzle Solved!</h3>
            <p className="text-xs text-slate-500 mb-4">
              Awesome job! You completed the Sudoku in{" "}
              <span className="font-bold text-slate-800">{formatTimer(seconds)}</span>.
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
                className="w-full py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition text-center"
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
