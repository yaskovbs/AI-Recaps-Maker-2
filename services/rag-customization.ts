/**
 * RAG Keyword & Theme Customization Service
 * Builds intelligent prompts for Gemini scene detection based on user preferences
 */

export interface RAGCustomization {
  // User-defined keywords to focus on
  keywords: string[];
  // Thematic focus areas
  themes: string[];
  // Specific areas to highlight
  focusAreas: string[];
  // Topics to avoid/exclude
  excludeTopics: string[];
  // Free-form topics to research
  topicsToExplore: string[];
  // Multi-select tone preferences
  tonePreferences: ('dramatic' | 'neutral' | 'humorous' | 'suspenseful' | 'informative' | 'emotional')[];
  // How detailed the breakdown should be (single select)
  detailLevel: 'brief' | 'standard' | 'detailed' | 'comprehensive';
  // Language for the recap script (single select)
  outputLanguage: 'english' | 'hebrew' | 'spanish' | 'french' | 'german' | 'arabic';
  // Pacing preference (single select)
  pacingStyle: 'fast' | 'medium' | 'slow';
  // Whether to include spoiler warnings
  includeSpoilerWarning: boolean;
  // Multi-select target audiences
  targetAudiences: ('general' | 'fans' | 'newcomers' | 'critics')[];
  // Backward-compat aliases (single values)
  tonePreference?: 'dramatic' | 'neutral' | 'humorous' | 'suspenseful' | 'informative' | 'emotional';
  targetAudience?: 'general' | 'fans' | 'newcomers' | 'critics';
}

// Preset theme collections per genre
export const GENRE_THEME_PRESETS: Record<string, { themes: string[]; keywords: string[]; focusAreas: string[] }> = {
  'sci-fi': {
    themes: ['technology', 'space', 'future', 'artificial intelligence', 'time travel'],
    keywords: ['spaceship', 'alien', 'robot', 'quantum', 'dystopia', 'utopia', 'wormhole'],
    focusAreas: ['world-building', 'technology concepts', 'moral dilemmas', 'character growth'],
  },
  'action': {
    themes: ['combat', 'survival', 'heroism', 'betrayal', 'redemption'],
    keywords: ['fight', 'explosion', 'chase', 'mission', 'weapon', 'enemy'],
    focusAreas: ['action sequences', 'fight choreography', 'stakes and tension', 'hero moments'],
  },
  'drama': {
    themes: ['relationships', 'family', 'identity', 'loss', 'growth'],
    keywords: ['conflict', 'emotion', 'revelation', 'sacrifice', 'forgiveness'],
    focusAreas: ['character development', 'emotional moments', 'dialogue', 'dramatic turns'],
  },
  'comedy': {
    themes: ['humor', 'satire', 'irony', 'friendship', 'misunderstanding'],
    keywords: ['joke', 'slapstick', 'wit', 'prank', 'awkward moment'],
    focusAreas: ['comedic timing', 'running gags', 'character quirks', 'funny scenes'],
  },
  'thriller': {
    themes: ['suspense', 'mystery', 'danger', 'deception', 'paranoia'],
    keywords: ['suspect', 'clue', 'trap', 'twist', 'secret', 'threat'],
    focusAreas: ['plot twists', 'tension building', 'red herrings', 'reveal moments'],
  },
  'horror': {
    themes: ['fear', 'survival', 'supernatural', 'isolation', 'dread'],
    keywords: ['monster', 'ghost', 'darkness', 'fear', 'danger', 'escape'],
    focusAreas: ['scare moments', 'atmosphere', 'supernatural elements', 'survival arc'],
  },
  'romance': {
    themes: ['love', 'attraction', 'heartbreak', 'chemistry', 'commitment'],
    keywords: ['confession', 'date', 'kiss', 'separation', 'reunion'],
    focusAreas: ['romantic tension', 'relationship milestones', 'emotional connection', 'obstacles'],
  },
  'mystery': {
    themes: ['investigation', 'secrets', 'clues', 'revelation', 'justice'],
    keywords: ['detective', 'murder', 'suspect', 'evidence', 'alibi'],
    focusAreas: ['clue presentation', 'mystery deepening', 'investigation steps', 'final reveal'],
  },
  'fantasy': {
    themes: ['magic', 'destiny', 'good vs evil', 'mythology', 'heroic journey'],
    keywords: ['spell', 'dragon', 'prophecy', 'artifact', 'kingdom', 'wizard'],
    focusAreas: ['world-building', 'magic system', 'character powers', 'quest progression'],
  },
  'documentary': {
    themes: ['facts', 'history', 'society', 'environment', 'human stories'],
    keywords: ['evidence', 'interview', 'data', 'discovery', 'impact'],
    focusAreas: ['key facts', 'expert opinions', 'visual evidence', 'narrative arc'],
  },
  'general': {
    themes: ['story', 'character', 'conflict', 'resolution'],
    keywords: ['important moment', 'key scene', 'turning point'],
    focusAreas: ['main plot', 'character arcs', 'key moments', 'resolution'],
  },
};

