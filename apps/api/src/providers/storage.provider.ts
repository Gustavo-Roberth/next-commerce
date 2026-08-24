import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase URL and Service Role Key are required');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export const STORAGE_BUCKETS = {
  PRODUCT_IMAGES: 'product-images',
  NFE_XML: 'nfe-xml',
  NFE_PDF: 'nfe-pdf',
  USER_AVATARS: 'user-avatars',
} as const;

export type StorageBucket = typeof STORAGE_BUCKETS[keyof typeof STORAGE_BUCKETS];

interface UploadOptions {
  bucket: StorageBucket;
  path: string;
  file: Buffer | Uint8Array;
  contentType: string;
  upsert?: boolean;
}

interface UploadResult {
  path: string;
  fullPath: string;
  publicUrl: string;
}

export async function uploadFile({
  bucket,
  path,
  file,
  contentType,
  upsert = false,
}: UploadOptions): Promise<UploadResult> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      contentType,
      upsert,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(data.path);

  return {
    path: data.path,
    fullPath: data.fullPath,
    publicUrl: publicUrlData.publicUrl,
  };
}

export async function deleteFile(bucket: StorageBucket, path: string): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) {
    throw new Error(`Delete failed: ${error.message}`);
  }
}

export async function getPublicUrl(bucket: StorageBucket, path: string): Promise<string> {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function createSignedUrl(
  bucket: StorageBucket,
  path: string,
  expiresIn = 3600
): Promise<string> {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error) {
    throw new Error(`Signed URL failed: ${error.message}`);
  }
  return data.signedUrl;
}

export function generateFilePath(
  bucket: StorageBucket,
  originalName: string,
  entityId?: string
): string {
  const ext = originalName.split('.').pop()?.toLowerCase() || 'bin';
  const uuid = randomUUID();
  const timestamp = Date.now();
  const safeName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_').substring(0, 100);
  const prefix = entityId ? `${entityId}/` : '';
  return `${prefix}${timestamp}-${uuid}-${safeName}.${ext}`;
}

export function validateImageFile(file: Buffer, contentType: string): { valid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!allowedTypes.includes(contentType)) {
    return { valid: false, error: `Tipo de arquivo não permitido. Permitidos: ${allowedTypes.join(', ')}` };
  }

  if (file.length > maxSize) {
    return { valid: false, error: `Arquivo muito grande. Máximo: ${maxSize / 1024 / 1024}MB` };
  }

  return { valid: true };
}

export async function initializeBuckets(): Promise<void> {
  const buckets = Object.values(STORAGE_BUCKETS);

  for (const bucket of buckets) {
    const { data, error } = await supabase.storage.getBucket(bucket);
    if (error && error.message.includes('not found')) {
      const { error: createError } = await supabase.storage.createBucket(bucket, {
        public: bucket === STORAGE_BUCKETS.PRODUCT_IMAGES || bucket === STORAGE_BUCKETS.USER_AVATARS,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: bucket === STORAGE_BUCKETS.PRODUCT_IMAGES || bucket === STORAGE_BUCKETS.USER_AVATARS
          ? ['image/jpeg', 'image/png', 'image/webp', 'image/avif']
          : ['application/pdf', 'application/xml', 'text/xml'],
      });
      if (createError) {
        console.error(`Failed to create bucket ${bucket}:`, createError);
      } else {
        console.log(`Bucket ${bucket} created`);
      }
    }
  }
}