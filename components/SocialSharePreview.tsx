import React from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';

interface Props {
  title: string;
  description: string;
  thumbnailUrl?: string;
  isRTL: boolean;
  onShare: (platform: string) => void;
}

function PlatformLabel({ icon, name, color }: { icon: any; name: string; color: string }) {
  return (
    <View style={[styles.platformLabel, { backgroundColor: color + '20', borderColor: color + '50' }]}>
      <MaterialIcons name={icon} size={14} color={color} />
      <Text style={[styles.platformLabelText, { color }]}>{name}</Text>
    </View>
  );
}

function ShareButton({ platform, onPress, isRTL }: { platform: string; onPress: () => void; isRTL: boolean }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.shareBtn, pressed && { opacity: 0.75 }]}
      onPress={onPress}
    >
      <MaterialIcons name="share" size={14} color={Colors.primary} />
      <Text style={styles.shareBtnText}>{isRTL ? 'שתף' : 'Share'}</Text>
    </Pressable>
  );
}

// Instagram Story Preview (9:16 ratio)
function InstagramPreview({ title, isRTL, onShare }: { title: string; isRTL: boolean; onShare: () => void }) {
  return (
    <View style={styles.previewWrapper}>
      <PlatformLabel icon="camera-alt" name="Instagram Story" color="#E1306C" />
      <View style={styles.igStoryCard}>
        <LinearGradient
          colors={['#833AB4', '#FD1D1D', '#FCAF45']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.igGradientBg}
        >
          {/* Top bar */}
          <View style={styles.igTopBar}>
            <View style={styles.igStoryProgress}>
              <View style={styles.igStoryProgressFill} />
            </View>
            <View style={styles.igUserRow}>
              <View style={styles.igAvatar} />
              <Text style={styles.igUsername}>AI Recaps</Text>
              <Text style={styles.igClose}>✕</Text>
            </View>
          </View>
          {/* Center content */}
          <View style={styles.igCenter}>
            <View style={styles.igPlayCircle}>
              <MaterialIcons name="play-arrow" size={36} color="#FFF" />
            </View>
            <Text style={styles.igCenterLabel}>AI RECAP</Text>
          </View>
          {/* Bottom overlay */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.85)']}
            style={styles.igBottomOverlay}
          >
            <Text style={[styles.igTitle, isRTL && styles.rtlText]} numberOfLines={3}>
              {title}
            </Text>
            <View style={styles.igSwipeRow}>
              <MaterialIcons name="keyboard-arrow-up" size={18} color="rgba(255,255,255,0.8)" />
              <Text style={styles.igSwipeText}>Swipe up to watch</Text>
            </View>
          </LinearGradient>
        </LinearGradient>
      </View>
      <ShareButton platform="instagram" onPress={onShare} isRTL={isRTL} />
    </View>
  );
}

