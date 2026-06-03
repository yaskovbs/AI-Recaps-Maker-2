import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, FlatList, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRecaps } from '@/contexts/RecapsContext';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';

// Public recaps come from RecapsContext - only shows recaps marked as public

type SortType = 'recent' | 'popular' | 'rating';

export default function GalleryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, isRTL } = useLanguage();
  const { getPublicRecaps } = useRecaps();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortType>('recent');
  
  const genres = [
    { value: 'all', labelHe: 'הכל', labelEn: 'All' },
    { value: 'sci-fi', labelHe: 'מדע בדיוני', labelEn: 'Sci-Fi' },
    { value: 'action', labelHe: 'אקשן', labelEn: 'Action' },
    { value: 'drama', labelHe: 'דרמה', labelEn: 'Drama' },
    { value: 'comedy', labelHe: 'קומדיה', labelEn: 'Comedy' },
    { value: 'crime', labelHe: 'פשע', labelEn: 'Crime' },
    { value: 'horror', labelHe: 'אימה', labelEn: 'Horror' },
  ];
  
  // Get public recaps from context
  const publicRecaps = getPublicRecaps();
  
  // Filter and sort recaps
  const filteredRecaps = publicRecaps.filter((recap) => {
    const matchesSearch = searchQuery.length === 0 || 
      recap.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (recap.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesGenre = !selectedGenre || selectedGenre === 'all' || recap.genre === selectedGenre;
    
    return matchesSearch && matchesGenre;
  }).sort((a, b) => {
    if (sortBy === 'recent') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sortBy === 'popular') return b.views - a.views;
    if (sortBy === 'rating') return b.rating - a.rating;
    return 0;
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <MaterialIcons name="video-library" size={28} color={Colors.primary} />
          <Text style={styles.headerTitle}>{isRTL ? 'גלריית סיכומים' : 'Recaps Gallery'}</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          {isRTL 
            ? 'גלה סיכומים מדהימים שנוצרו על ידי הקהילה'
            : 'Discover amazing recaps created by the community'}
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={20} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder={isRTL ? 'חפש סיכומים...' : 'Search recaps...'}
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            textAlign={isRTL ? 'right' : 'left'}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <MaterialIcons name="close" size={20} color={Colors.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Genre Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.genresScroll}
        contentContainerStyle={styles.genresContent}
      >
        {genres.map((genre) => (
          <Pressable
            key={genre.value}
            style={[
              styles.genreChip,
              selectedGenre === genre.value && styles.genreChipActive,
            ]}
            onPress={() => setSelectedGenre(genre.value)}
          >
            <Text
              style={[
                styles.genreChipText,
                selectedGenre === genre.value && styles.genreChipTextActive,
              ]}
            >
              {isRTL ? genre.labelHe : genre.labelEn}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Sort Options */}
      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>{isRTL ? 'מיין לפי:' : 'Sort by:'}</Text>
        <View style={styles.sortOptions}>
          <SortButton
            label={isRTL ? 'חדשים' : 'Recent'}
            active={sortBy === 'recent'}
            onPress={() => setSortBy('recent')}
          />
          <SortButton
            label={isRTL ? 'פופולרי' : 'Popular'}
            active={sortBy === 'popular'}
            onPress={() => setSortBy('popular')}
          />
          <SortButton
            label={isRTL ? 'דירוג' : 'Rating'}
            active={sortBy === 'rating'}
            onPress={() => setSortBy('rating')}
          />
        </View>
      </View>

      {/* Gallery Grid */}
      <FlatList
        data={filteredRecaps}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={[
          styles.gridContent,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        columnWrapperStyle={styles.gridRow}
        renderItem={({ item }) => <GalleryCard recap={item} isRTL={isRTL} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialIcons name="search-off" size={64} color={Colors.textMuted} />
            <Text style={styles.emptyText}>
              {isRTL ? 'טרם נוספו סיכומים ציבוריים' : 'No public recaps yet'}
            </Text>
            <Text style={styles.emptyHint}>
              {isRTL 
                ? 'סיכומים שמשתמשים בוחרים לשתף יופיעו כאן'
                : 'Recaps that users choose to share will appear here'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

function SortButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      style={[styles.sortButton, active && styles.sortButtonActive]}
      onPress={onPress}
    >
      <Text style={[styles.sortButtonText, active && styles.sortButtonTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

function GalleryCard({ recap, isRTL }: { recap: any; isRTL: boolean }) {
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    return `${mins}:${String(seconds % 60).padStart(2, '0')}`;
  };

  const formatViews = (views: number): string => {
    if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return String(views);
  };

  // Fallback thumbnail if not available
  const thumbnailUri = recap.thumbnail_url || 'https://via.placeholder.com/300x450.png?text=No+Thumbnail';

  return (
    <Pressable style={styles.galleryCard}>
      {/* Thumbnail */}
      <View style={styles.thumbnailContainer}>
        {recap.thumbnail_url ? (
          <Image
            source={{ uri: thumbnailUri }}
            style={styles.thumbnail}
            transition={200}
            contentFit="cover"
          />
        ) : (
          <View style={styles.thumbnailPlaceholder}>
            <MaterialIcons name="movie" size={48} color={Colors.textMuted} />
          </View>
        )}
        {/* Duration Badge */}
        <View style={styles.durationBadge}>
          <MaterialIcons name="play-arrow" size={12} color="#FFF" />
          <Text style={styles.durationText}>{formatDuration(recap.duration)}</Text>
        </View>
        {/* Rating Badge */}
        <View style={styles.ratingBadge}>
          <MaterialIcons name="star" size={12} color={Colors.warning} />
          <Text style={styles.ratingText}>{recap.rating.toFixed(1)}</Text>
        </View>
      </View>

      {/* Info */}
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {recap.title}
        </Text>
        {recap.description && (
          <Text style={styles.cardDescription} numberOfLines={2}>
            {recap.description}
          </Text>
        )}
        
        {/* Meta */}
        <View style={styles.cardMeta}>
          <View style={styles.metaRow}>
            <MaterialIcons name="visibility" size={14} color={Colors.textMuted} />
            <Text style={styles.metaText}>{formatViews(recap.views)}</Text>
          </View>
          <View style={styles.metaRow}>
            <MaterialIcons name="label" size={14} color={Colors.textMuted} />
            <Text style={styles.metaText} numberOfLines={1}>
              {recap.genre}
            </Text>
          </View>
        </View>
      </View>

      {/* Play Overlay */}
      <View style={styles.playOverlay}>
        <LinearGradient
          colors={['rgba(0, 212, 255, 0.9)', 'rgba(178, 75, 243, 0.9)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.playButton}
        >
          <MaterialIcons name="play-arrow" size={32} color="#FFF" />
        </LinearGradient>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  headerTitle: {
    fontSize: Typography.h3,
    fontWeight: Typography.bold,
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
  },
  
  // Search
  searchContainer: {
    padding: Spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.body,
    color: Colors.text,
    paddingVertical: Platform.select({ ios: Spacing.sm, android: Spacing.xs }),
  },
  
  // Genres
  genresScroll: {
    marginBottom: Spacing.md,
  },
  genresContent: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
  },
  genreChip: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.xs,
  },
  genreChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  genreChipText: {
    fontSize: Typography.bodySmall,
    color: Colors.text,
    fontWeight: Typography.medium,
  },
  genreChipTextActive: {
    color: '#FFF',
    fontWeight: Typography.bold,
  },
  
  // Sort
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  sortLabel: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    fontWeight: Typography.semibold,
  },
  sortOptions: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  sortButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surfaceLight,
  },
  sortButtonActive: {
    backgroundColor: Colors.primary,
  },
  sortButtonText: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
  sortButtonTextActive: {
    color: '#FFF',
    fontWeight: Typography.bold,
  },
  
  // Grid
  gridContent: {
    padding: Spacing.md,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  
  // Gallery Card
  galleryCard: {
    width: '48%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  thumbnailContainer: {
    width: '100%',
    aspectRatio: 2 / 3,
    backgroundColor: Colors.surfaceLight,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceLight,
  },
  durationBadge: {
    position: 'absolute',
    bottom: Spacing.xs,
    left: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  durationText: {
    fontSize: 10,
    color: '#FFF',
    fontWeight: Typography.bold,
  },
  ratingBadge: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  ratingText: {
    fontSize: 10,
    color: '#FFF',
    fontWeight: Typography.bold,
  },
  cardInfo: {
    padding: Spacing.sm,
    gap: Spacing.xs,
  },
  cardTitle: {
    fontSize: Typography.bodySmall,
    fontWeight: Typography.semibold,
    color: Colors.text,
    lineHeight: 18,
  },
  cardDescription: {
    fontSize: Typography.caption,
    color: Colors.textMuted,
    lineHeight: 16,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    flex: 1,
  },
  metaText: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  
  // Play Overlay
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0,
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.lg,
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl * 2,
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: Typography.h4,
    fontWeight: Typography.semibold,
    color: Colors.textMuted,
  },
  emptyHint: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