export const TONE_DESCRIPTIONS: Record<'dramatic' | 'neutral' | 'humorous' | 'suspenseful' | 'informative' | 'emotional', string> = {
  dramatic: 'High-stakes, intense narration that emphasizes emotional weight',
  neutral: 'Balanced, objective recap covering events as they happen',
  humorous: 'Light-hearted, witty narration with comedic observations',
  suspenseful: 'Building tension, keeping viewers on edge throughout',
  informative: 'Clear, educational narration focused on facts and context',
  emotional: 'Empathetic narration that connects with human moments',
};

export const DETAIL_LEVEL_DESCRIPTIONS: Record<RAGCustomization['detailLevel'], string> = {
  brief: '3-5 key scenes, high-level overview only',
  standard: '6-9 key scenes with moderate detail',
  detailed: '10-12 scenes with full descriptions and context',
  comprehensive: '13-15+ scenes with deep analysis and subtext',
};

export const DEFAULT_CUSTOMIZATION: RAGCustomization = {
  keywords: [],
  themes: [],
  focusAreas: [],
  excludeTopics: [],
  topicsToExplore: [],
  tonePreferences: ['dramatic'],
  detailLevel: 'standard',
  outputLanguage: 'english',
  pacingStyle: 'medium',
  includeSpoilerWarning: false,
  targetAudiences: ['general'],
};

/**
 * Get preset customization for a genre, merged with any user overrides
 */
export function getGenrePreset(genre: string, overrides?: Partial<RAGCustomization>): RAGCustomization {
  const preset = GENRE_THEME_PRESETS[genre] || GENRE_THEME_PRESETS['general'];
  return {
    ...DEFAULT_CUSTOMIZATION,
    themes: preset.themes.slice(0, 3),
    keywords: preset.keywords.slice(0, 5),
    focusAreas: preset.focusAreas.slice(0, 2),
    ...overrides,
  };
}

/**
 * Build a RAG-augmented prompt with all customizations
 */
