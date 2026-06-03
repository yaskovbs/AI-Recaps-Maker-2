import { View, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing } from '@/constants/theme';

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  size?: number;
  readonly?: boolean;
}

export function StarRating({ rating, onRatingChange, size = 32, readonly = false }: StarRatingProps) {
  const handlePress = (starIndex: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(starIndex + 1);
    }
  };

  return (
    <View style={styles.container}>
      {[0, 1, 2, 3, 4].map((index) => {
        const filled = index < Math.floor(rating);
        const halfFilled = index < rating && index >= Math.floor(rating);
        
        return (
          <Pressable
            key={index}
            onPress={() => handlePress(index)}
            disabled={readonly}
            style={({ pressed }) => [
              styles.starButton,
              pressed && !readonly && styles.starPressed,
            ]}
          >
            <MaterialIcons
              name={filled ? 'star' : halfFilled ? 'star-half' : 'star-border'}
              size={size}
              color={filled || halfFilled ? Colors.secondary : Colors.textMuted}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  starButton: {
    padding: 2,
  },
  starPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
});
