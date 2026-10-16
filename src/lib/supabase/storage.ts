import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import path from "path";

// Server-only module: uploads use the service-role key, which must never reach the browser.
if (typeof window !== "undefined") {
  throw new Error("src/lib/supabase/storage.ts must only be imported on the server.");
}

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wiugpsnngyponfwtlvnj.supabase.co";

function resolveStorageKey(): string {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (serviceKey) return serviceKey;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (anonKey) {
    return anonKey;
  }
  console.warn("[storage] Neither SUPABASE_SERVICE_ROLE_KEY nor NEXT_PUBLIC_SUPABASE_ANON_KEY is configured.");
  return "";
}

export const BUCKET_NAME = process.env.SUPABASE_STORAGE_BUCKET || "restaurant-assets";

let storageClient: SupabaseClient | null = null;
export function getStorageClient(): SupabaseClient {
  if (!storageClient) {
    storageClient = createClient(supabaseUrl, resolveStorageKey(), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return storageClient;
}

export interface UploadAssetParams {
  fileBuffer: Buffer | Uint8Array;
  fileName: string;
  mimeType: string;
  clientId: string;
  shopId: string;
  category?: "logos" | "covers" | "menus" | "general" | "feedback";
}

/**
 * Upload an asset directly to Supabase Storage structured strictly by client and shop.
 * Path format: clients/{clientId}/shops/{shopId}/{category}/{uniqueFilename}
 */
export async function uploadClientAsset({
  fileBuffer,
  fileName,
  mimeType,
  clientId,
  shopId,
  category = "general",
}: UploadAssetParams) {
  const ext = path.extname(fileName) || (mimeType === "application/pdf" ? ".pdf" : ".jpg");
  const sanitizedBase = fileName
    .replace(ext, "")
    .replace(/[^\w-]/g, "_")
    .slice(0, 30);
  const uniqueFilename = `${sanitizedBase}-${Date.now()}${ext}`;

  // Enforce client-specific and shop-specific storage path
  const storagePath = `clients/${clientId}/shops/${shopId}/${category}/${uniqueFilename}`;

  const { error } = await getStorageClient().storage
    .from(BUCKET_NAME)
    .upload(storagePath, fileBuffer, {
      contentType: mimeType,
      upsert: true,
    });

  if (error) {
    console.error("Supabase Storage upload error:", error);
    throw new Error(`Supabase Storage upload failed: ${error.message}`);
  }

  const { data: publicData } = getStorageClient().storage
    .from(BUCKET_NAME)
    .getPublicUrl(storagePath);

  return {
    publicUrl: publicData.publicUrl,
    storagePath,
    filename: uniqueFilename,
    bucket: BUCKET_NAME,
  };
}

/**
 * Delete an asset from Supabase Storage by its path or public URL.
 */
export async function deleteClientAsset(pathOrUrl: string) {
  if (!pathOrUrl) return;

  let storagePath = pathOrUrl;
  const bucketPrefix = `/storage/v1/object/public/${BUCKET_NAME}/`;
  if (pathOrUrl.includes(bucketPrefix)) {
    storagePath = pathOrUrl.split(bucketPrefix)[1];
  }

  try {
    await getStorageClient().storage.from(BUCKET_NAME).remove([storagePath]);
  } catch (err) {
    console.warn("Failed to delete asset from Supabase Storage:", err);
  }
}
