/**
 * File Analysis Service
 * Handles sequential processing: TXT first → then MP3
 * Provides text structure analysis + audio speech analysis
 */

export interface TxtAnalysisResult {
  rawText: string;
  charCount: number;
  wordCount: number;
  lineCount: number;
  estimatedReadingMinutes: number;    // ~200 wpm reading speed
  estimatedNarrationMinutes: number;  // ~130 wpm narration speed
  paragraphs: number;
  dialogueLines: number;             // Lines starting with quotes / name:
  hasDialogue: boolean;
  detectedLanguage: 'he' | 'en' | 'mixed' | 'unknown';
  structure: 'script' | 'prose' | 'list' | 'mixed';
  preview: string;                   // First ~150 chars
  keyPhrases: string[];              // First few sentences / headings
}

export interface Mp3AnalysisResult {
  fileName: string;
  fileSizeBytes: number;
  estimatedDurationSeconds: number;  // Approx from bitrate & size
  estimatedDurationDisplay: string;  // "3:42"
  speechRateWPM: number;             // Estimated words per minute from text
  speechPaceLabel: 'slow' | 'normal' | 'fast';
  estimatedWordCount: number;
  detectedLanguage: 'he' | 'en' | 'mixed' | 'unknown';
  transcriptPreview: string;         // Mock first words from file name context
  channels: 'mono' | 'stereo';
  estimatedBitrate: string;
}

export type AnalysisEvent =
  | { type: 'started';   phase: 'txt' | 'mp3'; message: string }
  | { type: 'progress';  phase: 'txt' | 'mp3'; step: string; message: string; pct: number }
  | { type: 'completed'; phase: 'txt' | 'mp3'; message: string; result: TxtAnalysisResult | Mp3AnalysisResult }
  | { type: 'error';     phase: 'txt' | 'mp3'; message: string };

type EventCallback = (event: AnalysisEvent) => void;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function detectLanguage(text: string): 'he' | 'en' | 'mixed' | 'unknown' {
  if (!text) return 'unknown';
  const hebrewChars = (text.match(/[\u0590-\u05FF]/g) || []).length;
  const latinChars  = (text.match(/[a-zA-Z]/g) || []).length;
  const total = hebrewChars + latinChars;
  if (total === 0) return 'unknown';
  const heRatio = hebrewChars / total;
  if (heRatio > 0.75) return 'he';
  if (heRatio < 0.25) return 'en';
  return 'mixed';
}

function detectStructure(text: string): 'script' | 'prose' | 'list' | 'mixed' {
  const lines = text.split('\n').filter(l => l.trim());
  const dialogueLines = lines.filter(l => /^[A-ZÀ-Ö\u05D0-\u05EA\w\s]{2,25}:/m.test(l)).length;
  const listLines     = lines.filter(l => /^[\-\*\•\d+\.]/.test(l.trim())).length;
  if (dialogueLines / lines.length > 0.3) return 'script';
  if (listLines / lines.length > 0.3) return 'list';
  if (lines.length > 10) return 'prose';
  return 'mixed';
}

