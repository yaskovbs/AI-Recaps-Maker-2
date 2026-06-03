import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RAGCustomization, DEFAULT_CUSTOMIZATION } from '@/services/rag-customization';

export interface RecapAdvancedSettings {
  movieTitle: string;
  movieDescription: string;
  selectedGenre: string;
  recapHours: number;
  recapMinutes: number;
  recapSeconds: number;
  cutMinutes: number;
  cutSeconds: number;
  ragCustomization: RAGCustomization;
  webSearchEnabled: boolean;
  youTubeLearningEnabled: boolean;
  continuousLearningEnabled: boolean;
}

export const DEFAULT_ADVANCED_SETTINGS: RecapAdvancedSettings = {
  movieTitle: '',
  movieDescription: '',
  selectedGenre: 'sci-fi',
  recapHours: 0,
  recapMinutes: 4,
  recapSeconds: 0,
  cutMinutes: 0,
  cutSeconds: 9,
  ragCustomization: { ...DEFAULT_CUSTOMIZATION },
  webSearchEnabled: false,
  youTubeLearningEnabled: false,
  continuousLearningEnabled: false,
};

interface AdvancedSettingsContextType {
  settings: RecapAdvancedSettings;
  updateSettings: (partial: Partial<RecapAdvancedSettings>) => void;
  resetSettings: () => void;
  isLoaded: boolean;
}

const STORAGE_KEY = '@airm_advanced_settings_v1';

const AdvancedSettingsContext = createContext<AdvancedSettingsContextType | undefined>(undefined);

export function AdvancedSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<RecapAdvancedSettings>({ ...DEFAULT_ADVANCED_SETTINGS });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            setSettings((prev) => ({ ...prev, ...parsed }));
          } catch {}
        }
      })
      .catch(() => {})
      .finally(() => setIsLoaded(true));
  }, []);

  const updateSettings = useCallback((partial: Partial<RecapAdvancedSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const resetSettings = useCallback(() => {
    setSettings({ ...DEFAULT_ADVANCED_SETTINGS });
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  }, []);

  return (
    <AdvancedSettingsContext.Provider value={{ settings, updateSettings, resetSettings, isLoaded }}>
      {children}
    </AdvancedSettingsContext.Provider>
  );
}

export function useAdvancedSettings() {
  const ctx = useContext(AdvancedSettingsContext);
  if (!ctx) throw new Error('useAdvancedSettings must be used within AdvancedSettingsProvider');
  return ctx;
}
