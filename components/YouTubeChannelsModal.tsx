import { View, Text, StyleSheet, Modal, Pressable, TextInput, ScrollView, Alert } from 'react-native';
import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useLanguage } from '@/contexts/LanguageContext';
import { useYouTubeChannels } from '@/contexts/YouTubeChannelsContext';
import { useAdMob } from '@/contexts/AdMobContext';
import { useCredits } from '@/contexts/CreditsContext';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';

interface YouTubeChannelsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function YouTubeChannelsModal({ visible, onClose }: YouTubeChannelsModalProps) {
  const { t, isRTL } = useLanguage();
  const {
    channels,
    slotConfig,
    addChannel,
    removeChannel,
    toggleChannel,
    syncAllChannels,
    canAddMoreChannels,
    getAdsRequiredForNextSlot,
    unlockSlots,
  } = useYouTubeChannels();
  
  const { showRewardedAd } = useAdMob();
  const { earnCreditFromAd } = useCredits();
  
  const [channelUrl, setChannelUrl] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);

  const handleAddChannel = async () => {
    if (!channelUrl.trim()) {
      Alert.alert(
        isRTL ? 'שגיאה' : 'Error',
        isRTL ? 'אנא הזן URL/handle של ערוץ' : 'Please enter channel URL/handle',
        [{ text: 'OK' }]
      );
      return;
    }
    
    if (!canAddMoreChannels()) {
      Alert.alert(
        isRTL ? 'אין סלוטים זמינים' : 'No Slots Available',
        isRTL ? 'צפה במודעות כדי לפתוח סלוטים נוספים' : 'Watch ads to unlock more slots',
        [{ text: 'OK' }]
      );
      return;
    }
    
    const added = await addChannel(channelUrl);
    
    if (added) {
      setChannelUrl('');
      Alert.alert(
        isRTL ? 'הצלחה!' : 'Success!',
        isRTL ? 'הערוץ נוסף בהצלחה' : 'Channel added successfully',
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert(
        isRTL ? 'שגיאה' : 'Error',
        isRTL ? 'לא הצלחנו להוסיף את הערוץ' : 'Failed to add channel',
        [{ text: 'OK' }]
      );
    }
  };

  const handleUnlockSlots = async () => {
    const adsRequired = getAdsRequiredForNextSlot();
    
    Alert.alert(
      isRTL ? 'פתיחת סלוטים' : 'Unlock Slots',
      isRTL
        ? `צפה ב-${adsRequired} מודעות כדי לפתוח סלוטים נוספים`
        : `Watch ${adsRequired} ads to unlock more slots`,
      [
        { text: isRTL ? 'ביטול' : 'Cancel', style: 'cancel' },
        {
          text: isRTL ? 'המשך' : 'Continue',
          onPress: () => watchAdsForSlots(adsRequired),
        },
      ]
    );
  };

  const watchAdsForSlots = async (adsRequired: number) => {
    setIsUnlocking(true);
    
    try {
      for (let i = 0; i < adsRequired; i++) {
        const result = await showRewardedAd();
        
        if (result.success) {
          await earnCreditFromAd();
          
          if (i < adsRequired - 1) {
            // Not the last ad yet
            await new Promise<void>((resolve) => {
              Alert.alert(
                isRTL ? 'נהדר!' : 'Great!',
                isRTL ? `נשאר עוד ${adsRequired - i - 1} מודעות` : `${adsRequired - i - 1} more ads to go`,
                [{ text: 'OK', onPress: () => resolve() }]
              );
            });
          }
        } else {
          Alert.alert(
            isRTL ? 'שגיאה' : 'Error',
            isRTL ? 'לא הצלחנו להציג מודעה' : 'Failed to show ad',
            [{ text: 'OK' }]
          );
          setIsUnlocking(false);
          return;
        }
      }
      
      // All ads watched successfully - unlock slots
      await unlockSlots(adsRequired);
      
      Alert.alert(
        isRTL ? 'הצלחה!' : 'Success!',
        isRTL ? 'סלוטים חדשים נפתחו!' : 'New slots unlocked!',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error unlocking slots:', error);
      Alert.alert(
        isRTL ? 'שגיאה' : 'Error',
        isRTL ? 'אירעה שגיאה' : 'An error occurred',
        [{ text: 'OK' }]
      );
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleRemoveChannel = (id: string, name: string) => {
    Alert.alert(
      isRTL ? 'הסרת ערוץ' : 'Remove Channel',
      isRTL ? `להסיר את ${name}?` : `Remove ${name}?`,
      [
        { text: isRTL ? 'ביטול' : 'Cancel', style: 'cancel' },
        {
          text: isRTL ? 'הסר' : 'Remove',
          style: 'destructive',
          onPress: () => removeChannel(id),
        },
      ]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <MaterialIcons name="youtube-searched-for" size={24} color={Colors.primary} />
            <Text style={styles.modalTitle}>{t.youtubeChannels}</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color={Colors.text} />
            </Pressable>
          </View>

          {/* Slots Info */}
          <View style={styles.slotsInfo}>
            <View style={styles.slotsRow}>
              <Text style={styles.slotsLabel}>{t.channelSlots}:</Text>
              <Text style={styles.slotsValue}>
                {slotConfig.usedSlots}/{slotConfig.totalSlots >= 22 ? t.unlimited : slotConfig.totalSlots}
              </Text>
            </View>
            
            {slotConfig.nextTier && (
              <Pressable
                style={({ pressed }) => [
                  styles.unlockButton,
                  pressed && styles.buttonPressed,
                  isUnlocking && styles.buttonDisabled,
                ]}
                onPress={handleUnlockSlots}
                disabled={isUnlocking}
              >
                <MaterialIcons name="lock-open" size={16} color={Colors.secondary} />
                <Text style={styles.unlockButtonText}>
                  {isRTL
                    ? `${t.unlockSlots} (${slotConfig.nextTier.adsRequired} מודעות)`
                    : `${t.unlockSlots} (${slotConfig.nextTier.adsRequired} ads)`}
                </Text>
              </Pressable>
            )}
          </View>

          {/* Add Channel Input */}
          <View style={styles.addChannelSection}>
            <View style={styles.inputContainer}>
              <MaterialIcons name="add" size={20} color={Colors.textMuted} />
              <TextInput
                style={styles.input}
                placeholder={isRTL ? 'URL, @handle, או UC...' : 'URL, @handle, or UC...'}
                placeholderTextColor={Colors.textMuted}
                value={channelUrl}
                onChangeText={setChannelUrl}
                autoCapitalize="none"
                textAlign={isRTL ? 'right' : 'left'}
              />
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.addButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={handleAddChannel}
            >
              <LinearGradient
                colors={[Colors.primary, Colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.addButtonGradient}
              >
                <Text style={styles.addButtonText}>{t.addChannel}</Text>
              </LinearGradient>
            </Pressable>
          </View>

          {/* Channels List */}
          <ScrollView style={styles.channelsList} showsVerticalScrollIndicator={false}>
            {channels.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialIcons name="subscriptions" size={48} color={Colors.textMuted} />
                <Text style={styles.emptyText}>
                  {isRTL ? 'עדיין אין ערוצים' : 'No channels yet'}
                </Text>
              </View>
            ) : (
              channels.map((channel) => (
                <View key={channel.id} style={styles.channelCard}>
                  <MaterialIcons
                    name={channel.isActive ? 'check-circle' : 'radio-button-unchecked'}
                    size={24}
                    color={channel.isActive ? Colors.success : Colors.textMuted}
                    onPress={() => toggleChannel(channel.id)}
                  />
                  <View style={styles.channelInfo}>
                    <Text style={styles.channelName}>{channel.name}</Text>
                    <Text style={styles.channelMeta} numberOfLines={1}>
                      {channel.handle || channel.channelId || channel.url}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => handleRemoveChannel(channel.id, channel.name)}
                    style={styles.removeButton}
                  >
                    <MaterialIcons name="delete" size={20} color={Colors.error} />
                  </Pressable>
                </View>
              ))
            )}
          </ScrollView>

          {/* Sync Button */}
          {channels.length > 0 && (
            <Pressable
              style={({ pressed }) => [
                styles.syncButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={syncAllChannels}
            >
              <MaterialIcons name="sync" size={20} color={Colors.primary} />
              <Text style={styles.syncButtonText}>{t.syncChannels}</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '85%',
    paddingBottom: Spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    flex: 1,
    fontSize: Typography.h3,
    fontWeight: Typography.bold,
    color: Colors.text,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Slots Info
  slotsInfo: {
    padding: Spacing.lg,
    gap: Spacing.sm,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  slotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  slotsLabel: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
  },
  slotsValue: {
    fontSize: Typography.h4,
    fontWeight: Typography.bold,
    color: Colors.primary,
  },
  unlockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    backgroundColor: 'rgba(178, 75, 243, 0.1)',
    borderWidth: 1,
    borderColor: Colors.secondary,
  },
  unlockButtonText: {
    fontSize: Typography.bodySmall,
    fontWeight: Typography.semibold,
    color: Colors.secondary,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  
  // Add Channel
  addChannelSection: {
    padding: Spacing.lg,
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  input: {
    flex: 1,
    paddingVertical: Spacing.md,
    fontSize: Typography.body,
    color: Colors.text,
  },
  addButton: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  addButtonGradient: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: Typography.body,
    fontWeight: Typography.bold,
    color: '#FFF',
  },
  
  // Channels List
  channelsList: {
    flex: 1,
    padding: Spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: Typography.body,
    color: Colors.textMuted,
  },
  channelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  channelInfo: {
    flex: 1,
  },
  channelName: {
    fontSize: Typography.body,
    fontWeight: Typography.semibold,
    color: Colors.text,
    marginBottom: 2,
  },
  channelMeta: {
    fontSize: Typography.caption,
    color: Colors.textMuted,
  },
  removeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Sync Button
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  syncButtonText: {
    fontSize: Typography.body,
    fontWeight: Typography.semibold,
    color: Colors.primary,
  },
  
  buttonPressed: {
    opacity: 0.8,
  },
});
