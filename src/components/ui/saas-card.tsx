import React from "react";
import { cn } from "@/lib/utils";

export interface SaaSCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  variant?: "default" | "muted" | "elevated";
  padding?: "none" | "sm" | "md" | "lg";
  radius?: "md" | "lg" | "saas";
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
}

export function SaaSCard({
  className,
  variant = "default",
  padding = "md",
  radius = "saas",
  title,
  subtitle,
  action,
  children,
  ...props
}: SaaSCardProps) {
  const variants = {
    default: "bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-card text-slate-900 dark:text-slate-100",
    muted: "bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 shadow-none text-slate-800 dark:text-slate-200",
    elevated: "bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-card-hover text-slate-900 dark:text-slate-100",
  };

  const paddings = {
    none: "p-0",
    sm: "p-4",
    md: "p-5 sm:p-6",
    lg: "p-6 sm:p-8",
  };

  const radiuses = {
    md: "rounded-xl",
    lg: "rounded-2xl",
    saas: "rounded-[20px]",
  };

  return (
    <div
      className={cn(
        "transition-all duration-200",
        variants[variant],
        radiuses[radius],
        paddings[padding],
        className
      )}
      {...props}
    >
      {(title || subtitle || action) && (
        <SaaSCardHeader title={title} subtitle={subtitle} action={action} />
      )}
      {children}
    </div>
  );
}

export function SaaSCardHeader({
  className,
  title,
  subtitle,
  action,
  children,
  ...props
}: Omit<React.HTMLAttributes<HTMLDivElement>, "title"> & {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800 mb-5",
        className
      )}
      {...props}
    >
      {children || (
        <>
          <div className="space-y-1">
            {title && (
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </>
      )}
    </div>
  );
}