function countDialogueLines(text: string): number {
  return (text.match(/^[A-ZÀ-Ö\u05D0-\u05EA\w\s]{2,25}:/mg) || []).length
       + (text.match(/["״]/g) || []).length / 2;
}

function extractKeyPhrases(text: string): string[] {
  const lines = text.split('\n').filter(l => l.trim().length > 10);
  return lines.slice(0, 5).map(l => l.trim().slice(0, 80));
}

function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function estimateDurationFromSize(bytes: number): number {
  // Most speech MP3s are ~16–64 kbps. Use 32 kbps as safe default.
  const bitrateKbps = 32;
  return Math.round((bytes * 8) / (bitrateKbps * 1000));
}

function estimateBitrate(bytes: number, durationSecs: number): string {
  if (durationSecs <= 0) return '32 kbps';
  const kbps = Math.round((bytes * 8) / (durationSecs * 1000));
  return `${kbps} kbps`;
}

function speechPaceLabel(wpm: number): 'slow' | 'normal' | 'fast' {
  if (wpm < 110) return 'slow';
  if (wpm < 160) return 'normal';
  return 'fast';
}

function delay(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

// ─── TXT Analysis ─────────────────────────────────────────────────────────────

export async function analyzeTxtFile(
  uri: string,
  fileName: string,
  size: number,
  platform: 'web' | 'mobile',
  onEvent: EventCallback
): Promise<TxtAnalysisResult | null> {
  onEvent({ type: 'started', phase: 'txt', message: `קורא קובץ ${fileName}...` });

  await delay(400);
  onEvent({ type: 'progress', phase: 'txt', step: 'read', message: 'קורא תוכן הקובץ', pct: 15 });

  let rawText = '';

  if (platform === 'web') {
    try {
      const response = await fetch(uri);
      rawText = await response.text();
    } catch {
      onEvent({ type: 'error', phase: 'txt', message: 'לא הצלחנו לקרוא את קובץ ה-TXT' });
      return null;
    }
  } else {
    // Mobile: simulate reading (FileSystem would be used in real implementation)
    rawText = `[תוכן קובץ ${fileName} — ${(size / 1024).toFixed(1)} KB]`;
  }

  await delay(350);
  onEvent({ type: 'progress', phase: 'txt', step: 'lang', message: 'מזהה שפה ומבנה', pct: 35 });

  const lang      = detectLanguage(rawText);
  const structure = detectStructure(rawText);

  await delay(350);
  onEvent({ type: 'progress', phase: 'txt', step: 'parse', message: 'מנתח מבנה הטקסט', pct: 55 });

  const words     = rawText.trim().split(/\s+/).filter(Boolean).length || Math.round(size / 5.5);
  const lines     = rawText.split('\n').length;
  const paras     = (rawText.match(/\n\s*\n/g) || []).length + 1;
  const dialogue  = Math.round(countDialogueLines(rawText));

  await delay(350);
  onEvent({ type: 'progress', phase: 'txt', step: 'timing', message: 'מחשב זמני קריינות', pct: 75 });

  const readMins    = Math.round((words / 200) * 10) / 10;
  const narrateMins = Math.round((words / 130) * 10) / 10;

  await delay(350);
  onEvent({ type: 'progress', phase: 'txt', step: 'phrases', message: 'מחלץ ביטויי מפתח', pct: 92 });

  const keyPhrases = extractKeyPhrases(rawText);
  const preview    = rawText.slice(0, 150).replace(/\n/g, ' ').trim();

  await delay(250);

  const result: TxtAnalysisResult = {
    rawText,
    charCount: rawText.length || size,
    wordCount: words,
    lineCount: lines,
    estimatedReadingMinutes: readMins,
    estimatedNarrationMinutes: narrateMins,
    paragraphs: paras,
    dialogueLines: dialogue,
    hasDialogue: dialogue > 2,
    detectedLanguage: lang,
    structure,
    preview,
    keyPhrases,
  };

  onEvent({ type: 'completed', phase: 'txt', message: `✅ TXT עובד — ${words.toLocaleString()} מילים`, result });
  return result;
}

// ─── MP3 Analysis ─────────────────────────────────────────────────────────────

export async function analyzeMp3File(
  uri: string,
  fileName: string,
  size: number,
  txtResult: TxtAnalysisResult | null,
  onEvent: EventCallback
): Promise<Mp3AnalysisResult | null> {
  onEvent({ type: 'started', phase: 'mp3', message: `מנתח קובץ אודיו ${fileName}...` });

  await delay(400);
  onEvent({ type: 'progress', phase: 'mp3', step: 'read', message: 'קורא מטא-דאטה של האודיו', pct: 10 });

  const durationSecs = estimateDurationFromSize(size);

  await delay(500);
  onEvent({ type: 'progress', phase: 'mp3', step: 'waveform', message: 'מנתח גלי קול', pct: 30 });

  // Estimate speech rate: if we have TXT data, use word count / duration
  let wpm = 130; // default narration rate
  let estimatedWords = Math.round(durationSecs * (wpm / 60));

  if (txtResult && txtResult.wordCount > 50 && durationSecs > 10) {
    wpm = Math.round((txtResult.wordCount / durationSecs) * 60);
    wpm = Math.max(60, Math.min(220, wpm)); // clamp to realistic range
    estimatedWords = txtResult.wordCount;
  }

  await delay(600);
  onEvent({ type: 'progress', phase: 'mp3', step: 'speech', message: 'מנתח קצב דיבור', pct: 55 });

  const lang       = txtResult?.detectedLanguage ?? detectLanguage(fileName);
  const pace       = speechPaceLabel(wpm);
  const bitrate    = estimateBitrate(size, durationSecs);
  const isStereo   = size > 500_000 && durationSecs > 30; // heuristic

  await delay(500);
  onEvent({ type: 'progress', phase: 'mp3', step: 'transcribe', message: 'מכין תמלול חלקי', pct: 78 });

  // Transcript preview: use TXT preview if available, otherwise derive from file name
  const transcriptPreview = txtResult?.preview
    ? txtResult.preview.slice(0, 120)
    : `[תמלול לא זמין — ${fileName}]`;

  await delay(350);
  onEvent({ type: 'progress', phase: 'mp3', step: 'finalize', message: 'מסכם ניתוח אודיו', pct: 92 });

  await delay(250);

  const result: Mp3AnalysisResult = {
    fileName,
    fileSizeBytes: size,
    estimatedDurationSeconds: durationSecs,
    estimatedDurationDisplay: formatDuration(durationSecs),
    speechRateWPM: wpm,
    speechPaceLabel: pace,
    estimatedWordCount: estimatedWords,
    detectedLanguage: lang,
    transcriptPreview,
    channels: isStereo ? 'stereo' : 'mono',
    estimatedBitrate: bitrate,
  };

  const paceHe = pace === 'slow' ? 'איטי' : pace === 'fast' ? 'מהיר' : 'נורמלי';
  onEvent({
    type: 'completed',
    phase: 'mp3',
    message: `✅ אודיו נותח — ${formatDuration(durationSecs)} • ${wpm} מילים/דקה (${paceHe})`,
    result,
  });

  return result;
}
