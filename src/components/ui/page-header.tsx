import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  className?: string;
}

export function PageHeader({
  title,
  description,
  badge,
  action,
  breadcrumbs,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("mb-6 sm:mb-8 animate-in fade-in slide-in-from-bottom-2 duration-500", className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-3">
          <ol className="flex flex-wrap items-center gap-1 text-[12px] font-medium text-slate-400 dark:text-slate-500">
            {breadcrumbs.map((crumb, idx) => {
              const last = idx === breadcrumbs.length - 1;
              return (
                <li key={idx} className="flex items-center gap-1">
                  {crumb.href && !last ? (
                    <Link
                      href={crumb.href}
                      className="rounded-md px-1 py-0.5 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/[0.05] dark:hover:text-slate-200"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span aria-current={last ? "page" : undefined} className="px-1 text-slate-600 dark:text-slate-300">
                      {crumb.label}
                    </span>
                  )}
                  {!last && <ChevronRight className="h-3 w-3 text-slate-300 dark:text-slate-600" aria-hidden="true" />}
                </li>
              );
            })}
          </ol>
        </nav>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[26px] font-semibold tracking-tight text-slate-900 sm:text-[30px] dark:text-white">
              {title}
            </h1>
            {badge && <div>{badge}</div>}
          </div>
          {description && (
            <p className="max-w-2xl text-[13.5px] leading-relaxed text-slate-500 dark:text-slate-400">
              {description}
            </p>
          )}
        </div>

        {action && (
          <div className="flex shrink-0 items-center gap-3 self-start sm:self-end">
            {action}
          </div>
        )}
      </div>
    </div>
  );
}
