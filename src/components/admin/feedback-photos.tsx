"use client";
// avoid-ai-design-ignore: K3 (lightbox scrim blurs the page underneath: real layering)

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight, ExternalLink, ImageIcon, X } from "lucide-react";

/** Table cell listing a feedback entry's photos; opens a full-screen viewer. */
export function FeedbackPhotoCell({ urls, label }: { urls: string[]; label: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (!urls || urls.length === 0) {
    return (
      <div className="flex items-center justify-center w-full">
        <span className="text-xs text-slate-400/80 dark:text-slate-500 whitespace-nowrap inline-block text-center font-medium">
          No photos
        </span>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col items-center justify-center gap-1.5 mx-auto">
        <div className="flex items-center justify-center gap-1.5">
          {urls.map((url, i) => (
            <Thumb key={url} url={url} index={i} total={urls.length} label={label} onOpen={() => setOpenIndex(i)} />
          ))}
        </div>
        <span className="inline-flex items-center justify-center gap-1 text-[10.5px] font-medium text-slate-400 dark:text-slate-500 text-center">
          <ImageIcon className="h-3 w-3" />
          {urls.length} photo{urls.length === 1 ? "" : "s"}
        </span>
      </div>

      <PhotoViewer urls={urls} index={openIndex} onIndex={setOpenIndex} label={label} />
    </>
  );
}

function Thumb({
  url,
  index,
  total,
  label,
  onOpen,
}: {
  url: string;
  index: number;
  total: number;
  label: string;
  onOpen: () => void;
}) {
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  return (
    <motion.button
      type="button"
      onClick={onOpen}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 420, damping: 30, delay: index * 0.04 }}
      className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 dark:border-white/10 dark:bg-white/5 cursor-pointer group"
      aria-label={`View photo ${index + 1} of ${total} from ${label}`}
    >
      {state === "loading" && <span className="skeleton absolute inset-0 rounded-none" aria-hidden="true" />}
      {state === "error" && (
        <span className="flex h-full w-full items-center justify-center text-slate-400 group-hover:text-teal-600 dark:text-slate-500 transition" aria-hidden="true">
          <ImageIcon className="h-4 w-4" />
        </span>
      )}
      <img
        src={url}
        alt=""
        loading="lazy"
        onLoad={() => setState("ready")}
        onError={() => setState("error")}
        className={`h-full w-full object-cover transition-opacity duration-300 ${state === "ready" ? "opacity-100" : "opacity-0 absolute inset-0"}`}
      />
    </motion.button>
  );
}

function PhotoViewer({
  urls,
  index,
  onIndex,
  label,
}: {
  urls: string[];
  index: number | null;
  onIndex: (i: number | null) => void;
  label: string;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const [direction, setDirection] = useState(0);
  const open = index !== null;

  const go = useCallback(
    (delta: number) => {
      if (index === null) return;
      setDirection(delta);
      onIndex((index + delta + urls.length) % urls.length);
    },
    [index, onIndex, urls.length]
  );

  useEffect(() => {
    if (!open) return;
    const prevFocus = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onIndex(null);
      else if (e.key === "ArrowRight" && urls.length > 1) go(1);
      else if (e.key === "ArrowLeft" && urls.length > 1) go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      prevFocus?.focus?.();
    };
  }, [open, go, onIndex, urls.length]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && index !== null && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={`Photo ${index + 1} of ${urls.length} from ${label}`}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md sm:p-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.15 } }}
          onClick={() => onIndex(null)}
        >
          <div className="absolute right-4 top-4 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <a
              href={urls[index]}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="Open original in a new tab"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
            <button
              ref={closeRef}
              type="button"
              onClick={() => onIndex(null)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="Close photo viewer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <AnimatePresence mode="popLayout" initial={false} custom={direction}>
            <motion.img
              key={urls[index]}
              src={urls[index]}
              alt={`Guest photo ${index + 1} of ${urls.length}`}
              custom={direction}
              variants={{
                enter: (d: number) => ({ opacity: 0, x: d * 60, scale: 0.96 }),
                center: { opacity: 1, x: 0, scale: 1 },
                exit: (d: number) => ({ opacity: 0, x: d * -60, scale: 0.96 }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 360, damping: 34 }}
              className="max-h-full max-w-full rounded-2xl object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </AnimatePresence>

          {urls.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  go(-1);
                }}
                className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:left-6"
                aria-label="Previous photo"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  go(1);
                }}
                className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:right-6"
                aria-label="Next photo"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-1.5" aria-hidden="true">
                {urls.map((u, i) => (
                  <span
                    key={u}
                    className={`h-1.5 rounded-full transition-all duration-300 ${i === index ? "w-5 bg-white" : "w-1.5 bg-white/40"}`}
                  />
                ))}
              </div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