export function buildRAGPrompt(
  title: string,
  genre: string,
  description: string,
  duration: number,
  customization: RAGCustomization
): string {
  const {
    keywords,
    themes,
    focusAreas,
    excludeTopics,
    topicsToExplore,
    tonePreferences,
    detailLevel,
    outputLanguage,
    pacingStyle,
    includeSpoilerWarning,
    targetAudiences,
    // backward-compat fallbacks
    tonePreference: _toneLegacy,
    targetAudience: _audienceLegacy,
  } = customization;

  const activeTones = (tonePreferences && tonePreferences.length > 0)
    ? tonePreferences
    : (_toneLegacy ? [_toneLegacy] : ['dramatic'] as const);
  const tonePreference = activeTones[0] as 'dramatic' | 'neutral' | 'humorous' | 'suspenseful' | 'informative' | 'emotional';
  const toneLabel = activeTones.join(' + ');

  const activeAudiences = (targetAudiences && targetAudiences.length > 0)
    ? targetAudiences
    : (_audienceLegacy ? [_audienceLegacy] : ['general'] as const);
  const targetAudience = activeAudiences[0] as 'general' | 'fans' | 'newcomers' | 'critics';

  const sceneRange = {
    brief: '3-5',
    standard: '6-9',
    detailed: '10-12',
    comprehensive: '13-15',
  }[detailLevel];

  const minImportance = {
    brief: 8,
    standard: 6,
    detailed: 5,
    comprehensive: 4,
  }[detailLevel];

  const languageInstruction = outputLanguage !== 'english'
    ? `\nIMPORTANT: Write the recap_script in ${outputLanguage}.`
    : '';

  const spoilerWarning = includeSpoilerWarning
    ? '\nAdd a brief spoiler warning at the start of the recap_script.'
    : '';

  const audienceMap: Record<string, string> = {
    general: 'Write for a general audience unfamiliar with the content.',
    fans: 'Write for fans who appreciate deeper references and callbacks.',
    newcomers: 'Keep it accessible — avoid jargon, explain context.',
    critics: 'Include analytical observations and thematic commentary.',
  };
  const audienceInstruction = activeAudiences.map((a) => audienceMap[a]).join(' Also: ');

  const pacingInstruction = {
    fast: 'Keep scenes brief, punchy. Prioritize action and impact.',
    medium: 'Balance detail with pacing. Cover each scene adequately.',
    slow: 'Take time with each scene. Include emotional subtext and nuance.',
  }[pacingStyle];

  const topicsSection = (topicsToExplore ?? []).length > 0
    ? `\n🔎 TOPICS TO RESEARCH (dig into these): ${(topicsToExplore ?? []).join(', ')}`
    : '';

  const keywordSection = keywords.length > 0
    ? `\n📍 FOCUS KEYWORDS (prioritize scenes containing these): ${keywords.join(', ')}`
    : '';

  const themeSection = themes.length > 0
    ? `\n🎭 KEY THEMES (explore these throughout the recap): ${themes.join(', ')}`
    : '';

  const focusSection = focusAreas.length > 0
    ? `\n🔍 FOCUS AREAS (emphasize these elements): ${focusAreas.join(', ')}`
    : '';

  const excludeSection = excludeTopics.length > 0
    ? `\n🚫 EXCLUDE (do NOT discuss or reference): ${excludeTopics.join(', ')}`
    : '';

  return `You are an expert film critic and advanced scene detector. Analyze the following content and generate a scene-by-scene breakdown for a ${duration}-second video recap.

📽️ CONTENT INFO:
Title: "${title}"
Genre: ${genre}
Description: ${description}

🎬 CUSTOMIZATION PARAMETERS:${keywordSection}${themeSection}${focusSection}${excludeSection}${topicsSection}
📢 Tone: ${toneLabel} — ${activeTones.map((t) => TONE_DESCRIPTIONS[t]).join('; ')}
🎯 Detail Level: ${detailLevel} — ${DETAIL_LEVEL_DESCRIPTIONS[detailLevel]}
🏃 Pacing: ${pacingInstruction}
👥 Audience: ${audienceInstruction}${languageInstruction}${spoilerWarning}

📋 INSTRUCTIONS:
- Identify ${sceneRange} key scenes based on genre and content
- Assign importance_score 1-10 (include scenes scoring ${minImportance}+ in recap)
- Tag each scene with any matched keywords from the focus list
- The recap_script must be complete flowing narration (~${Math.floor(duration / 60)} min ${duration % 60}s)
- Blend the ${toneLabel} tone${activeTones.length > 1 ? 's' : ''} throughout

Return ONLY a valid JSON object (no markdown fences, no extra text):
{
  "title": "engaging recap title",
  "overall_summary": "2-3 sentence overview",
  "tone": "${toneLabel}",
  "key_scenes": [
    {
      "timestamp_estimate": "0:00-0:45",
      "scene_type": "action|dialogue|emotional|comedy|exposition|climax|resolution|flashback|transition",
      "description": "detailed scene description with context",
      "importance_score": 8,
      "keywords_matched": ["keyword1"],
      "emotional_intensity": 7,
      "include_in_recap": true
    }
  ],
  "character_highlights": ["key character moment or trait"],
  "plot_points": ["major plot point or story beat"],
  "thematic_elements": ["theme present in the content"],
  "emotional_arc": "description of the emotional journey",
  "pacing_notes": "notes on the content's pacing and rhythm",
  "recap_script": "Full narrated recap script here",
  "scene_count": 8,
  "estimated_duration_seconds": ${duration}
}`;
}

