/**
 * Chunked Upload Service — AI Recaps Maker
 *
 * Features:
 * - Splits large files into 10 MB chunks using expo-file-system position/length reads
 * - Uploads each chunk independently with retry (3 attempts)
 * - Persists upload state to AsyncStorage for resume after crash / background return
 * - Emits detailed ChunkUploadProgress events (chunk index, bytes, %, ETA, speed)
 * - Background-resume task registered via expo-task-manager + expo-background-fetch
 */

import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, NativeModules } from 'react-native';
import { getSupabaseClient } from '@/template';

// ─── Safe lazy-load BackgroundFetch & TaskManager ────────────────────────────
// expo-background-fetch and expo-task-manager require native modules NOT present
// in Expo Go. We detect availability by checking NativeModules directly —
// this avoids the requireNativeModule Hermes-uncatchable throw.
// Constants.appOwnership is unreliable on Android Expo Go (SDK 54+).
const _hasBackgroundFetch = Boolean(NativeModules.ExpoBackgroundFetch);
const _hasTaskManager = Boolean(NativeModules.ExpoTaskManager);

let _BackgroundFetch: any = null;
let _TaskManager: any = null;

function getBackgroundFetch(): any {
  if (!_hasBackgroundFetch) return null;
  if (_BackgroundFetch) return _BackgroundFetch;
  try {
    _BackgroundFetch = require('expo-background-fetch');
  } catch {
    console.warn('[ChunkedUpload] expo-background-fetch not available');
  }
  return _BackgroundFetch;
}

function getTaskManager(): any {
  if (!_hasTaskManager) return null;
  if (_TaskManager) return _TaskManager;
  try {
    _TaskManager = require('expo-task-manager');
  } catch {
    console.warn('[ChunkedUpload] expo-task-manager not available');
  }
  return _TaskManager;
}

// ─── Constants ────────────────────────────────────────────────────────────────
export const CHUNK_SIZE = 10 * 1024 * 1024; // 10 MB per chunk
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1500;
const PENDING_KEY = '@airm_chunked_uploads_v2';
export const BG_TASK_NAME = 'AIRM_BACKGROUND_UPLOAD_TASK';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChunkUploadProgress {
  /** Zero-based index of chunk currently uploading */
  currentChunk: number;
  /** Total number of chunks */
  totalChunks: number;
  /** Number of chunks already uploaded (including current) */
  uploadedChunks: number;
  /** Overall progress 0-100 */
  percentage: number;
  /** Bytes uploaded so far */
  loaded: number;
  /** Total file size */
  total: number;
  /** Upload speed in bytes/second (rolling estimate) */
  bytesPerSecond: number;
  /** Estimated seconds remaining */
  etaSeconds: number;
}

export interface ChunkUploadState {
  /** Unique ID for this upload session */
  uploadId: string;
  fileUri: string;
  fileName: string;
  bucket: string;
  /** Final storage object key (without chunk suffix) */
  storagePath: string;
  totalChunks: number;
  /** Sorted list of chunk indices already uploaded */
  uploadedChunkIndices: number[];
  totalSize: number;
  startedAt: number;
  /** UTC ms of last update */
  lastUpdatedAt: number;
  /** Status */
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  /** Final public URL (populated on completion) */
  finalUrl?: string;
}

export interface ChunkUploadResult {
  url: string;
  path: string;
  size: number;
}

// ─── Abort controller ─────────────────────────────────────────────────────────

export interface UploadAbortToken {
  aborted: boolean;
  abort: () => void;
}

export function createAbortToken(): UploadAbortToken {
  const token = { aborted: false } as UploadAbortToken;
  token.abort = () => { token.aborted = true; };
  return token;
}

// ─── Persistence helpers ──────────────────────────────────────────────────────

