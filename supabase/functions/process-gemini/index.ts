// AI Recaps Maker — Advanced Gemini Scene Detection v2
// Uses Gemini 1.5 Pro with emotional scoring, scene flow analysis, and RAG prompt support
import { createClient } from "npm:@blinkdotnew/sdk";

console.log("🚀 Gemini Scene Detection v2 started");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

function errorResponse(message: string, status = 500): Response {
  return new Response(JSON.stringify({ error: message }), { status, headers: jsonHeaders });
}

// ─── Advanced RAG Prompt Builder ──────────────────────────────────────────────

function buildAdvancedPrompt(
  recap: Record<string, unknown>,
  customization?: Record<string, unknown>
): string {
  const title = (recap.title as string) ?? "Unknown Title";
  const description = (recap.description as string) || "No description provided";
  const genre = (recap.genre as string) || "general";
  const duration = (recap.duration as number) || 60;

  // ── RAG customization sections ──────────────────────────────────────────────
  const keywords = (customization?.keywords as string[]) ?? [];
  const themes = (customization?.themes as string[]) ?? [];
  const focusAreas = (customization?.focusAreas as string[]) ?? [];
  const excludeTopics = (customization?.excludeTopics as string[]) ?? [];
  const tone = (customization?.tonePreference as string) ?? "dramatic";
  const detailLevel = (customization?.detailLevel as string) ?? "standard";
  const outputLanguage = (customization?.outputLanguage as string) ?? "english";
  const pacingStyle = (customization?.pacingStyle as string) ?? "medium";
  const targetAudience = (customization?.targetAudience as string) ?? "general";
  const spoilerWarning = (customization?.includeSpoilerWarning as boolean) ?? false;

  const sceneRange: Record<string, string> = {
    brief: "3-5", standard: "6-9", detailed: "10-12", comprehensive: "13-15",
  };
  const minScore: Record<string, number> = {
    brief: 8, standard: 6, detailed: 5, comprehensive: 4,
  };

  const toneDescriptions: Record<string, string> = {
    dramatic: "High-stakes, intense narration emphasizing emotional weight",
    neutral: "Balanced, objective coverage of events",
    humorous: "Light-hearted, witty with comedic observations",
    suspenseful: "Build tension, keep viewers on edge throughout",
    informative: "Clear educational narration focused on facts",
    emotional: "Empathetic narration connecting with human moments",
  };

  const pacingNotes: Record<string, string> = {
    fast: "Keep scenes brief and punchy. Prioritize action and impact.",
    medium: "Balance detail with pacing. Cover each scene adequately.",
    slow: "Take time with each scene. Include emotional subtext.",
  };

  const audienceNotes: Record<string, string> = {
    general: "Write for a general audience unfamiliar with the content.",
    fans: "Write for fans who appreciate deeper references and callbacks.",
    newcomers: "Keep it accessible — explain context and avoid jargon.",
    critics: "Include analytical observations and thematic commentary.",
  };

  const genreContexts: Record<string, string> = {
    "sci-fi": "Focus on: technology concepts, world-building, moral dilemmas, futuristic elements",
    "action": "Focus on: fight sequences, chase scenes, hero moments, explosive setpieces",
    "drama": "Focus on: emotional turning points, character revelations, relationship dynamics",
    "comedy": "Focus on: comedic timing, running gags, misunderstandings, witty dialogue",
    "thriller": "Focus on: plot twists, tension-building moments, red herrings, reveals",
    "horror": "Focus on: scare moments, atmosphere, supernatural elements, survival arcs",
    "romance": "Focus on: chemistry, romantic milestones, obstacles, emotional connection",
    "mystery": "Focus on: clue presentation, investigation progression, final reveal",
    "fantasy": "Focus on: magic, world-building, prophecy, hero's journey",
    "documentary": "Focus on: key facts, expert moments, visual evidence, core argument",
    "general": "Focus on: main plot beats, character arcs, key moments, resolution",
  };

  const ragSection = [
    keywords.length > 0 ? `📍 FOCUS KEYWORDS (must appear in analysis): ${keywords.join(", ")}` : null,
    themes.length > 0 ? `🎭 THEMES TO EXPLORE: ${themes.join(", ")}` : null,
    focusAreas.length > 0 ? `🔍 EMPHASIZE THESE AREAS: ${focusAreas.join(", ")}` : null,
    excludeTopics.length > 0 ? `🚫 EXCLUDE THESE TOPICS: ${excludeTopics.join(", ")}` : null,
    `🎤 TONE: ${tone} — ${toneDescriptions[tone] ?? tone}`,
    `🏃 PACING: ${pacingStyle} — ${pacingNotes[pacingStyle] ?? ""}`,
    `👥 AUDIENCE: ${audienceNotes[targetAudience] ?? ""}`,
    outputLanguage !== "english" ? `🌍 WRITE recap_script IN ${outputLanguage.toUpperCase()}` : null,
    spoilerWarning ? "⚠️ Start recap_script with a brief spoiler warning" : null,
  ]
    .filter(Boolean)
    .join("\n");

  const genreContext = genreContexts[genre] ?? genreContexts["general"];

  return `You are an expert film critic and advanced scene detector powered by RAG technology.

📽️ CONTENT:
Title: "${title}"
Genre: ${genre}
Description: ${description}
Recap duration: ${duration} seconds

🎬 GENRE CONTEXT:
${genreContext}

🤖 RAG CUSTOMIZATION:
${ragSection}

📏 DETAIL LEVEL: ${detailLevel} — Identify ${sceneRange[detailLevel] ?? "6-9"} scenes (importance ≥ ${minScore[detailLevel] ?? 6})

─────────────────────────────────────────────────
RETURN ONLY valid JSON (no markdown, no code fences, no extra text):
{
  "title": "engaging recap title",
  "overall_summary": "2-3 sentence overview emphasizing the ${tone} tone",
  "tone": "${tone}",
  "genre": "${genre}",
  "content_rating": "G|PG|PG-13|R|NR",
  "key_scenes": [
    {
      "scene_id": 1,
      "timestamp_estimate": "0:00-0:45",
      "scene_type": "action|dialogue|emotional|comedy|exposition|climax|resolution|flashback|transition|reveal",
      "description": "detailed scene description with context and character actions",
      "importance_score": 8,
      "emotional_intensity": 7,
      "keywords_matched": ["keyword1", "keyword2"],
      "themes_present": ["theme1"],
      "character_focus": "main character or characters in this scene",
      "mood": "tense|joyful|sad|mysterious|exciting|peaceful",
      "include_in_recap": true,
      "recap_segment": "narration for this specific scene (1-3 sentences)"
    }
  ],
  "character_highlights": [
    {
      "name": "Character Name",
      "role": "protagonist|antagonist|supporting",
      "key_moment": "description of their most important moment"
    }
  ],
  "plot_points": [
    {
      "beat": "plot beat name",
      "description": "what happens",
      "importance": 8
    }
  ],
  "thematic_elements": ["theme present in the content"],
  "emotional_arc": {
    "opening": "emotional state at the beginning",
    "midpoint": "emotional state at the midpoint",
    "climax": "peak emotional moment",
    "resolution": "how it ends emotionally"
  },
  "pacing_analysis": {
    "overall": "fast|medium|slow",
    "notes": "brief note on the content's rhythm and structure"
  },
  "keywords_coverage": {
    "found": ["keywords that appeared in the analysis"],
    "not_found": ["keywords not evident in the content"]
  },
  "recap_script": "Complete flowing narration for the entire recap (~${duration}s). Written in ${tone} tone for ${targetAudience} audience. No bullet points — continuous prose narration.",
  "scene_count": 8,
  "estimated_duration_seconds": ${duration},
  "confidence_score": 0.85
}`;
}

