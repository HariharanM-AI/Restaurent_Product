"use client";
// avoid-ai-design-ignore: K3 (blur on the remove button sits over the photo itself: real layering)

import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Camera, ImagePlus, Loader2, X } from "lucide-react";

export interface PickedPhoto {
  id: string;
  file: File;
  previewUrl: string;
}

export const MAX_FEEDBACK_PHOTOS = 3;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_EDGE = 1600;
const MAX_RAW_BYTES = 8 * 1024 * 1024;

/**
 * Downscale on the device before upload: a 6 MB phone photo becomes ~300 KB,
 * which uploads quickly on restaurant Wi-Fi. Falls back to the original file
 * when the browser can't decode it (the server re-validates either way).
 */
async function shrinkPhoto(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" } as ImageBitmapOptions);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}

export function FeedbackPhotoPicker({
  photos,
  onChange,
  brandColor,
  disabled,
}: {
  photos: PickedPhoto[];
  onChange: (next: PickedPhoto[]) => void;
  brandColor: string;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const photosRef = useRef(photos);
  photosRef.current = photos;

  // Release preview URLs when the form unmounts
  useEffect(() => () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.previewUrl)), []);

  const remaining = MAX_FEEDBACK_PHOTOS - photos.length;

  const handleFiles = async (list: FileList | null) => {
    if (!list || list.length === 0) return;
    setError(null);
    const incoming = Array.from(list);
    const accepted = incoming.filter((f) => ACCEPTED.includes(f.type));
    if (accepted.length < incoming.length) setError("Only JPEG, PNG or WebP photos can be attached.");
    if (accepted.length > remaining) setError(`You can attach up to ${MAX_FEEDBACK_PHOTOS} photos.`);

    setBusy(true);
    const next: PickedPhoto[] = [];
    for (const raw of accepted.slice(0, remaining)) {
      const file = await shrinkPhoto(raw);
      if (file.size > MAX_RAW_BYTES) {
        setError("That photo is too large. Please choose one under 8 MB.");
        continue;
      }
      next.push({ id: crypto.randomUUID(), file, previewUrl: URL.createObjectURL(file) });
    }
    setBusy(false);
    if (next.length) onChange([...photos, ...next]);
    if (inputRef.current) inputRef.current.value = "";
  };

  const remove = (id: string) => {
    const target = photos.find((p) => p.id === id);
    if (target) URL.revokeObjectURL(target.previewUrl);
    onChange(photos.filter((p) => p.id !== id));
  };

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-700">
          Add photos <span className="font-normal text-slate-400">(optional)</span>
        </span>
        <span className="text-[10px] tabular-nums text-slate-400">
          {photos.length}/{MAX_FEEDBACK_PHOTOS}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <AnimatePresence initial={false} mode="popLayout">
          {photos.map((p, i) => (
            <motion.div
              key={p.id}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.15 } }}
              transition={{ type: "spring", stiffness: 420, damping: 30 }}
              className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.previewUrl} alt={`Attached photo ${i + 1}`} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => remove(p.id)}
                disabled={disabled}
                aria-label={`Remove photo ${i + 1}`}
                className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900/70 text-white backdrop-blur-sm transition hover:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-50"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          ))}

          {remaining > 0 && (
            <motion.button
              key="add"
              layout
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={disabled || busy}
              whileTap={{ scale: 0.96 }}
              transition={{ type: "spring", stiffness: 420, damping: 30 }}
              className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-slate-300 bg-white/60 text-slate-500 transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60"
              style={{ ["--tw-ring-color" as string]: brandColor }}
              aria-label="Add photos to your feedback"
            >
              {busy ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : photos.length === 0 ? (
                <Camera className="h-5 w-5" style={{ color: brandColor }} />
              ) : (
                <ImagePlus className="h-5 w-5" style={{ color: brandColor }} />
              )}
              <span className="text-[11px] font-medium">{busy ? "Preparing…" : photos.length === 0 ? "Add photo" : "Add more"}</span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        multiple
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <AnimatePresence>
        {error ? (
          <motion.p
            key="err"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            role="alert"
            className="mt-1.5 text-[11px] font-medium text-red-600"
          >
            {error}
          </motion.p>
        ) : (
          <p key="hint" className="mt-1.5 text-[10.5px] leading-relaxed text-slate-400">
            Up to {MAX_FEEDBACK_PHOTOS} photos · location data is removed before they reach the restaurant.
          </p>
        )}
      </AnimatePresence>
    </div>
  );
}
