import sharp from "sharp";
import { detectFileType } from "@/lib/uploads/file-signature";

/** Guest feedback photo limits — shared by the API route and the guest form copy */
export const FEEDBACK_IMAGE_LIMITS = {
  maxImages: 3,
  /** Raw upload cap per file, before server re-encoding */
  maxBytes: 8 * 1024 * 1024,
  /** Longest edge after re-encoding */
  maxEdge: 1600,
} as const;

export class FeedbackImageError extends Error {}

/**
 * Validates and re-encodes a guest photo:
 *  - JPEG / PNG / WebP only, verified by magic bytes
 *  - size and pixel caps (guards against decompression bombs)
 *  - applies EXIF orientation, then strips ALL metadata (GPS, device) by re-encoding
 *  - output is a fresh JPEG, so no original bytes (or embedded payloads) are stored
 */
export async function processFeedbackImage(file: File): Promise<Buffer> {
  if (file.size === 0) throw new FeedbackImageError("One of the photos is empty.");
  if (file.size > FEEDBACK_IMAGE_LIMITS.maxBytes) {
    throw new FeedbackImageError("Each photo must be 8 MB or smaller.");
  }

  const input = Buffer.from(await file.arrayBuffer());
  const kind = detectFileType(input);
  if (kind !== "image/jpeg" && kind !== "image/png" && kind !== "image/webp") {
    throw new FeedbackImageError("Photos must be JPEG, PNG or WebP images.");
  }

  try {
    return await sharp(input, { limitInputPixels: 40_000_000, failOn: "error" })
      .rotate()
      .resize({
        width: FEEDBACK_IMAGE_LIMITS.maxEdge,
        height: FEEDBACK_IMAGE_LIMITS.maxEdge,
        fit: "inside",
        withoutEnlargement: true,
      })
      .flatten({ background: "#ffffff" })
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer();
  } catch {
    throw new FeedbackImageError("One of the photos could not be read. Please try a different image.");
  }
}
