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
    default: "bg-white border border-slate-200/80 shadow-card",
    muted: "bg-slate-50/70 border border-slate-200/60 shadow-none",
    elevated: "bg-white border border-slate-200/80 shadow-card-hover",
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
        "flex items-start justify-between gap-4 pb-4 border-b border-slate-100 mb-5",
        className
      )}
      {...props}
    >
      {children || (
        <>
          <div className="space-y-1">
            {title && (
              <h3 className="text-base font-semibold text-slate-900 tracking-tight">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-slate-500 leading-relaxed">
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