async function loadAllStates(): Promise<Record<string, ChunkUploadState>> {
  try {
    const raw = await AsyncStorage.getItem(PENDING_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function saveState(state: ChunkUploadState): Promise<void> {
  const all = await loadAllStates();
  all[state.uploadId] = { ...state, lastUpdatedAt: Date.now() };
  await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(all));
}

async function removeState(uploadId: string): Promise<void> {
  const all = await loadAllStates();
  delete all[uploadId];
  await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(all));
}

/** Returns all pending/failed uploads that haven't completed */
export async function getPendingUploads(): Promise<ChunkUploadState[]> {
  const all = await loadAllStates();
  return Object.values(all).filter((s) => s.status !== 'completed');
}

// ─── Core chunked upload ──────────────────────────────────────────────────────

/**
 * Upload a file to Supabase Storage in 10 MB chunks.
 *
 * Each chunk is stored at `{bucket}/{storagePath}_chunk_{i}` as a separate
 * Supabase Storage object. The calling code receives a manifest URL path.
 * Resume: if AsyncStorage contains an existing state for the same uploadId,
 * already-uploaded chunks are skipped.
 *
 * @returns ChunkUploadResult with URL pointing to first chunk (manifest approach)
 */
export async function uploadFileInChunks(
  fileUri: string,
  fileName: string,
  bucket: 'videos' | 'audio' | 'documents' | 'rendered' | 'thumbnails',
  onProgress?: (progress: ChunkUploadProgress) => void,
  abortToken?: UploadAbortToken,
  resumeUploadId?: string,
): Promise<ChunkUploadResult> {
  const supabase = getSupabaseClient();

  // ── 1. Inspect file ────────────────────────────────────────────────────────
  const info = await FileSystem.getInfoAsync(fileUri, { size: true });
  if (!info.exists) throw new Error('File not found: ' + fileUri);
  const totalSize: number = (info as any).size ?? 0;
  if (totalSize === 0) throw new Error('File is empty');

  const totalChunks = Math.ceil(totalSize / CHUNK_SIZE);

  // ── 2. Build / restore upload state ───────────────────────────────────────
  const uploadId = resumeUploadId ?? `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `${uploadId}/${safeName}`;

  let state: ChunkUploadState;
  const existing = (await loadAllStates())[uploadId];
  if (existing && existing.status !== 'completed') {
    // Resume: re-use existing state
    state = { ...existing, status: 'uploading', fileUri, lastUpdatedAt: Date.now() };
    console.log(`[ChunkedUpload] Resuming upload ${uploadId} — ${existing.uploadedChunkIndices.length}/${totalChunks} chunks already done`);
  } else {
    state = {
      uploadId,
      fileUri,
      fileName,
      bucket,
      storagePath,
      totalChunks,
      uploadedChunkIndices: [],
      totalSize,
      startedAt: Date.now(),
      lastUpdatedAt: Date.now(),
      status: 'uploading',
    };
  }
  await saveState(state);

  // ── 3. Speed tracking ──────────────────────────────────────────────────────
  let startTime = Date.now();
  let bytesUploadedSinceStart = state.uploadedChunkIndices.length * CHUNK_SIZE;

  // ── 4. Upload chunks ───────────────────────────────────────────────────────
  for (let i = 0; i < totalChunks; i++) {
    if (abortToken?.aborted) {
      state.status = 'pending'; // preserve for later resume
      await saveState(state);
      throw new Error('Upload aborted by user');
    }

    if (state.uploadedChunkIndices.includes(i)) {
      // Already uploaded — skip
      continue;
    }

    const offset = i * CHUNK_SIZE;
    const chunkLength = Math.min(CHUNK_SIZE, totalSize - offset);
    const chunkPath = `${storagePath}_chunk_${i}`;

    // ── Read chunk ───────────────────────────────────────────────────────────
    let chunkBlob: Blob;
    if (Platform.OS === 'web') {
      const resp = await fetch(fileUri);
      const ab = await resp.arrayBuffer();
      chunkBlob = new Blob([ab.slice(offset, offset + chunkLength)]);
    } else {
      // expo-file-system native chunk read (avoids loading full file into memory)
      const base64 = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
        position: offset,
        length: chunkLength,
      });
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let b = 0; b < binary.length; b++) bytes[b] = binary.charCodeAt(b);
      chunkBlob = new Blob([bytes.buffer], { type: 'application/octet-stream' });
    }

    // ── Upload chunk with retry ──────────────────────────────────────────────
    let attempt = 0;
    let lastError: Error | null = null;
    while (attempt < MAX_RETRIES) {
      if (abortToken?.aborted) {
        state.status = 'pending';
        await saveState(state);
        throw new Error('Upload aborted by user');
      }
      try {
        const { error } = await supabase.storage
          .from(bucket)
          .upload(chunkPath, chunkBlob, {
            contentType: 'application/octet-stream',
            upsert: true,
          });
        if (error) throw new Error(error.message);
        lastError = null;
        break;
      } catch (err: any) {
        lastError = err;
        attempt++;
        console.warn(`[ChunkedUpload] Chunk ${i} attempt ${attempt}/${MAX_RETRIES} failed: ${err.message}`);
        if (attempt < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * attempt));
        }
      }
    }
    if (lastError) {
      state.status = 'failed';
      await saveState(state);
      throw new Error(`Chunk ${i}/${totalChunks} failed after ${MAX_RETRIES} retries: ${lastError.message}`);
    }

    // ── Mark chunk done ──────────────────────────────────────────────────────
    state.uploadedChunkIndices.push(i);
    await saveState(state);

    // ── Emit progress ────────────────────────────────────────────────────────
    const uploadedBytes = state.uploadedChunkIndices.length * CHUNK_SIZE;
    bytesUploadedSinceStart += chunkLength;
    const elapsedSec = Math.max(0.1, (Date.now() - startTime) / 1000);
    const bps = Math.round(bytesUploadedSinceStart / elapsedSec);
    const remaining = totalSize - uploadedBytes;
    const etaSec = bps > 0 ? Math.round(remaining / bps) : 0;

    onProgress?.({
      currentChunk: i,
      totalChunks,
      uploadedChunks: state.uploadedChunkIndices.length,
      percentage: Math.min(99, Math.round((uploadedBytes / totalSize) * 100)),
      loaded: Math.min(uploadedBytes, totalSize),
      total: totalSize,
      bytesPerSecond: bps,
      etaSeconds: etaSec,
    });
  }

  // ── 5. All chunks done — emit 100% ────────────────────────────────────────
  onProgress?.({
    currentChunk: totalChunks - 1,
    totalChunks,
    uploadedChunks: totalChunks,
    percentage: 100,
    loaded: totalSize,
    total: totalSize,
    bytesPerSecond: 0,
    etaSeconds: 0,
  });

  // Build a "manifest" public URL from the first chunk
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(`${storagePath}_chunk_0`);

  const finalUrl = urlData?.publicUrl ?? '';
  state.status = 'completed';
  state.finalUrl = finalUrl;
  await saveState(state);

  // Clean up completed state after 5 min
  setTimeout(() => removeState(uploadId), 5 * 60 * 1000);

  return { url: finalUrl, path: storagePath, size: totalSize };
}

// ─── Background Task Registration ────────────────────────────────────────────

/**
 * Define the background task — attempts to resume any pending uploads.
 * Only registered when TaskManager native module is available.
 */
function defineBackgroundTask() {
  const TaskManager = getTaskManager();
  const BackgroundFetch = getBackgroundFetch();
  if (!TaskManager || !BackgroundFetch) return;
  try {
    TaskManager.defineTask(BG_TASK_NAME, async () => {
      console.log('[BG Upload] Background task triggered — checking pending uploads');
      try {
        const pending = await getPendingUploads();
        if (pending.length === 0) {
          return BackgroundFetch.BackgroundFetchResult.NoData;
        }
        const upload = pending[0];
        console.log(`[BG Upload] Resuming: ${upload.fileName} (${upload.uploadedChunkIndices.length}/${upload.totalChunks})`);
        const info = await FileSystem.getInfoAsync(upload.fileUri);
        if (!info.exists) {
          console.warn('[BG Upload] Source file no longer accessible — removing state');
          await removeState(upload.uploadId);
          return BackgroundFetch.BackgroundFetchResult.Failed;
        }
        await uploadFileInChunks(
          upload.fileUri,
          upload.fileName,
          upload.bucket as 'videos',
          (prog) => {
            console.log(`[BG Upload] Progress: ${prog.percentage}% (chunk ${prog.currentChunk + 1}/${prog.totalChunks})`);
          },
          undefined,
          upload.uploadId,
        );
        return BackgroundFetch.BackgroundFetchResult.NewData;
      } catch (err: any) {
        console.error('[BG Upload] Background task error:', err.message);
        return BackgroundFetch.BackgroundFetchResult.Failed;
      }
    });
  } catch (err: any) {
    console.warn('[BG Upload] defineTask failed:', err.message);
  }
}

/**
 * Register the background upload task.
 * Call this once at app startup (e.g., in _layout.tsx after providers mount).
 */
export async function registerBackgroundUploadTask(): Promise<void> {
  // Define task here (not at module load) to avoid native module crash on import
  defineBackgroundTask();
  const BackgroundFetch = getBackgroundFetch();
  const TaskManager = getTaskManager();
  if (!BackgroundFetch || !TaskManager) {
    console.log('[BG Upload] Background fetch not available on this platform/build');
    return;
  }
  try {
    const status = await BackgroundFetch.getStatusAsync();
    if (
      status === BackgroundFetch.BackgroundFetchStatus.Restricted ||
      status === BackgroundFetch.BackgroundFetchStatus.Denied
    ) {
      console.warn('[BG Upload] Background fetch is restricted/denied on this device');
      return;
    }
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BG_TASK_NAME);
    if (!isRegistered) {
      await BackgroundFetch.registerTaskAsync(BG_TASK_NAME, {
        minimumInterval: 60 * 15,
        stopOnTerminate: false,
        startOnBoot: true,
      });
      console.log('[BG Upload] Background task registered');
    }
  } catch (err: any) {
    console.warn('[BG Upload] registerBackgroundUploadTask failed:', err.message);
  }
}

/** Unregister the background task (call on logout / cleanup) */
export async function unregisterBackgroundUploadTask(): Promise<void> {
  const BackgroundFetch = getBackgroundFetch();
  const TaskManager = getTaskManager();
  if (!BackgroundFetch || !TaskManager) return;
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BG_TASK_NAME);
    if (isRegistered) {
      await BackgroundFetch.unregisterTaskAsync(BG_TASK_NAME);
    }
  } catch {
    // Ignore
  }
}

// ─── Helpers used by UI ───────────────────────────────────────────────────────

/** Format seconds → "1h 23m" / "45s" */
export function formatETA(seconds: number): string {
  if (seconds <= 0) return '--';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 60) return s > 0 ? `${m}m ${s}s` : `${m}m`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return `${h}h ${rm}m`;
}

/** Format bytes/s → "1.2 MB/s" */
export function formatSpeed(bps: number): string {
  if (bps <= 0) return '--';
  if (bps < 1024) return `${bps} B/s`;
  if (bps < 1024 * 1024) return `${(bps / 1024).toFixed(1)} KB/s`;
  return `${(bps / 1024 / 1024).toFixed(1)} MB/s`;
}