// Twitter/X Preview
function TwitterPreview({ title, description, isRTL, onShare }: { title: string; description: string; isRTL: boolean; onShare: () => void }) {
  return (
    <View style={styles.previewWrapper}>
      <PlatformLabel icon="campaign" name="Twitter / X" color="#1DA1F2" />
      <View style={styles.twitterCard}>
        {/* Tweet composer look */}
        <View style={styles.twitterHeader}>
          <View style={styles.twitterAvatar}>
            <Text style={styles.twitterAvatarText}>AI</Text>
          </View>
          <View style={styles.twitterUserInfo}>
            <Text style={styles.twitterName}>AI Recaps Maker</Text>
            <Text style={styles.twitterHandle}>@airecaps</Text>
          </View>
          <View style={styles.twitterXBadge}>
            <Text style={styles.twitterXText}>𝕏</Text>
          </View>
        </View>
        {/* Tweet body */}
        <Text style={[styles.twitterBody, isRTL && styles.rtlText]} numberOfLines={3}>
          🎬 New recap just dropped! {title}
          {'\n'}✨ AI-powered • Key moments • Full story
        </Text>
        {/* Link preview card */}
        <View style={styles.twitterLinkCard}>
          <LinearGradient
            colors={['#1a1a2e', '#242438']}
            style={styles.twitterLinkThumbnail}
          >
            <MaterialIcons name="play-circle-filled" size={28} color={Colors.primary} />
          </LinearGradient>
          <View style={styles.twitterLinkInfo}>
            <Text style={styles.twitterLinkDomain}>airecaps.app</Text>
            <Text style={styles.twitterLinkTitle} numberOfLines={2}>{title}</Text>
            <Text style={styles.twitterLinkDesc} numberOfLines={1}>{description || 'Watch the AI-generated recap'}</Text>
          </View>
        </View>
        {/* Actions row */}
        <View style={styles.twitterActions}>
          {[
            { icon: 'chat-bubble-outline', count: '12' },
            { icon: 'repeat', count: '34' },
            { icon: 'favorite-border', count: '142' },
            { icon: 'bar-chart', count: '2.1K' },
          ].map((action, i) => (
            <View key={i} style={styles.twitterActionItem}>
              <MaterialIcons name={action.icon as any} size={16} color={Colors.textMuted} />
              <Text style={styles.twitterActionCount}>{action.count}</Text>
            </View>
          ))}
        </View>
      </View>
      <ShareButton platform="twitter" onPress={onShare} isRTL={isRTL} />
    </View>
  );
}

// WhatsApp Preview
function WhatsAppPreview({ title, description, isRTL, onShare }: { title: string; description: string; isRTL: boolean; onShare: () => void }) {
  return (
    <View style={styles.previewWrapper}>
      <PlatformLabel icon="message" name="WhatsApp" color="#25D366" />
      <View style={styles.whatsappCard}>
        {/* Chat bg */}
        <View style={styles.whatsappChat}>
          <Text style={styles.whatsappTimestamp}>Today, 14:32</Text>
          {/* Message bubble */}
          <View style={styles.whatsappBubble}>
            {/* Link preview */}
            <View style={styles.whatsappLinkPreview}>
              <View style={styles.whatsappLinkAccent} />
              <View style={styles.whatsappLinkContent}>
                <Text style={styles.whatsappLinkSite}>airecaps.app</Text>
                <Text style={[styles.whatsappLinkTitle, isRTL && styles.rtlText]} numberOfLines={2}>
                  {title}
                </Text>
                <Text style={[styles.whatsappLinkDesc, isRTL && styles.rtlText]} numberOfLines={2}>
                  {description || '🎬 Watch this amazing AI-generated video recap!'}
                </Text>
                <LinearGradient
                  colors={['#1a1a2e', '#0a0a14']}
                  style={styles.whatsappThumb}
                >
                  <MaterialIcons name="play-circle-filled" size={24} color="#25D366" />
                </LinearGradient>
              </View>
            </View>
            <Text style={[styles.whatsappMessage, isRTL && styles.rtlText]}>
              {isRTL ? '🎬 ראו את הסיכום החדש שלי! 🔥' : '🎬 Check out my new recap! 🔥'}
            </Text>
            <View style={styles.whatsappMeta}>
              <Text style={styles.whatsappTime}>14:32</Text>
              <MaterialIcons name="done-all" size={14} color="#34B7F1" />
            </View>
          </View>
        </View>
      </View>
      <ShareButton platform="whatsapp" onPress={onShare} isRTL={isRTL} />
    </View>
  );
}

