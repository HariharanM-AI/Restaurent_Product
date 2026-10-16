"use client";

import React, { useState, useEffect, useCallback, useTransition } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  RotateCcw,
  Trophy,
  Gamepad2,
  Eraser,
  Bot,
  Users,
  Sparkles,
  Grid3X3,
  Hash,
} from "lucide-react";

/* ─── Sudoku Puzzle Data ─── */
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

const WINNING_COMBOS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

type GameType = "sudoku" | "xoxo";

export default function GamesHubPage() {
  const params = useParams();
  const slug = params.restaurantSlug as string;

  const [activeGame, setActiveGame] = useState<GameType>("sudoku");
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

  return (
    <div
      className="w-full flex flex-col bg-slate-50 dark:bg-[#0B111A] select-none touch-manipulation overflow-hidden text-slate-800 dark:text-slate-100"
      style={{ height: "100dvh" }}
    >
      {/* ── Top Bar ── */}
      <div className="shrink-0 bg-white/80 dark:bg-[#0E1520]/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/[0.08] px-3 py-2 flex items-center justify-between w-full z-30">
        <Link
          href={`/r/${slug}`}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-slate-200 text-xs font-bold transition active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </Link>
        <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate max-w-[140px] sm:max-w-[200px] text-center">
          {restaurantName}
        </span>
        <div className="flex items-center gap-1.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-xs"
            style={{ backgroundColor: brandColor }}
          >
            <Gamepad2 className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* ── Game Switcher Bar (Sudoku vs XOXO) ── */}
      <div className="shrink-0 px-3 pt-2 pb-1.5 max-w-[420px] mx-auto w-full">
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-200/70 dark:bg-slate-800/80 backdrop-blur-md border border-slate-300/40 dark:border-white/[0.06] shadow-inner">
          <button
            type="button"
            onClick={() => setActiveGame("sudoku")}
            className={`flex items-center justify-center gap-2 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeGame === "sudoku"
                ? "bg-white dark:bg-[#1A2332] text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <Hash className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>Sudoku</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveGame("xoxo")}
            className={`flex items-center justify-center gap-2 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeGame === "xoxo"
                ? "bg-white dark:bg-[#1A2332] text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <Grid3X3 className="w-3.5 h-3.5 text-amber-500" />
            <span>Tic-Tac-Toe (XOXO)</span>
          </button>
        </div>
      </div>

      {/* ── Active Game Render ── */}
      <div className="flex-1 min-h-0 flex flex-col">
        {activeGame === "sudoku" ? (
          <SudokuGame brandColor={brandColor} slug={slug} />
        ) : (
          <XOXOGame brandColor={brandColor} slug={slug} />
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   SUDOKU GAME COMPONENT
   ═══════════════════════════════════════════════════════ */
function SudokuGame({ brandColor, slug }: { brandColor: string; slug: string }) {
  const [grid, setGrid] = useState<number[][]>(() =>
    PUZZLES.easy.initial.map((row) => [...row])
  );
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [isWon, setIsWon] = useState(false);

  useEffect(() => {
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++)
        if (PUZZLES.easy.initial[r][c] === 0) {
          setSelectedCell([r, c]);
          return;
        }
  }, []);

  useEffect(() => {
    if (isWon) return;
    const interval = setInterval(() => setSeconds((p) => p + 1), 1000);
    return () => clearInterval(interval);
  }, [isWon]);

  const handleNumberInput = useCallback(
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
          if (newGrid[i][j] !== PUZZLES.easy.solution[i][j]) {
            solved = false;
            break outer;
          }
      if (solved) setIsWon(true);
    },
    [selectedCell, isWon, grid]
  );

  const handleErase = useCallback(() => {
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
        if (PUZZLES.easy.initial[r][c] === 0) {
          setSelectedCell([r, c]);
          break;
        }
    setSeconds(0);
    setIsWon(false);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isWon) return;
      if (e.key >= "1" && e.key <= "9") {
        handleNumberInput(parseInt(e.key, 10));
        return;
      }
      if (["Backspace", "Delete", "0"].includes(e.key)) {
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
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleNumberInput, handleErase, isWon]);

  const fmt = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
  const isClue = selectedCell
    ? PUZZLES.easy.initial[selectedCell[0]][selectedCell[1]] !== 0
    : false;

  return (
    <div className="flex-1 flex flex-col justify-between overflow-hidden">
      {/* Sub-Header */}
      <div className="shrink-0 px-3 pt-1 pb-1 flex items-center justify-between max-w-[420px] mx-auto w-full">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-100">Sudoku Casual</span>
          <span className="text-[10px] text-slate-500 font-medium bg-slate-100 dark:bg-white/10 dark:text-slate-300 px-1.5 py-0.5 rounded">
            9x9
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-white/10 flex items-center gap-1">
            <span className="text-[10px] text-slate-400">⏱</span>
            <span>{fmt(seconds)}</span>
          </div>
          <button
            type="button"
            onClick={handleRestart}
            className="p-1 rounded-lg bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-600 dark:text-slate-300 transition cursor-pointer"
            aria-label="Restart"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 min-h-0 flex items-center justify-center px-2">
        <div
          className="aspect-square bg-slate-900 dark:bg-slate-600 rounded-2xl shadow-md grid grid-cols-9 gap-[1px] p-1"
          style={{
            width: "min(350px, calc(100vw - 1rem), calc(100dvh - 230px))",
            height: "min(350px, calc(100vw - 1rem), calc(100dvh - 230px))",
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
              const bR = (c + 1) % 3 === 0 && c !== 8 ? "border-r-2 border-slate-700 dark:border-slate-400" : "";
              const bB = (r + 1) % 3 === 0 && r !== 8 ? "border-b-2 border-slate-700 dark:border-slate-400" : "";
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
                      ? "bg-amber-100 dark:bg-amber-400/25 text-amber-950 dark:text-amber-200 font-black ring-1 ring-amber-300 dark:ring-amber-400/50"
                      : inLine || inBox
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                      : "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  } ${isInitial ? "text-slate-950 dark:text-white font-black" : "text-teal-700 dark:text-teal-300 font-bold"}`}
                >
                  {val !== 0 ? val : ""}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Number Keypad */}
      <div className="shrink-0 px-3 pt-1 pb-3 max-w-[420px] mx-auto w-full">
        <div className="grid grid-cols-5 gap-2 mb-2">
          {[1, 2, 3, 4, 5].map((num) => {
            const active = selectedCell && grid[selectedCell[0]][selectedCell[1]] === num;
            return (
              <button
                key={num}
                type="button"
                onClick={() => handleNumberInput(num)}
                disabled={!selectedCell || isClue || isWon}
                className={`h-10 rounded-xl text-base font-bold border transition-all active:scale-95 flex items-center justify-center shadow-xs cursor-pointer ${
                  active
                    ? "bg-teal-50 dark:bg-teal-400/15 border-teal-500 text-teal-800 dark:text-teal-200 ring-1 ring-teal-400"
                    : "bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-100"
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
                className={`h-10 rounded-xl text-base font-bold border transition-all active:scale-95 flex items-center justify-center shadow-xs cursor-pointer ${
                  active
                    ? "bg-teal-50 dark:bg-teal-400/15 border-teal-500 text-teal-800 dark:text-teal-200 ring-1 ring-teal-400"
                    : "bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-100"
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
            className="h-10 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-slate-300 transition-all active:scale-95 shadow-xs disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 gap-1 cursor-pointer"
            aria-label="Erase"
          >
            <Eraser className="w-4 h-4" />
            <span className="text-xs font-semibold">Del</span>
          </button>
        </div>
      </div>

      {/* Victory Modal */}
      {isWon && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 max-w-xs w-full shadow-2xl text-center border border-slate-100 dark:border-slate-700">
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
                className="w-full py-2.5 px-4 rounded-xl text-white font-bold text-sm shadow-md transition active:scale-95 cursor-pointer"
                style={{ backgroundColor: brandColor }}
              >
                Play Again
              </button>
              <Link
                href={`/r/${slug}`}
                className="w-full py-2 px-4 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-slate-300 font-semibold text-xs transition text-center"
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

/* ═══════════════════════════════════════════════════════
   XOXO (TIC-TAC-TOE) GAME COMPONENT
   ═══════════════════════════════════════════════════════ */
type Player = "X" | "O";
type BoardState = (Player | null)[];

function XOXOGame({ brandColor, slug }: { brandColor: string; slug: string }) {
  const [board, setBoard] = useState<BoardState>(Array(9).fill(null));
  const [turn, setTurn] = useState<Player>("X");
  const [vsMode, setVsMode] = useState<"ai" | "pvp">("ai");
  const [difficulty, setDifficulty] = useState<"smart" | "casual">("smart");
  const [winner, setWinner] = useState<Player | "draw" | null>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [scores, setScores] = useState({ x: 0, o: 0, ties: 0 });
  const [isAiThinking, setIsAiThinking] = useState(false);

  // Check for winner
  const checkWinner = useCallback((currentBoard: BoardState) => {
    for (const line of WINNING_COMBOS) {
      const [a, b, c] = line;
      if (
        currentBoard[a] &&
        currentBoard[a] === currentBoard[b] &&
        currentBoard[a] === currentBoard[c]
      ) {
        return { winner: currentBoard[a] as Player, line };
      }
    }
    if (currentBoard.every((cell) => cell !== null)) {
      return { winner: "draw" as const, line: null };
    }
    return null;
  }, []);

  // Minimax evaluation for Smart AI
  const minimax = useCallback(
    (b: BoardState, depth: number, isMaximizing: boolean): number => {
      const result = checkWinner(b);
      if (result) {
        if (result.winner === "O") return 10 - depth;
        if (result.winner === "X") return depth - 10;
        if (result.winner === "draw") return 0;
      }
      if (depth >= 5) return 0; // limit depth for fast response

      if (isMaximizing) {
        let maxEval = -Infinity;
        for (let i = 0; i < 9; i++) {
          if (!b[i]) {
            b[i] = "O";
            const evalVal = minimax(b, depth + 1, false);
            b[i] = null;
            maxEval = Math.max(maxEval, evalVal);
          }
        }
        return maxEval;
      } else {
        let minEval = Infinity;
        for (let i = 0; i < 9; i++) {
          if (!b[i]) {
            b[i] = "X";
            const evalVal = minimax(b, depth + 1, true);
            b[i] = null;
            minEval = Math.min(minEval, evalVal);
          }
        }
        return minEval;
      }
    },
    [checkWinner]
  );

  // Best move calculation
  const getBestMove = useCallback(
    (currentBoard: BoardState): number => {
      const emptyIndices = currentBoard
        .map((val, idx) => (val === null ? idx : null))
        .filter((val): val is number => val !== null);

      if (emptyIndices.length === 0) return -1;

      // Casual: 50% random move
      if (difficulty === "casual" && Math.random() < 0.5) {
        return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
      }

      // Check immediate winning move or block opponent
      for (const idx of emptyIndices) {
        const testBoard = [...currentBoard];
        testBoard[idx] = "O";
        if (checkWinner(testBoard)?.winner === "O") return idx;
      }
      for (const idx of emptyIndices) {
        const testBoard = [...currentBoard];
        testBoard[idx] = "X";
        if (checkWinner(testBoard)?.winner === "X") return idx;
      }

      // Center move preference
      if (currentBoard[4] === null) return 4;

      // Run minimax
      let bestScore = -Infinity;
      let bestMove = emptyIndices[0];
      for (const idx of emptyIndices) {
        const testBoard = [...currentBoard];
        testBoard[idx] = "O";
        const score = minimax(testBoard, 0, false);
        if (score > bestScore) {
          bestScore = score;
          bestMove = idx;
        }
      }
      return bestMove;
    },
    [difficulty, checkWinner, minimax]
  );

  // Handle cell click
  const handleCellClick = (index: number) => {
    if (board[index] || winner || isAiThinking) return;

    const nextBoard = [...board];
    nextBoard[index] = turn;
    setBoard(nextBoard);

    const winCheck = checkWinner(nextBoard);
    if (winCheck) {
      setWinner(winCheck.winner);
      setWinningLine(winCheck.line);
      setScores((s) => ({
        ...s,
        x: winCheck.winner === "X" ? s.x + 1 : s.x,
        o: winCheck.winner === "O" ? s.o + 1 : s.o,
        ties: winCheck.winner === "draw" ? s.ties + 1 : s.ties,
      }));
      return;
    }

    const nextTurn = turn === "X" ? "O" : "X";
    setTurn(nextTurn);
  };

  // AI response effect
  useEffect(() => {
    if (vsMode === "ai" && turn === "O" && !winner) {
      setIsAiThinking(true);
      const timer = setTimeout(() => {
        const move = getBestMove(board);
        if (move !== -1) {
          const nextBoard = [...board];
          nextBoard[move] = "O";
          setBoard(nextBoard);

          const winCheck = checkWinner(nextBoard);
          if (winCheck) {
            setWinner(winCheck.winner);
            setWinningLine(winCheck.line);
            setScores((s) => ({
              ...s,
              x: winCheck.winner === "X" ? s.x + 1 : s.x,
              o: winCheck.winner === "O" ? s.o + 1 : s.o,
              ties: winCheck.winner === "draw" ? s.ties + 1 : s.ties,
            }));
          } else {
            setTurn("X");
          }
        }
        setIsAiThinking(false);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [turn, vsMode, winner, board, getBestMove, checkWinner]);

  const handleRematch = () => {
    setBoard(Array(9).fill(null));
    setWinner(null);
    setWinningLine(null);
    setTurn("X");
    setIsAiThinking(false);
  };

  const handleResetScores = () => {
    setScores({ x: 0, o: 0, ties: 0 });
    handleRematch();
  };

  return (
    <div className="flex-1 flex flex-col justify-between overflow-hidden">
      {/* ── Subheader Controls ── */}
      <div className="shrink-0 px-3 pt-1 pb-1 max-w-[420px] mx-auto w-full flex items-center justify-between">
        {/* Mode Selector */}
        <div className="flex items-center gap-1 bg-slate-200/80 dark:bg-slate-800/80 p-0.5 rounded-xl border border-slate-300/40 dark:border-white/10 text-[11px] font-bold">
          <button
            type="button"
            onClick={() => {
              setVsMode("ai");
              handleRematch();
            }}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
              vsMode === "ai"
                ? "bg-white dark:bg-[#1E293B] text-slate-900 dark:text-white shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>vs AI</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setVsMode("pvp");
              handleRematch();
            }}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
              vsMode === "pvp"
                ? "bg-white dark:bg-[#1E293B] text-slate-900 dark:text-white shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
            }`}
          >
            <Users className="w-3.5 h-3.5 text-amber-500" />
            <span>2 Players</span>
          </button>
        </div>

        {/* AI Difficulty Toggle (if vs AI) / Restart */}
        <div className="flex items-center gap-1.5">
          {vsMode === "ai" && (
            <button
              type="button"
              onClick={() => setDifficulty((d) => (d === "smart" ? "casual" : "smart"))}
              className="text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition cursor-pointer"
            >
              {difficulty === "smart" ? "🧠 Smart" : "🎲 Casual"}
            </button>
          )}
          <button
            type="button"
            onClick={handleRematch}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-600 dark:text-slate-300 transition cursor-pointer"
            aria-label="Restart match"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Scoreboard ── */}
      <div className="shrink-0 px-3 py-1 max-w-[420px] mx-auto w-full">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div
            className={`p-2 rounded-2xl border transition-all ${
              turn === "X" && !winner
                ? "bg-teal-50 dark:bg-teal-950/40 border-teal-500 ring-2 ring-teal-500/20 shadow-xs"
                : "bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-white/10"
            }`}
          >
            <span className="text-[11px] font-extrabold text-teal-600 dark:text-teal-400 block">
              Player X {vsMode === "ai" ? "(You)" : ""}
            </span>
            <span className="text-xl font-black text-slate-900 dark:text-white leading-tight">
              {scores.x}
            </span>
          </div>

          <div className="p-2 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-white/10">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 block">
              Ties
            </span>
            <span className="text-xl font-black text-slate-700 dark:text-slate-300 leading-tight">
              {scores.ties}
            </span>
          </div>

          <div
            className={`p-2 rounded-2xl border transition-all ${
              turn === "O" && !winner
                ? "bg-amber-50 dark:bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/20 shadow-xs"
                : "bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-white/10"
            }`}
          >
            <span className="text-[11px] font-extrabold text-amber-600 dark:text-amber-400 block">
              Player O {vsMode === "ai" ? "(AI)" : ""}
            </span>
            <span className="text-xl font-black text-slate-900 dark:text-white leading-tight">
              {scores.o}
            </span>
          </div>
        </div>
      </div>

      {/* ── Status Indicator ── */}
      <div className="shrink-0 text-center py-1">
        {winner ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 animate-pulse">
            <Sparkles className="w-4 h-4" />
            {winner === "draw" ? "Game Drawn!" : `${winner} Wins the Round!`}
          </span>
        ) : isAiThinking ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <Bot className="w-3.5 h-3.5 animate-spin" />
            AI is calculating move...
          </span>
        ) : (
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            {turn === "X" ? "Your Turn (X)" : vsMode === "ai" ? "AI's Turn (O)" : "Player O's Turn"}
          </span>
        )}
      </div>

      {/* ── 3x3 Interactive Board ── */}
      <div className="flex-1 min-h-0 flex items-center justify-center px-4">
        <div
          className="aspect-square bg-slate-200/80 dark:bg-slate-700/80 p-2.5 rounded-3xl shadow-xl grid grid-cols-3 gap-2.5 backdrop-blur-md border border-slate-300/60 dark:border-white/10"
          style={{
            width: "min(320px, calc(100vw - 2rem), calc(100dvh - 270px))",
            height: "min(320px, calc(100vw - 2rem), calc(100dvh - 270px))",
          }}
        >
          {board.map((cell, idx) => {
            const isWinningCell = winningLine?.includes(idx);
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleCellClick(idx)}
                disabled={cell !== null || Boolean(winner) || isAiThinking}
                className={`aspect-square rounded-2xl flex items-center justify-center font-black transition-all transform active:scale-95 shadow-xs cursor-pointer ${
                  cell === null
                    ? "bg-white dark:bg-[#151D2A] hover:bg-slate-50 dark:hover:bg-[#1E293B]"
                    : isWinningCell
                    ? "bg-emerald-500 text-white shadow-lg ring-4 ring-emerald-300 dark:ring-emerald-600/50 scale-[1.03]"
                    : cell === "X"
                    ? "bg-white dark:bg-[#151D2A] text-teal-600 dark:text-teal-400"
                    : "bg-white dark:bg-[#151D2A] text-amber-500 dark:text-amber-400"
                } disabled:cursor-not-allowed`}
                aria-label={`Cell ${idx + 1}`}
              >
                {cell === "X" && (
                  <span className={`text-4xl sm:text-5xl font-black ${isWinningCell ? "text-white" : ""}`}>
                    ✕
                  </span>
                )}
                {cell === "O" && (
                  <span className={`text-4xl sm:text-5xl font-black ${isWinningCell ? "text-white" : ""}`}>
                    ◯
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Footer Actions ── */}
      <div className="shrink-0 px-3 pt-2 pb-4 max-w-[420px] mx-auto w-full flex items-center gap-2">
        <button
          type="button"
          onClick={handleRematch}
          className="flex-1 py-2.5 rounded-xl font-bold text-xs text-white shadow-md transition active:scale-95 cursor-pointer"
          style={{ backgroundColor: brandColor }}
        >
          {winner ? "Next Round" : "Restart Round"}
        </button>
        <button
          type="button"
          onClick={handleResetScores}
          className="px-3 py-2.5 rounded-xl font-semibold text-xs bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/20 transition cursor-pointer"
        >
          Reset Scores
        </button>
      </div>
    </div>
  );
}