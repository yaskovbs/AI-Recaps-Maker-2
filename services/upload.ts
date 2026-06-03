// File Upload Service with Progress Tracking - Blink Storage
import { blink } from '@/lib/blink';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadResult {
  url: string;
  path: string;
  size: number;
  type: string;
}

// Supported file formats
export const SUPPORTED_FORMATS = {
  video: ['mp4', 'avi', 'mov', 'mkv', 'webm'],
  audio: ['mp3', 'wav', 'aac', 'm4a', 'ogg'],
  document: ['txt', 'doc', 'docx', 'pdf'],
};

// MIME type mapping
export const MIME_TYPES: Record<string, string> = {
  // Video
  mp4: 'video/mp4',
  avi: 'video/x-msvideo',
  mov: 'video/quicktime',
  mkv: 'video/x-matroska',
  webm: 'video/webm',
  // Audio
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  aac: 'audio/aac',
  m4a: 'audio/mp4',
  ogg: 'audio/ogg',
  // Documents
  txt: 'text/plain',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  pdf: 'application/pdf',
};

/**
 * Validate file format
 */
export function validateFileFormat(fileName: string, allowedFormats: string[]): boolean {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  return allowedFormats.includes(extension);
}

/**
 * Get MIME type from file extension
 */
export function getMimeType(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  return MIME_TYPES[extension] || 'application/octet-stream';
}

/**
 * Get file extension from MIME type
 */
export function getExtensionFromMime(mimeType: string): string {
  const entry = Object.entries(MIME_TYPES).find(([_, mime]) => mime === mimeType);
  return entry ? entry[0] : '';
}

/**
 * Format file size to human-readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get file extension from URI
 */
export function getFileExtension(uri: string): string {
  const parts = uri.split('.');
  return parts[parts.length - 1].toLowerCase();
}

/**
 * Validate file size
 */
export function validateFileSize(size: number, maxSize: number = 5368709120): { valid: boolean; error?: string } {
  if (size > maxSize) {
    return {
      valid: false,
      error: `File size (${formatFileSize(size)}) exceeds maximum allowed size (${formatFileSize(maxSize)})`,
    };
  }
  return { valid: true };
}

/**
 * Get max file size for bucket type
 */
export function getMaxFileSize(bucket: 'videos' | 'audio' | 'documents' | 'rendered' | 'thumbnails'): number {
  switch (bucket) {
    case 'videos':
    case 'rendered':
      return 5368709120; // 5GB
    case 'audio':
      return 104857600; // 100MB
    case 'documents':
      return 10485760; // 10MB
    case 'thumbnails':
      return 5242880; // 5MB
    default:
      return 10485760; // 10MB
  }
}

/**
 * Returns the maximum upload size (in bytes) allowed for a given credit balance.
 * - 0 credits  → 0 bytes (uploads blocked)
 * - 1–4 credits → 500 MB
 * - 5–9 credits → 1 GB
 * - 10–19 credits → 2.5 GB
 * - 20+ credits → 5 GB (full limit)
 */
export function getUploadLimitForCredits(balance: number): number {
  if (balance <= 0) return 0;
  if (balance < 5) return 524288000;    // 500 MB
  if (balance < 10) return 1073741824;  // 1 GB
  if (balance < 20) return 2684354560;  // 2.5 GB
  return 5368709120;                    // 5 GB
}

export interface CreditCheckResult {
  canUpload: boolean;
  balance: number;
  required: number;
  message?: string;
}

/**
 * Check whether the current user has enough credits to upload.
 * Uploading requires a minimum balance of 1 credit.
 */
export async function checkUploadCredits(): Promise<CreditCheckResult> {
  const required = 1;

  const user = await blink.auth.me().catch(() => null);
  if (!user) {
    return {
      canUpload: false,
      balance: 0,
      required,
      message: 'User not authenticated. Please sign in to upload files.',
    };
  }

  const rows = await blink.db.userCredits.list({
    where: { userId: user.id },
    limit: 1,
  });

  const balance = rows.length > 0 ? (rows[0].balance as number) : 0;

  if (balance < required) {
    return {
      canUpload: false,
      balance,
      required,
      message: `Not enough credits to upload. You have ${balance} credit${balance === 1 ? '' : 's'} but need at least ${required}. Earn or purchase credits first.`,
    };
  }

  return { canUpload: true, balance, required };
}