// Facebook Preview
function FacebookPreview({ title, description, isRTL, onShare }: { title: string; description: string; isRTL: boolean; onShare: () => void }) {
  return (
    <View style={styles.previewWrapper}>
      <PlatformLabel icon="thumb-up" name="Facebook" color="#1877F2" />
      <View style={styles.facebookCard}>
        {/* Post header */}
        <View style={styles.facebookHeader}>
          <View style={styles.facebookAvatar}>
            <MaterialIcons name="smart-toy" size={20} color="#FFF" />
          </View>
          <View style={styles.facebookUserInfo}>
            <Text style={styles.facebookName}>AI Recaps Maker</Text>
            <View style={styles.facebookMeta}>
              <Text style={styles.facebookTime}>Just now</Text>
              <Text style={styles.facebookDot}>·</Text>
              <MaterialIcons name="public" size={12} color={Colors.textMuted} />
            </View>
          </View>
          <MaterialIcons name="more-horiz" size={20} color={Colors.textMuted} />
        </View>
        {/* Post text */}
        <Text style={[styles.facebookBody, isRTL && styles.rtlText]} numberOfLines={3}>
          {isRTL
            ? `🎬 יצרתי סיכום AI מדהים של "${title}" - חובה לראות! #AIRecap #סרטים`
            : `🎬 Just created an amazing AI recap of "${title}" - must watch! #AIRecap #Movies`}
        </Text>
        {/* Link card */}
        <View style={styles.facebookLinkCard}>
          <LinearGradient
            colors={['#0a0a14', '#1a1a2e']}
            style={styles.facebookLinkImage}
          >
            <MaterialIcons name="play-circle-filled" size={40} color={Colors.primary} />
            <Text style={styles.facebookPlayLabel}>Watch Recap</Text>
          </LinearGradient>
          <View style={styles.facebookLinkBody}>
            <Text style={styles.facebookLinkDomain}>AIRECAPS.APP</Text>
            <Text style={[styles.facebookLinkTitle, isRTL && styles.rtlText]} numberOfLines={2}>{title}</Text>
            <Text style={[styles.facebookLinkDesc, isRTL && styles.rtlText]} numberOfLines={2}>
              {description || 'AI-powered video recap with key moments and highlights'}
            </Text>
          </View>
        </View>
        {/* Reactions */}
        <View style={styles.facebookReactionsRow}>
          <View style={styles.facebookReactions}>
            {['👍', '❤️', '😮'].map((emoji, i) => (
              <Text key={i} style={styles.facebookEmoji}>{emoji}</Text>
            ))}
            <Text style={styles.facebookReactionCount}>248</Text>
          </View>
          <Text style={styles.facebookComments}>32 comments · 18 shares</Text>
        </View>
        {/* Actions */}
        <View style={styles.facebookActionsRow}>
          {[
            { icon: 'thumb-up', label: isRTL ? 'לייק' : 'Like' },
            { icon: 'comment', label: isRTL ? 'תגובה' : 'Comment' },
            { icon: 'share', label: isRTL ? 'שתף' : 'Share' },
          ].map((action, i) => (
            <View key={i} style={styles.facebookAction}>
              <MaterialIcons name={action.icon as any} size={18} color={Colors.textMuted} />
              <Text style={styles.facebookActionText}>{action.label}</Text>
            </View>
          ))}
        </View>
      </View>
      <ShareButton platform="facebook" onPress={onShare} isRTL={isRTL} />
    </View>
  );
}

