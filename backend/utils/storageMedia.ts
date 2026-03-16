import { supabaseAdmin } from "../config/supabaseAdmin";

const STORAGE_URL_REGEX = /\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+)$/i;
const ALT_PUBLIC_URL_REGEX = /\/object\/public\/([^/]+)\/(.+)$/i;

const knownBuckets = new Set<string>();

export type StorageRef = {
  bucket: string;
  path: string;
};

const toRefKey = (ref: StorageRef) => `${ref.bucket}:${ref.path}`;

const isDataUrl = (value: string) => /^data:/i.test(value);

export function parseStorageRef(raw: string | null | undefined, fallbackBucket?: string): StorageRef | null {
  if (!raw) return null;
  const value = String(raw).trim();
  if (!value || isDataUrl(value)) return null;

  if (!value.startsWith("http")) {
    if (!fallbackBucket) return null;
    return { bucket: fallbackBucket, path: value.replace(/^\/+/, "") };
  }

  try {
    const url = new URL(value);
    const pathname = decodeURIComponent(url.pathname);
    const matched = pathname.match(STORAGE_URL_REGEX) || pathname.match(ALT_PUBLIC_URL_REGEX);
    if (!matched) return null;

    return {
      bucket: matched[1],
      path: matched[2],
    };
  } catch {
    return null;
  }
}

export async function batchSignStorageRefs(refs: StorageRef[], expiresIn = 3600): Promise<Record<string, string>> {
  const grouped = new Map<string, Set<string>>();

  for (const ref of refs) {
    if (!ref?.bucket || !ref?.path) continue;
    if (!grouped.has(ref.bucket)) grouped.set(ref.bucket, new Set());
    grouped.get(ref.bucket)!.add(ref.path);
  }

  const signedMap: Record<string, string> = {};

  for (const [bucket, pathSet] of grouped.entries()) {
    const paths = [...pathSet];
    if (!paths.length) continue;

    try {
      const { data, error } = await supabaseAdmin.storage.from(bucket).createSignedUrls(paths, expiresIn);
      if (error) {
        console.warn(`[storage] failed to sign URLs for bucket ${bucket}:`, error.message);
        continue;
      }
      (data ?? []).forEach((item: any) => {
        if (item?.signedUrl && item?.path) {
          signedMap[`${bucket}:${item.path}`] = item.signedUrl;
        }
      });
    } catch (err: any) {
      console.warn(`[storage] unexpected sign error for bucket ${bucket}:`, err?.message || err);
    }
  }

  return signedMap;
}

export function getSignedStorageUrl(
  raw: string | null | undefined,
  signedMap: Record<string, string>,
  fallbackBucket?: string
): string | null {
  if (!raw) return null;
  const value = String(raw).trim();
  if (!value) return null;

  const ref = parseStorageRef(value, fallbackBucket);
  if (!ref) return value;

  const key = toRefKey(ref);
  return signedMap[key] ?? value;
}

export function parseDocumentField(raw: string | null | undefined): { values: string[]; asJsonArray: boolean } {
  if (!raw) return { values: [], asJsonArray: false };

  const value = String(raw).trim();
  if (!value) return { values: [], asJsonArray: false };

  if (value.startsWith("[")) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return {
          values: parsed.filter((item) => typeof item === "string" && item.trim().length > 0),
          asJsonArray: true,
        };
      }
    } catch {
      // fall through and treat as a single value
    }
  }

  return { values: [value], asJsonArray: false };
}

export async function ensureStorageBucket(bucket: string, isPublic = false): Promise<void> {
  if (!bucket || knownBuckets.has(bucket)) return;

  try {
    const { data, error } = await supabaseAdmin.storage.listBuckets();
    if (!error && (data ?? []).some((b: any) => b?.name === bucket || b?.id === bucket)) {
      knownBuckets.add(bucket);
      return;
    }
  } catch {
    // continue to create attempt
  }

  try {
    const { error } = await supabaseAdmin.storage.createBucket(bucket, {
      public: isPublic,
      fileSizeLimit: "50MB",
    });

    if (error && !/already exists|duplicate/i.test(error.message || "")) {
      console.warn(`[storage] failed to create bucket ${bucket}:`, error.message);
      return;
    }

    knownBuckets.add(bucket);
  } catch (err: any) {
    console.warn(`[storage] unexpected create bucket error for ${bucket}:`, err?.message || err);
  }
}

const mimeToExt: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/bmp": "bmp",
  "image/svg+xml": "svg",
  "application/pdf": "pdf",
};

export async function uploadDataUrlToBucket(
  dataUrl: string,
  bucket: string,
  keyPrefix: string
): Promise<string | null> {
  if (!isDataUrl(dataUrl)) return dataUrl;

  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/i);
  if (!match) return null;

  const mimeType = match[1].toLowerCase();
  const base64Payload = match[2];
  const ext = mimeToExt[mimeType] || "bin";

  await ensureStorageBucket(bucket, false);

  const objectPath = `${keyPrefix}.${ext}`;
  const fileBuffer = Buffer.from(base64Payload, "base64");

  const { error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(objectPath, fileBuffer, {
      contentType: mimeType,
      upsert: false,
      cacheControl: "3600",
    });

  if (error) {
    console.warn(`[storage] failed to upload data URL to ${bucket}/${objectPath}:`, error.message);
    return null;
  }

  return objectPath;
}
