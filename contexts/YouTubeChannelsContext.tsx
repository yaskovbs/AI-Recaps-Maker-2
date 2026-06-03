import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface YouTubeChannel {
  id: string;
  name: string;
  url: string;
  handle?: string; // @handle format
  channelId?: string; // UC... format
  addedAt: number;
  lastSyncedAt?: number;
  isActive: boolean;
}

interface ChannelSlotConfig {
  totalSlots: number; // Current total available slots
  usedSlots: number; // How many channels added
  availableSlots: number; // Remaining slots
  nextTier: {
    slots: number;
    adsRequired: number;
  } | null;
}

interface YouTubeChannelsContextType {
  channels: YouTubeChannel[];
  slotConfig: ChannelSlotConfig;
  isLoading: boolean;
  
  // Channel Management
  addChannel: (url: string) => Promise<boolean>;
  removeChannel: (id: string) => Promise<void>;
  toggleChannel: (id: string) => Promise<void>;
  syncChannel: (id: string) => Promise<void>;
  syncAllChannels: () => Promise<void>;
  
  // Slot Management
  canAddMoreChannels: () => boolean;
  getAdsRequiredForNextSlot: () => number;
  unlockSlots: (slots: number) => Promise<boolean>;
  
  refresh: () => Promise<void>;
}

const YouTubeChannelsContext = createContext<YouTubeChannelsContextType | undefined>(undefined);

const STORAGE_KEY = '@airm_youtube_channels';
const STORAGE_SLOTS_KEY = '@airm_youtube_slots';

// Slot Configuration
const FREE_SLOTS = 11; // Free: 1 personal + 10 inspiration
const MAX_TIER_SLOTS = 22; // After 22, unlimited but still 2 ads per channel
const ADS_PER_SLOT = 2; // 2 ads to unlock 1 additional channel

export function YouTubeChannelsProvider({ children }: { children: ReactNode }) {
  const [channels, setChannels] = useState<YouTubeChannel[]>([]);
  const [totalSlots, setTotalSlots] = useState(FREE_SLOTS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [storedChannels, storedSlots] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(STORAGE_SLOTS_KEY),
      ]);
      
      if (storedChannels) {
        setChannels(JSON.parse(storedChannels));
      }
      
      if (storedSlots) {
        setTotalSlots(parseInt(storedSlots, 10));
      }
    } catch (error) {
      console.error('Failed to load YouTube channels:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveData = async (newChannels: YouTubeChannel[], newSlots?: number) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newChannels));
      if (newSlots !== undefined) {
        await AsyncStorage.setItem(STORAGE_SLOTS_KEY, newSlots.toString());
        setTotalSlots(newSlots);
      }
      setChannels(newChannels);
    } catch (error) {
      console.error('Failed to save YouTube channels:', error);
    }
  };

  const parseChannelUrl = (url: string): { handle?: string; channelId?: string } => {
    // Handle @handle format
    if (url.includes('@')) {
      const match = url.match(/@([\w-]+)/);
      return { handle: match ? `@${match[1]}` : undefined };
    }
    
    // Handle channel ID format (UC...)
    if (url.includes('/channel/')) {
      const match = url.match(/\/channel\/(UC[\w-]+)/);
      return { channelId: match ? match[1] : undefined };
    }
    
    // Handle youtube.com/c/ChannelName
    if (url.includes('/c/')) {
      const match = url.match(/\/c\/([\w-]+)/);
      return { handle: match ? `@${match[1]}` : undefined };
    }
    
    // If just a string, treat as @handle
    if (!url.startsWith('http')) {
      return { handle: url.startsWith('@') ? url : `@${url}` };
    }
    
    return {};
  };

  const addChannel = async (url: string): Promise<boolean> => {
    // Check if we have available slots
    if (!canAddMoreChannels()) {
      console.log('❌ No available slots for new channel');
      return false;
    }
    
    const parsed = parseChannelUrl(url);
    
    if (!parsed.handle && !parsed.channelId) {
      console.log('❌ Invalid YouTube channel URL/handle');
      return false;
    }
    
    // Check for duplicates
    const exists = channels.some(ch => 
      ch.url === url || 
      ch.handle === parsed.handle || 
      ch.channelId === parsed.channelId
    );
    
    if (exists) {
      console.log('❌ Channel already exists');
      return false;
    }
    
    const newChannel: YouTubeChannel = {
      id: `${Date.now()}_${Math.random().toString(36).substring(7)}`,
      name: parsed.handle || parsed.channelId || 'Unknown',
      url,
      handle: parsed.handle,
      channelId: parsed.channelId,
      addedAt: Date.now(),
      isActive: true,
    };
    
    const newChannels = [...channels, newChannel];
    await saveData(newChannels);
    console.log('✅ Added channel:', newChannel.name);
    return true;
  };

  const removeChannel = async (id: string) => {
    const newChannels = channels.filter(ch => ch.id !== id);
    await saveData(newChannels);
    console.log('✅ Removed channel:', id);
  };

  const toggleChannel = async (id: string) => {
    const newChannels = channels.map(ch =>
      ch.id === id ? { ...ch, isActive: !ch.isActive } : ch
    );
    await saveData(newChannels);
  };

  const syncChannel = async (id: string) => {
    // TODO: Real sync with YouTube Data API
    const newChannels = channels.map(ch =>
      ch.id === id ? { ...ch, lastSyncedAt: Date.now() } : ch
    );
    await saveData(newChannels);
    console.log('✅ Synced channel:', id);
  };

  const syncAllChannels = async () => {
    // TODO: Real sync with YouTube Data API
    const newChannels = channels.map(ch => ({ ...ch, lastSyncedAt: Date.now() }));
    await saveData(newChannels);
    console.log('✅ Synced all channels');
  };

  const canAddMoreChannels = (): boolean => {
    // Unlimited mode after 22 channels
    if (totalSlots >= MAX_TIER_SLOTS) {
      return true;
    }
    return channels.length < totalSlots;
  };

  const getAdsRequiredForNextSlot = (): number => {
    // Always 2 ads to unlock 1 additional channel (after free 11)
    return ADS_PER_SLOT;
  };

  const unlockSlots = async (slots: number): Promise<boolean> => {
    // Each call unlocks 1 additional slot (after watching 2 ads)
    const newSlots = totalSlots + 1;
    
    await saveData(channels, newSlots);
    console.log(`✅ Unlocked 1 slot. New total: ${newSlots}`);
    return true;
  };

  const refresh = async () => {
    await loadData();
  };

  const slotConfig: ChannelSlotConfig = {
    totalSlots,
    usedSlots: channels.length,
    availableSlots: totalSlots >= MAX_TIER_SLOTS ? 999 : totalSlots - channels.length,
    nextTier: totalSlots < MAX_TIER_SLOTS
      ? { slots: totalSlots + 1, adsRequired: ADS_PER_SLOT }
      : null, // Unlimited after 22, but still shows 2 ads per channel requirement
  };

  const value: YouTubeChannelsContextType = {
    channels,
    slotConfig,
    isLoading,
    addChannel,
    removeChannel,
    toggleChannel,
    syncChannel,
    syncAllChannels,
    canAddMoreChannels,
    getAdsRequiredForNextSlot,
    unlockSlots,
    refresh,
  };

  return <YouTubeChannelsContext.Provider value={value}>{children}</YouTubeChannelsContext.Provider>;
}

export function useYouTubeChannels() {
  const context = useContext(YouTubeChannelsContext);
  if (!context) {
    throw new Error('useYouTubeChannels must be used within YouTubeChannelsProvider');
  }
  return context;
}
