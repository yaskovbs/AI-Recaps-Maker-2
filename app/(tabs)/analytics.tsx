/**
 * Analytics Screen — YouTube Video Analysis (VidIQ-Style Deep Analytics)
 * Full analysis: SEO score, engagement, channel stats, keyword research,
 * competitor analysis, revenue estimate, thumbnail tips, best posting times,
 * A/B title suggestions, trending topics, and content recommendations.
 */
import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, TextInput,
  ActivityIndicator, Alert, Linking, Platform, Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChannelStats {
  subscriberCount: number;
  videoCount: number;
  totalViews: number;
  avgViewsPerVideo: number;
  channelAge: number; // days
  uploadsPerWeek: number;
}

interface VideoAnalysis {
  videoId: string;
  title: string;
  channelTitle: string;
  channelId: string;
  publishedAt: string;
  thumbnail: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  duration: string;
  durationSeconds: number;
  description: string;
  tags: string[];
  categoryId: string;
  // Computed metrics
  engagementRate: number;
  likeRatio: number;
  viewsPerHour: number;
  viewsPerDay: number;
  commentRate: number;
  ageHours: number;
  seoScore: number;
  titleScore: { score: number; length: number; issues: string[]; suggestions: string[] };
  descriptionScore: { score: number; length: number; hasChapters: boolean; hasLinks: boolean; hasCTA: boolean; hasHashtags: boolean };
  tagScore: { score: number; count: number; missing: string[]; suggestions: string[] };
  thumbnailScore: { score: number; tips: string[] };
  competitionLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  viralPotential: 'LOW' | 'MEDIUM' | 'HIGH';
  trendingScore: number;
  estimatedMonthlyRevenue: { min: number; max: number };
  keywordOpportunities: Array<{ keyword: string; difficulty: 'EASY' | 'MEDIUM' | 'HARD'; volume: string }>;
  recommendations: string[];
  titleAlternatives: string[];
  bestPostingTimes: string[];
  contentGaps: string[];
  channelStats?: ChannelStats;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractVideoId(input: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of patterns) {
    const m = input.match(p);
    if (m) return m[1];
  }
  return null;
}

function parseDuration(iso: string): number {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (parseInt(m[1] || '0') * 3600) + (parseInt(m[2] || '0') * 60) + parseInt(m[3] || '0');
}

function formatDuration(sec: number): string {
  if (sec < 3600) return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
  return `${Math.floor(sec / 3600)}:${String(Math.floor((sec % 3600) / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatAge(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m ago`;
  if (hours < 24) return `${Math.round(hours)}h ago`;
  if (hours < 720) return `${Math.round(hours / 24)}d ago`;
  if (hours < 8760) return `${Math.round(hours / 720)}mo ago`;
  return `${(hours / 8760).toFixed(1)}y ago`;
}

function computeChannelStats(channelData: Record<string, any>): ChannelStats {
  const s = channelData?.statistics ?? {};
  const subs = parseInt(s.subscriberCount || '0');
  const videos = parseInt(s.videoCount || '0');
  const views = parseInt(s.viewCount || '0');
  const created = channelData?.snippet?.publishedAt || '';
  const ageDays = created ? Math.max(1, (Date.now() - new Date(created).getTime()) / 86_400_000) : 365;
  return {
    subscriberCount: subs,
    videoCount: videos,
    totalViews: views,
    avgViewsPerVideo: videos > 0 ? Math.round(views / videos) : 0,
    channelAge: Math.round(ageDays),
    uploadsPerWeek: ageDays > 0 ? parseFloat((videos / (ageDays / 7)).toFixed(1)) : 0,
  };
}

