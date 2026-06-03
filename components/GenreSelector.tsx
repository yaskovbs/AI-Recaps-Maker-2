// GenreSelector Component - Hardcoded genres (English & Hebrew)
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';

interface Genre {
  id: number;
  name_en: string;
  name_he: string;
  category: 'movie' | 'tv' | 'both';
  icon: string;
  color: string;
  sort_order: number;
}

interface GenreSelectorProps {
  selectedGenres: string[]; // Array of genre names
  onSelectionChange: (genres: string[]) => void;
  multiSelect?: boolean;
  language?: 'en' | 'he';
}

const HARDCODED_GENRES: Genre[] = [
  { id: 1,  name_en: 'Action',         name_he: 'אקשן',           category: 'both',  icon: 'local-fire-department', color: '#FF4500', sort_order: 1 },
  { id: 2,  name_en: 'Comedy',         name_he: 'קומדיה',         category: 'both',  icon: 'sentiment-very-satisfied', color: '#FFD700', sort_order: 2 },
  { id: 3,  name_en: 'Drama',          name_he: 'דרמה',           category: 'both',  icon: 'theater-comedy',        color: '#8B0000', sort_order: 3 },
  { id: 4,  name_en: 'Horror',         name_he: 'אימה',           category: 'both',  icon: 'nightlight',            color: '#4B0082', sort_order: 4 },
  { id: 5,  name_en: 'Romance',        name_he: 'רומנטי',         category: 'both',  icon: 'favorite',              color: '#FF69B4', sort_order: 5 },
  { id: 6,  name_en: 'Science Fiction',name_he: 'מדע בדיוני',    category: 'both',  icon: 'rocket',                color: '#00CED1', sort_order: 6 },
  { id: 7,  name_en: 'Fantasy',        name_he: 'פנטזיה',         category: 'both',  icon: 'auto-awesome',          color: '#9400D3', sort_order: 7 },
  { id: 8,  name_en: 'Thriller',       name_he: 'מותחן',          category: 'both',  icon: 'visibility',            color: '#2F4F4F', sort_order: 8 },
  { id: 9,  name_en: 'Mystery',        name_he: 'מסתורין',        category: 'both',  icon: 'search',                color: '#708090', sort_order: 9 },
  { id: 10, name_en: 'Adventure',      name_he: 'הרפתקה',         category: 'both',  icon: 'explore',               color: '#228B22', sort_order: 10 },
  { id: 11, name_en: 'Animation',      name_he: 'אנימציה',        category: 'both',  icon: 'animation',             color: '#FF8C00', sort_order: 11 },
  { id: 12, name_en: 'Documentary',    name_he: 'דוקומנטרי',      category: 'both',  icon: 'camera',                color: '#8B4513', sort_order: 12 },
  { id: 13, name_en: 'Crime',          name_he: 'פשע',            category: 'both',  icon: 'gavel',                 color: '#696969', sort_order: 13 },
  { id: 14, name_en: 'Biography',      name_he: 'ביוגרפיה',       category: 'movie', icon: 'person',                color: '#B8860B', sort_order: 14 },
  { id: 15, name_en: 'History',        name_he: 'היסטוריה',       category: 'both',  icon: 'history-edu',           color: '#A0522D', sort_order: 15 },
  { id: 16, name_en: 'Music',          name_he: 'מוסיקה',         category: 'both',  icon: 'music-note',            color: '#9932CC', sort_order: 16 },
  { id: 17, name_en: 'Sport',          name_he: 'ספורט',          category: 'both',  icon: 'sports-soccer',         color: '#006400', sort_order: 17 },
  { id: 18, name_en: 'Western',        name_he: 'מערבון',         category: 'movie', icon: 'landscape',             color: '#D2691E', sort_order: 18 },
  { id: 19, name_en: 'War',            name_he: 'מלחמה',          category: 'both',  icon: 'military-tech',         color: '#556B2F', sort_order: 19 },
  { id: 20, name_en: 'Family',         name_he: 'משפחה',          category: 'both',  icon: 'family-restroom',       color: '#20B2AA', sort_order: 20 },
  { id: 21, name_en: 'Kids',           name_he: 'ילדים',          category: 'both',  icon: 'child-care',            color: '#00BFFF', sort_order: 21 },
  { id: 22, name_en: 'Reality',        name_he: 'ריאליטי',        category: 'tv',    icon: 'live-tv',               color: '#FF1493', sort_order: 22 },
  { id: 23, name_en: 'Talk Show',      name_he: 'תוכנית שיחה',   category: 'tv',    icon: 'mic',                   color: '#1E90FF', sort_order: 23 },
  { id: 24, name_en: 'News',           name_he: 'חדשות',          category: 'tv',    icon: 'newspaper',             color: '#DC143C', sort_order: 24 },
  { id: 25, name_en: 'Soap Opera',     name_he: 'סבון',           category: 'tv',    icon: 'tv',                    color: '#DA70D6', sort_order: 25 },
  { id: 26, name_en: 'Mini Series',    name_he: 'מיני סדרה',      category: 'tv',    icon: 'view-module',           color: '#4682B4', sort_order: 26 },
  { id: 27, name_en: 'Superhero',      name_he: 'גיבור-על',       category: 'both',  icon: 'bolt',                  color: '#FF8200', sort_order: 27 },
  { id: 28, name_en: 'Psychological',  name_he: 'פסיכולוגי',      category: 'both',  icon: 'psychology',            color: '#800080', sort_order: 28 },
  { id: 29, name_en: 'Martial Arts',   name_he: 'אמנויות לחימה',  category: 'movie', icon: 'sports-martial-arts',   color: '#B22222', sort_order: 29 },
  { id: 30, name_en: 'Musical',        name_he: 'מחזמר',          category: 'both',  icon: 'queue-music',           color: '#FF6347', sort_order: 30 },
  { id: 31, name_en: 'General',        name_he: 'כללי',           category: 'both',  icon: 'category',              color: '#607D8B', sort_order: 31 },
];

