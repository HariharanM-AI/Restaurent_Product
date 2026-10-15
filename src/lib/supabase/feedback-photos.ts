import { randomUUID } from "crypto";
import { BUCKET_NAME, getStorageClient } from "@/lib/supabase/storage";

/**
 * Guest feedback photos are tenant-private:
 *  - stored under restaurants/{restaurantId}/feedback/ with random names
 *  - the database keeps the storage PATH, never a public URL
 *  - admins load them only through /api/restaurants/{id}/feedback/{feedbackId}/photos/{index},
 *    which checks restaurant membership and that the feedback belongs to that restaurant
 *
 * For full isolation at the storage layer, point SUPABASE_FEEDBACK_BUCKET at a PRIVATE
 * bucket (requires SUPABASE_SERVICE_ROLE_KEY). It falls back to the shared asset bucket.
 */
export const FEEDBACK_BUCKET = process.env.SUPABASE_FEEDBACK_BUCKET || BUCKET_NAME;

export const feedbackPhotoPrefix = (restaurantId: string) => `restaurants/${restaurantId}/feedback/`;

/** Same-origin, access-controlled URL the admin portal uses to display a photo. */
export const feedbackPhotoUrl = (restaurantId: string, feedbackId: string, index: number) =>
  `/api/restaurants/${encodeURIComponent(restaurantId)}/feedback/${encodeURIComponent(feedbackId)}/photos/${index}`;

/** Maps stored paths to access-controlled URLs for API responses. */
export const toFeedbackPhotoUrls = (restaurantId: string, feedbackId: string, paths: string[] | null | undefined) =>
  (paths ?? []).map((_, i) => feedbackPhotoUrl(restaurantId, feedbackId, i));

/** A stored path is only valid for the restaurant whose prefix it carries. */
export const isPathForRestaurant = (path: string, restaurantId: string) =>
  path.startsWith(feedbackPhotoPrefix(restaurantId)) && !path.includes("..");

export async function uploadFeedbackPhoto(restaurantId: string, jpeg: Buffer): Promise<string> {
  const path = `${feedbackPhotoPrefix(restaurantId)}${randomUUID()}.jpg`;
  const { error } = await getStorageClient()
    .storage.from(FEEDBACK_BUCKET)
    .upload(path, jpeg, { contentType: "image/jpeg", upsert: false, cacheControl: "private, max-age=0" });
  if (error) throw new Error(`Feedback photo upload failed: ${error.message}`);
  return path;
}

export async function downloadFeedbackPhoto(path: string): Promise<Buffer | null> {
  const { data, error } = await getStorageClient().storage.from(FEEDBACK_BUCKET).download(path);
  if (error || !data) return null;
  return Buffer.from(await data.arrayBuffer());
}

export async function deleteFeedbackPhotos(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  try {
    await getStorageClient().storage.from(FEEDBACK_BUCKET).remove(paths);
  } catch (err) {
    console.warn("Failed to delete feedback photos:", err);
  }
}