/**
 * Validate and sanitize user customization input
 */
export function sanitizeCustomization(input: Partial<RAGCustomization>): RAGCustomization {
  const base = { ...DEFAULT_CUSTOMIZATION };

  if (Array.isArray(input.keywords)) {
    base.keywords = input.keywords
      .filter((k) => typeof k === 'string' && k.trim().length > 0)
      .map((k) => k.trim().substring(0, 50))
      .slice(0, 20);
  }

  if (Array.isArray(input.themes)) {
    base.themes = input.themes
      .filter((t) => typeof t === 'string' && t.trim().length > 0)
      .map((t) => t.trim().substring(0, 50))
      .slice(0, 10);
  }

  if (Array.isArray(input.focusAreas)) {
    base.focusAreas = input.focusAreas
      .filter((f) => typeof f === 'string' && f.trim().length > 0)
      .map((f) => f.trim().substring(0, 60))
      .slice(0, 6);
  }

  if (Array.isArray(input.excludeTopics)) {
    base.excludeTopics = input.excludeTopics
      .filter((e) => typeof e === 'string' && e.trim().length > 0)
      .map((e) => e.trim().substring(0, 50))
      .slice(0, 10);
  }

  const validTones = ['dramatic', 'neutral', 'humorous', 'suspenseful', 'informative', 'emotional'] as const;
  if (Array.isArray(input.tonePreferences)) {
    const filtered = input.tonePreferences.filter((t) => validTones.includes(t as typeof validTones[number]));
    if (filtered.length > 0) base.tonePreferences = filtered;
  } else if (input.tonePreference && validTones.includes(input.tonePreference as typeof validTones[number])) {
    base.tonePreferences = [input.tonePreference as typeof validTones[number]];
  }

  const validDetail: RAGCustomization['detailLevel'][] = ['brief', 'standard', 'detailed', 'comprehensive'];
  if (input.detailLevel && validDetail.includes(input.detailLevel)) {
    base.detailLevel = input.detailLevel;
  }

  const validLangs: RAGCustomization['outputLanguage'][] = ['english', 'hebrew', 'spanish', 'french', 'german', 'arabic'];
  if (input.outputLanguage && validLangs.includes(input.outputLanguage)) {
    base.outputLanguage = input.outputLanguage;
  }

  const validPacing: RAGCustomization['pacingStyle'][] = ['fast', 'medium', 'slow'];
  if (input.pacingStyle && validPacing.includes(input.pacingStyle)) {
    base.pacingStyle = input.pacingStyle;
  }

  const validAudience = ['general', 'fans', 'newcomers', 'critics'] as const;
  if (Array.isArray(input.targetAudiences)) {
    const filtered = input.targetAudiences.filter((a) => validAudience.includes(a as typeof validAudience[number]));
    if (filtered.length > 0) base.targetAudiences = filtered;
  } else if (input.targetAudience && validAudience.includes(input.targetAudience as typeof validAudience[number])) {
    base.targetAudiences = [input.targetAudience as typeof validAudience[number]];
  }

  if (Array.isArray(input.topicsToExplore)) {
    base.topicsToExplore = input.topicsToExplore
      .filter((t) => typeof t === 'string' && t.trim().length > 0)
      .map((t) => t.trim().substring(0, 60))
      .slice(0, 10);
  }

  if (typeof input.includeSpoilerWarning === 'boolean') {
    base.includeSpoilerWarning = input.includeSpoilerWarning;
  }

  return base;
}