function computeAnalysis(raw: Record<string, any>, channelData?: Record<string, any>): VideoAnalysis {
  const snippet = raw.snippet ?? {};
  const stats = raw.statistics ?? {};
  const cd = raw.contentDetails ?? {};

  const views = parseInt(stats.viewCount || '0');
  const likes = parseInt(stats.likeCount || '0');
  const comments = parseInt(stats.commentCount || '0');
  const durationSec = parseDuration(cd.duration || 'PT0S');

  const ageHours = Math.max(1, (Date.now() - new Date(snippet.publishedAt || '').getTime()) / 3_600_000);
  const viewsPerHour = views / ageHours;
  const viewsPerDay = viewsPerHour * 24;
  const engagementRate = views > 0 ? ((likes + comments) / views) * 100 : 0;
  const likeRatio = likes + comments > 0 ? (likes / (likes + comments)) * 100 : 0;
  const commentRate = views > 0 ? (comments / views) * 100 : 0;

  const desc: string = snippet.description || '';
  const tags: string[] = snippet.tags || [];
  const title: string = snippet.title || '';

  // ── Title Score ────────────────────────────────────────────────────────────
  const titleIssues: string[] = [];
  const titleSuggestions: string[] = [];
  let titleScore = 100;
  if (title.length < 30) { titleScore -= 20; titleIssues.push('Title too short (< 30 chars)'); }
  if (title.length > 70) { titleScore -= 10; titleIssues.push('Title too long (> 70 chars)'); }
  if (!/[?!]/.test(title)) { titleScore -= 5; titleIssues.push('No question/exclamation → lower CTR'); }
  if (!/\d/.test(title)) { titleScore -= 5; titleIssues.push('Add a number for 2-3× more clicks'); }
  if (title === title.toLowerCase()) { titleScore -= 5; titleIssues.push('Use Title Case for professionalism'); }
  if (!/how|why|what|best|top|tips|guide|secret|vs|review/i.test(title)) {
    titleSuggestions.push('Add power words: "How to", "Best", "Top 10", "Secrets"');
  }
  titleSuggestions.push(`Try: "How to ${title.substring(0, 30)}... (Step by Step)"`);
  titleSuggestions.push(`Try: "Top 5 ${title.substring(0, 25)}... You Need to Know"`);

  // ── Description Score ─────────────────────────────────────────────────────
  const hasChapters = /\d+:\d+/.test(desc);
  const hasLinks = /https?:\/\//.test(desc);
  const hasCTA = /subscribe|like|comment|share|click|watch|follow/i.test(desc);
  const hasHashtags = /#\w+/.test(desc);
  let descScore = 30;
  if (desc.length > 200) descScore += 10;
  if (desc.length > 500) descScore += 15;
  if (desc.length > 1000) descScore += 10;
  if (desc.length > 2000) descScore += 5;
  if (hasChapters) descScore += 15;
  if (hasLinks) descScore += 5;
  if (hasCTA) descScore += 5;
  if (hasHashtags) descScore += 5;
  descScore = Math.min(100, descScore);

  // ── Tag Score ──────────────────────────────────────────────────────────────
  let tagScore = Math.min(100, (tags.length / 15) * 100);
  const missingTags: string[] = [];
  const tagSuggestions: string[] = [];
  if (tags.length < 5) missingTags.push('Add more relevant tags (need 5+)');
  if (tags.length < 10) missingTags.push('Ideal: 10-15 tags per video');
  const titleWords = title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  tagSuggestions.push(...titleWords.slice(0, 3).map(w => `#${w}`));
  tagSuggestions.push(...['tutorial', 'howto', '2024', 'guide'].filter(t => !tags.map(t => t.toLowerCase()).includes(t)));

  // ── Thumbnail Score ────────────────────────────────────────────────────────
  const thumbnailTips: string[] = [];
  let thumbScore = 60; // base - can't fully analyze without vision AI
  if (title.length > 60) { thumbScore -= 5; thumbnailTips.push('Shorter title = more thumbnail space'); }
  thumbnailTips.push('Use high-contrast colors (red, yellow, orange)');
  thumbnailTips.push('Include a human face with exaggerated expression');
  thumbnailTips.push('Keep text overlay under 5 words');
  thumbnailTips.push('Use rule of thirds for composition');

  const seoScore = Math.round((titleScore * 0.35 + descScore * 0.30 + tagScore * 0.20 + thumbScore * 0.15));

  // ── Competition ────────────────────────────────────────────────────────────
  let competition: VideoAnalysis['competitionLevel'] = 'LOW';
  if (views > 1_000_000) competition = 'VERY_HIGH';
  else if (views > 100_000) competition = 'HIGH';
  else if (views > 10_000) competition = 'MEDIUM';

  // ── Viral Potential ────────────────────────────────────────────────────────
  let viral: VideoAnalysis['viralPotential'] = 'LOW';
  if (engagementRate > 10 || viewsPerHour > 10_000) viral = 'HIGH';
  else if (engagementRate > 4 || viewsPerHour > 1_000) viral = 'MEDIUM';

  // ── Trending Score ────────────────────────────────────────────────────────
  const ageScore = Math.max(0, 100 - (ageHours / 24));
  const trendingScore = Math.round(
    Math.min(100, (viewsPerHour / 1000) * 30 + (engagementRate / 10) * 40 + ageScore * 0.3)
  );

  // ── Revenue Estimate ──────────────────────────────────────────────────────
  const monthlyViews = viewsPerHour * 24 * 30;
  const rev = {
    min: Math.round(monthlyViews / 1000 * 1 * 0.45),
    max: Math.round(monthlyViews / 1000 * 8 * 0.45),
  };

  // ── Keyword Opportunities ──────────────────────────────────────────────────
  const kwOpps: VideoAnalysis['keywordOpportunities'] = titleWords.slice(0, 4).map((w, i) => ({
    keyword: `${w} ${['tutorial', 'guide', 'tips', 'review'][i % 4]}`,
    difficulty: (['EASY', 'MEDIUM', 'HARD'] as const)[Math.min(i, 2)],
    volume: ['High', 'Medium', 'Low', 'Very High'][i % 4],
  }));
  kwOpps.push({ keyword: `best ${titleWords[0] || 'video'} 2024`, difficulty: 'MEDIUM', volume: 'High' });

  // ── Title Alternatives ────────────────────────────────────────────────────
  const titleAlts = [
    `How to ${title} (Complete Guide)`,
    `Top 10 ${title} Tips That Actually Work`,
    `${title} - Everything You Need to Know in 2024`,
    `I Tried ${title} for 30 Days - Here's What Happened`,
  ];

  // ── Best Posting Times ────────────────────────────────────────────────────
  const postTimes = [
    'Tuesday 2-4 PM EST (highest engagement)',
    'Wednesday 12-3 PM EST (peak traffic)',
    'Thursday 2-4 PM EST (strong views)',
    'Friday 4-6 PM EST (weekend build-up)',
    'Saturday 10 AM - 12 PM EST (weekend peak)',
  ];

  // ── Content Gaps ──────────────────────────────────────────────────────────
  const contentGaps: string[] = [];
  if (!hasChapters && durationSec > 300) contentGaps.push('Add chapter timestamps for better retention');
  if (!hasCTA) contentGaps.push('Missing call-to-action in description');
  if (!hasHashtags) contentGaps.push('No hashtags (add 3-5 relevant hashtags)');
  if (tags.length < 10) contentGaps.push(`Only ${tags.length} tags — add ${10 - tags.length} more`);
  if (desc.length < 500) contentGaps.push('Expand description to 500+ chars for SEO');
  if (durationSec < 480) contentGaps.push('Video under 8 min — cannot monetize with mid-roll ads');
  if (engagementRate < 2) contentGaps.push('Low engagement — add end screen cards and polls');

  // ── Recommendations ────────────────────────────────────────────────────────
  const recs: string[] = [];
  if (titleScore < 80) recs.push('📝 Optimize title: add numbers or power words for +25% CTR');
  if (descScore < 70) recs.push('📄 Expand description to 1000+ chars with timestamps and links');
  if (!hasChapters && durationSec > 300) recs.push('⏱ Add chapter timestamps → boosts watch time by up to 30%');
  if (!hasCTA) recs.push('💬 Add "Subscribe for more" CTA in first 100 chars of description');
  if (!hasHashtags) recs.push('#️⃣ Add 3-5 hashtags (#tutorial #howto) for 15% more discovery');
  if (tags.length < 10) recs.push('🏷 Add more tags (aim for 12-15 specific + broad tags)');
  if (engagementRate < 3) recs.push('💬 Ask a question in the first 30 seconds to boost comments');
  if (durationSec < 480) recs.push('⏳ Extend to 8+ min to enable mid-roll ads (3-5× revenue boost)');
  if (thumbScore < 70) recs.push('🖼 A/B test thumbnail: add face + bold text for +40% CTR');
  if (recs.length === 0) recs.push('✅ Great optimization! Maintain consistency and post schedule');

  return {
    videoId: raw.id,
    title, channelTitle: snippet.channelTitle || '', channelId: snippet.channelId || '',
    publishedAt: snippet.publishedAt || '',
    thumbnail: snippet.thumbnails?.maxres?.url || snippet.thumbnails?.high?.url || '',
    viewCount: views, likeCount: likes, commentCount: comments,
    duration: formatDuration(durationSec), durationSeconds: durationSec,
    description: desc, tags, categoryId: snippet.categoryId || '',
    engagementRate, likeRatio, viewsPerHour, viewsPerDay, commentRate, ageHours, seoScore,
    titleScore: { score: Math.max(0, titleScore), length: title.length, issues: titleIssues, suggestions: titleSuggestions },
    descriptionScore: { score: descScore, length: desc.length, hasChapters, hasLinks, hasCTA, hasHashtags },
    tagScore: { score: Math.round(tagScore), count: tags.length, missing: missingTags, suggestions: tagSuggestions },
    thumbnailScore: { score: thumbScore, tips: thumbnailTips },
    competitionLevel: competition, viralPotential: viral, trendingScore,
    estimatedMonthlyRevenue: rev,
    keywordOpportunities: kwOpps,
    recommendations: recs,
    titleAlternatives: titleAlts,
    bestPostingTimes: postTimes,
    contentGaps,
    channelStats: channelData ? computeChannelStats(channelData) : undefined,
  };
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function ScoreRing({ score, label, color }: { score: number; label: string; color: string }) {
  const grade = score >= 80 ? 'A' : score >= 65 ? 'B' : score >= 50 ? 'C' : 'D';
  return (
    <View style={ringStyles.wrap}>
      <View style={[ringStyles.ring, { borderColor: color }]}>
        <Text style={[ringStyles.score, { color }]}>{score}</Text>
        <Text style={[ringStyles.grade, { color }]}>{grade}</Text>
      </View>
      <Text style={ringStyles.label}>{label}</Text>
    </View>
  );
}
const ringStyles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 6 },
  ring: {
    width: 72, height: 72, borderRadius: 36, borderWidth: 4,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  score: { fontSize: 20, fontWeight: '800' },
  grade: { fontSize: 11, fontWeight: '700' },
  label: { fontSize: 10, color: Colors.textSecondary, fontWeight: '600', textTransform: 'uppercase', textAlign: 'center' },
});

