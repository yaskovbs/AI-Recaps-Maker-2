import React, { createContext, useState, useContext, ReactNode, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { useRouter, useSegments } from 'expo-router';
import { blink } from '@/lib/blink';

interface User {
  id: string;
  email: string;
  name?: string;
  provider: 'email' | 'google' | 'github' | 'apple' | 'microsoft' | 'guest';
  isAdmin?: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithMicrosoft: () => Promise<void>;
  sendMagicLink: (email: string) => Promise<void>;
  continueAsGuest: () => Promise<void>;
  signOut: () => Promise<void>;
  freezeAccount: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  geminiApiKey: string;
  setGeminiApiKey: (key: string) => Promise<boolean>;
  clearGeminiKey: () => Promise<boolean>;
  hasGeminiKey: boolean;
  youtubeApiKey: string;
  setYoutubeApiKey: (key: string) => Promise<boolean>;
  clearYoutubeKey: () => Promise<boolean>;
  hasYoutubeKey: boolean;
  googleSearchApiKey: string;
  setGoogleSearchApiKey: (key: string) => Promise<boolean>;
  clearGoogleSearchKey: () => Promise<boolean>;
  hasGoogleSearchKey: boolean;
  searchEngineId: string;
  setSearchEngineId: (id: string) => Promise<boolean>;
  clearSearchEngineId: () => Promise<boolean>;
  hasSearchEngineId: boolean;
  googleClientId: string;
  setGoogleClientId: (id: string) => Promise<boolean>;
  clearGoogleClientId: () => Promise<boolean>;
  hasGoogleClientId: boolean;
  googleClientSecret: string;
  setGoogleClientSecret: (secret: string) => Promise<boolean>;
  clearGoogleClientSecret: () => Promise<boolean>;
  hasGoogleClientSecret: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const GEMINI_KEY_STORAGE = '@airm_gemini_api_key';
const YOUTUBE_KEY_STORAGE = '@airm_youtube_api_key';
const GOOGLE_SEARCH_KEY_STORAGE = '@airm_google_search_api_key';
const SEARCH_ENGINE_ID_STORAGE = '@airm_search_engine_id';
const GOOGLE_CLIENT_ID_STORAGE = '@airm_google_client_id';
const GOOGLE_CLIENT_SECRET_STORAGE = '@airm_google_client_secret';
const GUEST_USER_KEY = '@airm_guest_user';

const ADMIN_EMAIL = 'yaskovbs2502@gmail.com';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [geminiApiKey, setGeminiApiKeyState] = useState('');
  const [youtubeApiKey, setYoutubeApiKeyState] = useState('');
  const [googleSearchApiKey, setGoogleSearchApiKeyState] = useState('');
  const [searchEngineId, setSearchEngineIdState] = useState('');
  const [googleClientId, setGoogleClientIdState] = useState('');
  const [googleClientSecret, setGoogleClientSecretState] = useState('');

  // Keep a ref to user so makeKeyOps closure always sees the latest value
  const userRef = useRef<User | null>(null);
  useEffect(() => { userRef.current = user; }, [user]);

  const router = useRouter();
  const segments = useSegments();

  /**
   * Load API keys from Blink DB user_profiles (cloud sync)
   * Falls back to AsyncStorage values already in state
   */
  const loadProfileKeys = async (userId: string) => {
    try {
      const profiles = await blink.db.userProfiles.list({ where: { userId }, limit: 1 });
      if (profiles.length > 0) {
        const profile = profiles[0] as any;
        if (profile.geminiApiKey) setGeminiApiKeyState(profile.geminiApiKey);
        if (profile.youtubeApiKey) setYoutubeApiKeyState(profile.youtubeApiKey);
        if (profile.googleSearchApiKey) setGoogleSearchApiKeyState(profile.googleSearchApiKey);
        if (profile.searchEngineId) setSearchEngineIdState(profile.searchEngineId);
      }
    } catch (err) {
      console.warn('⚠️ Could not load profile keys from DB:', err);
    }
  };

  /**
   * Upsert a field in user_profiles for the current authenticated user
   */
  const upsertProfileField = async (userId: string, field: string, value: string) => {
    try {
      const profiles = await blink.db.userProfiles.list({ where: { userId }, limit: 1 });
      if (profiles.length > 0) {
        await blink.db.userProfiles.update((profiles[0] as any).id, { [field]: value });
      } else {
        await blink.db.userProfiles.create({ userId, [field]: value });
      }
    } catch (err) {
      console.warn('⚠️ Could not upsert profile field:', err);
    }
  };

  useEffect(() => {
    // Load API keys from local storage first (instant)
    loadLocalKeys();

    // Listen to Blink auth state changes
    const unsubscribe = blink.auth.onAuthStateChanged(async (state: any) => {
      if (state.isLoading) return;

      if (state.user) {
        const mappedUser: User = {
          id: state.user.id,
          email: state.user.email || '',
          name: state.user.displayName || state.user.email?.split('@')[0],
          provider: 'email',
          isAdmin: state.user.email === ADMIN_EMAIL,
        };
        setUser(mappedUser);
        // Sync API keys from cloud profile
        await loadProfileKeys(state.user.id);
      } else {
        // Check for guest user in storage
        const guestStored = await AsyncStorage.getItem(GUEST_USER_KEY).catch(() => null);
        if (guestStored) {
          setUser(JSON.parse(guestStored));
        } else {
          setUser(null);
        }
      }
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === '(tabs)';
    if (!user && inAuthGroup) {
      router.replace('/login');
    } else if (user && !inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user, segments, isLoading]);

  const loadLocalKeys = async () => {
    try {
      const [gem, yt, gs, sei, gci, gcs] = await Promise.all([
        AsyncStorage.getItem(GEMINI_KEY_STORAGE),
        AsyncStorage.getItem(YOUTUBE_KEY_STORAGE),
        AsyncStorage.getItem(GOOGLE_SEARCH_KEY_STORAGE),
        AsyncStorage.getItem(SEARCH_ENGINE_ID_STORAGE),
        AsyncStorage.getItem(GOOGLE_CLIENT_ID_STORAGE),
        AsyncStorage.getItem(GOOGLE_CLIENT_SECRET_STORAGE),
      ]);
      if (gem) setGeminiApiKeyState(gem);
      if (yt) setYoutubeApiKeyState(yt);
      if (gs) setGoogleSearchApiKeyState(gs);
      if (sei) setSearchEngineIdState(sei);
      if (gci) setGoogleClientIdState(gci);
      if (gcs) setGoogleClientSecretState(gcs);
    } catch {}
  };

  const signIn = async (email: string, password: string) => {
    await AsyncStorage.removeItem(GUEST_USER_KEY);
    await blink.auth.signInWithEmail(email, password);
  };

  const signUp = async (email: string, password: string, name?: string) => {
    await AsyncStorage.removeItem(GUEST_USER_KEY);
    await blink.auth.signUp({ email, password, displayName: name });
  };

  const signInWithGoogle = async () => {
    await AsyncStorage.removeItem(GUEST_USER_KEY);
    await blink.auth.signInWithGoogle();
  };

  const signInWithGitHub = async () => {
    await AsyncStorage.removeItem(GUEST_USER_KEY);
    await blink.auth.signInWithGitHub();
  };

  const signInWithApple = async () => {
    await AsyncStorage.removeItem(GUEST_USER_KEY);
    await blink.auth.signInWithApple();
  };

  const signInWithMicrosoft = async () => {
    await AsyncStorage.removeItem(GUEST_USER_KEY);
    await blink.auth.signInWithMicrosoft();
  };

  const sendMagicLink = async (email: string) => {
    await blink.auth.sendMagicLink(email);
  };

  const continueAsGuest = async () => {
    const guestUser: User = {
      id: `guest_${Date.now()}`,
      email: 'guest@local',
      name: 'אורח',
      provider: 'guest',
    };
    await AsyncStorage.setItem(GUEST_USER_KEY, JSON.stringify(guestUser));
    setUser(guestUser);
  };

  const signOut = async () => {
    await AsyncStorage.removeItem(GUEST_USER_KEY);
    await blink.auth.signOut();
    setUser(null);
  };

  const freezeAccount = async () => {
    await signOut();
  };

  const deleteAccount = async () => {
    await signOut();
  };

  /**
   * Build set/clear operations for an API key.
   * profileField — camelCase field name in user_profiles (optional).
   *   Keys that are only local (client/secret) won't sync to DB.
   */
  const makeKeyOps = (
    storageKey: string,
    setState: (v: string) => void,
    profileField?: string
  ) => ({
    set: async (value: string): Promise<boolean> => {
      if (!value.trim()) return false;
      await AsyncStorage.setItem(storageKey, value.trim()).catch(() => {});
      setState(value.trim());
      // Sync to Blink DB if authenticated (non-guest)
      const currentUser = userRef.current;
      if (currentUser && !currentUser.id.startsWith('guest_') && profileField) {
        await upsertProfileField(currentUser.id, profileField, value.trim());
      }
      return true;
    },
    clear: async (): Promise<boolean> => {
      await AsyncStorage.removeItem(storageKey).catch(() => {});
      setState('');
      // Clear in Blink DB if authenticated (non-guest)
      const currentUser = userRef.current;
      if (currentUser && !currentUser.id.startsWith('guest_') && profileField) {
        await upsertProfileField(currentUser.id, profileField, '');
      }
      return true;
    },
  });

  const gemOps  = makeKeyOps(GEMINI_KEY_STORAGE,        setGeminiApiKeyState,       'geminiApiKey');
  const ytOps   = makeKeyOps(YOUTUBE_KEY_STORAGE,        setYoutubeApiKeyState,      'youtubeApiKey');
  const gsOps   = makeKeyOps(GOOGLE_SEARCH_KEY_STORAGE,  setGoogleSearchApiKeyState, 'googleSearchApiKey');
  const seiOps  = makeKeyOps(SEARCH_ENGINE_ID_STORAGE,   setSearchEngineIdState,     'searchEngineId');
  // Client ID and Secret are local-only (sensitive, not stored in Blink DB)
  const gciOps  = makeKeyOps(GOOGLE_CLIENT_ID_STORAGE,   setGoogleClientIdState);
  const gcsOps  = makeKeyOps(GOOGLE_CLIENT_SECRET_STORAGE, setGoogleClientSecretState);

  const value: AuthContextType = {
    user,
    isLoading,
    signIn,
    signUp,
    signInWithGoogle,
    signInWithGitHub,
    signInWithApple,
    signInWithMicrosoft,
    sendMagicLink,
    continueAsGuest,
    signOut,
    freezeAccount,
    deleteAccount,
    geminiApiKey,
    setGeminiApiKey: gemOps.set,
    clearGeminiKey: gemOps.clear,
    hasGeminiKey: !!geminiApiKey,
    youtubeApiKey,
    setYoutubeApiKey: ytOps.set,
    clearYoutubeKey: ytOps.clear,
    hasYoutubeKey: !!youtubeApiKey,
    googleSearchApiKey,
    setGoogleSearchApiKey: gsOps.set,
    clearGoogleSearchKey: gsOps.clear,
    hasGoogleSearchKey: !!googleSearchApiKey,
    searchEngineId,
    setSearchEngineId: seiOps.set,
    clearSearchEngineId: seiOps.clear,
    hasSearchEngineId: !!searchEngineId,
    googleClientId,
    setGoogleClientId: gciOps.set,
    clearGoogleClientId: gciOps.clear,
    hasGoogleClientId: !!googleClientId,
    googleClientSecret,
    setGoogleClientSecret: gcsOps.set,
    clearGoogleClientSecret: gcsOps.clear,
    hasGoogleClientSecret: !!googleClientSecret,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
