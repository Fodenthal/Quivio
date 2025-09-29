import { createClient } from "@supabase/supabase-js";
import { createHash, randomUUID } from "crypto";
import type { NormalizedQuestionImage } from "@/utils/questionSubmission";

const DEFAULT_MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
];

const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/svg+xml": ".svg",
};

const MAX_IMAGE_SIZE_BYTES = Number(process.env.QUESTION_IMAGE_MAX_BYTES ?? DEFAULT_MAX_IMAGE_SIZE);
const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "question-images";
const STORAGE_FOLDER = process.env.QUESTION_IMAGE_STORAGE_PREFIX || "uploads";

export interface UploadedImageResult extends NormalizedQuestionImage {
  storageProvider?: "supabase" | "inline";
}

const sanitizeFilename = (name: string): string => {
  const trimmed = name.trim().toLowerCase();
  const withoutSpaces = trimmed.replace(/\s+/g, "-");
  return withoutSpaces.replace(/[^a-z0-9._-]/g, "");
};

const inferExtension = (file: File): string => {
  const fromName = (() => {
    if (!file.name) return "";
    const match = file.name.match(/\.([a-zA-Z0-9]+)$/);
    if (!match) return "";
    return `.${match[1].toLowerCase()}`;
  })();

  if (fromName) {
    return fromName;
  }
  return EXTENSION_BY_TYPE[file.type] || "";
};

export const validateImageFile = (file: File): string | null => {
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    const maxMb = (MAX_IMAGE_SIZE_BYTES / (1024 * 1024)).toFixed(1);
    return `Image is too large. Maximum size is ${maxMb} MB.`;
  }
  if (file.size === 0) {
    return "Uploaded image appears to be empty.";
  }
  if (!file.type || !ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return "Unsupported image type. Please upload PNG, JPEG, WebP, GIF, or SVG.";
  }
  return null;
};

const buildSupabaseClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

export const uploadImageToSupabase = async (file: File): Promise<UploadedImageResult | null> => {
  const client = buildSupabaseClient();
  if (!client) {
    return null;
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const sha256 = createHash("sha256").update(buffer).digest("hex");
    const extension = inferExtension(file) || ".bin";
    const baseNameRaw = file.name ? file.name.replace(/\.[^/.]+$/, "") : "upload";
    const baseName = sanitizeFilename(baseNameRaw) || "upload";
    const objectName = `${STORAGE_FOLDER}/${sha256.slice(0, 8)}-${randomUUID()}-${baseName}${extension}`;

    const { error } = await client.storage
      .from(STORAGE_BUCKET)
      .upload(objectName, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (error) {
      console.error("Failed to upload image to Supabase storage", error);
      return null;
    }

    const { data: publicUrlData } = client.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(objectName);

    const publicUrl = publicUrlData?.publicUrl;

    return {
      url: publicUrl || `supabase://${STORAGE_BUCKET}/${objectName}`,
      bucket: STORAGE_BUCKET,
      path: objectName,
      storageKey: objectName,
      sha256,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      filename: file.name || `upload${extension}`,
      source: "upload",
      originalUrl: publicUrl || undefined,
      storageProvider: "supabase",
    };
  } catch (error) {
    console.error("Unexpected error during Supabase upload", error);
    return null;
  }
};

export const convertFileToDataUrl = async (file: File): Promise<UploadedImageResult> => {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64 = buffer.toString("base64");
  const mime = file.type || "application/octet-stream";
  return {
    url: `data:${mime};base64,${base64}`,
    mimeType: mime,
    size: file.size,
    filename: file.name,
    source: "upload:base64",
    storageProvider: "inline",
    originalUrl: undefined,
  };
};

export { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE_BYTES };