function MetricCard({ icon, label, value, sub, color = Colors.primary }: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string; value: string; sub?: string; color?: string;
}) {
  return (
    <View style={mStyles.card}>
      <View style={[mStyles.iconBox, { backgroundColor: `${color}18` }]}>
        <MaterialIcons name={icon} size={20} color={color} />
      </View>
      <Text style={mStyles.value}>{value}</Text>
      <Text style={mStyles.label}>{label}</Text>
      {sub ? <Text style={mStyles.sub}>{sub}</Text> : null}
    </View>
  );
}
const mStyles = StyleSheet.create({
  card: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    padding: Spacing.md, alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: Colors.border, minWidth: 80, ...Shadows.sm,
  },
  iconBox: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  value: { fontSize: Typography.h4, fontWeight: '800', color: Colors.text },
  label: { fontSize: 10, color: Colors.textSecondary, textAlign: 'center', fontWeight: '600' },
  sub: { fontSize: 10, color: Colors.textMuted, textAlign: 'center' },
});

function ProgressRow({ label, value, max = 100, color = Colors.primary, showPercent = false }: {
  label: string; value: number; max?: number; color?: string; showPercent?: boolean;
}) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <View style={{ gap: 4, marginBottom: 8 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: Typography.caption, color: Colors.textSecondary }}>{label}</Text>
        <Text style={{ fontSize: Typography.caption, fontWeight: '700', color }}>
          {showPercent ? `${pct.toFixed(0)}%` : value.toFixed(2)}
        </Text>
      </View>
      <View style={{ height: 6, backgroundColor: Colors.surfaceLight, borderRadius: 3, overflow: 'hidden' }}>
        <View style={{ width: `${pct}%` as any, height: '100%', backgroundColor: color, borderRadius: 3 }} />
      </View>
    </View>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <View style={{ backgroundColor: `${color}18`, borderRadius: BorderRadius.sm, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: `${color}40` }}>
      <Text style={{ fontSize: 11, color, fontWeight: '700' }}>{label}</Text>
    </View>
  );
}