export function GenreSelector({
  selectedGenres,
  onSelectionChange,
  multiSelect = false,
  language = 'he',
}: GenreSelectorProps) {
  const [genres] = useState<Genre[]>(HARDCODED_GENRES);
  const [loading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'movie' | 'tv'>('all');

  // Filter genres
  const filteredGenres = genres.filter((genre) => {
    // Category filter
    if (categoryFilter !== 'all' && genre.category !== 'both' && genre.category !== categoryFilter) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const nameToSearch = language === 'he' ? genre.name_he : genre.name_en;
      return nameToSearch.toLowerCase().includes(searchLower);
    }

    return true;
  });

  // Toggle genre selection
  const toggleGenre = (genreName: string) => {
    if (multiSelect) {
      if (selectedGenres.includes(genreName)) {
        onSelectionChange(selectedGenres.filter((g) => g !== genreName));
      } else {
        onSelectionChange([...selectedGenres, genreName]);
      }
    } else {
      onSelectionChange([genreName]);
    }
  };

  // Render genre card
  const renderGenre = ({ item }: { item: Genre }) => {
    const isSelected = selectedGenres.includes(item.name_en);
    const displayName = language === 'he' ? item.name_he : item.name_en;

    return (
      <Pressable
        style={[
          styles.genreCard,
          { borderColor: item.color },
          isSelected && { backgroundColor: item.color + '20', borderWidth: 2 },
        ]}
        onPress={() => toggleGenre(item.name_en)}
      >
        <MaterialIcons
          name={item.icon as any}
          size={24}
          color={isSelected ? item.color : Colors.textMuted}
        />
        <Text
          style={[
            styles.genreName,
            isSelected && { color: item.color, fontWeight: '700' },
          ]}
        >
          {displayName}
        </Text>
        {isSelected && (
          <MaterialIcons name="check-circle" size={20} color={item.color} />
        )}
      </Pressable>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>טוען ז׳אנרים...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder={language === 'he' ? 'חיפוש ז׳אנר...' : 'Search genre...'}
          placeholderTextColor={Colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')}>
            <MaterialIcons name="clear" size={20} color={Colors.textMuted} />
          </Pressable>
        )}
      </View>

      {/* Category Filter */}
      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>
          {language === 'he' ? 'סינון:' : 'Filter:'}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {(['all', 'movie', 'tv'] as const).map((category) => (
            <Pressable
              key={category}
              style={[
                styles.filterButton,
                categoryFilter === category && styles.filterButtonActive,
              ]}
              onPress={() => setCategoryFilter(category)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  categoryFilter === category && styles.filterButtonTextActive,
                ]}
              >
                {category === 'all' && (language === 'he' ? 'הכל' : 'All')}
                {category === 'movie' && (language === 'he' ? 'סרטים' : 'Movies')}
                {category === 'tv' && (language === 'he' ? 'סדרות' : 'TV Shows')}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Selected count */}
      {multiSelect && selectedGenres.length > 0 && (
        <View style={styles.selectedContainer}>
          <Text style={styles.selectedText}>
            {language === 'he'
              ? `נבחרו ${selectedGenres.length} ז׳אנרים`
              : `${selectedGenres.length} genre${selectedGenres.length > 1 ? 's' : ''} selected`}
          </Text>
          <Pressable onPress={() => onSelectionChange([])}>
            <Text style={styles.clearButton}>
              {language === 'he' ? 'נקה הכל' : 'Clear all'}
            </Text>
          </Pressable>
        </View>
      )}

      {/* Genre list */}
      <FlatList
        data={filteredGenres}
        renderItem={renderGenre}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="search-off" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>
              {language === 'he' ? 'לא נמצאו ז׳אנרים' : 'No genres found'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textMuted,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  filterLabel: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: Colors.background,
  },
  selectedContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 8,
  },
  selectedText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600',
  },
  clearButton: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 16,
  },
  genreCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  genreName: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textMuted,
    marginTop: 16,
  },
});