// ─── Gemini API Call ──────────────────────────────────────────────────────────

async function callGemini(
  prompt: string,
  geminiApiKey: string,
  modelId = "gemini-1.5-pro-latest"
): Promise<{ data: Record<string, unknown> | null; rawText: string; tokensIn: number; tokensOut: number }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${geminiApiKey}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 58_000);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          response_mime_type: "application/json",
          temperature: 0.65,
          topP: 0.9,
          topK: 40,
          maxOutputTokens: 8192,
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini API ${res.status}: ${errText}`);
    }

    const geminiData = await res.json() as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
        finishReason?: string;
      }>;
      usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
    };

    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const tokensIn = geminiData.usageMetadata?.promptTokenCount ?? Math.ceil(prompt.length / 4);
    const tokensOut = geminiData.usageMetadata?.candidatesTokenCount ?? Math.ceil(rawText.length / 4);

    let parsed: Record<string, unknown> | null = null;
    try {
      parsed = JSON.parse(rawText) as Record<string, unknown>;
    } catch {
      // Strip markdown fences and retry
      const stripped = rawText
        .replace(/^```(?:json)?\s*/im, "")
        .replace(/\s*```\s*$/im, "")
        .trim();
      try {
        parsed = JSON.parse(stripped) as Record<string, unknown>;
      } catch {
        // Last attempt: find first { ... } block
        const match = stripped.match(/\{[\s\S]*\}/);
        if (match) {
          try { parsed = JSON.parse(match[0]) as Record<string, unknown>; } catch { /* fall through */ }
        }
      }
    }

    return { data: parsed, rawText, tokensIn, tokensOut };
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Build fallback analysis when Gemini returns unparseable text ─────────────

function buildFallbackAnalysis(
  recap: Record<string, unknown>,
  rawText: string
): Record<string, unknown> {
  const duration = (recap.duration as number) || 60;
  return {
    title: recap.title,
    overall_summary: rawText.substring(0, 300),
    tone: "neutral",
    genre: recap.genre ?? "general",
    content_rating: "NR",
    key_scenes: [],
    character_highlights: [],
    plot_points: [],
    thematic_elements: [],
    emotional_arc: {
      opening: "story begins",
      midpoint: "story develops",
      climax: "story peaks",
      resolution: "story ends",
    },
    pacing_analysis: { overall: "medium", notes: "Analysis could not be fully parsed" },
    keywords_coverage: { found: [], not_found: [] },
    recap_script: rawText,
    scene_count: 0,
    estimated_duration_seconds: duration,
    confidence_score: 0.2,
  };
}

// ─── Progress update helper ───────────────────────────────────────────────────

async function updateProgress(
  blink: ReturnType<typeof createClient>,
  recapId: string,
  progress: number,
  status?: string
) {
  try {
    const update: Record<string, unknown> = { progress };
    if (status) update.status = status;
    await blink.db.recaps.update(recapId, update);
  } catch (e) {
    console.warn("Failed to update progress:", e);
  }
}

// ─── Main Handler ─────────────────────────────────────────────────────────────

async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const BLINK_SECRET_KEY = Deno.env.get("BLINK_SECRET_KEY") ?? "";
    if (!BLINK_SECRET_KEY) {
      console.warn("⚠️ BLINK_SECRET_KEY not set — DB operations may fail");
    }

    const blink = createClient({
      projectId: "ai-recaps-app-f7p6yyt8",
      secretKey: BLINK_SECRET_KEY,
    });

    // ── Parse body ──────────────────────────────────────────────────────────
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return errorResponse("Invalid JSON body", 400);
    }

    const { recapId, geminiApiKey, customization } = body as {
      recapId?: string;
      geminiApiKey?: string;
      customization?: Record<string, unknown>;
    };

    if (!recapId || !geminiApiKey) {
      return errorResponse("Missing recapId or geminiApiKey", 400);
    }

    console.log(`📝 Processing recap: ${recapId}`);

    // ── Fetch recap ─────────────────────────────────────────────────────────
    const recap = await blink.db.recaps.get(recapId) as Record<string, unknown> | null;
    if (!recap) {
      return errorResponse("Recap not found", 404);
    }

    console.log(`✅ Found recap: ${recap.title}`);
    await updateProgress(blink, recapId, 10, "processing");

    // ── Build advanced prompt ───────────────────────────────────────────────
    const prompt = buildAdvancedPrompt(recap, customization);
    await updateProgress(blink, recapId, 25);

    console.log("🤖 Calling Gemini 1.5 Pro (advanced scene detection v2)...");

    // ── Call Gemini ─────────────────────────────────────────────────────────
    let analysis: Record<string, unknown>;
    let rawText: string;
    let tokensIn: number;
    let tokensOut: number;

    try {
      const result = await callGemini(prompt, geminiApiKey);
      rawText = result.rawText;
      tokensIn = result.tokensIn;
      tokensOut = result.tokensOut;
      analysis = result.data ?? buildFallbackAnalysis(recap, rawText);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("❌ Gemini call failed:", msg);
      await blink.db.recaps.update(recapId, {
        status: "failed",
        errorMessage: msg,
        progress: 0,
      });
      return errorResponse(`Gemini processing failed: ${msg}`, 502);
    }

    await updateProgress(blink, recapId, 80);

    // ── Extract & enrich scene data ─────────────────────────────────────────
    const recapScript = (analysis.recap_script as string) || rawText;
    const scenes = Array.isArray(analysis.key_scenes) ? analysis.key_scenes : [];
    const sceneCount = (analysis.scene_count as number) || scenes.length;
    const confidenceScore = (analysis.confidence_score as number) || 0.5;

    // Calculate processing stats
    const duration = Date.now() - startTime;
    const includedScenes = scenes.filter((s: Record<string, unknown>) => s.include_in_recap !== false);

    // Build scriptUrl as base64-encoded JSON for storage
    const scriptUrl = `data:application/json;base64,${btoa(
      unescape(encodeURIComponent(JSON.stringify(analysis, null, 2)))
    )}`;

    // ── Update recap as completed ───────────────────────────────────────────
    await blink.db.recaps.update(recapId, {
      status: "completed",
      progress: 100,
      scriptUrl,
      updatedAt: new Date().toISOString(),
    });

    console.log(`✅ Scene detection v2 complete. Scenes: ${sceneCount}, Confidence: ${confidenceScore}`);
    console.log(`📊 Tokens: ${tokensIn} in / ${tokensOut} out | Time: ${duration}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        script: recapScript,
        scriptUrl,
        jobId: `recap-${recapId}-${Date.now()}`,
        analysis,
        sceneCount,
        includedSceneCount: includedScenes.length,
        confidenceScore,
        processingTimeMs: duration,
        tokensUsed: {
          input: tokensIn,
          output: tokensOut,
          total: tokensIn + tokensOut,
        },
      }),
      { status: 200, headers: jsonHeaders }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    console.error("❌ Unexpected handler error:", msg);
    return errorResponse(msg, 500);
  }
}

Deno.serve(handler);
