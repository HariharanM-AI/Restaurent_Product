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
    <div className={cn("w-full overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-card", className)}>
      <table className="w-full text-left border-collapse text-xs sm:text-sm">
        <thead>
          <tr className="border-b border-slate-200/80 bg-slate-50/70 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
            {columns.map((col, idx) => (
              <th
                key={idx}
                scope="col"
                className={cn("py-3 px-4 sm:px-6 whitespace-nowrap", col.headerClassName)}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((row) => (
            <tr
              key={keyExtractor(row)}
              onClick={() => onRowClick?.(row)}
              className={cn(
                "transition-colors duration-150",
                onRowClick
                  ? "cursor-pointer hover:bg-slate-50/80 active:bg-slate-100/70"
                  : "hover:bg-slate-50/40"
              )}
            >
              {columns.map((col, idx) => (
                <td
                  key={idx}
                  className={cn(
                    "py-3.5 px-4 sm:px-6 text-slate-700 align-middle",
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
