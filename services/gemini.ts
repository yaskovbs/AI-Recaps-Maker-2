// Gemini AI Service - Client-side wrapper for Edge Function with API Tracking
import { trackApiUsage, checkApiLimits, hashApiKey } from './api-tracking';

export interface RecapCustomization {
  keywords?: string[];
  themes?: string[];
  focusAreas?: string[];
  excludeTopics?: string[];
  tonePreference?: string;
  detailLevel?: string;
}

export interface GeminiProcessRequest {
  recapId: string;
  geminiApiKey: string;
  customization?: RecapCustomization;
}

export interface GeminiSceneAnalysis {
  title?: string;
  overall_summary?: string;
  tone?: string;
  key_scenes?: Array<{
    timestamp_estimate: string;
    scene_type: string;
    description: string;
    importance_score: number;
    keywords_matched: string[];
    include_in_recap: boolean;
  }>;
  character_highlights?: string[];
  plot_points?: string[];
  emotional_arc?: string;
  recap_script?: string;
  scene_count?: number;
  estimated_duration_seconds?: number;
}

export interface GeminiProcessResponse {
  success: boolean;
  script: string;
  scriptUrl: string;
  jobId: string;
  analysis?: GeminiSceneAnalysis;
  sceneCount?: number;
  tokensUsed?: {
    input: number;
    output: number;
  };
}

const GEMINI_EDGE_FUNCTION_URL =
  'https://f7p6yyt8--process-gemini.functions.blink.new';

/**
 * Process video with Gemini AI (via Blink Edge Function)
 * With automatic API usage tracking and limit checking
 */
export async function processWithGemini(
  request: GeminiProcessRequest
): Promise<{ data: GeminiProcessResponse | null; error: string | null }> {
  const startTime = Date.now();

  console.log('🤖 Calling process-gemini Edge Function...');
  console.log('📝 Recap ID:', request.recapId);

  // ✅ Step 1: Check API limits before proceeding
  const keyHash = await hashApiKey(request.geminiApiKey);
  const limitsCheck = await checkApiLimits(keyHash);

  if (limitsCheck.exceeded) {
    console.warn('⚠️ API limits exceeded:', limitsCheck.message);
    return {
      data: null,
      error: `API Limit Exceeded: ${limitsCheck.message}`,
    };
  }

  try {
    // ✅ Step 2: Call Blink Edge Function
    const response = await fetch(GEMINI_EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recapId: request.recapId,
        geminiApiKey: request.geminiApiKey,
        ...(request.customization ? { customization: request.customization } : {}),
      }),
    });

    const duration = Date.now() - startTime;

    if (!response.ok) {
      let errorMessage: string;
      try {
        const text = await response.text();
        errorMessage = `[Gemini Error ${response.status}] ${text || response.statusText}`;
      } catch {
        errorMessage = `[Gemini Error ${response.status}] ${response.statusText}`;
      }

      console.error('❌ Gemini processing failed:', errorMessage);

      // ✅ Step 3: Track failed API call
      await trackApiUsage({
        apiType: 'gemini',
        apiKey: request.geminiApiKey,
        tokensInput: 0,
        tokensOutput: 0,
        costInput: 0,
        costOutput: 0,
        durationMs: duration,
        operationType: 'video-analysis',
        recapId: request.recapId,
        status: 'failed',
        errorMessage,
      });

      return { data: null, error: errorMessage };
    }

    const data: GeminiProcessResponse = await response.json();
    const duration2 = Date.now() - startTime;

    console.log('✅ Gemini processing successful');
    if (data.script) {
      console.log('📝 Script preview:', data.script.substring(0, 100) + '...');
    }

    // ✅ Step 4: Track successful API call
    const tokensInput = data.tokensUsed?.input || 0;
    const tokensOutput = data.tokensUsed?.output || 0;

    await trackApiUsage({
      apiType: 'gemini',
      apiKey: request.geminiApiKey,
      tokensInput,
      tokensOutput,
      costInput: 0,
      costOutput: 0,
      durationMs: duration2,
      operationType: 'video-analysis',
      recapId: request.recapId,
      status: 'success',
    });

    console.log('📊 API usage tracked:', {
      tokens: tokensInput + tokensOutput,
      duration: `${(duration2 / 1000).toFixed(2)}s`,
    });

    return { data, error: null };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('❌ Unexpected error:', error);

    // ✅ Track timeout/unknown error
    await trackApiUsage({
      apiType: 'gemini',
      apiKey: request.geminiApiKey,
      tokensInput: 0,
      tokensOutput: 0,
      costInput: 0,
      costOutput: 0,
      durationMs: duration,
      operationType: 'video-analysis',
      recapId: request.recapId,
      status: 'timeout',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get processing job status (stub — processing_jobs table not in Blink DB)
 */
export async function getProcessingJobStatus(jobId: string) {
  console.warn('⚠️ getProcessingJobStatus: processing_jobs table not available in Blink DB');
  return { data: null, error: 'Not implemented' };
}

/**
 * Subscribe to processing job updates (stub — no realtime in Blink DB)
 */
export function subscribeToProcessingJob(
  jobId: string,
  onUpdate: (job: any) => void
): () => void {
  console.warn('⚠️ subscribeToProcessingJob: realtime not supported in Blink DB');
  return () => {};
}

/**
 * Subscribe to recap updates (stub — poll instead of realtime)
 */
export function subscribeToRecap(
  recapId: string,
  onUpdate: (recap: any) => void
): () => void {
  console.warn('⚠️ subscribeToRecap: realtime not supported in Blink DB');
  return () => {};
}
