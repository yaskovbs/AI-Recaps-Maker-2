import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { blink } from '@/lib/blink';
import { useAuth } from './AuthContext';

export interface Recap {
  id: string;
  userId: string;
  title: string;
  description?: string;
  genre: string;
  duration: number;
  cutInterval: number;
  inputType: 'mp4' | 'mp3-txt' | 'record';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  errorMessage?: string;
  videoUrl?: string;
  audioUrl?: string;
  scriptUrl?: string;
  thumbnailUrl?: string;
  renderedUrl?: string;
  visibility: 'public' | 'private';
  views: number;
  shares: number;
  rating: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRecapInput {
  title: string;
  description?: string;
  genre: string;
  duration: number;
  cutInterval: number;
  inputType: 'mp4' | 'mp3-txt' | 'record';
  visibility?: 'public' | 'private';
  videoUrl?: string;
  audioUrl?: string;
  scriptUrl?: string;
}

interface RecapsContextType {
  recaps: Recap[];
  publicRecaps: Recap[];
  isLoading: boolean;
  createRecap: (input: CreateRecapInput) => Promise<Recap>;
  updateRecap: (id: string, updates: Partial<Recap>) => Promise<void>;
  deleteRecap: (id: string) => Promise<void>;
  getRecapById: (id: string) => Promise<Recap | null>;
  getMyRecaps: () => Recap[];
  getPublicRecaps: () => Recap[];
  getCompletedRecaps: () => Recap[];
  getProcessingRecaps: () => Recap[];
  getFailedRecaps: () => Recap[];
  togglePublicStatus: (id: string) => Promise<void>;
  incrementViews: (id: string) => Promise<void>;
  incrementShares: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
  refreshPublic: () => Promise<void>;
  addRecap: (recapData: any) => Promise<string>;
}

const RecapsContext = createContext<RecapsContextType | undefined>(undefined);

export function RecapsProvider({ children }: { children: ReactNode }) {
  const [recaps, setRecaps] = useState<Recap[]>([]);
  const [publicRecaps, setPublicRecaps] = useState<Recap[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user && !user.id.startsWith('guest_')) {
      loadRecaps();
    } else {
      setRecaps([]);
      setIsLoading(false);
    }
    loadPublicRecaps();
  }, [user]);

  const loadRecaps = async () => {
    if (!user || user.id.startsWith('guest_')) return;
    try {
      setIsLoading(true);
      const data = await blink.db.recaps.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      });
      setRecaps(data as Recap[]);
    } catch (error) {
      console.error('❌ Failed to load recaps:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPublicRecaps = async () => {
    try {
      // Fetch by visibility only (AND compound query causes HTTP 400 in Blink SDK)
      // then filter completed client-side
      const data = await blink.db.recaps.list({
        where: { visibility: 'public' },
        orderBy: { createdAt: 'desc' },
        limit: 100,
      });
      const completed = (data as Recap[]).filter((r) => r.status === 'completed');
      setPublicRecaps(completed.slice(0, 50));
    } catch (error) {
      console.error('❌ Failed to load public recaps:', error);
      // Don't crash — silently keep empty list
      setPublicRecaps([]);
    }
  };

  const createRecap = async (input: CreateRecapInput): Promise<Recap> => {
    if (!user) throw new Error('User not authenticated');
    const data = await blink.db.recaps.create({
      userId: user.id,
      title: input.title,
      description: input.description,
      genre: input.genre,
      duration: input.duration,
      cutInterval: input.cutInterval,
      inputType: input.inputType,
      status: 'pending',
      progress: 0,
      visibility: input.visibility || 'private',
      views: 0,
      shares: 0,
      rating: 0,
      videoUrl: input.videoUrl,
      audioUrl: input.audioUrl,
      scriptUrl: input.scriptUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const recap = data as Recap;
    setRecaps(prev => [recap, ...prev]);
    return recap;
  };

  const updateRecap = async (id: string, updates: Partial<Recap>) => {
    await blink.db.recaps.update(id, { ...updates, updatedAt: new Date().toISOString() });
    setRecaps(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const deleteRecap = async (id: string) => {
    await blink.db.recaps.delete(id);
    setRecaps(prev => prev.filter(r => r.id !== id));
  };

  const getRecapById = async (id: string): Promise<Recap | null> => {
    const data = await blink.db.recaps.get(id);
    return data as Recap | null;
  };

  const getMyRecaps = () => recaps;
  const getPublicRecaps = () => publicRecaps;
  const getCompletedRecaps = () => recaps.filter(r => r.status === 'completed');
  const getProcessingRecaps = () => recaps.filter(r => r.status === 'processing' || r.status === 'pending');
  const getFailedRecaps = () => recaps.filter(r => r.status === 'failed');

  const togglePublicStatus = async (id: string) => {
    const recap = recaps.find(r => r.id === id);
    if (!recap) return;
    const newVisibility = recap.visibility === 'public' ? 'private' : 'public';
    await updateRecap(id, { visibility: newVisibility });
  };

  const incrementViews = async (id: string) => {
    const recap = recaps.find(r => r.id === id);
    if (recap) await updateRecap(id, { views: recap.views + 1 });
  };

  const incrementShares = async (id: string) => {
    const recap = recaps.find(r => r.id === id);
    if (recap) await updateRecap(id, { shares: recap.shares + 1 });
  };

  const refresh = async () => loadRecaps();
  const refreshPublic = async () => loadPublicRecaps();

  const addRecap = async (recapData: any): Promise<string> => {
    if (!user || user.id.startsWith('guest_')) {
      return `mock_recap_${Date.now()}`;
    }
    const recap = await createRecap({
      title: recapData.title,
      description: recapData.description,
      genre: recapData.genre,
      duration: recapData.duration,
      cutInterval: 9,
      inputType: recapData.sourceType === 'text' ? 'mp3-txt' : 'mp4',
      visibility: recapData.isPublic ? 'public' : 'private',
    });
    return recap.id;
  };

  const value: RecapsContextType = {
    recaps,
    publicRecaps,
    isLoading,
    createRecap,
    updateRecap,
    deleteRecap,
    getRecapById,
    getMyRecaps,
    getPublicRecaps,
    getCompletedRecaps,
    getProcessingRecaps,
    getFailedRecaps,
    togglePublicStatus,
    incrementViews,
    incrementShares,
    refresh,
    refreshPublic,
    addRecap,
  };

  return <RecapsContext.Provider value={value}>{children}</RecapsContext.Provider>;
}

export function useRecaps() {
  const context = useContext(RecapsContext);
  if (!context) throw new Error('useRecaps must be used within RecapsProvider');
  return context;
}
