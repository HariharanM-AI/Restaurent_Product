"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  render?: (row: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  emptyState?: React.ReactNode;
  onRowClick?: (row: T) => void;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  emptyState,
  onRowClick,
  className,
}: DataTableProps<T>) {
  if (data.length === 0 && emptyState) {
    return <div className="py-6">{emptyState}</div>;
  }

  return (
    <div className={cn("w-full overflow-x-auto rounded-[20px] border border-slate-200/80 dark:border-white/[0.08] bg-white/95 dark:bg-[#121927]/90 shadow-card backdrop-blur-xs", className)}>
      <table className="w-full text-left border-collapse text-xs sm:text-sm">
        <thead>
          <tr className="border-b border-slate-200/80 dark:border-white/[0.08] bg-slate-50/80 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold text-[11px] uppercase tracking-wider">
            {columns.map((col, idx) => (
              <th
                key={idx}
                scope="col"
                className={cn("py-3.5 px-4 sm:px-6 whitespace-nowrap", col.headerClassName)}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {data.map((row) => (
            <tr
              key={keyExtractor(row)}
              onClick={() => onRowClick?.(row)}
              className={cn(
                "transition-colors duration-150",
                onRowClick
                  ? "cursor-pointer hover:bg-slate-50/90 dark:hover:bg-slate-800/50 active:bg-slate-100/80 dark:active:bg-slate-800/80"
                  : "hover:bg-slate-50/50 dark:hover:bg-slate-850/40"
              )}
            >
              {columns.map((col, idx) => (
                <td
                  key={idx}
                  className={cn(
                    "py-3.5 px-4 sm:px-6 text-slate-700 dark:text-slate-200 align-middle",
                    col.className
                  )}
                >
                  {col.render
                    ? col.render(row)
                    : col.accessorKey
                    ? String(row[col.accessorKey] ?? "")
                    : null}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