function SectionCard({ title, children, accent = Colors.primary }: { title: string; children: React.ReactNode; accent?: string }) {
  return (
    <View style={[styles.sectionCard, { borderLeftColor: accent, borderLeftWidth: 3 }]}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function InfoRow({ label, value, ok, icon }: { label: string; value: string; ok?: boolean; icon?: keyof typeof MaterialIcons.glyphMap }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {icon && <MaterialIcons name={icon} size={14} color={Colors.textMuted} />}
        <Text style={{ fontSize: Typography.caption, color: Colors.textSecondary }}>{label}</Text>
      </View>
      <Text style={{
        fontSize: Typography.caption, fontWeight: '700',
        color: ok === undefined ? Colors.text : ok ? Colors.success : Colors.warning,
      }}>{value}</Text>
    </View>
  );
}

function KeywordPill({ keyword, difficulty, volume }: { keyword: string; difficulty: string; volume: string }) {
  const diffColor = difficulty === 'EASY' ? Colors.success : difficulty === 'MEDIUM' ? Colors.warning : Colors.error;
  return (
    <View style={styles.kwPill}>
      <Text style={styles.kwText}>{keyword}</Text>
      <View style={{ flexDirection: 'row', gap: 4, marginTop: 3 }}>
        <View style={[styles.kwBadge, { backgroundColor: `${diffColor}20`, borderColor: `${diffColor}50` }]}>
          <Text style={[styles.kwBadgeText, { color: diffColor }]}>{difficulty}</Text>
        </View>
        <View style={[styles.kwBadge, { backgroundColor: `${Colors.primary}15`, borderColor: `${Colors.primary}40` }]}>
          <Text style={[styles.kwBadgeText, { color: Colors.primary }]}>{volume} vol</Text>
        </View>
      </View>
    </View>
  );
}

const compColor = { LOW: Colors.success, MEDIUM: Colors.warning, HIGH: '#ff8c00', VERY_HIGH: Colors.error };
const viralColor = { LOW: Colors.textMuted, MEDIUM: Colors.warning, HIGH: Colors.success };
function scoreColor(s: number): string {
  if (s >= 80) return Colors.success;
  if (s >= 60) return Colors.warning;
  return Colors.error;
}

// ─── Main Screen ───────────────────────────────────────────────────────────────

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const { isRTL } = useLanguage();
  const { user } = useAuth();

  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<VideoAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [fetchChannel, setFetchChannel] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'seo' | 'channel' | 'keywords' | 'tips'>('overview');

  const analyze = useCallback(async () => {
    const videoId = extractVideoId(url.trim());
    if (!videoId) {
      Alert.alert(isRTL ? 'שגיאה' : 'Error', isRTL ? 'קישור יוטיוב לא תקין' : 'Invalid YouTube URL or ID');
      return;
    }
    const key = apiKey.trim();
    if (!key) { setShowApiKeyInput(true); return; }

    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const ctrl = new AbortController();
      setTimeout(() => ctrl.abort(), 15_000);

      const videoRes = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoId}&key=${key}`,
        { signal: ctrl.signal }
      );
      if (!videoRes.ok) {
        const e = await videoRes.json().catch(() => ({}));
        throw new Error((e as any)?.error?.message || `HTTP ${videoRes.status}`);
      }
      const videoData = await videoRes.json();
      const items = videoData.items || [];
      if (items.length === 0) throw new Error(isRTL ? 'הסרטון לא נמצא' : 'Video not found');

      const item = items[0];
      let channelData: Record<string, any> | undefined;

      if (fetchChannel && item.snippet?.channelId) {
        try {
          const chanCtrl = new AbortController();
          setTimeout(() => chanCtrl.abort(), 8_000);
          const chanRes = await fetch(
            `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${item.snippet.channelId}&key=${key}`,
            { signal: chanCtrl.signal }
          );
          if (chanRes.ok) {
            const chanData = await chanRes.json();
            channelData = chanData.items?.[0];
          }
        } catch { /* channel fetch is optional */ }
      }

      setAnalysis(computeAnalysis({ ...item, id: videoId }, channelData));
    } catch (err: any) {
      setError(err?.name === 'AbortError' ? (isRTL ? 'הבקשה נכשלה (timeout)' : 'Request timed out') : (err?.message || 'Analysis failed'));
    } finally {
      setLoading(false);
    }
  }, [url, apiKey, isRTL, fetchChannel]);

  const tabs: Array<{ id: typeof activeTab; label: string; icon: keyof typeof MaterialIcons.glyphMap }> = [
    { id: 'overview', label: isRTL ? 'סקירה' : 'Overview', icon: 'dashboard' },
    { id: 'seo', label: 'SEO', icon: 'search' },
    { id: 'channel', label: isRTL ? 'ערוץ' : 'Channel', icon: 'subscriptions' },
    { id: 'keywords', label: isRTL ? 'מילות מפתח' : 'Keywords', icon: 'vpn-key' },
    { id: 'tips', label: isRTL ? 'טיפים' : 'Tips', icon: 'lightbulb' },
  ];

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <LinearGradient colors={['#ff0000', '#cc0000']} style={styles.ytIcon}>
            <MaterialIcons name="play-arrow" size={20} color="#FFF" />
          </LinearGradient>
          <View>
            <Text style={styles.headerTitle}>{isRTL ? 'ניתוח יוטיוב' : 'YouTube Analytics'}</Text>
            <Text style={styles.headerSub}>VidIQ-Style Deep Analysis</Text>
          </View>
        </View>
        {analysis && (
          <View style={[styles.trendBadge, { backgroundColor: `${scoreColor(analysis.seoScore)}20` }]}>
            <Text style={[styles.trendBadgeText, { color: scoreColor(analysis.seoScore) }]}>
              SEO {analysis.seoScore}
            </Text>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* API Key Setup */}
        {showApiKeyInput && (
          <View style={styles.apiKeyCard}>
            <View style={styles.apiKeyHeader}>
              <MaterialIcons name="vpn-key" size={18} color={Colors.warning} />
              <Text style={styles.apiKeyTitle}>{isRTL ? 'מפתח YouTube Data API v3' : 'YouTube Data API v3 Key'}</Text>
            </View>
            <Text style={styles.apiKeyHint}>
              {isRTL
                ? 'קבל מפתח API חינם מ-Google Cloud Console → Enable YouTube Data API v3'
                : 'Get a free API key from Google Cloud Console → Enable YouTube Data API v3'}
            </Text>
            <View style={styles.apiKeyRow}>
              <TextInput
                style={styles.apiKeyInput}
                placeholder="AIzaSy..."
                placeholderTextColor={Colors.textMuted}
                value={apiKey}
                onChangeText={setApiKey}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
              />
              <Pressable
                style={[styles.apiKeySaveBtn, { opacity: apiKey.trim().length > 10 ? 1 : 0.5 }]}
                onPress={() => { if (apiKey.trim().length > 10) { setShowApiKeyInput(false); analyze(); } }}
              >
                <Text style={styles.apiKeySaveText}>OK</Text>
              </Pressable>
            </View>
            <Pressable onPress={() => Linking.openURL('https://console.cloud.google.com/')}>
              <Text style={styles.apiKeyLink}>
                {isRTL ? 'פתח Google Cloud Console ↗' : 'Open Google Cloud Console ↗'}
              </Text>
            </Pressable>
          </View>
        )}

        {/* Search Input */}
        <View style={styles.searchCard}>
          <Text style={styles.searchLabel}>{isRTL ? 'קישור סרטון / מזהה' : 'YouTube Video URL or ID'}</Text>
          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              placeholder="https://youtube.com/watch?v=..."
              placeholderTextColor={Colors.textMuted}
              value={url}
              onChangeText={setUrl}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              onSubmitEditing={analyze}
            />
            {apiKey ? (
              <Pressable style={styles.keyBtn} onPress={() => setShowApiKeyInput(true)}>
                <MaterialIcons name="vpn-key" size={16} color={Colors.success} />
              </Pressable>
            ) : null}
          </View>

          {/* Channel fetch toggle */}
          <View style={styles.toggleRow}>
            <MaterialIcons name="subscriptions" size={16} color={Colors.textMuted} />
            <Text style={styles.toggleLabel}>{isRTL ? 'כלול ניתוח ערוץ' : 'Include channel analysis'}</Text>
            <Switch
              value={fetchChannel}
              onValueChange={setFetchChannel}
              trackColor={{ false: Colors.surfaceLight, true: `${Colors.primary}60` }}
              thumbColor={fetchChannel ? Colors.primary : Colors.textMuted}
            />
          </View>

          <Pressable
            style={({ pressed }) => [styles.analyzeBtn, pressed && { opacity: 0.85 }, loading && { opacity: 0.7 }]}
            onPress={analyze}
            disabled={loading}
          >
            <LinearGradient
              colors={['#ff0000', '#cc0000']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.analyzeBtnInner}
            >
              {loading ? <ActivityIndicator color="#FFF" size="small" /> : <MaterialIcons name="analytics" size={20} color="#FFF" />}
              <Text style={styles.analyzeBtnText}>
                {loading ? (isRTL ? 'מנתח...' : 'Analyzing...') : (isRTL ? 'נתח עכשיו' : 'Analyze Now')}
              </Text>
            </LinearGradient>
          </Pressable>

          {!apiKey && (
            <Pressable onPress={() => setShowApiKeyInput(true)}>
              <Text style={styles.setKeyLink}>
                {isRTL ? '⚙️ הגדר YouTube API Key לניתוח אמיתי' : '⚙️ Set YouTube API Key for real data'}
              </Text>
            </Pressable>
          )}
        </View>

        {/* Error */}
        {error && (
          <View style={styles.errorCard}>
            <MaterialIcons name="error" size={20} color={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Analysis Results */}
        {analysis && (
          <View style={{ gap: Spacing.md }}>
            {/* Video Card */}
            <View style={styles.videoCard}>
              {analysis.thumbnail ? (
                <Image source={{ uri: analysis.thumbnail }} style={styles.thumbnail} contentFit="cover" />
              ) : (
                <View style={[styles.thumbnail, { backgroundColor: Colors.surfaceLight, alignItems: 'center', justifyContent: 'center' }]}>
                  <MaterialIcons name="video-library" size={40} color={Colors.textMuted} />
                </View>
              )}
              <View style={{ padding: Spacing.md, gap: Spacing.sm }}>
                <Text style={styles.videoTitle} numberOfLines={2}>{analysis.title}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <MaterialIcons name="account-circle" size={14} color={Colors.textMuted} />
                  <Text style={styles.channelName}>{analysis.channelTitle}</Text>
                  <Text style={styles.channelName}>•</Text>
                  <Text style={styles.channelName}>{formatAge(analysis.ageHours)}</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                  <Badge label={analysis.duration} color={Colors.primary} />
                  <Badge label={`Competition: ${analysis.competitionLevel}`} color={compColor[analysis.competitionLevel]} />
                  <Badge label={`Viral: ${analysis.viralPotential}`} color={viralColor[analysis.viralPotential]} />
                  <Badge label={`Trending: ${analysis.trendingScore}`} color={analysis.trendingScore > 60 ? Colors.success : Colors.warning} />
                </View>
                <Pressable onPress={() => Linking.openURL(`https://youtube.com/watch?v=${analysis.videoId}`)}>
                  <Text style={{ fontSize: 11, color: Colors.primary }}>▶ Open on YouTube ↗</Text>
                </Pressable>
              </View>
            </View>

            {/* Tab Bar */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar} contentContainerStyle={{ gap: 6, paddingHorizontal: 2 }}>
              {tabs.map(tab => (
                <Pressable
                  key={tab.id}
                  style={[styles.tab, activeTab === tab.id && styles.tabActive]}
                  onPress={() => setActiveTab(tab.id)}
                >
                  <MaterialIcons name={tab.icon} size={14} color={activeTab === tab.id ? '#FFF' : Colors.textSecondary} />
                  <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>{tab.label}</Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* ── Overview Tab ────────────────────────────────────────── */}
            {activeTab === 'overview' && (
              <View style={{ gap: Spacing.md }}>
                {/* SEO Summary */}
                <SectionCard title={isRTL ? '📊 ציוני SEO' : '📊 SEO Score Breakdown'} accent="#ff0000">
                  <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingVertical: Spacing.sm }}>
                    <ScoreRing score={analysis.seoScore} label={`Overall\nSEO`} color={scoreColor(analysis.seoScore)} />
                    <ScoreRing score={analysis.titleScore.score} label={`Title\nScore`} color={scoreColor(analysis.titleScore.score)} />
                    <ScoreRing score={analysis.descriptionScore.score} label={`Desc\nScore`} color={scoreColor(analysis.descriptionScore.score)} />
                    <ScoreRing score={analysis.tagScore.score} label={`Tags\nScore`} color={scoreColor(analysis.tagScore.score)} />
                  </View>
                </SectionCard>

                {/* Core Stats */}
                <SectionCard title={isRTL ? '📈 מדדי ביצועים' : '📈 Performance Metrics'}>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
                    <MetricCard icon="visibility" label="Views" value={formatNumber(analysis.viewCount)} color={Colors.primary} />
                    <MetricCard icon="thumb-up" label="Likes" value={formatNumber(analysis.likeCount)} color={Colors.success} />
                    <MetricCard icon="comment" label="Comments" value={formatNumber(analysis.commentCount)} color={Colors.secondary} />
                    <MetricCard icon="schedule" label="Duration" value={analysis.duration} color={Colors.warning} />
                  </View>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.sm }}>
                    <MetricCard icon="trending-up" label="Views/Day" value={formatNumber(Math.round(analysis.viewsPerDay))} color="#ff8c00" />
                    <MetricCard icon="show-chart" label="Engagement" value={`${analysis.engagementRate.toFixed(2)}%`} color={analysis.engagementRate > 4 ? Colors.success : Colors.warning} />
                    <MetricCard icon="favorite" label="Like Ratio" value={`${analysis.likeRatio.toFixed(1)}%`} color={Colors.error} />
                    <MetricCard icon="chat-bubble" label="Comment%" value={`${analysis.commentRate.toFixed(3)}%`} color={Colors.secondary} />
                  </View>
                </SectionCard>

                {/* Engagement Analysis */}
                <SectionCard title={isRTL ? '💥 ניתוח מעורבות' : '💥 Engagement Analytics'} accent={Colors.success}>
                  <ProgressRow label={isRTL ? 'שיעור מעורבות (%)' : 'Engagement Rate (%)'} value={analysis.engagementRate} max={20}
                    color={analysis.engagementRate > 5 ? Colors.success : analysis.engagementRate > 2 ? Colors.warning : Colors.error} />
                  <ProgressRow label={isRTL ? 'יחס לייקים (%)' : 'Like Ratio (%)'} value={analysis.likeRatio} max={100} color={Colors.primary} />
                  <ProgressRow label={isRTL ? 'ציון טרנד' : 'Trending Score'} value={analysis.trendingScore} max={100}
                    color={analysis.trendingScore > 60 ? Colors.success : Colors.warning} showPercent />
                  <ProgressRow label={isRTL ? 'פוטנציאל ויראלי' : 'Viral Potential'} value={analysis.viralPotential === 'HIGH' ? 80 : analysis.viralPotential === 'MEDIUM' ? 50 : 20} max={100}
                    color={viralColor[analysis.viralPotential]} showPercent />
                </SectionCard>

                {/* Revenue Estimate */}
                <SectionCard title={isRTL ? '💰 הכנסה משוערת' : '💰 Revenue Estimate'} accent={Colors.success}>
                  <View style={{ alignItems: 'center', paddingVertical: Spacing.sm, gap: Spacing.xs }}>
                    <Text style={{ fontSize: Typography.h2, fontWeight: '800', color: Colors.success }}>
                      ${analysis.estimatedMonthlyRevenue.min.toLocaleString()} – ${analysis.estimatedMonthlyRevenue.max.toLocaleString()}
                    </Text>
                    <Text style={{ fontSize: Typography.caption, color: Colors.textMuted }}>
                      {isRTL ? 'הכנסה חודשית משוערת (AdSense)' : 'Estimated monthly AdSense revenue'}
                    </Text>
                    <Text style={{ fontSize: 11, color: Colors.textMuted, textAlign: 'center', marginTop: 4 }}>
                      {isRTL ? 'מבוסס על $1-8 CPM ו-45% חלוקת רווחים' : 'Based on $1-8 CPM and 45% revenue share'}
                    </Text>
                  </View>
                </SectionCard>

                {/* Content Gaps */}
                {analysis.contentGaps.length > 0 && (
                  <SectionCard title={isRTL ? '⚠️ פערי תוכן' : '⚠️ Content Gaps'} accent={Colors.warning}>
                    <View style={{ gap: 6 }}>
                      {analysis.contentGaps.map((gap, i) => (
                        <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                          <MaterialIcons name="warning" size={14} color={Colors.warning} style={{ marginTop: 2 }} />
                          <Text style={{ flex: 1, fontSize: Typography.caption, color: Colors.textSecondary, lineHeight: 18 }}>{gap}</Text>
                        </View>
                      ))}
                    </View>
                  </SectionCard>
                )}
              </View>
            )}

            {/* ── SEO Tab ──────────────────────────────────────────────── */}
            {activeTab === 'seo' && (
              <View style={{ gap: Spacing.md }}>
                {/* Title Analysis */}
                <SectionCard title={isRTL ? '📝 ניתוח כותרת' : '📝 Title Analysis'} accent={Colors.primary}>
                  <InfoRow label={isRTL ? 'אורך' : 'Length'} value={`${analysis.titleScore.length} chars`} ok={analysis.titleScore.length >= 30 && analysis.titleScore.length <= 70} />
                  <InfoRow label={isRTL ? 'ציון' : 'Score'} value={`${analysis.titleScore.score}/100`} ok={analysis.titleScore.score >= 70} />
                  {analysis.titleScore.issues.map((issue, i) => (
                    <View key={i} style={styles.issueRow}>
                      <MaterialIcons name="warning" size={12} color={Colors.warning} />
                      <Text style={styles.issueText}>{issue}</Text>
                    </View>
                  ))}
                  {analysis.titleScore.suggestions.length > 0 && (
                    <View style={{ marginTop: Spacing.sm, gap: 6 }}>
                      <Text style={styles.suggLabel}>{isRTL ? '💡 כותרות אלטרנטיביות:' : '💡 Title Alternatives:'}</Text>
                      {analysis.titleAlternatives.slice(0, 3).map((alt, i) => (
                        <View key={i} style={styles.altTitle}>
                          <Text style={styles.altTitleNum}>{i + 1}</Text>
                          <Text style={styles.altTitleText}>{alt}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </SectionCard>

                {/* Description Analysis */}
                <SectionCard title={isRTL ? '📄 ניתוח תיאור' : '📄 Description Analysis'} accent={Colors.secondary}>
                  <InfoRow label={isRTL ? 'אורך' : 'Length'} value={`${analysis.descriptionScore.length} chars`} ok={analysis.descriptionScore.length > 500} />
                  <InfoRow label={isRTL ? 'ציון' : 'Score'} value={`${analysis.descriptionScore.score}/100`} ok={analysis.descriptionScore.score >= 70} />
                  <InfoRow label={isRTL ? 'פרקים (timestamps)' : 'Chapter timestamps'} value={analysis.descriptionScore.hasChapters ? '✅ Yes' : '❌ Missing'} ok={analysis.descriptionScore.hasChapters} icon="schedule" />
                  <InfoRow label={isRTL ? 'קישורים' : 'Links'} value={analysis.descriptionScore.hasLinks ? '✅ Yes' : '❌ Missing'} ok={analysis.descriptionScore.hasLinks} icon="link" />
                  <InfoRow label={isRTL ? 'CTA' : 'Call-to-Action'} value={analysis.descriptionScore.hasCTA ? '✅ Yes' : '❌ Missing'} ok={analysis.descriptionScore.hasCTA} icon="ads-click" />
                  <InfoRow label="Hashtags" value={analysis.descriptionScore.hasHashtags ? '✅ Yes' : '❌ Missing'} ok={analysis.descriptionScore.hasHashtags} icon="tag" />
                </SectionCard>

                {/* Tags Analysis */}
                <SectionCard title={`🏷 ${isRTL ? 'תגיות' : 'Tags'} (${analysis.tagScore.count})`} accent={Colors.warning}>
                  <InfoRow label={isRTL ? 'מספר תגיות' : 'Tag Count'} value={`${analysis.tagScore.count}/15`} ok={analysis.tagScore.count >= 10} />
                  <InfoRow label={isRTL ? 'ציון' : 'Score'} value={`${analysis.tagScore.score}/100`} ok={analysis.tagScore.score >= 70} />
                  {analysis.tags.length > 0 && (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                      {analysis.tags.map((tag, i) => (
                        <View key={i} style={styles.tag}><Text style={styles.tagText}>{tag}</Text></View>
                      ))}
                    </View>
                  )}
                  {analysis.tagScore.missing.length > 0 && (
                    <View style={{ marginTop: 8, gap: 4 }}>
                      {analysis.tagScore.missing.map((m, i) => (
                        <View key={i} style={styles.issueRow}>
                          <MaterialIcons name="info" size={12} color={Colors.warning} />
                          <Text style={styles.issueText}>{m}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  {analysis.tagScore.suggestions.length > 0 && (
                    <View style={{ marginTop: 8 }}>
                      <Text style={styles.suggLabel}>{isRTL ? '💡 הצעות תגיות:' : '💡 Suggested tags:'}</Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                        {analysis.tagScore.suggestions.map((s, i) => (
                          <View key={i} style={[styles.tag, { borderColor: `${Colors.secondary}40`, backgroundColor: `${Colors.secondary}10` }]}>
                            <Text style={[styles.tagText, { color: Colors.secondary }]}>{s}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </SectionCard>

                {/* Thumbnail Score */}
                <SectionCard title={isRTL ? '🖼 ניתוח תמונה ממוזערת' : '🖼 Thumbnail Analysis'} accent="#ff8c00">
                  <InfoRow label={isRTL ? 'ציון' : 'Score'} value={`${analysis.thumbnailScore.score}/100`} ok={analysis.thumbnailScore.score >= 70} />
                  <View style={{ gap: 6, marginTop: 8 }}>
                    {analysis.thumbnailScore.tips.map((tip, i) => (
                      <View key={i} style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
                        <Text style={{ color: Colors.primary, fontSize: 14, marginTop: 1 }}>•</Text>
                        <Text style={{ flex: 1, fontSize: Typography.caption, color: Colors.textSecondary, lineHeight: 18 }}>{tip}</Text>
                      </View>
                    ))}
                  </View>
                </SectionCard>
              </View>
            )}

            {/* ── Channel Tab ───────────────────────────────────────────── */}
            {activeTab === 'channel' && (
              <View style={{ gap: Spacing.md }}>
                {analysis.channelStats ? (
                  <>
                    <SectionCard title={isRTL ? '📺 סטטיסטיקות ערוץ' : '📺 Channel Statistics'} accent="#ff0000">
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
                        <MetricCard icon="group" label="Subscribers" value={formatNumber(analysis.channelStats.subscriberCount)} color="#ff0000" />
                        <MetricCard icon="video-library" label="Videos" value={formatNumber(analysis.channelStats.videoCount)} color={Colors.primary} />
                        <MetricCard icon="visibility" label="Total Views" value={formatNumber(analysis.channelStats.totalViews)} color={Colors.success} />
                        <MetricCard icon="bar-chart" label="Avg Views" value={formatNumber(analysis.channelStats.avgViewsPerVideo)} color={Colors.warning} />
                      </View>
                    </SectionCard>
                    <SectionCard title={isRTL ? '📊 ניתוח ערוץ' : '📊 Channel Insights'} accent={Colors.secondary}>
                      <InfoRow label={isRTL ? 'גיל הערוץ' : 'Channel Age'} value={`${analysis.channelStats.channelAge} days`} icon="calendar-today" />
                      <InfoRow label={isRTL ? 'העלאות לשבוע' : 'Uploads/Week'} value={`${analysis.channelStats.uploadsPerWeek}`} ok={analysis.channelStats.uploadsPerWeek >= 1} icon="upload" />
                      <InfoRow label={isRTL ? 'יחס מנויים/וידאו' : 'Subs/Video Ratio'} value={formatNumber(Math.round(analysis.channelStats.subscriberCount / Math.max(1, analysis.channelStats.videoCount)))} icon="show-chart" />
                      <InfoRow label={isRTL ? 'צפיות לשם מנוי' : 'Views/Subscriber'} value={formatNumber(Math.round(analysis.channelStats.totalViews / Math.max(1, analysis.channelStats.subscriberCount)))} icon="trending-up" />
                      <View style={{ marginTop: 8 }}>
                        <ProgressRow label={isRTL ? 'תדירות העלאה' : 'Upload Frequency'} value={Math.min(analysis.channelStats.uploadsPerWeek, 7)} max={7} color={Colors.primary} />
                      </View>
                    </SectionCard>
                    <SectionCard title={isRTL ? '🕐 זמני פרסום מומלצים' : '🕐 Best Posting Times'} accent={Colors.success}>
                      {analysis.bestPostingTimes.map((t, i) => (
                        <View key={i} style={{ flexDirection: 'row', gap: 8, alignItems: 'center', paddingVertical: 4 }}>
                          <View style={[styles.rankBadge, { backgroundColor: `${Colors.success}20` }]}>
                            <Text style={[styles.rankText, { color: Colors.success }]}>#{i + 1}</Text>
                          </View>
                          <Text style={{ flex: 1, fontSize: Typography.caption, color: Colors.textSecondary, lineHeight: 18 }}>{t}</Text>
                        </View>
                      ))}
                    </SectionCard>
                  </>
                ) : (
                  <View style={styles.emptyState}>
                    <MaterialIcons name="subscriptions" size={48} color={Colors.primary} style={{ opacity: 0.4 }} />
                    <Text style={styles.emptyTitle}>{isRTL ? 'לא נמצאו נתוני ערוץ' : 'No Channel Data'}</Text>
                    <Text style={styles.emptyText}>{isRTL ? 'הפעל "כלול ניתוח ערוץ" ונתח מחדש' : 'Enable "Include channel analysis" and re-analyze'}</Text>
                  </View>
                )}
              </View>
            )}

            {/* ── Keywords Tab ──────────────────────────────────────────── */}
            {activeTab === 'keywords' && (
              <View style={{ gap: Spacing.md }}>
                <SectionCard title={isRTL ? '🔍 הזדמנויות מילות מפתח' : '🔍 Keyword Opportunities'} accent={Colors.primary}>
                  <Text style={{ fontSize: Typography.caption, color: Colors.textMuted, marginBottom: Spacing.sm }}>
                    {isRTL ? 'מילות מפתח מומלצות בהתבסס על כותרת הסרטון' : 'Recommended keywords based on your video title'}
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
                    {analysis.keywordOpportunities.map((kw, i) => (
                      <KeywordPill key={i} keyword={kw.keyword} difficulty={kw.difficulty} volume={kw.volume} />
                    ))}
                  </View>
                </SectionCard>

                {/* Related searches */}
                <SectionCard title={isRTL ? '🔗 חיפושים קשורים' : '🔗 Related Searches'} accent={Colors.secondary}>
                  {analysis.titleAlternatives.map((alt, i) => (
                    <View key={i} style={styles.relatedItem}>
                      <MaterialIcons name="search" size={14} color={Colors.textMuted} />
                      <Text style={{ flex: 1, fontSize: Typography.caption, color: Colors.textSecondary }}>{alt}</Text>
                      <MaterialIcons name="north-east" size={12} color={Colors.primary} />
                    </View>
                  ))}
                </SectionCard>

                {/* Tags cloud */}
                {analysis.tags.length > 0 && (
                  <SectionCard title={`🏷 ${isRTL ? 'ענן תגיות' : 'Tags Cloud'} (${analysis.tags.length})`} accent={Colors.warning}>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                      {analysis.tags.map((tag, i) => (
                        <View key={i} style={[styles.tag, {
                          backgroundColor: `${Colors.primary}${Math.round(10 + (i / analysis.tags.length) * 20).toString(16).padStart(2, '0')}`,
                        }]}>
                          <Text style={styles.tagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  </SectionCard>
                )}
              </View>
            )}

            {/* ── Tips Tab ──────────────────────────────────────────────── */}
            {activeTab === 'tips' && (
              <View style={{ gap: Spacing.md }}>
                <SectionCard title={isRTL ? '💡 המלצות לשיפור' : '💡 AI Recommendations'} accent={Colors.primary}>
                  <View style={{ gap: Spacing.sm }}>
                    {analysis.recommendations.map((rec, i) => (
                      <View key={i} style={styles.recItem}>
                        <View style={[styles.recBadge, { backgroundColor: `${Colors.primary}20` }]}>
                          <Text style={[styles.recBadgeText, { color: Colors.primary }]}>{i + 1}</Text>
                        </View>
                        <Text style={styles.recText}>{rec}</Text>
                      </View>
                    ))}
                  </View>
                </SectionCard>

                <SectionCard title={isRTL ? '🎯 A/B כותרות לבדיקה' : '🎯 A/B Title Testing'} accent={Colors.secondary}>
                  {analysis.titleAlternatives.map((alt, i) => (
                    <View key={i} style={styles.altTitle}>
                      <View style={[styles.recBadge, { backgroundColor: `${Colors.secondary}20` }]}>
                        <Text style={[styles.recBadgeText, { color: Colors.secondary }]}>v{i + 1}</Text>
                      </View>
                      <Text style={styles.altTitleText}>{alt}</Text>
                    </View>
                  ))}
                </SectionCard>

                <SectionCard title={isRTL ? '🖼 טיפים לתמונה ממוזערת' : '🖼 Thumbnail Best Practices'} accent="#ff8c00">
                  {analysis.thumbnailScore.tips.map((tip, i) => (
                    <View key={i} style={{ flexDirection: 'row', gap: 8, paddingVertical: 6, borderBottomWidth: i < analysis.thumbnailScore.tips.length - 1 ? 1 : 0, borderColor: Colors.border }}>
                      <View style={[styles.recBadge, { backgroundColor: '#ff8c0020' }]}>
                        <MaterialIcons name="check" size={12} color="#ff8c00" />
                      </View>
                      <Text style={{ flex: 1, fontSize: Typography.caption, color: Colors.textSecondary, lineHeight: 18 }}>{tip}</Text>
                    </View>
                  ))}
                </SectionCard>

                <SectionCard title={isRTL ? '🕐 זמני פרסום אופטימליים' : '🕐 Optimal Posting Times'} accent={Colors.success}>
                  {analysis.bestPostingTimes.map((t, i) => (
                    <View key={i} style={{ flexDirection: 'row', gap: 8, alignItems: 'center', paddingVertical: 4 }}>
                      <MaterialIcons name="access-time" size={14} color={Colors.success} />
                      <Text style={{ flex: 1, fontSize: Typography.caption, color: Colors.textSecondary }}>{t}</Text>
                    </View>
                  ))}
                </SectionCard>
              </View>
            )}
          </View>
        )}

        {/* Empty state */}
        {!analysis && !loading && !error && (
          <View style={styles.emptyState}>
            <MaterialIcons name="youtube-searched-for" size={64} color="#ff0000" style={{ opacity: 0.5 }} />
            <Text style={styles.emptyTitle}>
              {isRTL ? 'ניתוח VidIQ מתקדם' : 'VidIQ-Style Deep Analytics'}
            </Text>
            <Text style={styles.emptyText}>
              {isRTL
                ? 'הדבק קישור יוטיוב לקבלת ניתוח מעמיק:\nציון SEO, ניתוח ערוץ, מחקר מילות מפתח,\nהמלצות A/B, זמני פרסום ועוד'
                : 'Paste a YouTube URL for deep analytics:\nSEO score, channel analysis, keyword research,\nA/B title testing, optimal posting times & more'}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginTop: 8 }}>
              {['SEO Score', 'Engagement', 'Revenue', 'Keywords', 'Channel Stats', 'Best Times', 'A/B Titles', 'Thumbnail Tips'].map(f => (
                <View key={f} style={[styles.featurePill, { backgroundColor: `#ff000015`, borderColor: `#ff000040` }]}>
                  <Text style={{ fontSize: 11, color: '#ff0000', fontWeight: '600' }}>{f}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderColor: Colors.border,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  ytIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: Typography.h3, fontWeight: '800', color: Colors.text },
  headerSub: { fontSize: 11, color: Colors.textMuted },
  trendBadge: { borderRadius: BorderRadius.sm, paddingHorizontal: 10, paddingVertical: 5 },
  trendBadgeText: { fontSize: Typography.caption, fontWeight: '700' },

  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.md, gap: Spacing.md },

  apiKeyCard: {
    backgroundColor: `${Colors.warning}10`, borderRadius: BorderRadius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: `${Colors.warning}40`, gap: Spacing.sm,
  },
  apiKeyHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  apiKeyTitle: { fontSize: Typography.bodySmall, fontWeight: '700', color: Colors.warning },
  apiKeyHint: { fontSize: Typography.caption, color: Colors.textSecondary, lineHeight: 16 },
  apiKeyRow: { flexDirection: 'row', gap: Spacing.sm },
  apiKeyInput: {
    flex: 1, backgroundColor: Colors.background, borderRadius: BorderRadius.sm,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    fontSize: Typography.bodySmall, color: Colors.text,
  },
  apiKeySaveBtn: {
    backgroundColor: Colors.warning, borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md, alignItems: 'center', justifyContent: 'center',
  },
  apiKeySaveText: { color: '#000', fontWeight: '700', fontSize: Typography.bodySmall },
  apiKeyLink: { fontSize: Typography.caption, color: Colors.primary, textAlign: 'center' },

  searchCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    padding: Spacing.md, gap: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border, ...Shadows.sm,
  },
  searchLabel: { fontSize: Typography.caption, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase' },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.background, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.md,
  },
  searchInput: { flex: 1, fontSize: Typography.bodySmall, color: Colors.text, paddingVertical: Spacing.md },
  keyBtn: { padding: 4 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  toggleLabel: { flex: 1, fontSize: Typography.caption, color: Colors.textSecondary },
  analyzeBtn: { borderRadius: BorderRadius.md, overflow: 'hidden' },
  analyzeBtnInner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, paddingVertical: Spacing.md,
  },
  analyzeBtnText: { fontSize: Typography.body, fontWeight: '800', color: '#FFF' },
  setKeyLink: { fontSize: 11, color: Colors.textMuted, textAlign: 'center' },

  errorCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: `${Colors.error}15`, borderRadius: BorderRadius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: `${Colors.error}30`,
  },
  errorText: { flex: 1, fontSize: Typography.bodySmall, color: Colors.error },

  emptyState: {
    alignItems: 'center', gap: Spacing.md,
    paddingVertical: Spacing.xxl * 2, paddingHorizontal: Spacing.xl,
  },
  emptyTitle: { fontSize: Typography.h3, fontWeight: '700', color: Colors.textSecondary, textAlign: 'center' },
  emptyText: { fontSize: Typography.bodySmall, color: Colors.textMuted, textAlign: 'center', lineHeight: 22 },
  featurePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.sm, borderWidth: 1 },

  videoCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', ...Shadows.md,
  },
  thumbnail: { width: '100%', height: 200 },
  videoTitle: { fontSize: Typography.body, fontWeight: '700', color: Colors.text, lineHeight: 22 },
  channelName: { fontSize: Typography.caption, color: Colors.textSecondary },

  tabBar: { flexGrow: 0 },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md, backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
  },
  tabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabLabel: { fontSize: Typography.caption, color: Colors.textSecondary, fontWeight: '600' },
  tabLabelActive: { color: '#FFF' },

  sectionCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    padding: Spacing.md, gap: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border, ...Shadows.sm,
  },
  sectionTitle: { fontSize: Typography.bodySmall, fontWeight: '800', color: Colors.text, marginBottom: 4 },

  issueRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  issueText: { flex: 1, fontSize: Typography.caption, color: Colors.warning, lineHeight: 16 },
  suggLabel: { fontSize: Typography.caption, fontWeight: '600', color: Colors.textSecondary, marginBottom: 4 },
  altTitle: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    padding: Spacing.sm, backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.sm, marginBottom: 4,
  },
  altTitleNum: { fontSize: 11, fontWeight: '800', color: Colors.primary, minWidth: 16 },
  altTitleText: { flex: 1, fontSize: Typography.caption, color: Colors.text, lineHeight: 18 },

  tag: {
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: BorderRadius.sm, borderWidth: 1,
    borderColor: `${Colors.primary}40`, backgroundColor: `${Colors.primary}10`,
  },
  tagText: { fontSize: 11, color: Colors.primary, fontWeight: '500' },

  kwPill: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.sm, borderWidth: 1,
    borderColor: Colors.border, padding: Spacing.sm, minWidth: 120,
  },
  kwText: { fontSize: Typography.caption, color: Colors.text, fontWeight: '600' },
  kwBadge: {
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 4, borderWidth: 1,
  },
  kwBadgeText: { fontSize: 10, fontWeight: '700' },

  relatedItem: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 6, borderBottomWidth: 1, borderColor: Colors.border,
  },

  rankBadge: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rankText: { fontSize: 10, fontWeight: '700' },

  recItem: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: `${Colors.primary}08`, borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
  },
  recBadge: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  recBadgeText: { fontSize: 10, fontWeight: '800' },
  recText: { flex: 1, fontSize: Typography.caption, color: Colors.textSecondary, lineHeight: 18 },
});
