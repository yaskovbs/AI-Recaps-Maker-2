import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Rating {
  userId: string;
  rating: number; // 1-5
  timestamp: number;
}

interface RatingContextType {
  ratings: Rating[];
  averageRating: number;
  totalRatings: number;
  userRating: number | null;
  submitRating: (rating: number, userId: string) => Promise<void>;
}

const RatingContext = createContext<RatingContextType | undefined>(undefined);

const STORAGE_KEY = '@airm_ratings';

export function RatingProvider({ children }: { children: ReactNode }) {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [userRating, setUserRating] = useState<number | null>(null);

  useEffect(() => {
    loadRatings();
  }, []);

  const loadRatings = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedRatings = JSON.parse(stored);
        setRatings(parsedRatings);
      }
    } catch (error) {
      console.error('Failed to load ratings:', error);
    }
  };

  const submitRating = async (rating: number, userId: string) => {
    try {
      // Remove old rating from same user
      const filtered = ratings.filter((r) => r.userId !== userId);
      
      const newRating: Rating = {
        userId,
        rating,
        timestamp: Date.now(),
      };
      
      const updated = [...filtered, newRating];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setRatings(updated);
      setUserRating(rating);
    } catch (error) {
      console.error('Failed to submit rating:', error);
    }
  };

  const averageRating = ratings.length > 0
    ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
    : 0;

  const value: RatingContextType = {
    ratings,
    averageRating,
    totalRatings: ratings.length,
    userRating,
    submitRating,
  };

  return <RatingContext.Provider value={value}>{children}</RatingContext.Provider>;
}

export function useRating() {
  const context = useContext(RatingContext);
  if (!context) {
    throw new Error('useRating must be used within RatingProvider');
  }
  return context;
}
