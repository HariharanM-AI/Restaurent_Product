"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive" | "accent";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      children,
      icon,
      iconPosition = "left",
      type = "button",
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-semibold tracking-tight transition-all duration-150 ease-out rounded-xl select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.97] cursor-pointer";

    const variants = {
      primary:
        "bg-gradient-to-b from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 dark:from-teal-500 dark:to-teal-600 text-white shadow-xs hover:shadow-md border border-teal-500/30",
      secondary:
        "bg-slate-100 hover:bg-slate-200/90 dark:bg-slate-800/90 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-200/60 dark:border-white/[0.08] shadow-xs",
      outline:
        "bg-white/80 hover:bg-white dark:bg-slate-900/80 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/[0.1] hover:border-slate-300 dark:hover:border-white/[0.2] shadow-xs",
      ghost:
        "bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/[0.08] border border-transparent",
      destructive:
        "bg-red-600 hover:bg-red-700 text-white shadow-xs border border-red-500/30",
      accent:
        "bg-teal-50/90 text-teal-800 border border-teal-200/80 hover:bg-teal-100 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800/50 dark:hover:bg-teal-900/60",
    };

    const sizes = {
      sm: "text-xs px-3 py-1.5 h-8 gap-1.5 rounded-lg font-medium",
      md: "text-sm px-4 py-2 h-10 gap-2 rounded-xl",
      lg: "text-base px-5 py-2.5 h-12 gap-2.5 rounded-xl font-bold",
      icon: "w-9 h-9 p-0 rounded-xl",
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        ) : icon && iconPosition === "left" ? (
          <span className="shrink-0">{icon}</span>
        ) : null}

        {children}

        {!isLoading && icon && iconPosition === "right" ? (
          <span className="shrink-0">{icon}</span>
        ) : null}
      </button>
    );
  }
);

Button.displayName = "Button";