/**
 * Upload file to Blink Storage with progress tracking
 *
 * IMPORTANT (Android OOM fix):
 * Never use FileSystem.readAsStringAsync(uri, {encoding: Base64}) for large files.
 * On Android that allocates 1.33× the file size in JS heap, crashing with OOM for videos > ~100 MB.
 * Instead we use `fetch(fileUri)` which returns a streaming Response — React Native resolves
 * local file:// URIs without loading the whole file into JS memory.
 */
export async function uploadFile(
  fileUri: string,
  fileName: string,
  bucket: 'videos' | 'audio' | 'documents' | 'rendered' | 'thumbnails',
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  const user = await blink.auth.me().catch(() => null);

  if (!user) {
    throw new Error('User not authenticated. Please sign in to upload files.');
  }

  // Credit check is informational only — still allow upload if auth'd
  let creditMaxSize = getMaxFileSize(bucket);
  try {
    const creditCheck = await checkUploadCredits();
    if (creditCheck.canUpload) {
      creditMaxSize = Math.min(getUploadLimitForCredits(creditCheck.balance), getMaxFileSize(bucket));
    }
  } catch (e) {
    console.warn('⚠️ Credit check failed, using default limit:', e);
  }

  const timestamp = Date.now();
  const uploadPath = `${bucket}/${user.id}/${timestamp}_${fileName}`;
  const mimeType = getMimeType(fileName);

  let fileBlob: Blob;
  let fileSize = 0;

  // ─── Build Blob WITHOUT reading entire file into JS memory ────────────────
  // fetch() on React Native resolves file:// and content:// URIs by streaming
  // the file through native I/O, never allocating the whole buffer in JS heap.
  // This is the correct approach for large videos on Android.
  try {
    const response = await fetch(fileUri);
    if (!response.ok) {
      throw new Error(`Failed to read file: HTTP ${response.status}`);
    }
    fileBlob = await response.blob();
    fileSize = fileBlob.size;
  } catch (fetchErr) {
    // Fallback for edge cases (e.g. web Blob URLs that need re-fetch)
    console.warn('⚠️ fetch(fileUri) failed, trying fallback:', fetchErr);
    if (Platform.OS !== 'web') {
      // Last-resort: chunked read via FileSystem (only for small files)
      const info = await FileSystem.getInfoAsync(fileUri);
      const fileSizeBytes = (info as any).size ?? 0;
      if (fileSizeBytes > 50 * 1024 * 1024) {
        throw new Error(
          `File is too large to load into memory (${formatFileSize(fileSizeBytes)}). ` +
          'Please use a smaller file or build a custom dev client.'
        );
      }
      const base64 = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      fileBlob = new Blob([bytes.buffer], { type: mimeType });
      fileSize = bytes.length;
    } else {
      throw fetchErr;
    }
  }

  console.log(`📤 Uploading ${fileName} to ${uploadPath}`);
  console.log(`📊 File size: ${formatFileSize(fileSize)}`);

  // Warn for very large files — upload will still proceed but may be slow
  const LARGE_FILE_WARNING_BYTES = 200 * 1024 * 1024; // 200 MB
  if (fileSize > LARGE_FILE_WARNING_BYTES) {
    console.warn(
      `⚠️ Large file detected (${formatFileSize(fileSize)}). ` +
      'Upload will proceed but may take a while on slower connections.'
    );
  }

  const maxSize = creditMaxSize;
  const validation = validateFileSize(fileSize, maxSize);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  onProgress?.({ loaded: 0, total: fileSize, percentage: 0 });

  const file = new File([fileBlob], fileName, { type: mimeType });
  const { publicUrl } = await blink.storage.upload(file, uploadPath, {
    onProgress: (percent: number) => {
      onProgress?.({ loaded: Math.round((fileSize * percent) / 100), total: fileSize, percentage: percent });
    },
  });

  const result: UploadResult = {
    url: publicUrl,
    path: uploadPath,
    size: fileSize,
    type: mimeType,
  };

  console.log(`✅ Upload successful: ${result.url}`);
  return result;
}

/**
 * Delete file from Blink Storage
 */
export async function deleteFile(
  bucket: 'videos' | 'audio' | 'documents' | 'rendered' | 'thumbnails',
  filePath: string
): Promise<void> {
  await blink.storage.remove(filePath);
  console.log(`✅ File deleted: ${filePath}`);
}

/**
 * Compress video (placeholder)
 */
export async function compressVideo(
  videoUri: string,
  quality: 'low' | 'medium' | 'high' = 'medium'
): Promise<string> {
  console.log(`⚠️ Video compression not yet implemented (quality: ${quality})`);
  return videoUri;
}
