/**
 * Pipeline Service — connects the Create wizard to the backend recap pipeline.
 *
 * Endpoints (Task 3 will fully deploy the backend):
 *   POST  /recaps/jobs           — create a new job
 *   GET   /recaps/jobs/:id       — get job status
 *   GET   /recaps/jobs/:id/events — SSE stream of step events
 *
 * Until the backend is available, this service falls back to a mock simulation
 * that emits the same event types with realistic delays.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const PIPELINE_URL = (process.env.EXPO_PUBLIC_PIPELINE_URL || '').replace(/\/$/, '');
const JOBS_STORAGE_KEY = '@airm_pipeline_jobs';

export type PipelineEventType =
  | 'step_started'
  | 'step_completed'
  | 'step_fallback'
  | 'step_failed'
  | 'job_completed'
  | 'job_failed';

export interface PipelineEvent {
  type: PipelineEventType;
  step: string;
  message: string;
  timestamp: number;
  data?: Record<string, unknown>;
}

export interface RecapJob {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  title: string;
  genre: string;
  durationSeconds: number;
  createdAt: number;
  completedAt?: number;
  events: PipelineEvent[];
  outputUrl?: string;
}

const MOCK_STEPS = [
  { step: 'audio_analysis', label: 'Analyzing audio', duration: 1200 },
  { step: 'video_analysis', label: 'Analyzing video with Gemini', duration: 2000 },
  { step: 'ai_matching', label: 'Smart AI matching', duration: 1500 },
  { step: 'segment_extraction', label: 'Extracting key segments', duration: 1800 },
  { step: 'render', label: 'Rendering final recap', duration: 2500 },
];

function generateJobId(): string {
  return `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function saveJob(job: RecapJob): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(JOBS_STORAGE_KEY);
    const jobs: Record<string, RecapJob> = stored ? JSON.parse(stored) : {};
    jobs[job.id] = job;
    await AsyncStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(jobs));
  } catch {
    // Non-fatal — job persists in memory for the session
  }
}

export async function loadJobs(): Promise<RecapJob[]> {
  try {
    const stored = await AsyncStorage.getItem(JOBS_STORAGE_KEY);
    if (!stored) return [];
    const jobs: Record<string, RecapJob> = JSON.parse(stored);
    return Object.values(jobs).sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

export async function loadLastJobId(): Promise<string | null> {
  const jobs = await loadJobs();
  return jobs.length > 0 ? jobs[0].id : null;
}

interface CreateJobParams {
  title: string;
  genre: string;
  durationSeconds: number;
  audioUrl?: string;
  videoUrl?: string;
  scriptText?: string;
  learningContext?: { personalConsentGiven: boolean; activeChannels: { handle: string; channelId: string }[] };
}

/**
 * Attempt to create a real job on the backend.
 * Falls back to a mock job if the backend is unavailable.
 */
export async function createRecapJob(params: CreateJobParams): Promise<RecapJob> {
  const jobId = generateJobId();

  if (PIPELINE_URL) {
    try {
      const resp = await fetch(`${PIPELINE_URL}/recaps/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...params, id: jobId }),
      });
      if (resp.ok) {
        const serverJob = await resp.json();
        const job: RecapJob = {
          id: serverJob.id || jobId,
          status: 'queued',
          title: params.title,
          genre: params.genre,
          durationSeconds: params.durationSeconds,
          createdAt: Date.now(),
          events: [],
        };
        await saveJob(job);
        return job;
      }
    } catch {
      // Backend not reachable — fall through to mock
    }
  }

  // Mock job
  const job: RecapJob = {
    id: jobId,
    status: 'queued',
    title: params.title,
    genre: params.genre,
    durationSeconds: params.durationSeconds,
    createdAt: Date.now(),
    events: [],
  };
  await saveJob(job);
  return job;
}

/**
 * Get the current status of a job.
 * Falls back to local storage if backend unreachable.
 */
export async function getRecapJob(jobId: string): Promise<RecapJob | null> {
  if (PIPELINE_URL) {
    try {
      const resp = await fetch(`${PIPELINE_URL}/recaps/jobs/${jobId}`);
      if (resp.ok) {
        return await resp.json();
      }
    } catch {
      // Fall through to local
    }
  }

  try {
    const stored = await AsyncStorage.getItem(JOBS_STORAGE_KEY);
    if (stored) {
      const jobs: Record<string, RecapJob> = JSON.parse(stored);
      return jobs[jobId] || null;
    }
  } catch {}
  return null;
}

type EventCallback = (event: PipelineEvent) => void;
type DoneCallback = (job: RecapJob) => void;
type ErrorCallback = (error: Error) => void;

/**
 * Subscribe to job events. Returns an unsubscribe function.
 *
 * In production (when PIPELINE_URL is set), attempts to poll the real SSE endpoint.
 * Otherwise runs a mock simulation with the same event contract.
 */
export function subscribeToJobEvents(
  job: RecapJob,
  onEvent: EventCallback,
  onDone: DoneCallback,
  onError: ErrorCallback
): () => void {
  let cancelled = false;

  async function runMockSimulation() {
    const updatedJob: RecapJob = { ...job, status: 'processing', events: [] };

    for (const mockStep of MOCK_STEPS) {
      if (cancelled) return;

      const startEvent: PipelineEvent = {
        type: 'step_started',
        step: mockStep.step,
        message: `Starting: ${mockStep.label}`,
        timestamp: Date.now(),
      };
      updatedJob.events.push(startEvent);
      onEvent(startEvent);

      await delay(mockStep.duration);

      if (cancelled) return;

      // Occasionally simulate a fallback (step succeeds via alternative method)
      const usesFallback = Math.random() < 0.15;
      const completedEvent: PipelineEvent = {
        type: usesFallback ? 'step_fallback' : 'step_completed',
        step: mockStep.step,
        message: usesFallback
          ? `${mockStep.label} completed via fallback mode`
          : `${mockStep.label} completed`,
        timestamp: Date.now(),
      };
      updatedJob.events.push(completedEvent);
      onEvent(completedEvent);

      await delay(200);
    }

    if (cancelled) return;

    updatedJob.status = 'completed';
    updatedJob.completedAt = Date.now();
    updatedJob.outputUrl = `file://mock/recaps/${job.id}/recap.mp4`;

    await saveJob(updatedJob);
    onDone(updatedJob);
  }

  async function runRealPolling() {
    try {
      const resp = await fetch(`${PIPELINE_URL}/recaps/jobs/${job.id}/events`, {
        headers: { Accept: 'text/event-stream' },
      });

      if (!resp.ok || !resp.body) {
        // Fall back to mock
        await runMockSimulation();
        return;
      }

      // Minimal SSE parser
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (!cancelled) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          try {
            const ev: PipelineEvent = JSON.parse(line.slice(5).trim());
            onEvent(ev);
            if (ev.type === 'job_completed') {
              const finalJob = await getRecapJob(job.id);
              onDone(finalJob || { ...job, status: 'completed' });
              return;
            }
            if (ev.type === 'job_failed') {
              onError(new Error(ev.message));
              return;
            }
          } catch {}
        }
      }
    } catch {
      if (!cancelled) {
        await runMockSimulation();
      }
    }
  }

  if (PIPELINE_URL) {
    runRealPolling();
  } else {
    runMockSimulation();
  }

  return () => {
    cancelled = true;
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