// ─── TikTok Preview (9:16 vertical) ──────────────────────────────────────────
function TikTokPreview({ title, isRTL, onShare }: { title: string; isRTL: boolean; onShare: () => void }) {
  return (
    <View style={styles.previewWrapper}>
      <PlatformLabel icon="music-note" name="TikTok" color="#010101" />
      <View style={styles.tiktokCard}>
        <LinearGradient
          colors={['#010101', '#1a1a2e', '#16213e']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.tiktokBg}
        >
          {/* Right sidebar icons */}
          <View style={styles.tiktokSidebar}>
            <View style={styles.tiktokAvatar} />
            <View style={styles.tiktokSideAction}>
              <MaterialIcons name="favorite" size={22} color="#FFF" />
              <Text style={styles.tiktokSideCount}>12.4K</Text>
            </View>
            <View style={styles.tiktokSideAction}>
              <MaterialIcons name="comment" size={22} color="#FFF" />
              <Text style={styles.tiktokSideCount}>843</Text>
            </View>
            <View style={styles.tiktokSideAction}>
              <MaterialIcons name="bookmark" size={22} color="#FFF" />
              <Text style={styles.tiktokSideCount}>2.1K</Text>
            </View>
            <View style={styles.tiktokSideAction}>
              <MaterialIcons name="share" size={22} color="#FFF" />
              <Text style={styles.tiktokSideCount}>Share</Text>
            </View>
            <View style={[styles.tiktokAvatar, styles.tiktokMusicDisc]}>
              <MaterialIcons name="music-note" size={12} color="#FFF" />
            </View>
          </View>
          {/* Bottom caption */}
          <View style={styles.tiktokBottom}>
            <Text style={styles.tiktokUsername}>@airecaps</Text>
            <Text style={styles.tiktokCaption} numberOfLines={2}>{title}</Text>
            <View style={styles.tiktokMusicRow}>
              <MaterialIcons name="music-note" size={12} color="#FFF" />
              <Text style={styles.tiktokMusicText}>AI Recaps – Trending Sound</Text>
            </View>
          </View>
          {/* TikTok dual color logo */}
          <View style={styles.tiktokLogoArea}>
            <Text style={[styles.tiktokLogo, { color: '#69C9D0', marginLeft: -1 }]}>TikTok</Text>
            <Text style={[styles.tiktokLogo, { color: '#EE1D52', marginLeft: 1, position: 'absolute' }]}>TikTok</Text>
            <Text style={styles.tiktokLogo}>TikTok</Text>
          </View>
        </LinearGradient>
      </View>
      <ShareButton platform="tiktok" onPress={onShare} isRTL={isRTL} />
    </View>
  );
}

// ─── YouTube Shorts Preview (9:16 vertical) ───────────────────────────────────
function YouTubeShortsPreview({ title, isRTL, onShare }: { title: string; isRTL: boolean; onShare: () => void }) {
  return (
    <View style={styles.previewWrapper}>
      <PlatformLabel icon="play-circle-filled" name="YouTube Shorts" color="#FF0000" />
      <View style={styles.ytShortsCard}>
        <LinearGradient
          colors={['#0f0f0f', '#1a1a1a', '#0f0f0f']}
          style={styles.ytShortsBg}
        >
          {/* Top bar */}
          <View style={styles.ytShortsTopBar}>
            <View style={styles.ytShortsLogo}>
              <MaterialIcons name="play-arrow" size={14} color="#FFF" style={{ marginLeft: 2 }} />
            </View>
            <Text style={styles.ytShortsLogoText}>Shorts</Text>
          </View>

          {/* Center play indicator */}
          <View style={styles.ytShortsCenter}>
            <View style={styles.ytShortsPlayRing}>
              <MaterialIcons name="play-arrow" size={30} color="#FFF" />
            </View>
          </View>

          {/* Right sidebar */}
          <View style={styles.ytShortsSidebar}>
            <View style={styles.tiktokSideAction}>
              <MaterialIcons name="thumb-up" size={22} color="#FFF" />
              <Text style={styles.tiktokSideCount}>8.7K</Text>
            </View>
            <View style={styles.tiktokSideAction}>
              <MaterialIcons name="thumb-down" size={22} color="#FFF" />
              <Text style={styles.tiktokSideCount}>Dislike</Text>
            </View>
            <View style={styles.tiktokSideAction}>
              <MaterialIcons name="comment" size={22} color="#FFF" />
              <Text style={styles.tiktokSideCount}>321</Text>
            </View>
            <View style={styles.tiktokSideAction}>
              <MaterialIcons name="share" size={22} color="#FFF" />
              <Text style={styles.tiktokSideCount}>Share</Text>
            </View>
            <View style={styles.tiktokSideAction}>
              <MaterialIcons name="more-horiz" size={22} color="#FFF" />
            </View>
          </View>

          {/* Bottom info */}
          <View style={styles.ytShortsBottom}>
            <View style={styles.ytShortsChannelRow}>
              <View style={styles.ytShortsAvatar} />
              <Text style={styles.ytShortsChannel}>AI Recaps</Text>
              <View style={styles.ytShortsSubscribeBtn}>
                <Text style={styles.ytShortsSubscribeText}>Subscribe</Text>
              </View>
            </View>
            <Text style={styles.ytShortsTitle} numberOfLines={2}>{title}</Text>
          </View>

          {/* Red progress bar at bottom */}
          <View style={styles.ytShortsProgressBar}>
            <View style={styles.ytShortsProgressFill} />
          </View>
        </LinearGradient>
      </View>
      <ShareButton platform="youtube-shorts" onPress={onShare} isRTL={isRTL} />
    </View>
  );
}

