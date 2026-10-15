"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  motion,
  useInView,
  useMotionValue,
  useSpring,
  useReducedMotion,
  type HTMLMotionProps,
  type Variants,
} from "motion/react";
import { cn } from "@/lib/utils";

/* Shared easing — mirrors --ease-smooth-out in globals.css */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 14, filter: "blur(4px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.5, ease: EASE_OUT },
  },
};

/* ─── Stagger container: children using `fadeUp` cascade in ─── */
export function Stagger({
  children,
  className,
  delay = 0,
  stagger = 0.06,
  ...rest
}: HTMLMotionProps<"div"> & { delay?: number; stagger?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : "hidden"}
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: stagger, delayChildren: delay } },
      }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className, ...rest }: HTMLMotionProps<"div">) {
  return (
    <motion.div className={className} variants={fadeUp} {...rest}>
      {children}
    </motion.div>
  );
}

/* ─── Reveal on scroll into view ─── */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 18,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  as?: "div" | "section" | "li" | "article";
}) {
  const reduce = useReducedMotion();
  const Comp = motion[as];
  return (
    <Comp
      className={className}
      initial={reduce ? false : { opacity: 0, y, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: EASE_OUT, delay }}
    >
      {children}
    </Comp>
  );
}

/* ─── Count-up number that springs to new values ─── */
export function AnimatedNumber({
  value,
  format = (n) => Math.round(n).toLocaleString(),
  className,
}: {
  value: number;
  format?: (n: number) => string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 90, damping: 22, mass: 0.8 });
  const formatRef = useRef(format);
  formatRef.current = format;
  const [display, setDisplay] = useState(() => format(reduce ? value : 0));

  useEffect(() => {
    if (reduce) {
      setDisplay(formatRef.current(value));
      return;
    }
    if (inView) mv.set(value);
  }, [value, inView, reduce, mv]);

  useEffect(() => spring.on("change", (v) => setDisplay(formatRef.current(v))), [spring]);

  return (
    <span ref={ref} className={cn("tabular", className)}>
      {display}
    </span>
  );
}

/* ─── Live pulse dot ─── */
export function LiveDot({ className, tone = "emerald" }: { className?: string; tone?: "emerald" | "amber" | "rose" }) {
  const tones = {
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
  };
  return (
    <span className={cn("relative inline-flex h-2 w-2", className)} aria-hidden="true">
      <span className={cn("absolute inset-0 rounded-full animate-live-ping", tones[tone])} />
      <span className={cn("relative inline-flex h-2 w-2 rounded-full", tones[tone])} />
    </span>
  );
}

/* ─── Segmented control with sliding pill ─── */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  layoutId,
  className,
  size = "md",
  ariaLabel,
}: {
  options: readonly { key: T; label: React.ReactNode }[];
  value: T;
  onChange: (key: T) => void;
  layoutId: string;
  className?: string;
  size?: "sm" | "md";
  ariaLabel?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "glass relative inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-xl p-1 no-scrollbar",
        className
      )}
    >
      {options.map((opt) => {
        const active = opt.key === value;
        return (
          <button
            key={opt.key}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(opt.key)}
            className={cn(
              "relative z-0 inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg font-semibold transition-colors duration-200 focus-visible:outline-offset-0",
              size === "sm" ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-xs",
              active
                ? "text-slate-900 dark:text-white"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 -z-10 rounded-lg bg-white shadow-[0_1px_2px_rgba(15,23,42,0.08),0_2px_8px_-2px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70 dark:bg-transparent dark:bg-gradient-to-b dark:from-white/[0.16] dark:to-white/[0.08] dark:ring-white/[0.12] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
