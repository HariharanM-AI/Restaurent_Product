import React from "react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "p-8 sm:p-12 text-center rounded-[20px] bg-slate-50/70 border border-slate-200/80 flex flex-col items-center justify-center max-w-md mx-auto my-6",
        className
      )}
    >
      <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-500 mb-4 shrink-0">
        {icon}
      </div>

      <h3 className="text-base font-semibold text-slate-900 mb-1.5">
        {title}
      </h3>

      <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-6 max-w-xs">
        {description}
      </p>

      {action && <div>{action}</div>}
    </div>
  );
}
