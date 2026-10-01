import { createClient } from "@supabase/supabase-js";
import path from "path";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wiugpsnngyponfwtlvnj.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpdWdwc25uZ3lwb25md3Rsdm5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4ODM2MTAsImV4cCI6MjEwNTQ1OTYxMH0.R574lqG0dcT58LSqzFQdQ-CqzmrN9r_9IZYifa4BstU";

export const BUCKET_NAME = process.env.SUPABASE_STORAGE_BUCKET || "restaurant-assets";

export const supabaseStorage = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
});

export interface UploadAssetParams {
  fileBuffer: Buffer | Uint8Array;
  fileName: string;
  mimeType: string;
  clientId: string;
  shopId: string;
  category?: "logos" | "covers" | "menus" | "general";
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

  const { data, error } = await supabaseStorage.storage
    .from(BUCKET_NAME)
    .upload(storagePath, fileBuffer, {
      contentType: mimeType,
      upsert: true,
    });

  if (error) {
    console.error("Supabase Storage upload error:", error);
    throw new Error(`Supabase Storage upload failed: ${error.message}`);
  }

  const { data: publicData } = supabaseStorage.storage
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
    await supabaseStorage.storage.from(BUCKET_NAME).remove([storagePath]);
  } catch (err) {
    console.warn("Failed to delete asset from Supabase Storage:", err);
  }
}