export default function SocialSharePreview({ title, description, thumbnailUrl, isRTL, onShare }: Props) {
  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <LinearGradient
          colors={[Colors.primary, Colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.sectionIconBg}
        >
          <MaterialIcons name="share" size={18} color="#FFF" />
        </LinearGradient>
        <Text style={[styles.sectionTitle, isRTL && styles.rtlText]}>
          {isRTL ? 'שתף ברשתות חברתיות' : 'Share on Social Media'}
        </Text>
      </View>

      <Text style={[styles.sectionSubtitle, isRTL && styles.rtlText]}>
        {isRTL
          ? 'הצג כיצד יראה הסיכום שלך ברשתות השונות'
          : 'Preview how your recap will look on each platform'}
      </Text>

      {/* Previews Scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.previewsScroll}
      >
        <InstagramPreview title={title} isRTL={isRTL} onShare={() => onShare('instagram')} />
        <TikTokPreview title={title} isRTL={isRTL} onShare={() => onShare('tiktok')} />
        <YouTubeShortsPreview title={title} isRTL={isRTL} onShare={() => onShare('youtube-shorts')} />
        <TwitterPreview title={title} description={description} isRTL={isRTL} onShare={() => onShare('twitter')} />
        <WhatsAppPreview title={title} description={description} isRTL={isRTL} onShare={() => onShare('whatsapp')} />
        <FacebookPreview title={title} description={description} isRTL={isRTL} onShare={() => onShare('facebook')} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sectionIconBg: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: Typography.h4,
    fontWeight: Typography.bold,
    color: Colors.text,
  },
  sectionSubtitle: {
    fontSize: Typography.bodySmall,
    color: Colors.textMuted,
  },
  rtlText: {
    textAlign: 'right',
  },
  previewsScroll: {
    gap: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  previewWrapper: {
    width: 260,
    gap: Spacing.sm,
  },
  platformLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  platformLabelText: {
    fontSize: Typography.caption,
    fontWeight: Typography.semibold,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  shareBtnText: {
    fontSize: Typography.bodySmall,
    fontWeight: Typography.semibold,
    color: Colors.primary,
  },

  // Instagram
  igStoryCard: {
    width: 147,
    height: 260,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.lg,
    alignSelf: 'center',
  },
  igGradientBg: {
    flex: 1,
  },
  igTopBar: {
    padding: Spacing.sm,
    gap: Spacing.xs,
  },
  igStoryProgress: {
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 1,
  },
  igStoryProgressFill: {
    height: '100%',
    width: '60%',
    backgroundColor: '#FFF',
    borderRadius: 1,
  },
  igUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  igAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderWidth: 1,
    borderColor: '#FFF',
  },
  igUsername: {
    flex: 1,
    fontSize: 9,
    fontWeight: '700',
    color: '#FFF',
  },
  igClose: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
  },
  igCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  igPlayCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  igCenterLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 3,
  },
  igBottomOverlay: {
    padding: Spacing.sm,
    gap: Spacing.xs,
  },
  igTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
    lineHeight: 15,
  },
  igSwipeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  igSwipeText: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.8)',
  },

  // Twitter
  twitterCard: {
    backgroundColor: '#15202B',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(29,161,242,0.2)',
    ...Shadows.sm,
  },
  twitterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  twitterAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  twitterAvatarText: {
    fontSize: Typography.caption,
    fontWeight: Typography.bold,
    color: '#000',
  },
  twitterUserInfo: {
    flex: 1,
  },
  twitterName: {
    fontSize: Typography.bodySmall,
    fontWeight: Typography.bold,
    color: '#E7E9EA',
  },
  twitterHandle: {
    fontSize: Typography.caption,
    color: '#8B98A5',
  },
  twitterXBadge: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  twitterXText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#E7E9EA',
  },
  twitterBody: {
    fontSize: Typography.bodySmall,
    color: '#E7E9EA',
    lineHeight: 20,
  },
  twitterLinkCard: {
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    flexDirection: 'row',
    height: 60,
  },
  twitterLinkThumbnail: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  twitterLinkInfo: {
    flex: 1,
    padding: Spacing.sm,
    justifyContent: 'center',
    gap: 1,
  },
  twitterLinkDomain: {
    fontSize: 9,
    color: '#8B98A5',
  },
  twitterLinkTitle: {
    fontSize: 10,
    fontWeight: '600',
    color: '#E7E9EA',
    lineHeight: 14,
  },
  twitterLinkDesc: {
    fontSize: 9,
    color: '#8B98A5',
  },
  twitterActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacing.xs,
  },
  twitterActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  twitterActionCount: {
    fontSize: Typography.caption,
    color: '#8B98A5',
  },

  // WhatsApp
  whatsappCard: {
    backgroundColor: '#0B141A',
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(37,211,102,0.2)',
    ...Shadows.sm,
  },
  whatsappChat: {
    padding: Spacing.md,
    gap: Spacing.sm,
    alignItems: 'flex-end',
  },
  whatsappTimestamp: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.3)',
    alignSelf: 'center',
  },
  whatsappBubble: {
    maxWidth: '90%',
    backgroundColor: '#005C4B',
    borderRadius: 12,
    borderTopRightRadius: 2,
    padding: Spacing.sm,
    gap: Spacing.xs,
  },
  whatsappLinkPreview: {
    backgroundColor: '#0B141A',
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  whatsappLinkAccent: {
    width: 4,
    backgroundColor: '#25D366',
  },
  whatsappLinkContent: {
    flex: 1,
    padding: Spacing.sm,
    gap: Spacing.xs,
  },
  whatsappLinkSite: {
    fontSize: 9,
    color: '#25D366',
    fontWeight: '700',
  },
  whatsappLinkTitle: {
    fontSize: 10,
    fontWeight: '600',
    color: '#E9EDEF',
    lineHeight: 14,
  },
  whatsappLinkDesc: {
    fontSize: 9,
    color: '#8696A0',
    lineHeight: 13,
  },
  whatsappThumb: {
    height: 60,
    marginTop: Spacing.xs,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  whatsappMessage: {
    fontSize: Typography.bodySmall,
    color: '#E9EDEF',
    lineHeight: 18,
  },
  whatsappMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 3,
  },
  whatsappTime: {
    fontSize: 9,
    color: '#8696A0',
  },

  // Facebook
  facebookCard: {
    backgroundColor: '#242526',
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(24,119,242,0.2)',
    ...Shadows.sm,
  },
  facebookHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.sm,
    paddingBottom: 0,
  },
  facebookAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1877F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  facebookUserInfo: {
    flex: 1,
  },
  facebookName: {
    fontSize: Typography.bodySmall,
    fontWeight: Typography.bold,
    color: '#E4E6EB',
  },
  facebookMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  facebookTime: {
    fontSize: 9,
    color: '#B0B3B8',
  },
  facebookDot: {
    fontSize: 9,
    color: '#B0B3B8',
  },
  facebookBody: {
    fontSize: Typography.bodySmall,
    color: '#E4E6EB',
    padding: Spacing.sm,
    lineHeight: 18,
  },
  facebookLinkCard: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  facebookLinkImage: {
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  facebookPlayLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1,
  },
  facebookLinkBody: {
    padding: Spacing.sm,
    backgroundColor: '#3A3B3C',
    gap: 2,
  },
  facebookLinkDomain: {
    fontSize: 9,
    color: '#B0B3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  facebookLinkTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#E4E6EB',
    lineHeight: 15,
  },
  facebookLinkDesc: {
    fontSize: 9,
    color: '#B0B3B8',
    lineHeight: 13,
  },
  facebookReactionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  facebookReactions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  facebookEmoji: {
    fontSize: 12,
  },
  facebookReactionCount: {
    fontSize: 9,
    color: '#B0B3B8',
    marginLeft: 3,
  },
  facebookComments: {
    fontSize: 9,
    color: '#B0B3B8',
  },
  facebookActionsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  facebookAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: Spacing.sm,
  },
  facebookActionText: {
    fontSize: 10,
    color: '#B0B3B8',
    fontWeight: '500',
  },

  // ── TikTok ────────────────────────────────────────────────────────────────
  tiktokCard: {
    width: 147,
    height: 260,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.lg,
    alignSelf: 'center',
  },
  tiktokBg: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  tiktokSidebar: {
    position: 'absolute',
    right: 6,
    bottom: 60,
    alignItems: 'center',
    gap: 14,
  },
  tiktokAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EE1D52',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  tiktokMusicDisc: {
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tiktokSideAction: {
    alignItems: 'center',
    gap: 2,
  },
  tiktokSideCount: {
    fontSize: 9,
    color: '#FFF',
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  tiktokBottom: {
    padding: Spacing.sm,
    paddingRight: 50,
    paddingBottom: Spacing.md,
    gap: 4,
  },
  tiktokUsername: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  tiktokCaption: {
    fontSize: 10,
    color: '#FFF',
    lineHeight: 14,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  tiktokMusicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tiktokMusicText: {
    fontSize: 9,
    color: '#FFF',
    flex: 1,
  },
  tiktokLogoArea: {
    position: 'absolute',
    top: 10,
    left: 10,
  },
  tiktokLogo: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: -0.5,
  },

  // ── YouTube Shorts ─────────────────────────────────────────────────────────
  ytShortsCard: {
    width: 147,
    height: 260,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.lg,
    alignSelf: 'center',
  },
  ytShortsBg: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  ytShortsTopBar: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ytShortsLogo: {
    width: 20,
    height: 14,
    backgroundColor: '#FF0000',
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ytShortsLogoText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
  },
  ytShortsCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 50,
    bottom: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ytShortsPlayRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ytShortsSidebar: {
    position: 'absolute',
    right: 6,
    bottom: 70,
    alignItems: 'center',
    gap: 14,
  },
  ytShortsBottom: {
    padding: Spacing.sm,
    paddingRight: 50,
    paddingBottom: 16,
    gap: 6,
  },
  ytShortsChannelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ytShortsAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF0000',
  },
  ytShortsChannel: {
    fontSize: 10,
    color: '#FFF',
    fontWeight: '600',
    flex: 1,
  },
  ytShortsSubscribeBtn: {
    backgroundColor: '#FF0000',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  ytShortsSubscribeText: {
    fontSize: 8,
    color: '#FFF',
    fontWeight: '700',
  },
  ytShortsTitle: {
    fontSize: 10,
    color: '#FFF',
    lineHeight: 14,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  ytShortsProgressBar: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    width: '100%',
  },
  ytShortsProgressFill: {
    height: '100%',
    width: '35%',
    backgroundColor: '#FF0000',
  },
});
