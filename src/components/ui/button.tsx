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
      "inline-flex items-center justify-center font-medium transition-all duration-150 rounded-xl select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";

    const variants = {
      primary:
        "bg-primary text-white hover:bg-teal-800 dark:bg-emerald-700 dark:hover:bg-emerald-600 shadow-sm border border-transparent",
      secondary:
        "bg-slate-100 text-slate-800 hover:bg-slate-200/80 border border-slate-200/60 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:border-slate-700 shadow-none",
      outline:
        "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:border-slate-700 dark:hover:border-slate-600 shadow-sm",
      ghost:
        "bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 border border-transparent",
      destructive:
        "bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 border border-transparent shadow-sm",
      accent:
        "bg-teal-50 text-teal-800 border border-teal-200/80 hover:bg-teal-100/80 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800/60 dark:hover:bg-teal-900/60",
    };

    const sizes = {
      sm: "text-xs px-3 py-1.5 h-8 gap-1.5 rounded-lg",
      md: "text-sm px-4 py-2 h-10 gap-2 rounded-xl",
      lg: "text-base px-5 py-2.5 h-12 gap-2.5 rounded-xl",
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
