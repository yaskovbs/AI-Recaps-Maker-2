import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Modal, Alert, Platform, ActivityIndicator } from 'react-native';
import { ComponentProps, useState, useEffect, useRef, ReactNode } from 'react';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCredits } from '@/contexts/CreditsContext';
import { useAdMob } from '@/contexts/AdMobContext';
import { useRecaps } from '@/contexts/RecapsContext';
import { useAdvancedSettings } from '@/contexts/AdvancedSettingsContext';
import { useAuth } from '@/contexts/AuthContext';
import { useYouTubeChannels } from '@/contexts/YouTubeChannelsContext';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { uploadFile, formatFileSize, validateFileFormat, SUPPORTED_FORMATS } from '@/services/upload';
import { canUserUpload, getUploadCreditCost } from '@/services/upload-limits';
import RecapCustomizationPanel from '@/components/RecapCustomizationPanel';
import CreditsPurchaseModal from '@/components/CreditsPurchaseModal';
import UploadProgressBar from '@/components/UploadProgressBar';
import VideoChaptersEditor, { Chapter } from '@/components/VideoChaptersEditor';
import SocialSharePreview from '@/components/SocialSharePreview';
import { RAGCustomization, DEFAULT_CUSTOMIZATION } from '@/services/rag-customization';
import { PipelineEvent, RecapJob, getRecapJob, subscribeToJobEvents, createRecapJob } from '@/services/pipeline';
import { processWithGemini, subscribeToRecap } from '@/services/gemini';
import { analyzeTxtFile, analyzeMp3File, TxtAnalysisResult, Mp3AnalysisResult, AnalysisEvent } from '@/services/file-analysis';
import { uploadFileInChunks, ChunkUploadProgress, formatETA, formatSpeed, createAbortToken, UploadAbortToken, CHUNK_SIZE, getPendingUploads, registerBackgroundUploadTask } from '@/services/chunked-upload';
import NetInfo from '@react-native-community/netinfo';
import { AppState, AppStateStatus } from 'react-native';

type WizardStep = 1 | 2 | 3 | 4 | 5;

const GENRES = [
  { value: 'sci-fi', labelHe: 'מדע בדיוני', labelEn: 'Sci-Fi' },
  { value: 'action', labelHe: 'אקשן', labelEn: 'Action' },
  { value: 'drama', labelHe: 'דרמה', labelEn: 'Drama' },
  { value: 'comedy', labelHe: 'קומדיה', labelEn: 'Comedy' },
  { value: 'thriller', labelHe: 'מותחן', labelEn: 'Thriller' },
  { value: 'horror', labelHe: 'אימה', labelEn: 'Horror' },
  { value: 'romance', labelHe: 'רומנטי', labelEn: 'Romance' },
  { value: 'mystery', labelHe: 'מסתורין', labelEn: 'Mystery' },
  { value: 'fantasy', labelHe: 'פנטזיה', labelEn: 'Fantasy' },
  { value: 'adventure', labelHe: 'הרפתקאות', labelEn: 'Adventure' },
  { value: 'crime', labelHe: 'פשע', labelEn: 'Crime' },
  { value: 'war', labelHe: 'מלחמה', labelEn: 'War' },
  { value: 'historical', labelHe: 'היסטורי', labelEn: 'Historical' },
  { value: 'biographical', labelHe: 'ביוגרפי', labelEn: 'Biographical' },
  { value: 'animation', labelHe: 'אנימציה', labelEn: 'Animation' },
  { value: 'family', labelHe: 'משפחתי', labelEn: 'Family' },
  { value: 'musical', labelHe: 'מוזיקלי', labelEn: 'Musical' },
  { value: 'sport', labelHe: 'ספורט', labelEn: 'Sport' },
  { value: 'documentary', labelHe: 'דוקומנטרי', labelEn: 'Documentary' },
  { value: 'western', labelHe: 'ווסטרן', labelEn: 'Western' },
];

export default function CreateScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, isRTL } = useLanguage();
  const { balance, earnCreditFromAd, consumeForRecap, hasEnoughCredits } = useCredits();
  const { showRewardedAd, showInterstitialAd } = useAdMob();
  const { addRecap } = useRecaps();
  const { channels } = useYouTubeChannels();
  const { geminiApiKey } = useAuth();
  const [showAdModal, setShowAdModal] = useState(false);
  const [isCreatingRecap, setIsCreatingRecap] = useState(false);

  // Pipeline state
  const [lastJobId, setLastJobId] = useState<string | null>(null);
  const [pipelineJob, setPipelineJob] = useState<RecapJob | null>(null);
  const [pipelineEvents, setPipelineEvents] = useState<PipelineEvent[]>([]);
  const [isJobProcessing, setIsJobProcessing] = useState(false);
  const pipelineUnsubRef = useRef<(() => void) | null>(null);

  // Gemini processing status
  const [processingStatus, setProcessingStatus] = useState<'idle' | 'processing' | 'done' | 'error'>('idle');
  const [processingMessage, setProcessingMessage] = useState('');
  const pollingCleanupRef = useRef<(() => void) | null>(null);
  
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [scriptText, setScriptText] = useState('');
  const [txtFile, setTxtFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [mp3File, setMp3File] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [videoFile, setVideoFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  
  // Advanced Settings State
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [movieTitle, setMovieTitle] = useState('Siren (2018) Season 1 Episode 1 TV Show Recap');
  // RAG Customization State
  const [ragCustomization, setRagCustomization] = useState<RAGCustomization>({ ...DEFAULT_CUSTOMIZATION });
  const [selectedGenre, setSelectedGenre] = useState('sci-fi');
  const [movieDescription, setMovieDescription] = useState('');
  const [recapHours, setRecapHours] = useState(0);
  const [recapMinutes, setRecapMinutes] = useState(4);
  const [recapSeconds, setRecapSeconds] = useState(0);
  const [cutMinutes, setCutMinutes] = useState(0);
  const [cutSeconds, setCutSeconds] = useState(9);
  
  // Processing States
  const [isProcessingTxt, setIsProcessingTxt] = useState(false);
  const [isProcessingMp3, setIsProcessingMp3] = useState(false);
  const [isProcessingVideo, setIsProcessingVideo] = useState(false);
  const [txtProcessed, setTxtProcessed] = useState(false);
  const [mp3Processed, setMp3Processed] = useState(false);
  const [videoProcessed, setVideoProcessed] = useState(false);
  const [txtAnalysisResult, setTxtAnalysisResult] = useState<TxtAnalysisResult | null>(null);
  const [mp3AnalysisResult, setMp3AnalysisResult] = useState<Mp3AnalysisResult | null>(null);
  const [txtAnalysisEvents, setTxtAnalysisEvents] = useState<AnalysisEvent[]>([]);
  const [mp3AnalysisEvents, setMp3AnalysisEvents] = useState<AnalysisEvent[]>([]);
  
  // Upload Progress States
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const [videoUploadLoaded, setVideoUploadLoaded] = useState(0);
  const [videoUploadTotal, setVideoUploadTotal] = useState(0);
  const [mp3UploadProgress, setMp3UploadProgress] = useState(0);
  const [txtUploadProgress, setTxtUploadProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [scriptUrl, setScriptUrl] = useState<string>('');
  
  // Final Recap State
  const [isRecapComplete, setIsRecapComplete] = useState(false);
  const [finalRecapFile, setFinalRecapFile] = useState<{
    uri: string;
    name: string;
    size: number;
  } | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Chapters State
  const [videoChapters, setVideoChapters] = useState<Chapter[]>([]);
  
  // Draft persistence
  const DRAFT_KEY = '@airm_wizard_draft_v2';
  useEffect(() => {
    AsyncStorage.getItem(DRAFT_KEY)
      .then((stored) => {
        if (!stored) return;
        try {
          const d = JSON.parse(stored);
          if (d.scriptText) setScriptText(d.scriptText);
          if (d.movieTitle) setMovieTitle(d.movieTitle);
          if (d.selectedGenre) setSelectedGenre(d.selectedGenre);
          if (d.movieDescription) setMovieDescription(d.movieDescription);
          if (typeof d.recapHours === 'number') setRecapHours(d.recapHours);
          if (typeof d.recapMinutes === 'number') setRecapMinutes(d.recapMinutes);
          if (typeof d.recapSeconds === 'number') setRecapSeconds(d.recapSeconds);
          if (typeof d.cutMinutes === 'number') setCutMinutes(d.cutMinutes);
          if (typeof d.cutSeconds === 'number') setCutSeconds(d.cutSeconds);
          // Restore step: allow Step 5 only when there's a lastJobId to resume
          if (typeof d.currentStep === 'number' && d.currentStep >= 1 && d.currentStep <= 5) {
            const canRestoreStep5 = d.currentStep === 5 && !!d.lastJobId;
            if (d.currentStep < 5 || canRestoreStep5) {
              setCurrentStep(d.currentStep as WizardStep);
            }
          }
          // Restore lastJobId and rehydrate job state for Step 5 resume
          if (d.lastJobId) {
            setLastJobId(d.lastJobId);
            // Re-hydrate pipeline state so Step 5 can resume
            getRecapJob(d.lastJobId)
              .then((storedJob) => {
                if (!storedJob) return;
                setPipelineJob(storedJob);
                // Restore persisted events (from incremental draft saves during prior session)
                if (d.pipelineEvents && Array.isArray(d.pipelineEvents) && d.pipelineEvents.length > 0) {
                  setPipelineEvents(d.pipelineEvents);
                } else if (storedJob.events && storedJob.events.length > 0) {
                  setPipelineEvents(storedJob.events);
                }
                if (storedJob.status === 'completed') {
                  const safeName = (storedJob.title || 'recap').replace(/[^a-zA-Z0-9]/g, '_');
                  setFinalRecapFile({
                    uri: storedJob.outputUrl || `file://mock/recaps/${storedJob.id}/${safeName}_recap.mp4`,
                    name: `${safeName}_recap.mp4`,
                    size: 25600000,
                  });
                  setIsRecapComplete(true);
                } else if (storedJob.status === 'processing') {
                  setIsJobProcessing(true);
                  if (pipelineUnsubRef.current) pipelineUnsubRef.current();
                  const unsub = subscribeToJobEvents(
                    storedJob,
                    (ev: PipelineEvent) => setPipelineEvents((prev) => [...prev, ev]),
                    (completedJob: RecapJob) => {
                      setIsJobProcessing(false);
                      const n = (completedJob.title || 'recap').replace(/[^a-zA-Z0-9]/g, '_');
                      setFinalRecapFile({
                        uri: completedJob.outputUrl || `file://mock/recaps/${completedJob.id}/${n}_recap.mp4`,
                        name: `${n}_recap.mp4`,
                        size: 25600000,
                      });
                      setIsRecapComplete(true);
                    },
                    () => setIsJobProcessing(false)
                  );
                  pipelineUnsubRef.current = unsub;
                }
              })
              .catch((e) => console.warn('[Draft] getRecapJob failed during restore:', e));
          }
        } catch (e) {
          console.warn('[Draft] Failed to parse stored draft on restore:', e);
        }
      })
      .catch((e) => console.warn('[Draft] Failed to read draft on restore:', e));
  }, []);

  // Unmount cleanup: cancel any active pipeline subscription
  useEffect(() => {
    return () => {
      if (pipelineUnsubRef.current) {
        pipelineUnsubRef.current();
        pipelineUnsubRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (isRecapComplete) {
      AsyncStorage.removeItem(DRAFT_KEY).catch((e) => console.warn('[Draft] Failed to remove:', e));
      return;
    }
    const draft = {
      scriptText, movieTitle, selectedGenre, movieDescription,
      recapHours, recapMinutes, recapSeconds, cutMinutes, cutSeconds,
      currentStep, lastJobId,
    };
    AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(draft)).catch((e) => console.warn('[Draft] Failed to save:', e));
  }, [scriptText, movieTitle, selectedGenre, movieDescription, recapHours, recapMinutes, recapSeconds, cutMinutes, cutSeconds, currentStep, lastJobId, isRecapComplete]);

  // Calculate estimated segments
  const calculateSegments = () => {
    const totalRecapSeconds = recapHours * 3600 + recapMinutes * 60 + recapSeconds;
    const cutIntervalSeconds = cutMinutes * 60 + cutSeconds;
    
    if (cutIntervalSeconds === 0) return { segments: 0, clipDuration: 0 };
    
    const segments = Math.floor(totalRecapSeconds / cutIntervalSeconds);
    const clipDuration = 1; // Each clip is 1 second as per example
    
    return { segments, clipDuration };
  };
  
  const { segments, clipDuration } = calculateSegments();

  const handleNext = async () => {
    // Guard: no-op when processing or already complete
    if (isJobProcessing || isRecapComplete) return;
    if (currentStep < 5) {
      setCurrentStep((prev) => (prev + 1) as WizardStep);
    } else {
      // Final step - attempt recap creation
      await handleCreateRecap();
    }
  };

  const handleCreateRecap = async () => {
    // Check if user has credits
    if (hasEnoughCredits(1)) {
      // Has credits - show interstitial ad with consent, then create
      await showInterstitialConfirmation();
    } else {
      // No credits - must watch rewarded ad
      setShowAdModal(true);
    }
  };

  const showInterstitialConfirmation = async () => {
    // Show native alert for interstitial consent
    const confirmed = await new Promise<boolean>((resolve) => {
      const { Alert } = require('react-native');
      Alert.alert(
        isRTL ? 'אישור יצירה' : 'Confirm Creation',
        isRTL
          ? 'נציג מודעה קצרה לפני יצירת הסיכום. להמשיך?'
          : "We'll show a short ad before creating your recap. Continue?",
        [
          {
            text: isRTL ? 'ביטול' : 'Cancel',
            style: 'cancel',
            onPress: () => resolve(false),
          },
          {
            text: isRTL ? 'המשך' : 'Continue',
            onPress: () => resolve(true),
          },
        ]
      );
    });

    if (!confirmed) {
      return;
    }

    // Show interstitial ad
    setIsCreatingRecap(true);
    try {
      const adShown = await showInterstitialAd();
      if (adShown) {
        // Ad shown successfully - now consume credit and create
        await finalizeRecapCreation();
      } else {
        // Ad failed to show - still create (fallback)
        await finalizeRecapCreation();
      }
    } catch (error) {
      console.error('Interstitial error:', error);
      await finalizeRecapCreation();
    } finally {
      setIsCreatingRecap(false);
    }
  };

  // Derive backward-compat single-value fields from multi-select arrays
  // so edge functions / processWithGemini that expect tonePreference/targetAudience still work
  const effectiveCustomization = {
    ...ragCustomization,
    tonePreference: ragCustomization.tonePreferences?.[0] ?? 'dramatic',
    targetAudience: ragCustomization.targetAudiences?.[0] ?? 'general',
  } as RAGCustomization;

  const finalizeRecapCreation = async () => {
    // Idempotency: prevent duplicate calls while a job is already in-flight or complete
    if (isJobProcessing || isRecapComplete || pipelineJob !== null) return;
    const consumed = await consumeForRecap();
    if (consumed) {
      // Create recap record
      try {
        console.log('🎬 Creating recap...');
        const recapId = await addRecap({
          userId: 'user_current', // Will be replaced with real user ID from auth
          title: movieTitle || scriptText.substring(0, 50) || (isRTL ? 'סיכום ללא כותרת' : 'Untitled Recap'),
          description: movieDescription || scriptText.substring(0, 200),
          genre: selectedGenre,
          duration: recapHours * 3600 + recapMinutes * 60 + recapSeconds || 180,
          status: 'processing',
          sourceType: scriptText ? 'text' : 'txt',
          isPublic: false, // Default to private
          views: 0,
          rating: 0,
          steps: {
            step1: true,
            step2: false,
            step3: false,
            step4: false,
            step5: false,
            step6: false,
          },
        });
        
        if (!recapId) {
          throw new Error('Failed to create recap');
        }
        
        console.log('✅ Recap created with ID:', recapId);
        console.log('📊 Settings:', { movieTitle, selectedGenre, segments, clipDuration });

        // ── Gemini AI Processing ───────────────────────────────────────────
        if (geminiApiKey && videoUrl) {
          console.log('🤖 Starting Gemini AI processing...');
          setProcessingStatus('processing');
          setProcessingMessage(isRTL ? 'מעבד עם Gemini AI...' : 'Processing with Gemini AI...');

          // Start live status polling
          pollingCleanupRef.current = subscribeToRecap(recapId, (recap) => {
            if (recap.status === 'completed') {
              setProcessingStatus('done');
              setProcessingMessage(isRTL ? '✅ עיבוד Gemini הסתיים!' : '✅ Gemini processing done!');
            } else if (recap.status === 'failed') {
              setProcessingStatus('error');
              setProcessingMessage(isRTL ? '⚠️ עיבוד נכשל' : '⚠️ Processing failed');
            } else {
              const pct = recap.progress ?? 0;
              setProcessingMessage(
                isRTL
                  ? `מעבד... ${pct}%`
                  : `Processing... ${pct}%`
              );
            }
          });

          const { data: geminiData, error: geminiError } = await processWithGemini({
            recapId,
            geminiApiKey,
            customization: effectiveCustomization,
          });

          pollingCleanupRef.current?.();
          pollingCleanupRef.current = null;

          if (geminiError) {
            console.warn('⚠️ Gemini processing error:', geminiError);
            setProcessingStatus('error');
            setProcessingMessage(geminiError);
          } else if (geminiData) {
            console.log('✅ Gemini processed:', geminiData.sceneCount, 'scenes');
            setProcessingStatus('done');
            setProcessingMessage(
              isRTL
                ? `✅ ${geminiData.sceneCount ?? 0} סצינות זוהו`
                : `✅ ${geminiData.sceneCount ?? 0} scenes detected`
            );
            // If edge function returned a final script URL, use it as the recap file
            if (geminiData.scriptUrl) {
              const recapFileName = `${movieTitle.replace(/[^a-zA-Z0-9]/g, '_')}_recap.txt`;
              setFinalRecapFile({ uri: geminiData.scriptUrl, name: recapFileName, size: 0 });
              setIsRecapComplete(true);
              setProcessingStatus('idle');
              return;
            }
          }
        } else {
          if (!geminiApiKey) {
            console.log('ℹ️ No Gemini API key — skipping AI processing. Add key in Settings.');
          }
        }

        // Fallback mock result (when no Gemini key or API call succeeded without file URL)
        const mockFileName = `${movieTitle.replace(/[^a-zA-Z0-9]/g, '_')}_recap.mp4`;
        const mockFile = {
          uri: `file://mock/recaps/${recapId}/${mockFileName}`,
          name: mockFileName,
          size: 25600000,
        };
        setFinalRecapFile(mockFile);
        setIsRecapComplete(true);
        setProcessingStatus('idle');
        console.log('✅ Recap finalized:', mockFile.name);
        
      } catch (error) {
        console.error('Failed to create recap:', error);
        const { Alert } = require('react-native');
        Alert.alert(
          isRTL ? 'שגיאה' : 'Error',
          isRTL ? 'נכשל ביצירת הסיכום' : 'Failed to create recap',
          [{ text: 'OK' }]
        );
      }
    } else {
      const { Alert } = require('react-native');
      Alert.alert(
        isRTL ? 'שגיאה' : 'Error',
        isRTL ? 'נכשל ביצירת הסיכום' : 'Failed to create recap',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      console.log('🎬 Creating recap job via pipeline...');
      // Clear previous pipeline state
      setPipelineEvents([]);
      setIsJobProcessing(true);

      // Save recap to local DB first
      const recapId = await addRecap({
        userId: 'user_current',
        title: movieTitle || scriptText.substring(0, 50) || (isRTL ? 'סיכום ללא כותרת' : 'Untitled Recap'),
        description: movieDescription || scriptText.substring(0, 200),
        genre: selectedGenre,
        duration: recapHours * 3600 + recapMinutes * 60 + recapSeconds || 180,
        status: 'processing',
        sourceType: mp3File ? 'audio' : scriptText ? 'text' : 'txt',
        isPublic: false,
        views: 0,
        rating: 0,
        steps: { step1: true, step2: false, step3: false, step4: false, step5: false },
      });

      if (!recapId) throw new Error('Failed to save recap to database');
      console.log('✅ Recap saved locally, ID:', recapId);

      // Read personal learning consent (set in YouTube Channels screen)
      let personalConsentGiven = false;
      try {
        const stored = await AsyncStorage.getItem('@airm_yt_personal_learning');
        personalConsentGiven = stored === 'true';
      } catch {
        // Non-fatal
      }
      const activeChannels = channels
        .filter((ch) => ch.isActive && ch.handle && ch.channelId)
        .map((ch) => ({ handle: ch.handle as string, channelId: ch.channelId as string }));

      // Create job via pipeline service (uses real backend or simulation fallback)
      const job = await createRecapJob({
        title: movieTitle || 'Untitled Recap',
        genre: selectedGenre,
        durationSeconds: recapHours * 3600 + recapMinutes * 60 + recapSeconds || 180,
        scriptText: scriptText || undefined,
        audioUrl: mp3File?.uri || undefined,
        videoUrl: videoFile?.uri || undefined,
        learningContext: personalConsentGiven && activeChannels.length > 0
          ? { personalConsentGiven, activeChannels }
          : undefined,
      });

      setPipelineJob(job);
      setLastJobId(job.id);
      console.log('📡 Pipeline job created:', job.id);

      // Cancel any previous subscription
      if (pipelineUnsubRef.current) pipelineUnsubRef.current();

      // Subscribe to per-step pipeline events
      const unsub = subscribeToJobEvents(
        job,
        (event: PipelineEvent) => {
          console.log(`📊 Pipeline event [${event.type}]:`, event.step, event.message);
          setPipelineEvents(prev => {
            const updated = [...prev, event];
            // Persist events incrementally so cross-session resume can show prior progress
            AsyncStorage.getItem(DRAFT_KEY).then((stored) => {
              try {
                const draft = stored ? JSON.parse(stored) : {};
                AsyncStorage.setItem(DRAFT_KEY, JSON.stringify({ ...draft, pipelineEvents: updated })).catch((e) => console.warn('[Draft] Failed to persist events:', e));
              } catch (e) {
                console.warn('[Draft] Failed to parse stored draft for event persistence:', e);
              }
            }).catch((e) => console.warn('[Draft] Failed to read draft for event persistence:', e));
            return updated;
          });
        },
        (completedJob: RecapJob) => {
          console.log('✅ Recap pipeline complete:', completedJob.id);
          setIsJobProcessing(false);
          const safeName = (movieTitle || 'recap').replace(/[^a-zA-Z0-9]/g, '_');
          const mockFileName = `${safeName}_recap.mp4`;
          setFinalRecapFile({
            uri: completedJob.outputUrl || `file://mock/recaps/${completedJob.id}/${mockFileName}`,
            name: mockFileName,
            size: 25600000,
          });
          setIsRecapComplete(true);
        },
        (error: Error) => {
          console.error('❌ Pipeline error:', error);
          setIsJobProcessing(false);
          // Clear pipelineJob so Step 5 exits the stale "processing" view on failure
          setPipelineJob(null);
          // Refund credit on pipeline runtime failure (consistent with job-creation failure)
          earnCreditFromAd().catch((e) => console.warn('[Credit] Refund failed on pipeline error:', e));
          Alert.alert(
            isRTL ? 'שגיאת עיבוד' : 'Processing Error',
            `${error.message} ${isRTL ? '(הקרדיט הוחזר)' : '(Credit refunded)'}`,
            [{ text: 'OK' }]
          );
        }
      );
      pipelineUnsubRef.current = unsub;

    } catch (error) {
      console.error('Failed to create recap:', error);
      setIsJobProcessing(false);
      // Clear pipelineJob so Step 5 doesn't stay in stale "processing" view
      setPipelineJob(null);
      // Refund consumed credit when job creation fails
      await earnCreditFromAd().catch((e) => console.warn('[Credit] Refund failed on job creation error:', e));
      Alert.alert(
        isRTL ? 'שגיאה' : 'Error',
        isRTL ? 'נכשל ביצירת הסיכום. הקרדיט הוחזר.' : 'Failed to create recap. Credit refunded.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleWatchAdForCredit = async () => {
    try {
      const result = await showRewardedAd();
      
      if (result.success) {
        // Earned credit from ad
        await earnCreditFromAd();
        setShowAdModal(false);
        
        const { Alert } = require('react-native');
        Alert.alert(
          isRTL ? 'נהדר!' : 'Great!',
          isRTL ? 'קיבלת 1 קרדיט! עכשיו תוכל ליצור סיכום' : 'You earned 1 credit! You can now create a recap',
          [
            {
              text: 'OK',
              onPress: () => handleCreateRecap(), // Try create again
            },
          ]
        );
      } else {
        const { Alert } = require('react-native');
        Alert.alert(
          isRTL ? 'שגיאה' : 'Error',
          isRTL ? 'לא הצלחנו להציג מודעה כרגע' : 'Could not show ad at this time',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Rewarded ad error:', error);
      const { Alert } = require('react-native');
      Alert.alert(
        isRTL ? 'שגיאה' : 'Error',
        isRTL ? 'אירעה שגיאה' : 'An error occurred',
        [{ text: 'OK' }]
      );
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as WizardStep);
    }
  };
  
  const handleAdvancedSettingsSave = () => setShowAdvancedSettings(false);

  const [isGeneratingChapters, setIsGeneratingChapters] = useState(false);
  const generateAIChapters = async () => {
    setIsGeneratingChapters(true);
    try {
      await new Promise<void>((r) => setTimeout(r, 1500));
      setVideoChapters([
        { id: '1', title: isRTL ? 'פרק 1' : 'Chapter 1', startTime: 0, endTime: 60, includeInRecap: true },
        { id: '2', title: isRTL ? 'פרק 2' : 'Chapter 2', startTime: 60, endTime: 120, includeInRecap: true },
      ]);
    } finally {
      setIsGeneratingChapters(false);
    }
  };

  // Register background task once on mount + handle foreground resume
  useEffect(() => {
    registerBackgroundUploadTask();
    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        // App returned to foreground — check for pending background uploads
        getPendingUploads().then((pending) => {
          if (pending.length > 0) {
            console.log(`[BG Resume] ${pending.length} pending upload(s) detected on foreground`);
          }
        }).catch(() => {});
      }
    });
    return () => sub.remove();
  }, []);

  const handleStartNewRecap = () => {
    // Reset all pipeline and completion state to allow creating a new recap in the same session
    setPipelineJob(null);
    setPipelineEvents([]);
    setIsRecapComplete(false);
    setIsJobProcessing(false);
    setFinalRecapFile(null);
    setLastJobId(null);
    setCurrentStep(1);
    setScriptText('');
    setMovieTitle('');
    setMovieDescription('');
    AsyncStorage.removeItem(DRAFT_KEY).catch((e) => console.warn('[Draft] Failed to clear draft:', e));
  };

  const handleDownloadRecap = async () => {
    if (!finalRecapFile) {
      Alert.alert(
        isRTL ? 'שגיאה' : 'Error',
        isRTL ? 'קובץ הסיכום לא נמצא' : 'Recap file not found',
        [{ text: 'OK' }]
      );
      return;
    }
    
    setIsDownloading(true);
    
    try {
      console.log('📥 Starting download:', finalRecapFile.name);
      
      // For web - create download link
      if (Platform.OS === 'web') {
        // Mock download for web
        const link = document.createElement('a');
        link.href = finalRecapFile.uri;
        link.download = finalRecapFile.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        Alert.alert(
          isRTL ? 'הצלחה!' : 'Success!',
          isRTL ? 'הקובץ הורד בהצלחה' : 'File downloaded successfully',
          [{ text: 'OK' }]
        );
      } else {
        // For mobile - save to Downloads folder
        const fileUri = FileSystem.documentDirectory + finalRecapFile.name;
        
        // In real app, you would download from server here
        // For now, we'll create a mock file or use Sharing
        
        // Check if sharing is available
        const isSharingAvailable = await Sharing.isAvailableAsync();
        
        if (isSharingAvailable) {
          // Share the file (which allows saving to device)
          await Sharing.shareAsync(finalRecapFile.uri, {
            mimeType: 'video/mp4',
            dialogTitle: isRTL ? 'שמור סיכום' : 'Save Recap',
            UTI: 'public.mpeg-4',
          });
          
          Alert.alert(
            isRTL ? 'הצלחה!' : 'Success!',
            isRTL ? 'הקובץ זמין לשמירה' : 'File available for saving',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert(
            isRTL ? 'שגיאה' : 'Error',
            isRTL ? 'שיתוף קבצים לא זמין במכשיר זה' : 'File sharing not available on this device',
            [{ text: 'OK' }]
          );
        }
      }
      
      console.log('✅ Download completed!');
    } catch (error) {
      console.error('❌ Download error:', error);
      Alert.alert(
        isRTL ? 'שגיאה' : 'Error',
        isRTL ? 'הורדת הקובץ נכשלה' : 'File download failed',
        [{ text: 'OK' }]
      );
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t.createRecap}</Text>
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        {[1, 2, 3, 4, 5].map((step) => (
          <View key={step} style={styles.progressStep}>
            <View
              style={[
                styles.progressDot,
                step === currentStep && styles.progressDotActive,
                step < currentStep && styles.progressDotComplete,
              ]}
            >
              {step < currentStep ? (
                <MaterialIcons name="check" size={16} color="#FFF" />
              ) : (
                <Text style={styles.progressNumber}>{step}</Text>
              )}
            </View>
            {step < 5 && (
              <View
                style={[
                  styles.progressLine,
                  step < currentStep && styles.progressLineComplete,
                ]}
              />
            )}
          </View>
        ))}
      </View>

      {/* Step Title */}
      <Text style={styles.stepTitle}>
        {t[`step${currentStep}Title` as keyof typeof t] as string}
      </Text>

      {/* Step Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {currentStep === 1 && <Step1Content scriptText={scriptText} setScriptText={setScriptText} txtFile={txtFile} setTxtFile={setTxtFile} mp3File={mp3File} setMp3File={setMp3File} isProcessingTxt={isProcessingTxt} setIsProcessingTxt={setIsProcessingTxt} isProcessingMp3={isProcessingMp3} setIsProcessingMp3={setIsProcessingMp3} setTxtProcessed={setTxtProcessed} setMp3Processed={setMp3Processed} txtAnalysisResult={txtAnalysisResult} setTxtAnalysisResult={setTxtAnalysisResult} mp3AnalysisResult={mp3AnalysisResult} setMp3AnalysisResult={setMp3AnalysisResult} txtAnalysisEvents={txtAnalysisEvents} setTxtAnalysisEvents={setTxtAnalysisEvents} mp3AnalysisEvents={mp3AnalysisEvents} setMp3AnalysisEvents={setMp3AnalysisEvents} />}
        {currentStep === 2 && <Step2Content videoChapters={videoChapters} setVideoChapters={setVideoChapters} mp3File={mp3File} txtFile={txtFile} txtAnalysisResult={txtAnalysisResult} mp3AnalysisResult={mp3AnalysisResult} />}
        {currentStep === 3 && <Step3Content videoFile={videoFile} setVideoFile={setVideoFile} isProcessingVideo={isProcessingVideo} setIsProcessingVideo={setIsProcessingVideo} setVideoProcessed={setVideoProcessed} videoUploadProgress={videoUploadProgress} setVideoUploadProgress={setVideoUploadProgress} videoUploadLoaded={videoUploadLoaded} setVideoUploadLoaded={setVideoUploadLoaded} videoUploadTotal={videoUploadTotal} setVideoUploadTotal={setVideoUploadTotal} setVideoUrl={setVideoUrl} creditBalance={balance} />}
        {currentStep === 4 && <Step4Content movieTitle={movieTitle} setMovieTitle={setMovieTitle} movieDescription={movieDescription} setMovieDescription={setMovieDescription} selectedGenre={selectedGenre} setSelectedGenre={setSelectedGenre} recapHours={recapHours} setRecapHours={setRecapHours} recapMinutes={recapMinutes} setRecapMinutes={setRecapMinutes} recapSeconds={recapSeconds} setRecapSeconds={setRecapSeconds} cutMinutes={cutMinutes} setCutMinutes={setCutMinutes} cutSeconds={cutSeconds} setCutSeconds={setCutSeconds} ragCustomization={ragCustomization} setRagCustomization={setRagCustomization} segments={segments} clipDuration={clipDuration} />}
        {currentStep === 5 && <Step5Content balance={balance} isRecapComplete={isRecapComplete} isJobProcessing={isJobProcessing} pipelineEvents={pipelineEvents} pipelineJob={pipelineJob} finalRecapFile={finalRecapFile} isDownloading={isDownloading} onDownload={handleDownloadRecap} movieTitle={movieTitle} movieDescription={movieDescription} selectedGenre={selectedGenre} segments={segments} videoChapters={videoChapters} isGeneratingChapters={isGeneratingChapters} generateAIChapters={generateAIChapters} />}
      </ScrollView>

      {/* Ad Requirement Modal */}
      <Modal
        visible={showAdModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAdModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <MaterialIcons name="stars" size={48} color={Colors.primary} />
            <Text style={styles.modalTitle}>
              {isRTL ? 'אין קרדיטים' : 'No Credits'}
            </Text>
            <Text style={styles.modalMessage}>
              {isRTL
                ? 'צפה במודעה מתגמלת כדי לקבל 1 קרדיט ולהמשיך ביצירת הסיכום'
                : 'Watch a rewarded ad to earn 1 credit and continue creating your recap'}
            </Text>
            
            <View style={styles.modalActions}>
              <Pressable
                style={({ pressed }) => [
                  styles.modalCancelButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => setShowAdModal(false)}
              >
                <Text style={styles.modalCancelText}>
                  {isRTL ? 'ביטול' : 'Cancel'}
                </Text>
              </Pressable>
              
              <Pressable
                style={({ pressed }) => [
                  styles.modalWatchButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={handleWatchAdForCredit}
              >
                <LinearGradient
                  colors={[Colors.primary, Colors.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.modalWatchGradient}
                >
                  <MaterialIcons name="play-circle-filled" size={20} color="#FFF" />
                  <Text style={styles.modalWatchText}>
                    {isRTL ? 'צפה במודעה' : 'Watch Ad'}
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>
            
            {/* Buy credits option */}
            <Pressable
              style={({ pressed }) => [styles.buyCreditsLink, pressed && { opacity: 0.7 }]}
              onPress={() => { setShowAdModal(false); setShowCreditsModal(true); }}
            >
              <MaterialIcons name="shopping-cart" size={14} color={Colors.primary} />
              <Text style={styles.buyCreditsLinkText}>
                {isRTL ? 'קנה קרדיטים עם Stripe' : 'Or buy credits with Stripe'}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Credits Purchase Modal */}
      <CreditsPurchaseModal
        visible={showCreditsModal}
        onClose={() => setShowCreditsModal(false)}
        userId="user_current"
        currentBalance={balance}
        onPurchaseComplete={(newBal) => {
          console.log('Credits updated:', newBal);
          setShowCreditsModal(false);
        }}
        isRTL={isRTL}
      />

      {/* Advanced Settings Modal */}
      <Modal
        visible={showAdvancedSettings}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAdvancedSettings(false)}
      >
        <View style={styles.advancedModalOverlay}>
          <View style={styles.advancedModalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Header */}
              <View style={styles.advancedHeader}>
                <Text style={styles.advancedTitle}>
                  {isRTL ? 'הגדרות סיכום מתקדמות' : 'Advanced Recap Settings'}
                </Text>
                <Pressable onPress={() => setShowAdvancedSettings(false)} style={styles.advancedCloseButton}>
                  <MaterialIcons name="close" size={24} color={Colors.text} />
                </Pressable>
              </View>

              {/* Movie Title */}
              <View style={styles.advancedField}>
                <Text style={styles.advancedLabel}>
                  {isRTL ? 'כותרת הסרט/סדרה' : 'Movie/Series Title'} *
                </Text>
                <TextInput
                  style={styles.advancedInput}
                  placeholder={isRTL ? 'לדוגמה: Siren (2018) Season 1 Episode 1' : 'e.g., Siren (2018) Season 1 Episode 1'}
                  placeholderTextColor={Colors.textMuted}
                  value={movieTitle}
                  onChangeText={setMovieTitle}
                  textAlign={isRTL ? 'right' : 'left'}
                />
              </View>

              {/* Genre Selection */}
              <View style={styles.advancedField}>
                <Text style={styles.advancedLabel}>
                  {isRTL ? 'ז\'אנרים' : 'Genres'}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.genreScroll}>
                  {GENRES.map((genre) => (
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
              </View>

              {/* Description */}
              <View style={styles.advancedField}>
                <Text style={styles.advancedLabel}>
                  {isRTL ? 'תיאור הסרט/סדרה' : 'Movie/Series Description'}
                </Text>
                <TextInput
                  style={[styles.advancedInput, styles.advancedTextArea]}
                  placeholder={isRTL ? 'תאר את העלילה והדמויות...' : 'Describe the plot and characters...'}
                  placeholderTextColor={Colors.textMuted}
                  value={movieDescription}
                  onChangeText={setMovieDescription}
                  multiline
                  numberOfLines={4}
                  textAlign={isRTL ? 'right' : 'left'}
                  textAlignVertical="top"
                />
                <View style={styles.tipBox}>
                  <MaterialIcons name="lightbulb" size={16} color={Colors.warning} />
                  <Text style={styles.tipText}>
                    {isRTL
                      ? 'טיפ לשיפור איכות: תיאור מפורט יעזור ל-AI ליצור סיכום מדויק יותר ולכלול את הרגעים החשובים ביותר.'
                      : 'Quality tip: Detailed description helps AI create more accurate recap and include the most important moments.'}
                  </Text>
                </View>
              </View>

              {/* Recap Duration */}
              <View style={styles.advancedField}>
                <Text style={styles.advancedLabel}>
                  {isRTL ? 'אורך הסיכום (עד 3 שעות)' : 'Recap Duration (up to 3 hours)'}
                </Text>
                <View style={styles.timePickerRow}>
                  <View style={styles.timePickerGroup}>
                    <TextInput
                      style={styles.timeInput}
                      value={String(recapHours).padStart(2, '0')}
                      onChangeText={(val) => setRecapHours(Math.min(3, Math.max(0, parseInt(val) || 0)))}
                      keyboardType="number-pad"
                      maxLength={2}
                    />
                    <Text style={styles.timeLabel}>{isRTL ? 'שעות' : 'hours'}</Text>
                  </View>
                  <Text style={styles.timeSeparator}>:</Text>
                  <View style={styles.timePickerGroup}>
                    <TextInput
                      style={styles.timeInput}
                      value={String(recapMinutes).padStart(2, '0')}
                      onChangeText={(val) => setRecapMinutes(Math.min(59, Math.max(0, parseInt(val) || 0)))}
                      keyboardType="number-pad"
                      maxLength={2}
                    />
                    <Text style={styles.timeLabel}>{isRTL ? 'דקות' : 'minutes'}</Text>
                  </View>
                  <Text style={styles.timeSeparator}>:</Text>
                  <View style={styles.timePickerGroup}>
                    <TextInput
                      style={styles.timeInput}
                      value={String(recapSeconds).padStart(2, '0')}
                      onChangeText={(val) => setRecapSeconds(Math.min(59, Math.max(0, parseInt(val) || 0)))}
                      keyboardType="number-pad"
                      maxLength={2}
                    />
                    <Text style={styles.timeLabel}>{isRTL ? 'שניות' : 'seconds'}</Text>
                  </View>
                </View>
              </View>

              {/* Cut Interval */}
              <View style={styles.advancedField}>
                <Text style={styles.advancedLabel}>
                  {isRTL ? 'חתוך כל (דקות : שניות)' : 'Cut every (minutes : seconds)'}
                </Text>
                <View style={styles.timePickerRow}>
                  <View style={styles.timePickerGroup}>
                    <TextInput
                      style={styles.timeInput}
                      value={String(cutMinutes)}
                      onChangeText={(val) => setCutMinutes(Math.max(0, parseInt(val) || 0))}
                      keyboardType="number-pad"
                      maxLength={2}
                    />
                    <Text style={styles.timeLabel}>{isRTL ? 'דקות' : 'min'}</Text>
                  </View>
                  <Text style={styles.timeSeparator}>:</Text>
                  <View style={styles.timePickerGroup}>
                    <TextInput
                      style={styles.timeInput}
                      value={String(cutSeconds).padStart(2, '0')}
                      onChangeText={(val) => setCutSeconds(Math.min(59, Math.max(0, parseInt(val) || 0)))}
                      keyboardType="number-pad"
                      maxLength={2}
                    />
                    <Text style={styles.timeLabel}>{isRTL ? 'שניות' : 'sec'}</Text>
                  </View>
                </View>
                <Text style={styles.cutHint}>
                  {isRTL
                    ? `כל ${cutSeconds} שניות ייחתך קטע של ${clipDuration} שניות`
                    : `Every ${cutSeconds} seconds will cut a ${clipDuration} second clip`}
                </Text>
              </View>

              {/* AI RAG Customization Panel */}
              <View style={{ marginVertical: Spacing.md, borderTopWidth: 1, borderColor: Colors.border, paddingTop: Spacing.md }}>
                <RecapCustomizationPanel
                  genre={selectedGenre}
                  customization={ragCustomization}
                  onChange={setRagCustomization}
                  isRTL={isRTL}
                />
              </View>

              {/* Summary */}
              <View style={styles.summaryBox}>
                <Text style={styles.summaryTitle}>
                  {isRTL ? 'סיכום הגדרות:' : 'Settings Summary:'}
                </Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>{isRTL ? 'אורך סיכום:' : 'Recap duration:'}</Text>
                  <Text style={styles.summaryValue}>
                    {String(recapHours).padStart(2, '0')}:{String(recapMinutes).padStart(2, '0')}:{String(recapSeconds).padStart(2, '0')}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>{isRTL ? 'מרווח חיתוך:' : 'Cut interval:'}</Text>
                  <Text style={styles.summaryValue}>
                    {String(cutMinutes).padStart(2, '0')}:{String(cutSeconds).padStart(2, '0')}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>{isRTL ? 'קטעים משוערים:' : 'Estimated segments:'}</Text>
                  <Text style={styles.summaryValue}>~{segments} {isRTL ? 'קטעים' : 'segments'}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>{isRTL ? 'משך כל קטע:' : 'Each clip duration:'}</Text>
                  <Text style={styles.summaryValue}>{clipDuration} {isRTL ? 'שניות' : 'seconds'}</Text>
                </View>
              </View>

              {/* Save Button */}
              <Pressable
                style={({ pressed }) => [
                  styles.advancedSaveButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={handleAdvancedSettingsSave}
              >
                <LinearGradient
                  colors={[Colors.primary, Colors.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.advancedSaveGradient}
                >
                  <MaterialIcons name="save" size={20} color="#FFF" />
                  <Text style={styles.advancedSaveText}>
                    {isRTL ? 'שמור והמשך' : 'Save & Continue'}
                  </Text>
                </LinearGradient>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Bottom Actions */}
      <View style={[styles.bottomActions, { paddingBottom: insets.bottom + Spacing.md }]}>
        {currentStep > 1 && (
          <Pressable
            style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]}
            onPress={handleBack}
          >
            <MaterialIcons name={isRTL ? 'chevron-right' : 'chevron-left'} size={24} color={Colors.textSecondary} />
            <Text style={styles.backButtonText}>{t.back}</Text>
          </Pressable>
        )}
        
        <Pressable
          style={({ pressed }) => [
            styles.continueButton,
            pressed && styles.buttonPressed,
            (isJobProcessing || isRecapComplete) && { opacity: 0.4 },
          ]}
          onPress={handleNext}
          disabled={isJobProcessing || isRecapComplete}
        >
          <LinearGradient
            colors={[Colors.primary, Colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.continueGradient}
          >
            <Text style={styles.continueButtonText}>
              {currentStep === 5 ? t.finish : t.continue}
            </Text>
            <MaterialIcons name={isRTL ? 'chevron-left' : 'chevron-right'} size={24} color="#FFF" />
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

// Step Components
function Step1Content({ 
  scriptText, 
  setScriptText,
  txtFile,
  setTxtFile,
  mp3File,
  setMp3File,
  isProcessingTxt,
  setIsProcessingTxt,
  isProcessingMp3,
  setIsProcessingMp3,
  setTxtProcessed,
  setMp3Processed,
  txtAnalysisResult,
  setTxtAnalysisResult,
  mp3AnalysisResult,
  setMp3AnalysisResult,
  txtAnalysisEvents,
  setTxtAnalysisEvents,
  mp3AnalysisEvents,
  setMp3AnalysisEvents,
}: { 
  scriptText: string; 
  setScriptText: (text: string) => void;
  txtFile: DocumentPicker.DocumentPickerAsset | null;
  setTxtFile: (file: DocumentPicker.DocumentPickerAsset | null) => void;
  mp3File: DocumentPicker.DocumentPickerAsset | null;
  setMp3File: (file: DocumentPicker.DocumentPickerAsset | null) => void;
  isProcessingTxt: boolean;
  setIsProcessingTxt: (val: boolean) => void;
  isProcessingMp3: boolean;
  setIsProcessingMp3: (val: boolean) => void;
  setTxtProcessed: (val: boolean) => void;
  setMp3Processed: (val: boolean) => void;
  txtAnalysisResult: TxtAnalysisResult | null;
  setTxtAnalysisResult: (r: TxtAnalysisResult | null) => void;
  mp3AnalysisResult: Mp3AnalysisResult | null;
  setMp3AnalysisResult: (r: Mp3AnalysisResult | null) => void;
  txtAnalysisEvents: AnalysisEvent[];
  setTxtAnalysisEvents: (e: AnalysisEvent[]) => void;
  mp3AnalysisEvents: AnalysisEvent[];
  setMp3AnalysisEvents: (e: AnalysisEvent[]) => void;
}) {
  const { t, isRTL } = useLanguage();
  
  const handlePickTxt = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/plain',
        copyToCacheDirectory: false,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setTxtFile(file);
        setIsProcessingTxt(true);
        setTxtAnalysisEvents([]);
        setTxtAnalysisResult(null);
        
        const events: AnalysisEvent[] = [];
        const res = await analyzeTxtFile(
          file.uri,
          file.name,
          file.size || 0,
          Platform.OS as 'web' | 'mobile',
          (ev) => {
            events.push(ev);
            setTxtAnalysisEvents([...events]);
          }
        );
        
        if (res) {
          setTxtAnalysisResult(res);
          if (res.rawText && res.rawText.length > 10 && !res.rawText.startsWith('[')) {
            setScriptText(res.rawText);
          }
          setTxtProcessed(true);
        }
        setIsProcessingTxt(false);
      }
    } catch (error) {
      console.error('Error picking TXT file:', error);
      setIsProcessingTxt(false);
      Alert.alert(isRTL ? 'שגיאה' : 'Error', isRTL ? 'לא הצלחנו לבחור קובץ' : 'Failed to pick file');
    }
  };
  
  const handlePickMp3 = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: false,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setMp3File(file);
        setIsProcessingMp3(true);
        setMp3AnalysisEvents([]);
        setMp3AnalysisResult(null);
        
        const events: AnalysisEvent[] = [];
        const res = await analyzeMp3File(
          file.uri,
          file.name,
          file.size || 0,
          txtAnalysisResult,  // pass TXT data to enrich MP3 analysis
          (ev) => {
            events.push(ev);
            setMp3AnalysisEvents([...events]);
          }
        );
        
        if (res) {
          setMp3AnalysisResult(res);
          setMp3Processed(true);
        }
        setIsProcessingMp3(false);
      }
    } catch (error) {
      console.error('Error picking MP3 file:', error);
      setIsProcessingMp3(false);
      Alert.alert(isRTL ? 'שגיאה' : 'Error', isRTL ? 'לא הצלחנו לבחור קובץ' : 'Failed to pick file');
    }
  };

  const paceColor = (pace: 'slow' | 'normal' | 'fast') =>
    pace === 'fast' ? Colors.warning : pace === 'slow' ? Colors.primary : Colors.success;
  const paceLabel = (pace: 'slow' | 'normal' | 'fast') =>
    isRTL
      ? (pace === 'fast' ? 'מהיר' : pace === 'slow' ? 'איטי' : 'נורמלי')
      : (pace === 'fast' ? 'Fast' : pace === 'slow' ? 'Slow' : 'Normal');
  
  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepDescription}>
        {isRTL ? 'הדבק תסריט, העלה TXT, ואחרי זה MP3' : 'Paste script, upload TXT first, then MP3'}
      </Text>

      {/* Order indicator */}
      <View style={s1.orderRow}>
        <View style={[s1.orderBadge, txtFile ? s1.orderBadgeDone : s1.orderBadgeActive]}>
          <Text style={s1.orderNum}>1</Text>
        </View>
        <View style={s1.orderLine} />
        <View style={[s1.orderBadge, mp3File ? s1.orderBadgeDone : txtFile ? s1.orderBadgeActive : s1.orderBadgePending]}>
          <Text style={s1.orderNum}>2</Text>
        </View>
        <View style={s1.orderLine} />
        <View style={[s1.orderBadge, (txtFile || mp3File) ? s1.orderBadgeActive : s1.orderBadgePending]}>
          <MaterialIcons name="auto-awesome" size={14} color="#fff" />
        </View>
      </View>
      <View style={s1.orderLabels}>
        <Text style={s1.orderLabel}>{isRTL ? 'TXT' : 'TXT'}</Text>
        <Text style={s1.orderLabel}>{isRTL ? 'MP3' : 'MP3'}</Text>
        <Text style={s1.orderLabel}>{isRTL ? 'AI' : 'AI'}</Text>
      </View>
      
      {/* TXT Section */}
      <View style={s1.sectionCard}>
        <View style={s1.sectionHeader}>
          <View style={s1.sectionNum}><Text style={s1.sectionNumText}>1</Text></View>
          <MaterialIcons name="description" size={20} color={Colors.primary} />
          <Text style={s1.sectionTitle}>{isRTL ? 'קובץ TXT — תסריט / טקסט' : 'TXT File — Script / Text'}</Text>
          {txtFile && !isProcessingTxt && <MaterialIcons name="check-circle" size={18} color={Colors.success} />}
        </View>

        <TextInput
          style={styles.textInput}
          placeholder={isRTL ? 'הדבק תסריט כאן...' : 'Paste script here...'}
          placeholderTextColor={Colors.textMuted}
          value={scriptText}
          onChangeText={setScriptText}
          multiline
          textAlign={isRTL ? 'right' : 'left'}
        />

        <Pressable
          style={({ pressed }) => [
            s1.uploadBtn,
            txtFile && !isProcessingTxt && s1.uploadBtnDone,
            pressed && { opacity: 0.8 },
            isProcessingTxt && { opacity: 0.7 },
          ]}
          onPress={handlePickTxt}
          disabled={isProcessingTxt}
        >
          {isProcessingTxt
            ? <ActivityIndicator size="small" color={Colors.primary} />
            : <MaterialIcons name={txtFile ? 'swap-horiz' : 'upload-file'} size={20}
                color={txtFile && !isProcessingTxt ? Colors.success : Colors.primary} />}
          <Text style={[s1.uploadBtnText, txtFile && !isProcessingTxt && { color: Colors.success }]}>
            {isProcessingTxt
              ? (isRTL ? 'מנתח TXT...' : 'Analyzing TXT...')
              : txtFile
              ? (isRTL ? `שנה קובץ — ${txtFile.name}` : `Change — ${txtFile.name}`)
              : (isRTL ? 'בחר קובץ TXT' : 'Select TXT File')}
          </Text>
        </Pressable>

        {/* TXT Progress Events */}
        {txtAnalysisEvents.length > 0 && (
          <View style={s1.eventsBox}>
            {txtAnalysisEvents.map((ev, i) => (
              <AnalysisEventRow key={i} event={ev} isRTL={isRTL} />
            ))}
          </View>
        )}

        {/* TXT Result Card */}
        {txtAnalysisResult && !isProcessingTxt && (
          <View style={s1.resultCard}>
            <Text style={s1.resultTitle}>{isRTL ? '📄 תוצאות ניתוח TXT' : '📄 TXT Analysis Results'}</Text>
            <ResultRow icon="translate" label={isRTL ? 'שפה' : 'Language'}
              value={txtAnalysisResult.detectedLanguage === 'he' ? 'עברית' : txtAnalysisResult.detectedLanguage === 'en' ? 'English' : txtAnalysisResult.detectedLanguage} />
            <ResultRow icon="subject" label={isRTL ? 'מבנה' : 'Structure'}
              value={isRTL
                ? (txtAnalysisResult.structure === 'script' ? 'תסריט' : txtAnalysisResult.structure === 'prose' ? 'פרוזה' : txtAnalysisResult.structure === 'list' ? 'רשימה' : 'מעורב')
                : txtAnalysisResult.structure} />
            <ResultRow icon="format-size" label={isRTL ? 'מילים' : 'Words'}
              value={txtAnalysisResult.wordCount.toLocaleString()} />
            <ResultRow icon="schedule" label={isRTL ? 'זמן קריינות משוער' : 'Est. narration time'}
              value={`${txtAnalysisResult.estimatedNarrationMinutes} ${isRTL ? 'דקות' : 'min'}`} />
            {txtAnalysisResult.hasDialogue && (
              <ResultRow icon="chat" label={isRTL ? 'דיאלוגים' : 'Dialogue lines'}
                value={String(Math.round(txtAnalysisResult.dialogueLines))} />
            )}
            {txtAnalysisResult.preview ? (
              <View style={s1.previewBox}>
                <Text style={s1.previewLabel}>{isRTL ? 'תצוגה מקדימה:' : 'Preview:'}</Text>
                <Text style={s1.previewText} numberOfLines={3}>{txtAnalysisResult.preview}</Text>
              </View>
            ) : null}
          </View>
        )}
      </View>

      {/* MP3 Section — unlocked after TXT (or can skip TXT) */}
      <View style={[s1.sectionCard, !txtFile && { opacity: 0.6 }]}>
        <View style={s1.sectionHeader}>
          <View style={[s1.sectionNum, { backgroundColor: Colors.secondary + 'cc' }]}>
            <Text style={s1.sectionNumText}>2</Text>
          </View>
          <MaterialIcons name="audiotrack" size={20} color={Colors.secondary} />
          <Text style={s1.sectionTitle}>{isRTL ? 'קובץ MP3 — קריינות / שמע' : 'MP3 File — Audio / Narration'}</Text>
          {mp3File && !isProcessingMp3 && <MaterialIcons name="check-circle" size={18} color={Colors.success} />}
        </View>

        {!txtFile && (
          <View style={s1.tipBox}>
            <MaterialIcons name="info" size={14} color={Colors.textMuted} />
            <Text style={s1.tipText}>
              {isRTL ? 'מומלץ: העלה TXT קודם לניתוח מדויק יותר של האודיו' : 'Recommended: Upload TXT first for better audio analysis'}
            </Text>
          </View>
        )}

        <Pressable
          style={({ pressed }) => [
            s1.uploadBtn,
            { borderColor: Colors.secondary },
            mp3File && !isProcessingMp3 && s1.uploadBtnDone,
            pressed && { opacity: 0.8 },
            isProcessingMp3 && { opacity: 0.7 },
          ]}
          onPress={handlePickMp3}
          disabled={isProcessingMp3}
        >
          {isProcessingMp3
            ? <ActivityIndicator size="small" color={Colors.secondary} />
            : <MaterialIcons name={mp3File ? 'swap-horiz' : 'mic'} size={20}
                color={mp3File && !isProcessingMp3 ? Colors.success : Colors.secondary} />}
          <Text style={[s1.uploadBtnText, { color: Colors.secondary }, mp3File && !isProcessingMp3 && { color: Colors.success }]}>
            {isProcessingMp3
              ? (isRTL ? 'מנתח MP3...' : 'Analyzing MP3...')
              : mp3File
              ? (isRTL ? `שנה קובץ — ${mp3File.name}` : `Change — ${mp3File.name}`)
              : (isRTL ? 'בחר קובץ MP3' : 'Select MP3 File')}
          </Text>
        </Pressable>

        {/* MP3 Progress Events */}
        {mp3AnalysisEvents.length > 0 && (
          <View style={s1.eventsBox}>
            {mp3AnalysisEvents.map((ev, i) => (
              <AnalysisEventRow key={i} event={ev} isRTL={isRTL} />
            ))}
          </View>
        )}

        {/* MP3 Result Card */}
        {mp3AnalysisResult && !isProcessingMp3 && (
          <View style={[s1.resultCard, { borderColor: Colors.secondary + '44' }]}>
            <Text style={[s1.resultTitle, { color: Colors.secondary }]}>
              {isRTL ? '🎵 תוצאות ניתוח MP3' : '🎵 MP3 Analysis Results'}
            </Text>
            <ResultRow icon="timer" label={isRTL ? 'אורך משוער' : 'Est. duration'}
              value={mp3AnalysisResult.estimatedDurationDisplay} />
            <ResultRow icon="speed" label={isRTL ? 'קצב דיבור' : 'Speech rate'}
              value={
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={[s1.resultValue, { color: paceColor(mp3AnalysisResult.speechPaceLabel) }]}>
                    {mp3AnalysisResult.speechRateWPM} wpm
                  </Text>
                  <View style={[s1.paceBadge, { backgroundColor: paceColor(mp3AnalysisResult.speechPaceLabel) + '22',
                    borderColor: paceColor(mp3AnalysisResult.speechPaceLabel) + '66' }]}>
                    <Text style={[s1.paceBadgeText, { color: paceColor(mp3AnalysisResult.speechPaceLabel) }]}>
                      {paceLabel(mp3AnalysisResult.speechPaceLabel)}
                    </Text>
                  </View>
                </View>
              } />
            <ResultRow icon="format-list-numbered" label={isRTL ? 'מילים משוערות' : 'Est. words'}
              value={mp3AnalysisResult.estimatedWordCount.toLocaleString()} />
            <ResultRow icon="settings-input-antenna" label={isRTL ? 'ערוצים' : 'Channels'}
              value={mp3AnalysisResult.channels === 'stereo' ? (isRTL ? 'סטריאו' : 'Stereo') : (isRTL ? 'מונו' : 'Mono')} />
            <ResultRow icon="high-quality" label={isRTL ? 'קצב סיביות' : 'Bitrate'}
              value={mp3AnalysisResult.estimatedBitrate} />
            {mp3AnalysisResult.transcriptPreview ? (
              <View style={s1.previewBox}>
                <Text style={s1.previewLabel}>{isRTL ? 'תמלול משוער:' : 'Transcript preview:'}</Text>
                <Text style={s1.previewText} numberOfLines={3}>{mp3AnalysisResult.transcriptPreview}</Text>
              </View>
            ) : null}
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Analysis Event Row (shared) ───────────────────────────────────────────────
function AnalysisEventRow({ event, isRTL }: { event: AnalysisEvent; isRTL: boolean }) {
  const isDone  = event.type === 'completed';
  const isErr   = event.type === 'error';
  const isStart = event.type === 'started';
  const isProg  = event.type === 'progress';
  const icon: ComponentProps<typeof MaterialIcons>['name'] =
    isDone ? 'check-circle' : isErr ? 'error' : isStart ? 'play-circle-outline' : 'radio-button-checked';
  const color = isDone ? Colors.success : isErr ? Colors.error : isProg ? Colors.primary : Colors.textMuted;

  return (
    <View style={s1.eventRow}>
      <MaterialIcons name={icon} size={14} color={color} />
      <View style={{ flex: 1 }}>
        <Text style={[s1.eventMsg, { color }, isRTL && { textAlign: 'right' }]}>
          {event.message}
        </Text>
        {isProg && event.type === 'progress' && (
          <View style={s1.eventProgressTrack}>
            <View style={[s1.eventProgressFill, { width: `${event.pct}%` as any }]} />
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Result Row (shared) ───────────────────────────────────────────────────────
function ResultRow({
  icon, label, value,
}: {
  icon: ComponentProps<typeof MaterialIcons>['name'];
  label: string;
  value: string | React.ReactNode;
}) {
  return (
    <View style={s1.resultRow}>
      <MaterialIcons name={icon} size={14} color={Colors.textMuted} />
      <Text style={s1.resultLabel}>{label}:</Text>
      {typeof value === 'string'
        ? <Text style={s1.resultValue}>{value}</Text>
        : value}
    </View>
  );
}

// Step-1-only styles
const s1 = StyleSheet.create({
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
    marginBottom: 2,
  },
  orderBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.textMuted,
  },
  orderBadgeActive: { backgroundColor: Colors.primary },
  orderBadgeDone:   { backgroundColor: Colors.success },
  orderBadgePending:{ backgroundColor: Colors.surfaceLight },
  orderLine: {
    width: 40,
    height: 2,
    backgroundColor: Colors.border,
    marginHorizontal: 4,
  },
  orderNum: { fontSize: 12, fontWeight: '700', color: '#fff' },
  orderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '50%',
    marginBottom: 4,
    alignSelf: 'center',
  },
  orderLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '600' },
  sectionCard: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
    ...Shadows.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sectionNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary + 'cc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionNumText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  sectionTitle: {
    flex: 1,
    fontSize: Typography.body,
    fontWeight: '600',
    color: Colors.text,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(0, 212, 255, 0.08)',
    borderWidth: 1,
    borderColor: Colors.primary + '60',
  },
  uploadBtnDone: {
    backgroundColor: 'rgba(76, 175, 80, 0.08)',
    borderColor: Colors.success + '60',
  },
  uploadBtnText: {
    flex: 1,
    fontSize: Typography.body,
    fontWeight: '600',
    color: Colors.primary,
  },
  eventsBox: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
    paddingVertical: 2,
  },
  eventMsg: {
    fontSize: Typography.caption,
    lineHeight: 16,
  },
  eventProgressTrack: {
    height: 3,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 2,
    marginTop: 3,
    overflow: 'hidden',
  },
  eventProgressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  resultCard: {
    backgroundColor: 'rgba(0, 212, 255, 0.05)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
    gap: Spacing.xs,
  },
  resultTitle: {
    fontSize: Typography.body,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: 2,
  },
  resultLabel: {
    fontSize: Typography.caption,
    color: Colors.textSecondary,
    minWidth: 90,
  },
  resultValue: {
    fontSize: Typography.caption,
    fontWeight: '600',
    color: Colors.text,
  },
  previewBox: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    marginTop: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  previewLabel: {
    fontSize: Typography.caption,
    color: Colors.textMuted,
    fontWeight: '600',
    marginBottom: 2,
  },
  previewText: {
    fontSize: Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  paceBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  paceBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  tipBox: {
    flexDirection: 'row',
    gap: Spacing.xs,
    alignItems: 'flex-start',
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
  },
  tipText: {
    flex: 1,
    fontSize: Typography.caption,
    color: Colors.textMuted,
    lineHeight: 16,
  },
});

function Step2Content({
  videoChapters,
  setVideoChapters,
  mp3File,
  txtFile,
  txtAnalysisResult,
  mp3AnalysisResult,
}: {
  videoChapters: Chapter[];
  setVideoChapters: (c: Chapter[]) => void;
  mp3File?: import('expo-document-picker').DocumentPickerAsset | null;
  txtFile?: import('expo-document-picker').DocumentPickerAsset | null;
  txtAnalysisResult?: TxtAnalysisResult | null;
  mp3AnalysisResult?: Mp3AnalysisResult | null;
}) {
  const { isRTL } = useLanguage();

  // Readiness indicators
  const hasTxt = !!txtFile || !!txtAnalysisResult;
  const hasMp3 = !!mp3File || !!mp3AnalysisResult;

  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepDescription}>
        {isRTL ? 'סקירת קבצים מעובדים ועריכת פרקים' : 'Review processed files and edit chapters'}
      </Text>

      {/* TXT Summary */}
      <View style={[s2.fileCard, hasTxt && s2.fileCardReady]}>
        <View style={s2.fileCardHeader}>
          <MaterialIcons name="description" size={22}
            color={hasTxt ? Colors.success : Colors.textMuted} />
          <Text style={[s2.fileCardTitle, hasTxt && { color: Colors.success }]}>
            {isRTL ? 'קובץ TXT' : 'TXT File'}
          </Text>
          <MaterialIcons
            name={hasTxt ? 'check-circle' : 'radio-button-unchecked'}
            size={18}
            color={hasTxt ? Colors.success : Colors.textMuted}
          />
        </View>
        {txtAnalysisResult ? (
          <View style={s2.metaGrid}>
            <S2Meta label={isRTL ? 'מילים' : 'Words'} value={txtAnalysisResult.wordCount.toLocaleString()} />
            <S2Meta label={isRTL ? 'קריינות' : 'Narration'} value={`${txtAnalysisResult.estimatedNarrationMinutes}m`} />
            <S2Meta label={isRTL ? 'שפה' : 'Lang'}
              value={txtAnalysisResult.detectedLanguage === 'he' ? 'עברית' : txtAnalysisResult.detectedLanguage === 'en' ? 'EN' : txtAnalysisResult.detectedLanguage} />
            <S2Meta label={isRTL ? 'מבנה' : 'Structure'}
              value={isRTL
                ? (txtAnalysisResult.structure === 'script' ? 'תסריט' : txtAnalysisResult.structure === 'prose' ? 'פרוזה' : 'אחר')
                : txtAnalysisResult.structure} />
          </View>
        ) : (
          <Text style={s2.missingText}>
            {isRTL ? 'לא הועלה — ניתן להמשיך ללא TXT' : 'Not uploaded — can continue without TXT'}
          </Text>
        )}
      </View>

      {/* MP3 Summary */}
      <View style={[s2.fileCard, hasMp3 && s2.fileCardReady, { borderColor: hasMp3 ? Colors.success + '50' : Colors.border }]}>
        <View style={s2.fileCardHeader}>
          <MaterialIcons name="audiotrack" size={22}
            color={hasMp3 ? Colors.success : Colors.textMuted} />
          <Text style={[s2.fileCardTitle, hasMp3 && { color: Colors.success }]}>
            {isRTL ? 'קובץ MP3' : 'MP3 File'}
          </Text>
          <MaterialIcons
            name={hasMp3 ? 'check-circle' : 'radio-button-unchecked'}
            size={18}
            color={hasMp3 ? Colors.success : Colors.textMuted}
          />
        </View>
        {mp3AnalysisResult ? (
          <View style={s2.metaGrid}>
            <S2Meta label={isRTL ? 'אורך' : 'Duration'} value={mp3AnalysisResult.estimatedDurationDisplay} />
            <S2Meta label={isRTL ? 'קצב' : 'Pace'}
              value={`${mp3AnalysisResult.speechRateWPM} wpm`}
              color={mp3AnalysisResult.speechPaceLabel === 'fast' ? Colors.warning
                   : mp3AnalysisResult.speechPaceLabel === 'slow' ? Colors.primary : Colors.success} />
            <S2Meta label={isRTL ? 'ערוצים' : 'Channels'}
              value={mp3AnalysisResult.channels === 'stereo' ? (isRTL ? 'סטריאו' : 'Stereo') : (isRTL ? 'מונו' : 'Mono')} />
            <S2Meta label={isRTL ? 'קצב סיביות' : 'Bitrate'} value={mp3AnalysisResult.estimatedBitrate} />
          </View>
        ) : (
          <Text style={s2.missingText}>
            {isRTL ? 'לא הועלה — המערכת תייצר MP3 אוטומטית' : 'Not uploaded — system will auto-generate MP3'}
          </Text>
        )}
      </View>

      {/* Chapters Editor */}
      <VideoChaptersEditor
        chapters={videoChapters}
        onChange={setVideoChapters}
        totalDuration={mp3AnalysisResult?.estimatedDurationSeconds || 0}
        isRTL={isRTL}
      />
    </View>
  );
}

function S2Meta({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={s2.metaItem}>
      <Text style={[s2.metaValue, color ? { color } : {}]}>{value}</Text>
      <Text style={s2.metaLabel}>{label}</Text>
    </View>
  );
}

const s2 = StyleSheet.create({
  fileCard: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  fileCardReady: {
    borderColor: Colors.success + '50',
    backgroundColor: 'rgba(76,175,80,0.04)',
  },
  fileCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  fileCardTitle: {
    flex: 1,
    fontSize: Typography.body,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  metaItem: {
    alignItems: 'center',
    minWidth: 60,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  metaValue: {
    fontSize: Typography.body,
    fontWeight: '700',
    color: Colors.primary,
  },
  metaLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 1,
  },
  missingText: {
    fontSize: Typography.bodySmall,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
});

function Step3Content({
  videoFile,
  setVideoFile,
  isProcessingVideo,
  setIsProcessingVideo,
  setVideoProcessed,
  videoUploadProgress,
  setVideoUploadProgress,
  videoUploadLoaded,
  setVideoUploadLoaded,
  videoUploadTotal,
  setVideoUploadTotal,
  setVideoUrl,
  creditBalance,
}: { 
  videoFile: DocumentPicker.DocumentPickerAsset | null;
  setVideoFile: (file: DocumentPicker.DocumentPickerAsset | null) => void;
  isProcessingVideo: boolean;
  setIsProcessingVideo: (val: boolean) => void;
  setVideoProcessed: (val: boolean) => void;
  videoUploadProgress: number;
  setVideoUploadProgress: (progress: number) => void;
  videoUploadLoaded: number;
  setVideoUploadLoaded: (v: number) => void;
  videoUploadTotal: number;
  setVideoUploadTotal: (v: number) => void;
  setVideoUrl: (url: string) => void;
  creditBalance: number;
}) {
  const { isRTL } = useLanguage();
  const router = useRouter();
  const balance = creditBalance;

  // Chunked upload state
  const [chunkProgress, setChunkProgress] = React.useState<ChunkUploadProgress | null>(null);
  const [uploadSpeed, setUploadSpeed] = React.useState<string>('');
  const [uploadEta, setUploadEta] = React.useState<string>('');
  const [isBackgroundReady, setIsBackgroundReady] = React.useState(false);
  const abortTokenRef = React.useRef<UploadAbortToken | null>(null);

  // Network state
  const [networkType, setNetworkType] = React.useState<string>('unknown');
  const [isCellular, setIsCellular] = React.useState(false);

  // Subscribe to network changes
  React.useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      const type = state.type ?? 'unknown';
      setNetworkType(type);
      setIsCellular(type === 'cellular');
    });
    NetInfo.fetch().then((state) => {
      const type = state.type ?? 'unknown';
      setNetworkType(type);
      setIsCellular(type === 'cellular');
    });
    return () => unsub();
  }, []);

  // Check for pending background uploads when component mounts
  React.useEffect(() => {
    getPendingUploads().then((pending) => {
      if (pending.length > 0) {
        setIsBackgroundReady(true);
        console.log(`[Step3] ${pending.length} pending upload(s) from background`);
      }
    }).catch(() => {});
  }, []);

  const CELLULAR_WARN_BYTES = 500 * 1024 * 1024; // 500 MB
  const CHUNKED_THRESHOLD = 50 * 1024 * 1024;    // Use chunked upload for files > 50 MB

  const handlePickVideo = async () => {
    try {
      console.log('🎬 Opening video picker...');
      
      const result = await DocumentPicker.getDocumentAsync({
        type: 'video/*',
        copyToCacheDirectory: false,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        const fileSize = file.size || 0;

        // ── Format validation ──────────────────────────────────────────────
        if (!validateFileFormat(file.name, SUPPORTED_FORMATS.video)) {
          Alert.alert(
            isRTL ? 'פורמט לא נתמך' : 'Unsupported Format',
            isRTL
              ? `פורמטים נתמכים: ${SUPPORTED_FORMATS.video.join(', ')}`
              : `Supported formats: ${SUPPORTED_FORMATS.video.join(', ')}`,
            [{ text: 'OK' }]
          );
          return;
        }

        // ── Size validation (5 GB hard cap) ───────────────────────────────
        const maxSize = 5368709120;
        if (fileSize > maxSize) {
          Alert.alert(
            isRTL ? 'קובץ גדול מדי' : 'File Too Large',
            isRTL
              ? `גודל מקסימלי: ${formatFileSize(maxSize)}. הקובץ שלך: ${formatFileSize(fileSize)}`
              : `Maximum size: ${formatFileSize(maxSize)}. Your file: ${formatFileSize(fileSize)}`,
            [{ text: 'OK' }]
          );
          return;
        }

        // ── Cellular warning for files > 500 MB ───────────────────────────
        if (isCellular && fileSize > CELLULAR_WARN_BYTES) {
          const proceed = await new Promise<boolean>((resolve) => {
            Alert.alert(
              isRTL ? '⚠️ רשת סלולרית' : '⚠️ Cellular Network',
              isRTL
                ? `הקובץ שלך גדול (${formatFileSize(fileSize)}).\n\nהעלאה על רשת סלולרית תצרוך כ-${formatFileSize(fileSize)} מהמכסה שלך.\n\nמומלץ להתחבר ל-Wi-Fi לפני ההעלאה.`
                : `Your file is large (${formatFileSize(fileSize)}).\n\nUploading over cellular will use approximately ${formatFileSize(fileSize)} of your data plan.\n\nWi-Fi is strongly recommended.`,
              [
                { text: isRTL ? 'בטל' : 'Cancel', style: 'cancel', onPress: () => resolve(false) },
                { text: isRTL ? 'המשך בכל זאת' : 'Continue Anyway', onPress: () => resolve(true) },
              ]
            );
          });
          if (!proceed) return;
        }

        // ── Credit check (informational) ───────────────────────────────────
        try {
          const creditCheck = canUserUpload(balance, fileSize);
          if (!creditCheck.allowed) console.warn('⚠️ Credit check warning:', creditCheck.reason);
        } catch (e) {
          console.warn('⚠️ Credit check failed:', e);
        }

        setVideoFile(file);
        setIsProcessingVideo(true);
        setChunkProgress(null);
        setVideoUploadProgress(0);
        setVideoUploadLoaded(0);
        setVideoUploadTotal(fileSize);

        // ── Choose upload strategy ─────────────────────────────────────────
        const useChunked = fileSize > CHUNKED_THRESHOLD;
        console.log(`📤 ${useChunked ? 'Chunked' : 'Direct'} upload — ${formatFileSize(fileSize)}`);

        try {
          let finalUrl = '';
          let finalPath = '';
          let finalSize = fileSize;

          if (useChunked) {
            // ── CHUNKED UPLOAD ───────────────────────────────────────────
            const token = createAbortToken();
            abortTokenRef.current = token;

            const chunkResult = await uploadFileInChunks(
              file.uri,
              file.name,
              'videos',
              (prog: ChunkUploadProgress) => {
                setChunkProgress(prog);
                setVideoUploadProgress(prog.percentage);
                setVideoUploadLoaded(prog.loaded);
                setVideoUploadTotal(prog.total);
                setUploadSpeed(formatSpeed(prog.bytesPerSecond));
                setUploadEta(formatETA(prog.etaSeconds));
              },
              token,
            );
            finalUrl = chunkResult.url;
            finalPath = chunkResult.path;
            finalSize = chunkResult.size;
          } else {
            // ── DIRECT UPLOAD (small files) ──────────────────────────────
            const uploadResult = await uploadFile(
              file.uri,
              file.name,
              'videos',
              (progress) => {
                setVideoUploadProgress(Math.round(progress.percentage));
                setVideoUploadLoaded(progress.loaded);
                setVideoUploadTotal(progress.total);
              }
            );
            finalUrl = uploadResult.url;
            finalPath = uploadResult.path;
            finalSize = uploadResult.size;
          }

          setVideoUrl(finalUrl);
          setVideoProcessed(true);
          abortTokenRef.current = null;

          Alert.alert(
            isRTL ? 'הצלחה!' : 'Success!',
            isRTL
              ? `וידאו ${file.name} הועלה בהצלחה (${formatFileSize(finalSize)})`
              : `Video ${file.name} uploaded successfully (${formatFileSize(finalSize)})`,
            [{ text: 'OK' }]
          );

        } catch (uploadError: any) {
          const errorMessage: string = uploadError.message || (isRTL ? 'נסה שנית' : 'Please try again');

          if (errorMessage.includes('aborted')) {
            // User cancelled — no alert
            setVideoFile(null);
          } else if (errorMessage.includes('too large to load into memory') || errorMessage.includes('load into memory')) {
            Alert.alert(
              isRTL ? 'קובץ גדול מדי עבור Expo Go' : 'File Too Large for Expo Go',
              isRTL
                ? 'Expo Go אינו יכול לטעון קבצים מעל ~200MB.\n\nבנה APK ייצור להעלאת קבצים עד 5GB.\n\n📦 Download → Android APK'
                : 'Expo Go cannot handle files over ~200MB.\n\nBuild the production APK for files up to 5GB.\n\n📦 Download → Android APK',
              [{ text: 'OK' }]
            );
            setVideoFile(null);
          } else if (errorMessage.includes('ENOSPC') || errorMessage.includes('No space left')) {
            Alert.alert(
              isRTL ? 'אין מקום בדיסק' : 'Device Storage Full',
              isRTL
                ? 'פנה מקום במכשיר ונסה שוב.'
                : 'Free up storage on your device and try again.',
              [{ text: 'OK' }]
            );
            setVideoFile(null);
          } else if (errorMessage.includes('authenticated') || errorMessage.includes('sign in')) {
            Alert.alert(
              isRTL ? 'נדרשת התחברות' : 'Sign In Required',
              isRTL ? 'התחבר כדי להעלות קבצים' : 'Sign in to upload files',
              [
                { text: isRTL ? 'ביטול' : 'Cancel', style: 'cancel' },
                { text: isRTL ? 'התחבר' : 'Sign In', onPress: () => router.push('/login') },
              ]
            );
            setVideoFile(null);
          } else {
            Alert.alert(isRTL ? 'העלאה נכשלה' : 'Upload Failed', errorMessage, [{ text: 'OK' }]);
            setVideoFile(null);
          }

          setVideoUploadProgress(0);
          setVideoUploadLoaded(0);
          setVideoUploadTotal(0);
          setChunkProgress(null);
        } finally {
          setIsProcessingVideo(false);
        }
      }
    } catch (error: any) {
      Alert.alert(
        isRTL ? 'שגיאה' : 'Error',
        (isRTL ? 'לא הצלחנו לבחור וידאו' : 'Failed to pick video') + (error.message ? `: ${error.message}` : ''),
        [{ text: 'OK' }]
      );
    }
  };

  const handleCancelUpload = () => {
    if (abortTokenRef.current) {
      abortTokenRef.current.abort();
      abortTokenRef.current = null;
    }
    setIsProcessingVideo(false);
    setVideoFile(null);
    setChunkProgress(null);
    setVideoUploadProgress(0);
    setVideoUploadLoaded(0);
    setVideoUploadTotal(0);
  };
  
  return (
    <View style={styles.stepContent}>
      <MaterialIcons name="upload-file" size={64} color={Colors.primary} />
      <Text style={styles.stepDescription}>
        {isRTL ? 'העלה וידאו ממכשירך (עד 5GB)' : 'Upload video from your device (up to 5GB)'}
      </Text>

      {/* Network status indicator */}
      <View style={[
        s3.networkBadge,
        isCellular ? s3.networkCellular : (networkType === 'wifi' ? s3.networkWifi : s3.networkUnknown),
      ]}>
        <MaterialIcons
          name={isCellular ? 'signal-cellular-alt' : networkType === 'wifi' ? 'wifi' : 'signal-wifi-off'}
          size={14}
          color={isCellular ? Colors.warning : networkType === 'wifi' ? Colors.success : Colors.textMuted}
        />
        <Text style={[s3.networkText, isCellular ? { color: Colors.warning } : networkType === 'wifi' ? { color: Colors.success } : { color: Colors.textMuted }]}>
          {isCellular
            ? (isRTL ? 'רשת סלולרית — העלאת קבצים גדולים לא מומלצת' : 'Cellular — large file upload not recommended')
            : networkType === 'wifi'
            ? (isRTL ? 'Wi-Fi — מצוין להעלאות גדולות' : 'Wi-Fi — great for large uploads')
            : (isRTL ? 'בודק חיבור...' : 'Checking connection...')}
        </Text>
      </View>

      {/* Background upload resume notice */}
      {isBackgroundReady && (
        <View style={s3.bgResumeBadge}>
          <MaterialIcons name="cloud-upload" size={16} color={Colors.primary} />
          <Text style={s3.bgResumeText}>
            {isRTL ? 'העלאה הקודמת ממשיכה ברקע' : 'Previous upload resuming in background'}
          </Text>
        </View>
      )}
      
      {/* Show file info if selected */}
      {videoFile && !isProcessingVideo && (
        <View style={styles.fileInfoBox}>
          <MaterialIcons name="video-file" size={32} color={Colors.success} />
          <View style={{ flex: 1 }}>
            <Text style={styles.fileInfoName} numberOfLines={1}>{videoFile.name}</Text>
            <Text style={styles.fileInfoSize}>{formatFileSize(videoFile.size || 0)}</Text>
          </View>
          <MaterialIcons name="check-circle" size={24} color={Colors.success} />
        </View>
      )}
      
      {/* Chunked Upload Progress */}
      {isProcessingVideo && chunkProgress && (
        <View style={s3.chunkCard}>
          {/* Header row */}
          <View style={s3.chunkHeader}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={s3.chunkTitle}>
              {isRTL
                ? `מעלה חלק ${chunkProgress.currentChunk + 1} מתוך ${chunkProgress.totalChunks}`
                : `Uploading chunk ${chunkProgress.currentChunk + 1} of ${chunkProgress.totalChunks}`}
            </Text>
            <Text style={s3.chunkPct}>{chunkProgress.percentage}%</Text>
          </View>

          {/* Overall progress bar */}
          <View style={s3.chunkTrack}>
            <View style={[s3.chunkFill, { width: `${chunkProgress.percentage}%` as any }]} />
          </View>

          {/* Chunk bubbles */}
          <View style={s3.chunkBubbles}>
            {Array.from({ length: Math.min(chunkProgress.totalChunks, 12) }).map((_, idx) => {
              const isDone = idx < chunkProgress.uploadedChunks;
              const isCurrent = idx === chunkProgress.currentChunk;
              return (
                <View
                  key={idx}
                  style={[
                    s3.chunkBubble,
                    isDone && s3.chunkBubbleDone,
                    isCurrent && s3.chunkBubbleCurrent,
                  ]}
                >
                  {isDone && <MaterialIcons name="check" size={10} color="#fff" />}
                </View>
              );
            })}
            {chunkProgress.totalChunks > 12 && (
              <Text style={s3.chunkMore}>+{chunkProgress.totalChunks - 12}</Text>
            )}
          </View>

          {/* Speed + ETA + size */}
          <View style={s3.chunkMeta}>
            <View style={s3.chunkMetaItem}>
              <MaterialIcons name="speed" size={12} color={Colors.textMuted} />
              <Text style={s3.chunkMetaText}>{uploadSpeed || '--'}</Text>
            </View>
            <View style={s3.chunkMetaItem}>
              <MaterialIcons name="timer" size={12} color={Colors.textMuted} />
              <Text style={s3.chunkMetaText}>
                {isRTL ? `נותר: ${uploadEta || '--'}` : `ETA: ${uploadEta || '--'}`}
              </Text>
            </View>
            <View style={s3.chunkMetaItem}>
              <MaterialIcons name="cloud-upload" size={12} color={Colors.textMuted} />
              <Text style={s3.chunkMetaText}>
                {formatFileSize(chunkProgress.loaded)} / {formatFileSize(chunkProgress.total)}
              </Text>
            </View>
          </View>

          {/* Background note */}
          <View style={s3.bgNote}>
            <MaterialIcons name="info-outline" size={12} color={Colors.primary} />
            <Text style={s3.bgNoteText}>
              {isRTL
                ? 'אם תצא מהאפליקציה, ההעלאה תמשיך ברקע ותחודש אוטומטית'
                : 'If you leave the app, the upload continues in background and resumes automatically'}
            </Text>
          </View>

          {/* Cancel button */}
          <Pressable style={s3.cancelBtn} onPress={handleCancelUpload}>
            <MaterialIcons name="cancel" size={16} color={Colors.error} />
            <Text style={s3.cancelBtnText}>{isRTL ? 'בטל העלאה' : 'Cancel Upload'}</Text>
          </Pressable>
        </View>
      )}

      {/* Simple progress bar for direct uploads */}
      {isProcessingVideo && !chunkProgress && (
        <View style={{ width: '100%', marginTop: Spacing.sm }}>
          <UploadProgressBar
            percentage={videoUploadProgress}
            loaded={videoUploadLoaded}
            total={videoUploadTotal}
            fileName={videoFile?.name}
            isRTL={isRTL}
          />
        </View>
      )}
      
      {/* Upload Button */}
      {!videoFile && !isProcessingVideo && (
        <UploadButton 
          icon="video-library" 
          label={isRTL ? 'בחר וידאו' : 'Select Video'}
          large
          onPress={handlePickVideo}
          isSelected={false}
        />
      )}
      
      {/* Change Button */}
      {videoFile && !isProcessingVideo && (
        <Pressable
          style={({ pressed }) => [styles.changeButton, pressed && styles.buttonPressed]}
          onPress={handlePickVideo}
        >
          <MaterialIcons name="swap-horiz" size={20} color={Colors.primary} />
          <Text style={styles.changeButtonText}>{isRTL ? 'שנה וידאו' : 'Change Video'}</Text>
        </Pressable>
      )}
      
      <Text style={styles.stepHint}>
        {isRTL
          ? `פורמטים נתמכים: MP4, AVI, MOV, MKV, WebM • עד 5GB • חלקים: ${formatFileSize(CHUNK_SIZE)}`
          : `Supported: MP4, AVI, MOV, MKV, WebM • Up to 5GB • Chunk size: ${formatFileSize(CHUNK_SIZE)}`}
      </Text>
      <View style={styles.largeFileNote}>
        <MaterialIcons name="info-outline" size={14} color={Colors.warning} />
        <Text style={styles.largeFileNoteText}>
          {isRTL
            ? 'קבצים מעל 200MB (כולל 2.2GB+) דורשים APK ייצור — לא Expo Go'
            : 'Files over 200MB (including 2.2GB+) require production APK — not Expo Go'}
        </Text>
      </View>
    </View>
  );
}

// ─── Step 3 local styles ───────────────────────────────────────────────────────
const s3 = StyleSheet.create({
  networkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: 5,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignSelf: 'center',
  },
  networkWifi: {
    backgroundColor: 'rgba(0, 255, 127, 0.08)',
    borderColor: Colors.success + '44',
  },
  networkCellular: {
    backgroundColor: 'rgba(255, 184, 0, 0.10)',
    borderColor: Colors.warning + '55',
  },
  networkUnknown: {
    backgroundColor: Colors.surfaceLight,
    borderColor: Colors.border,
  },
  networkText: {
    fontSize: Typography.caption,
    fontWeight: '600',
    flexShrink: 1,
  },
  bgResumeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(0, 212, 255, 0.08)',
    borderWidth: 1,
    borderColor: Colors.primary + '44',
  },
  bgResumeText: {
    fontSize: Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
  },
  // Chunk card
  chunkCard: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary + '44',
    gap: Spacing.sm,
    ...Shadows.md,
  },
  chunkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  chunkTitle: {
    flex: 1,
    fontSize: Typography.bodySmall,
    fontWeight: '600',
    color: Colors.text,
  },
  chunkPct: {
    fontSize: Typography.h4,
    fontWeight: '700',
    color: Colors.primary,
    minWidth: 46,
    textAlign: 'right',
  },
  chunkTrack: {
    width: '100%',
    height: 7,
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  chunkFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
  },
  chunkBubbles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    alignItems: 'center',
  },
  chunkBubble: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chunkBubbleDone: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  chunkBubbleCurrent: {
    backgroundColor: Colors.primary + '44',
    borderColor: Colors.primary,
  },
  chunkMore: {
    fontSize: Typography.caption,
    color: Colors.textMuted,
    marginLeft: 2,
  },
  chunkMeta: {
    flexDirection: 'row',
    gap: Spacing.md,
    flexWrap: 'wrap',
  },
  chunkMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  chunkMetaText: {
    fontSize: Typography.caption,
    color: Colors.textSecondary,
    fontVariant: ['tabular-nums'] as any,
  },
  bgNote: {
    flexDirection: 'row',
    gap: Spacing.xs,
    alignItems: 'flex-start',
    backgroundColor: 'rgba(0, 212, 255, 0.05)',
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  bgNoteText: {
    flex: 1,
    fontSize: Typography.caption,
    color: Colors.primary,
    lineHeight: 16,
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    alignSelf: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.error + '15',
    borderWidth: 1,
    borderColor: Colors.error + '40',
  },
  cancelBtnText: {
    fontSize: Typography.bodySmall,
    fontWeight: '600',
    color: Colors.error,
  },
});

function Step4Content({
  movieTitle, setMovieTitle,
  movieDescription, setMovieDescription,
  selectedGenre, setSelectedGenre,
  recapHours, setRecapHours,
  recapMinutes, setRecapMinutes,
  recapSeconds, setRecapSeconds,
  cutMinutes, setCutMinutes,
  cutSeconds, setCutSeconds,
  ragCustomization, setRagCustomization,
  segments, clipDuration,
}: {
  movieTitle: string; setMovieTitle: (v: string) => void;
  movieDescription: string; setMovieDescription: (v: string) => void;
  selectedGenre: string; setSelectedGenre: (v: string) => void;
  recapHours: number; setRecapHours: (v: number) => void;
  recapMinutes: number; setRecapMinutes: (v: number) => void;
  recapSeconds: number; setRecapSeconds: (v: number) => void;
  cutMinutes: number; setCutMinutes: (v: number) => void;
  cutSeconds: number; setCutSeconds: (v: number) => void;
  ragCustomization: RAGCustomization; setRagCustomization: (v: RAGCustomization) => void;
  segments: number; clipDuration: number;
}) {
  const { isRTL } = useLanguage();
  const { settings, updateSettings, isLoaded: settingsLoaded } = useAdvancedSettings();
  const {
    hasGeminiKey, setGeminiApiKey, clearGeminiKey, geminiApiKey,
    youtubeApiKey, setYoutubeApiKey, clearYoutubeKey,
    googleSearchApiKey, setGoogleSearchApiKey, clearGoogleSearchKey,
  } = useAuth();

  const [geminiKeyInput, setGeminiKeyInput] = useState('');
  const [geminiKeyVisible, setGeminiKeyVisible] = useState(false);
  const [geminiKeySaving, setGeminiKeySaving] = useState(false);

  const [ytKeyInput, setYtKeyInput] = useState('');
  const [ytKeyVisible, setYtKeyVisible] = useState(false);
  const [ytKeySaving, setYtKeySaving] = useState(false);

  const [searchKeyInput, setSearchKeyInput] = useState('');
  const [searchKeyVisible, setSearchKeyVisible] = useState(false);
  const [searchKeySaving, setSearchKeySaving] = useState(false);

  const handleSaveGeminiKey = async () => {
    if (!geminiKeyInput.trim()) return;
    setGeminiKeySaving(true);
    await setGeminiApiKey(geminiKeyInput.trim());
    setGeminiKeyInput('');
    setGeminiKeyVisible(false);
    setGeminiKeySaving(false);
  };

  const handleClearGeminiKey = async () => {
    await clearGeminiKey();
    setGeminiKeyInput('');
    setGeminiKeyVisible(false);
  };

  const handleSaveYtKey = async () => {
    if (!ytKeyInput.trim()) return;
    setYtKeySaving(true);
    await setYoutubeApiKey(ytKeyInput.trim());
    setYtKeyInput('');
    setYtKeyVisible(false);
    setYtKeySaving(false);
  };

  const handleClearYtKey = async () => {
    await clearYoutubeKey();
    setYtKeyInput('');
    setYtKeyVisible(false);
  };

  const handleSaveSearchKey = async () => {
    if (!searchKeyInput.trim()) return;
    setSearchKeySaving(true);
    await setGoogleSearchApiKey(searchKeyInput.trim());
    setSearchKeyInput('');
    setSearchKeyVisible(false);
    setSearchKeySaving(false);
  };

  const handleClearSearchKey = async () => {
    await clearGoogleSearchKey();
    setSearchKeyInput('');
    setSearchKeyVisible(false);
  };

  // Re-sync from context whenever shared settings change (e.g. user edits Settings tab).
  // Guard behind settingsLoaded to avoid overwriting draft-restored values before
  // context has finished loading from AsyncStorage.
  useEffect(() => {
    if (!settingsLoaded) return;
    if (settings.movieTitle !== movieTitle) setMovieTitle(settings.movieTitle || '');
    if (settings.movieDescription !== movieDescription) setMovieDescription(settings.movieDescription || '');
    if (settings.selectedGenre !== selectedGenre) setSelectedGenre(settings.selectedGenre);
    if (settings.recapHours !== recapHours) setRecapHours(settings.recapHours);
    if (settings.recapMinutes !== recapMinutes) setRecapMinutes(settings.recapMinutes);
    if (settings.recapSeconds !== recapSeconds) setRecapSeconds(settings.recapSeconds);
    if (settings.cutMinutes !== cutMinutes) setCutMinutes(settings.cutMinutes);
    if (settings.cutSeconds !== cutSeconds) setCutSeconds(settings.cutSeconds);
  }, [ // eslint-disable-line react-hooks/exhaustive-deps
    settingsLoaded,
    settings.movieTitle, settings.movieDescription, settings.selectedGenre,
    settings.recapHours, settings.recapMinutes, settings.recapSeconds,
    settings.cutMinutes, settings.cutSeconds,
  ]);

  // Keep context in sync as user edits — all fields
  const handleTitleChange = (v: string) => {
    setMovieTitle(v);
    updateSettings({ movieTitle: v });
  };
  const handleDescChange = (v: string) => {
    setMovieDescription(v);
    updateSettings({ movieDescription: v });
  };
  const handleGenreChange = (v: string) => {
    setSelectedGenre(v);
    updateSettings({ selectedGenre: v });
  };
  const handleRecapHoursChange = (v: number) => {
    setRecapHours(v);
    updateSettings({ recapHours: v });
  };
  const handleRecapMinutesChange = (v: number) => {
    setRecapMinutes(v);
    updateSettings({ recapMinutes: v });
  };
  const handleRecapSecondsChange = (v: number) => {
    setRecapSeconds(v);
    updateSettings({ recapSeconds: v });
  };
  const handleCutMinutesChange = (v: number) => {
    setCutMinutes(v);
    updateSettings({ cutMinutes: v });
  };
  const handleCutSecondsChange = (v: number) => {
    setCutSeconds(v);
    updateSettings({ cutSeconds: v });
  };

  return (
    <View style={styles.stepContent}>
      {/* AI Matching Header */}
      <View style={styles.step4Header}>
        <LinearGradient
          colors={['rgba(0,212,255,0.12)', 'rgba(147,51,234,0.08)']}
          style={styles.step4HeaderGrad}
        >
          <MaterialIcons name="auto-awesome" size={32} color={Colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.step4Title}>
              {isRTL ? 'הגדרות AI חכמות' : 'Smart AI Settings'}
            </Text>
            <Text style={styles.step4Subtitle}>
              {isRTL ? 'התאם את הסיכום לצרכים שלך' : 'Customize your recap settings'}
            </Text>
          </View>
        </LinearGradient>
      </View>

      {/* Movie Title */}
      <View style={styles.advancedField}>
        <Text style={styles.advancedLabel}>
          {isRTL ? 'כותרת הסרט/סדרה' : 'Movie/Series Title'} *
        </Text>
        <TextInput
          style={styles.advancedInput}
          placeholder={isRTL ? 'לדוגמה: Siren (2018) Season 1 Episode 1' : 'e.g., Siren (2018) Season 1 Episode 1'}
          placeholderTextColor={Colors.textMuted}
          value={movieTitle}
          onChangeText={handleTitleChange}
          textAlign={isRTL ? 'right' : 'left'}
        />
      </View>

      {/* Genre */}
      <View style={styles.advancedField}>
        <Text style={styles.advancedLabel}>{isRTL ? "ז'אנרים" : 'Genres'}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.genreScroll}>
          {GENRES.map((genre) => (
            <Pressable
              key={genre.value}
              style={[styles.genreChip, selectedGenre === genre.value && styles.genreChipActive]}
              onPress={() => handleGenreChange(genre.value)}
            >
              <Text style={[styles.genreChipText, selectedGenre === genre.value && styles.genreChipTextActive]}>
                {isRTL ? genre.labelHe : genre.labelEn}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Description */}
      <View style={styles.advancedField}>
        <Text style={styles.advancedLabel}>
          {isRTL ? 'תיאור הסרט/סדרה' : 'Movie/Series Description'}
        </Text>
        <TextInput
          style={[styles.advancedInput, styles.advancedTextArea]}
          placeholder={isRTL ? 'תאר את העלילה והדמויות...' : 'Describe the plot and characters...'}
          placeholderTextColor={Colors.textMuted}
          value={movieDescription}
          onChangeText={handleDescChange}
          multiline
          numberOfLines={4}
          textAlign={isRTL ? 'right' : 'left'}
          textAlignVertical="top"
        />
        <View style={styles.tipBox}>
          <MaterialIcons name="lightbulb" size={16} color={Colors.warning} />
          <Text style={styles.tipText}>
            {isRTL
              ? 'טיפ לשיפור איכות: תיאור מפורט יעזור ל-AI ליצור סיכום מדויק יותר.'
              : 'Quality tip: Detailed description helps AI create a more accurate recap.'}
          </Text>
        </View>
      </View>

      {/* Recap Duration */}
      <View style={styles.advancedField}>
        <Text style={styles.advancedLabel}>
          {isRTL ? 'אורך הסיכום (עד 3 שעות)' : 'Recap Duration (up to 3 hours)'}
        </Text>
        <View style={styles.timePickerRow}>
          <View style={styles.timePickerGroup}>
            <TextInput
              style={styles.timeInput}
              value={String(recapHours).padStart(2, '0')}
              onChangeText={(v) => handleRecapHoursChange(Math.min(3, Math.max(0, parseInt(v) || 0)))}
              keyboardType="number-pad"
              maxLength={2}
            />
            <Text style={styles.timeLabel}>{isRTL ? 'שעות' : 'h'}</Text>
          </View>
          <Text style={styles.timeSeparator}>:</Text>
          <View style={styles.timePickerGroup}>
            <TextInput
              style={styles.timeInput}
              value={String(recapMinutes).padStart(2, '0')}
              onChangeText={(v) => handleRecapMinutesChange(Math.min(59, Math.max(0, parseInt(v) || 0)))}
              keyboardType="number-pad"
              maxLength={2}
            />
            <Text style={styles.timeLabel}>{isRTL ? 'דקות' : 'min'}</Text>
          </View>
          <Text style={styles.timeSeparator}>:</Text>
          <View style={styles.timePickerGroup}>
            <TextInput
              style={styles.timeInput}
              value={String(recapSeconds).padStart(2, '0')}
              onChangeText={(v) => handleRecapSecondsChange(Math.min(59, Math.max(0, parseInt(v) || 0)))}
              keyboardType="number-pad"
              maxLength={2}
            />
            <Text style={styles.timeLabel}>{isRTL ? 'שניות' : 'sec'}</Text>
          </View>
        </View>
      </View>

      {/* Cut Interval */}
      <View style={styles.advancedField}>
        <Text style={styles.advancedLabel}>
          {isRTL ? 'חתוך כל (דקות : שניות)' : 'Cut every (min : sec)'}
        </Text>
        <View style={styles.timePickerRow}>
          <View style={styles.timePickerGroup}>
            <TextInput
              style={styles.timeInput}
              value={String(cutMinutes)}
              onChangeText={(v) => handleCutMinutesChange(Math.max(0, parseInt(v) || 0))}
              keyboardType="number-pad"
              maxLength={2}
            />
            <Text style={styles.timeLabel}>{isRTL ? 'דקות' : 'min'}</Text>
          </View>
          <Text style={styles.timeSeparator}>:</Text>
          <View style={styles.timePickerGroup}>
            <TextInput
              style={styles.timeInput}
              value={String(cutSeconds).padStart(2, '0')}
              onChangeText={(v) => handleCutSecondsChange(Math.min(59, Math.max(0, parseInt(v) || 0)))}
              keyboardType="number-pad"
              maxLength={2}
            />
            <Text style={styles.timeLabel}>{isRTL ? 'שניות' : 'sec'}</Text>
          </View>
        </View>
        <Text style={styles.cutHint}>
          {isRTL
            ? `כל ${cutSeconds} שניות ייחתך קטע של ${clipDuration} שניות — ~${segments} קטעים`
            : `Every ${cutSeconds}s → ${clipDuration}s clip — ~${segments} segments total`}
        </Text>
      </View>

      {/* AI RAG Customization */}
      <View style={{ width: '100%', borderTopWidth: 1, borderColor: Colors.border, paddingTop: Spacing.md }}>
        <RecapCustomizationPanel
          genre={selectedGenre}
          customization={ragCustomization}
          onChange={(v) => {
            setRagCustomization(v);
            updateSettings({ ragCustomization: v });
          }}
          isRTL={isRTL}
        />
      </View>

      {/* AI Enhancement Toggles */}
      <View style={styles.advancedField}>
        <Text style={styles.advancedLabel}>{isRTL ? 'שיפורי AI' : 'AI Enhancements'}</Text>
        {[
          {
            key: 'webSearchEnabled' as const,
            icon: 'search' as ComponentProps<typeof MaterialIcons>['name'],
            labelEn: 'Web Search (enriches context)',
            labelHe: 'חיפוש באינטרנט (מעשיר הקשר)',
          },
          {
            key: 'youTubeLearningEnabled' as const,
            icon: 'play-circle-outline' as ComponentProps<typeof MaterialIcons>['name'],
            labelEn: 'YouTube Channel Learning',
            labelHe: 'למידה מערוצי YouTube',
          },
          {
            key: 'continuousLearningEnabled' as const,
            icon: 'autorenew' as ComponentProps<typeof MaterialIcons>['name'],
            labelEn: 'Continuous Learning',
            labelHe: 'למידה מתמשכת',
          },
        ].map(({ key, icon, labelEn, labelHe }) => (
          <Pressable
            key={key}
            style={styles.toggleRow}
            onPress={() => updateSettings({ [key]: !settings[key] })}
            accessibilityRole="switch"
            accessibilityState={{ checked: settings[key] }}
          >
            <MaterialIcons name={icon} size={20} color={settings[key] ? Colors.primary : Colors.textMuted} />
            <Text style={[styles.toggleLabel, settings[key] && styles.toggleLabelActive]}>
              {isRTL ? labelHe : labelEn}
            </Text>
            <View style={[styles.toggleSwitch, settings[key] && styles.toggleSwitchOn]}>
              <View style={[styles.toggleThumb, settings[key] && styles.toggleThumbOn]} />
            </View>
          </Pressable>
        ))}
      </View>

      {/* BYOK / API Key - editable Gemini key field */}
      <View style={styles.advancedField}>
        <Text style={styles.advancedLabel}>{isRTL ? 'מפתחות API (BYOK)' : 'API Keys (BYOK)'}</Text>

        {/* Gemini key row */}
        <View style={styles.toggleRow}>
          <MaterialIcons name="vpn-key" size={20} color={hasGeminiKey ? Colors.success : Colors.textMuted} />
          <Text style={[styles.toggleLabel, hasGeminiKey && styles.toggleLabelActive]}>
            {'Google Gemini API Key'}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <MaterialIcons
              name={hasGeminiKey ? 'check-circle' : 'cancel'}
              size={18}
              color={hasGeminiKey ? Colors.success : Colors.error}
            />
            <Text style={{ fontSize: Typography.caption, color: hasGeminiKey ? Colors.success : Colors.error }}>
              {hasGeminiKey ? (isRTL ? 'מוגדר' : 'Set') : (isRTL ? 'לא מוגדר' : 'Not set')}
            </Text>
            <Pressable
              onPress={() => setGeminiKeyVisible(v => !v)}
              style={{ marginLeft: 8, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
                backgroundColor: geminiKeyVisible ? Colors.primary + '30' : Colors.surfaceLight }}
            >
              <Text style={{ fontSize: Typography.caption, color: Colors.primary }}>
                {geminiKeyVisible ? (isRTL ? 'סגור' : 'Close') : hasGeminiKey ? (isRTL ? 'שנה' : 'Change') : (isRTL ? 'הגדר' : 'Set')}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Inline Gemini key input */}
        {geminiKeyVisible && (
          <View style={{ marginTop: 8, gap: 6 }}>
            <TextInput
              style={styles.textInput}
              value={geminiKeyInput}
              onChangeText={setGeminiKeyInput}
              placeholder={isRTL ? 'הכנס מפתח Gemini API...' : 'Paste your Gemini API key...'}
              placeholderTextColor={Colors.textMuted}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable
                onPress={handleSaveGeminiKey}
                disabled={geminiKeySaving || !geminiKeyInput.trim()}
                style={{ flex: 1, backgroundColor: Colors.primary, borderRadius: 8, padding: 8,
                  alignItems: 'center', opacity: (!geminiKeyInput.trim() || geminiKeySaving) ? 0.5 : 1 }}
              >
                <Text style={{ color: '#ffffff', fontSize: Typography.caption, fontWeight: '600' }}>
                  {geminiKeySaving ? (isRTL ? 'שומר...' : 'Saving...') : (isRTL ? 'שמור' : 'Save')}
                </Text>
              </Pressable>
              {hasGeminiKey && (
                <Pressable
                  onPress={handleClearGeminiKey}
                  style={{ flex: 1, backgroundColor: Colors.error + '20', borderRadius: 8, padding: 8,
                    alignItems: 'center', borderWidth: 1, borderColor: Colors.error + '40' }}
                >
                  <Text style={{ color: Colors.error, fontSize: Typography.caption, fontWeight: '600' }}>
                    {isRTL ? 'הסר מפתח' : 'Remove Key'}
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        )}

        {!hasGeminiKey && !geminiKeyVisible && (
          <Text style={styles.cutHint}>
            {isRTL
              ? 'הגדר מפתח Gemini לשימוש ב-AI אישי. ניתן גם להגדיר בהגדרות.'
              : 'Set a Gemini key to use personal AI. Can also be configured in Settings.'}
          </Text>
        )}

        {/* YouTube API key row */}
        <View style={[styles.toggleRow, { marginTop: 8 }]}>
          <MaterialIcons name="smart-display" size={20} color={!!youtubeApiKey ? Colors.success : Colors.textMuted} />
          <Text style={[styles.toggleLabel, !!youtubeApiKey && styles.toggleLabelActive]}>
            {'YouTube API Key'}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <MaterialIcons name={!!youtubeApiKey ? 'check-circle' : 'cancel'} size={18}
              color={!!youtubeApiKey ? Colors.success : Colors.textMuted} />
            <Text style={{ fontSize: Typography.caption, color: !!youtubeApiKey ? Colors.success : Colors.textMuted }}>
              {!!youtubeApiKey ? (isRTL ? 'מוגדר' : 'Set') : (isRTL ? 'אופציונלי' : 'Optional')}
            </Text>
            <Pressable onPress={() => setYtKeyVisible(v => !v)}
              style={{ marginLeft: 8, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
                backgroundColor: ytKeyVisible ? Colors.primary + '30' : Colors.surfaceLight }}>
              <Text style={{ fontSize: Typography.caption, color: Colors.primary }}>
                {ytKeyVisible ? (isRTL ? 'סגור' : 'Close') : !!youtubeApiKey ? (isRTL ? 'שנה' : 'Change') : (isRTL ? 'הגדר' : 'Set')}
              </Text>
            </Pressable>
          </View>
        </View>
        {ytKeyVisible && (
          <View style={{ marginTop: 8, gap: 6 }}>
            <TextInput style={styles.textInput} value={ytKeyInput} onChangeText={setYtKeyInput}
              placeholder={isRTL ? 'הכנס YouTube API Key...' : 'Paste your YouTube API key...'}
              placeholderTextColor={Colors.textMuted} secureTextEntry autoCapitalize="none" autoCorrect={false} />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable onPress={handleSaveYtKey} disabled={ytKeySaving || !ytKeyInput.trim()}
                style={{ flex: 1, backgroundColor: Colors.primary, borderRadius: 8, padding: 8,
                  alignItems: 'center', opacity: (!ytKeyInput.trim() || ytKeySaving) ? 0.5 : 1 }}>
                <Text style={{ color: '#ffffff', fontSize: Typography.caption, fontWeight: '600' }}>
                  {ytKeySaving ? (isRTL ? 'שומר...' : 'Saving...') : (isRTL ? 'שמור' : 'Save')}
                </Text>
              </Pressable>
              {!!youtubeApiKey && (
                <Pressable onPress={handleClearYtKey}
                  style={{ flex: 1, backgroundColor: Colors.error + '20', borderRadius: 8, padding: 8,
                    alignItems: 'center', borderWidth: 1, borderColor: Colors.error + '40' }}>
                  <Text style={{ color: Colors.error, fontSize: Typography.caption, fontWeight: '600' }}>
                    {isRTL ? 'הסר מפתח' : 'Remove Key'}
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        )}

        {/* Google Search API key row */}
        <View style={[styles.toggleRow, { marginTop: 8 }]}>
          <MaterialIcons name="manage-search" size={20} color={!!googleSearchApiKey ? Colors.success : Colors.textMuted} />
          <Text style={[styles.toggleLabel, !!googleSearchApiKey && styles.toggleLabelActive]}>
            {'Google Search API Key'}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <MaterialIcons name={!!googleSearchApiKey ? 'check-circle' : 'cancel'} size={18}
              color={!!googleSearchApiKey ? Colors.success : Colors.textMuted} />
            <Text style={{ fontSize: Typography.caption, color: !!googleSearchApiKey ? Colors.success : Colors.textMuted }}>
              {!!googleSearchApiKey ? (isRTL ? 'מוגדר' : 'Set') : (isRTL ? 'אופציונלי' : 'Optional')}
            </Text>
            <Pressable onPress={() => setSearchKeyVisible(v => !v)}
              style={{ marginLeft: 8, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
                backgroundColor: searchKeyVisible ? Colors.primary + '30' : Colors.surfaceLight }}>
              <Text style={{ fontSize: Typography.caption, color: Colors.primary }}>
                {searchKeyVisible ? (isRTL ? 'סגור' : 'Close') : !!googleSearchApiKey ? (isRTL ? 'שנה' : 'Change') : (isRTL ? 'הגדר' : 'Set')}
              </Text>
            </Pressable>
          </View>
        </View>
        {searchKeyVisible && (
          <View style={{ marginTop: 8, gap: 6 }}>
            <TextInput style={styles.textInput} value={searchKeyInput} onChangeText={setSearchKeyInput}
              placeholder={isRTL ? 'הכנס Google Search API Key...' : 'Paste your Google Search API key...'}
              placeholderTextColor={Colors.textMuted} secureTextEntry autoCapitalize="none" autoCorrect={false} />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable onPress={handleSaveSearchKey} disabled={searchKeySaving || !searchKeyInput.trim()}
                style={{ flex: 1, backgroundColor: Colors.primary, borderRadius: 8, padding: 8,
                  alignItems: 'center', opacity: (!searchKeyInput.trim() || searchKeySaving) ? 0.5 : 1 }}>
                <Text style={{ color: '#ffffff', fontSize: Typography.caption, fontWeight: '600' }}>
                  {searchKeySaving ? (isRTL ? 'שומר...' : 'Saving...') : (isRTL ? 'שמור' : 'Save')}
                </Text>
              </Pressable>
              {!!googleSearchApiKey && (
                <Pressable onPress={handleClearSearchKey}
                  style={{ flex: 1, backgroundColor: Colors.error + '20', borderRadius: 8, padding: 8,
                    alignItems: 'center', borderWidth: 1, borderColor: Colors.error + '40' }}>
                  <Text style={{ color: Colors.error, fontSize: Typography.caption, fontWeight: '600' }}>
                    {isRTL ? 'הסר מפתח' : 'Remove Key'}
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        )}
      </View>

      {/* Settings summary */}
      <View style={styles.summaryBox}>
        <Text style={styles.summaryTitle}>{isRTL ? 'סיכום הגדרות:' : 'Settings Summary:'}</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{isRTL ? 'אורך סיכום:' : 'Recap duration:'}</Text>
          <Text style={styles.summaryValue}>
            {String(recapHours).padStart(2, '0')}:{String(recapMinutes).padStart(2, '0')}:{String(recapSeconds).padStart(2, '0')}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{isRTL ? 'מרווח חיתוך:' : 'Cut interval:'}</Text>
          <Text style={styles.summaryValue}>{String(cutMinutes).padStart(2, '0')}:{String(cutSeconds).padStart(2, '0')}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{isRTL ? 'קטעים משוערים:' : 'Est. segments:'}</Text>
          <Text style={styles.summaryValue}>~{segments}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{isRTL ? 'Gemini API:' : 'Gemini API:'}</Text>
          <Text style={[styles.summaryValue, { color: hasGeminiKey ? Colors.success : Colors.error }]}>
            {hasGeminiKey ? (isRTL ? 'BYOK פעיל' : 'BYOK active') : (isRTL ? 'מצב ברירת מחדל' : 'Default mode')}
          </Text>
        </View>
      </View>
    </View>
  );
}

function Step5Content({
  balance,
  isRecapComplete,
  isJobProcessing,
  pipelineEvents,
  pipelineJob,
  finalRecapFile,
  isDownloading,
  onDownload,
  movieTitle,
  movieDescription,
  selectedGenre,
  segments,
  videoChapters,
  isGeneratingChapters,
  generateAIChapters,
}: {
  balance: number;
  isRecapComplete: boolean;
  isJobProcessing: boolean;
  pipelineEvents: PipelineEvent[];
  pipelineJob: RecapJob | null;
  finalRecapFile: { uri: string; name: string; size: number } | null;
  isDownloading: boolean;
  onDownload: () => void;
  movieTitle: string;
  movieDescription: string;
  selectedGenre: string;
  segments: number;
  videoChapters: Chapter[];
  isGeneratingChapters: boolean;
  generateAIChapters: () => void;
}) {
  const { t, isRTL } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Simulate playback progress
  useEffect(() => {
    if (isPlaying) {
      progressTimerRef.current = setInterval(() => {
        setVideoProgress((p) => {
          if (p >= 100) {
            setIsPlaying(false);
            return 0;
          }
          return p + 0.5;
        });
      }, 100);
    } else {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    }
    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [isPlaying]);

  const handleSharePlatform = (platform: string) => {
    if (finalRecapFile) {
      Sharing.shareAsync(finalRecapFile.uri).catch(() => {
        Alert.alert(
          isRTL ? `פותח ${platform}...` : `Opening ${platform}...`,
          isRTL
            ? `שיתוף ב-${platform} יפתח בקרוב`
            : `Sharing to ${platform} will open shortly`,
          [{ text: 'OK' }]
        );
      });
    } else {
      Alert.alert(
        isRTL ? `שתף ב-${platform}` : `Share on ${platform}`,
        isRTL ? 'צור סיכום תחילה' : 'Create a recap first',
        [{ text: 'OK' }]
      );
    }
  };

  const progressSeconds = Math.floor((videoProgress / 100) * 240);
  const progressMM = String(Math.floor(progressSeconds / 60)).padStart(2, '0');
  const progressSS = String(progressSeconds % 60).padStart(2, '0');

  if (!isRecapComplete) {
    // ── PROCESSING: Show live pipeline events ─────────────────────────────
    if (isJobProcessing || pipelineJob) {
      const completedEvents = pipelineEvents.filter(e =>
        e.type === 'step_completed' || e.type === 'step_fallback'
      ).length;
      const totalExpectedSteps = 5; // matches MOCK_STEPS in pipeline.ts
      const progressPct = Math.min(100, Math.round((completedEvents / totalExpectedSteps) * 100));

      return (
        <View style={styles.pipelineProcessingCard}>
          {/* Header */}
          <View style={styles.pipelineProcessingHeader}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={[styles.pipelineProcessingTitle, isRTL && { textAlign: 'right' }]}>
              {isRTL ? '⚙️ מעבד את הסיכום...' : '⚙️ Processing Recap...'}
            </Text>
          </View>

          {/* Progress bar */}
          <View style={styles.pipelineProgressTrack}>
            <View style={[styles.pipelineProgressFill, { width: `${progressPct}%` as `${number}%` }]} />
          </View>
          <Text style={[styles.pipelineProgressLabel, isRTL && { textAlign: 'right' }]}>
            {isRTL ? `${progressPct}% הושלם` : `${progressPct}% complete`}
          </Text>

          {/* Live events list */}
          <View style={styles.pipelineEventsList}>
            {pipelineEvents.map((ev, idx) => {
              const isCompleted = ev.type === 'step_completed' || ev.type === 'step_fallback';
              const isFailed = ev.type === 'step_failed';
              const isStarted = ev.type === 'step_started';
              const iconName: ComponentProps<typeof MaterialIcons>['name'] = isCompleted ? 'check-circle' : isFailed ? 'error' : isStarted ? 'radio-button-checked' : 'info';
              const iconColor = isCompleted ? Colors.success : isFailed ? Colors.error : Colors.primary;

              return (
                <View key={idx} style={styles.pipelineEventRow}>
                  <MaterialIcons name={iconName} size={16} color={iconColor} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.pipelineEventStep, isRTL && { textAlign: 'right' }]}>
                      {ev.step.replace(/_/g, ' ')}
                      {ev.type === 'step_fallback' && (
                        <Text style={styles.pipelineFallbackBadge}> (fallback)</Text>
                      )}
                    </Text>
                    <Text style={[styles.pipelineEventMsg, isRTL && { textAlign: 'right' }]}>
                      {ev.message}
                    </Text>
                  </View>
                </View>
              );
            })}
            {isJobProcessing && pipelineEvents.length === 0 && (
              <Text style={styles.pipelineWaiting}>
                {isRTL ? 'ממתין לאירועי עיבוד...' : 'Waiting for pipeline events...'}
              </Text>
            )}
          </View>

          {pipelineJob && (
            <Text style={[styles.pipelineJobId, isRTL && { textAlign: 'right' }]}>
              {isRTL ? `מזהה עבודה: ${pipelineJob.id}` : `Job ID: ${pipelineJob.id}`}
            </Text>
          )}
        </View>
      );
    }

    // ── PRE-SUBMISSION: Ready to create ──────────────────────────────────
    return (
      <View style={styles.stepContent}>
        <MaterialIcons name="check-circle" size={64} color={Colors.success} />
        <Text style={styles.stepDescription}>
          {isRTL ? 'מוכן ליצירת הסיכום הסופי!' : 'Ready to create final recap!'}
        </Text>

        {/* Recap summary card */}
        <View style={styles.step5SummaryCard}>
          {movieTitle ? (
            <Text style={[styles.step5SummaryTitle, isRTL && { textAlign: 'right' }]} numberOfLines={2}>
              {movieTitle}
            </Text>
          ) : null}
          <View style={styles.step5SummaryRow}>
            <MaterialIcons name="local-movies" size={14} color={Colors.textSecondary} />
            <Text style={styles.step5SummaryMeta}>{selectedGenre}</Text>
            <MaterialIcons name="content-cut" size={14} color={Colors.textSecondary} style={{ marginLeft: 8 }} />
            <Text style={styles.step5SummaryMeta}>
              {isRTL ? `${segments} קטעים` : `${segments} segments`}
            </Text>
          </View>
        </View>
        
        <View style={styles.creditsBadge}>
          <MaterialIcons name="stars" size={20} color={Colors.primary} />
          <Text style={styles.creditsText}>
            {t.credits}: {balance}
          </Text>
        </View>

        {balance === 0 && (
          <Text style={styles.warningText}>
            {t.insufficientCredits}
          </Text>
        )}

        {/* AI Chapter Suggestions */}
        {videoChapters.length === 0 ? (
          <Pressable
            style={({ pressed }) => [styles.aiChapterBtn, pressed && { opacity: 0.8 }, isGeneratingChapters && { opacity: 0.7 }]}
            onPress={generateAIChapters}
            disabled={isGeneratingChapters}
          >
            {isGeneratingChapters ? (
              <ActivityIndicator size="small" color={Colors.secondary} />
            ) : (
              <MaterialIcons name="auto-awesome" size={18} color={Colors.secondary} />
            )}
            <Text style={styles.aiChapterBtnText}>
              {isGeneratingChapters ? (isRTL ? 'מייצר פרקים...' : 'Generating chapters...') : (isRTL ? '🤖 הצע פרקים עם AI' : '🤖 AI Suggest Chapters')}
            </Text>
          </Pressable>
        ) : (
          <View style={styles.chaptersReadyChip}>
            <MaterialIcons name="check-circle" size={16} color={Colors.success} />
            <Text style={styles.chaptersReadyText}>
              {isRTL ? `✅ ${videoChapters.length} פרקים מוכנים` : `✅ ${videoChapters.length} chapters ready`}
            </Text>
          </View>
        )}
      </View>
    );
  }
  
  // Recap Complete - Enhanced View
  return (
    <View style={styles.step6Wrapper}>

      {/* Celebration Banner */}
      <LinearGradient
        colors={[Colors.success + '33', Colors.primary + '22']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.celebrationBanner}
      >
        <View style={styles.celebrationIconRow}>
          <MaterialIcons name="celebration" size={40} color={Colors.success} />
          <View style={styles.celebrationTextBlock}>
            <Text style={[styles.completeTitle, isRTL && { textAlign: 'right' }]}>
              {isRTL ? '🎉 הסיכום הושלם!' : '🎉 Recap Complete!'}
            </Text>
            <Text style={[styles.completeDescription, isRTL && { textAlign: 'right' }]}>
              {isRTL ? 'הסיכום שלך מוכן לצפייה ולשיתוף' : 'Your recap is ready to watch and share'}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* AI Smart Summary Card */}
      <View style={styles.aiSummaryCard}>
        <View style={styles.aiSummaryHeader}>
          <LinearGradient
            colors={[Colors.primary, Colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.aiIconBadge}
          >
            <MaterialIcons name="auto-awesome" size={16} color="#FFF" />
          </LinearGradient>
          <Text style={[styles.aiSummaryTitle, isRTL && { textAlign: 'right' }]}>
            {isRTL ? 'סיכום AI חכם' : 'AI Smart Summary'}
          </Text>
          <View style={styles.aiBadge}>
            <Text style={styles.aiBadgeText}>Gemini</Text>
          </View>
        </View>
        <View style={styles.aiSummaryBody}>
          <View style={styles.aiMetaRow}>
            <View style={styles.aiMetaChip}>
              <MaterialIcons name="movie" size={12} color={Colors.primary} />
              <Text style={styles.aiMetaText} numberOfLines={1}>{movieTitle || 'Untitled'}</Text>
            </View>
            <View style={styles.aiMetaChip}>
              <MaterialIcons name="category" size={12} color={Colors.secondary} />
              <Text style={styles.aiMetaText}>{selectedGenre}</Text>
            </View>
          </View>
          <View style={styles.aiStatsRow}>
            {[
              { label: isRTL ? 'קטעים' : 'Segments', value: String(segments || 26) },
              { label: isRTL ? 'אורך' : 'Duration', value: '4:00' },
              { label: isRTL ? 'איכות' : 'Quality', value: '1080p' },
            ].map((stat, i) => (
              <View key={i} style={styles.aiStat}>
                <Text style={styles.aiStatValue}>{stat.value}</Text>
                <Text style={styles.aiStatLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
          <Text style={[styles.aiSummaryText, isRTL && { textAlign: 'right' }]}>
            {isRTL
              ? `הסיכום מכיל ${segments || 26} קטעי מפתח שנבחרו על ידי ה-AI. כל רגע נבחר בקפידה כדי לשקף את הרגעים הרגשיים והעלילתיים החשובים ביותר של ${movieTitle || 'הסרט'}.`
              : `This recap contains ${segments || 26} key segments selected by AI. Each moment was carefully chosen to reflect the most emotionally impactful and plot-relevant scenes from ${movieTitle || 'the film'}.`
            }
          </Text>
        </View>
      </View>

      {/* Inline Video Player */}
      {finalRecapFile && (
        <View style={styles.videoPlayerCard}>
          <View style={styles.videoPlayerHeader}>
            <MaterialIcons name="play-circle-outline" size={18} color={Colors.primary} />
            <Text style={[styles.videoPlayerTitle, isRTL && { textAlign: 'right' }]}>
              {isRTL ? 'תצוגה מקדימה' : 'Preview'}
            </Text>
          </View>
          {/* Player viewport */}
          <Pressable
            style={styles.videoViewport}
            onPress={() => setIsPlaying((p) => !p)}
          >
            {/* Black video bg */}
            <LinearGradient
              colors={['#000', '#0a0a14', '#000']}
              style={styles.videoScreen}
            >
              {/* Film grain overlay */}
              <View style={styles.videoOverlay}>
                {/* Play/Pause icon */}
                <View style={[styles.playPauseCircle, isPlaying && styles.playPauseCirclePlaying]}>
                  <MaterialIcons
                    name={isPlaying ? 'pause' : 'play-arrow'}
                    size={44}
                    color="#FFF"
                  />
                </View>
                {/* Center label */}
                <Text style={styles.videoTapHint}>
                  {isPlaying
                    ? (isRTL ? 'לחץ להשהיה' : 'Tap to pause')
                    : (isRTL ? 'לחץ להפעלה' : 'Tap to play')}
                </Text>
              </View>
              {/* Watermark */}
              <Text style={styles.videoWatermark}>AI Recaps</Text>
            </LinearGradient>

            {/* Player controls bar */}
            <View style={styles.videoControls}>
              <Pressable onPress={() => setIsPlaying((p) => !p)} style={styles.videoCtrlBtn}>
                <MaterialIcons
                  name={isPlaying ? 'pause' : 'play-arrow'}
                  size={22}
                  color="#FFF"
                />
              </Pressable>

              {/* Time */}
              <Text style={styles.videoTime}>{progressMM}:{progressSS}</Text>

              {/* Seek bar */}
              <View style={styles.seekBarTrack}>
                <View style={[styles.seekBarFill, { width: `${videoProgress}%` as any }]} />
                <View style={[styles.seekBarThumb, { left: `${videoProgress}%` as any }]} />
              </View>

              <Text style={styles.videoTime}>4:00</Text>

              {/* Fullscreen */}
              <Pressable
                style={styles.videoCtrlBtn}
                onPress={() => {
                  if (finalRecapFile) {
                    Sharing.shareAsync(finalRecapFile.uri);
                  }
                }}
              >
                <MaterialIcons name="fullscreen" size={22} color="#FFF" />
              </Pressable>
            </View>
          </Pressable>
        </View>
      )}

      {/* File Info Card */}
      <View style={styles.fileInfoCard}>
        <View style={styles.fileIcon}>
          <MaterialIcons name="video-file" size={48} color={Colors.primary} />
        </View>
        <View style={styles.fileDetails}>
          <Text style={styles.fileName} numberOfLines={1}>
            {finalRecapFile?.name || 'recap.mp4'}
          </Text>
          <Text style={styles.fileSize}>
            {finalRecapFile ? `${(finalRecapFile.size / 1024 / 1024).toFixed(2)} MB` : '0 MB'}
          </Text>
          <View style={styles.fileMetaRow}>
            <MaterialIcons name="high-quality" size={16} color={Colors.success} />
            <Text style={styles.fileMeta}>1080p • MP4 • H.264</Text>
          </View>
        </View>
      </View>
      
      {/* Download Button */}
      <Pressable
        style={({ pressed }) => [
          styles.downloadButton,
          pressed && styles.buttonPressed,
          isDownloading && styles.buttonDisabled,
        ]}
        onPress={onDownload}
        disabled={isDownloading}
      >
        <LinearGradient
          colors={[Colors.success, '#00C851']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.downloadGradient}
        >
          {isDownloading ? (
            <>
              <ActivityIndicator size="small" color="#FFF" />
              <Text style={styles.downloadButtonText}>
                {isRTL ? 'מוריד...' : 'Downloading...'}
              </Text>
            </>
          ) : (
            <>
              <MaterialIcons name="download" size={24} color="#FFF" />
              <Text style={styles.downloadButtonText}>
                {isRTL ? 'הורד MP4' : 'Download MP4'}
              </Text>
            </>
          )}
        </LinearGradient>
      </Pressable>

      {/* Success Message */}
      <View style={styles.successMessage}>
        <MaterialIcons name="info" size={18} color={Colors.primary} />
        <Text style={styles.successMessageText}>
          {isRTL
            ? 'הקובץ יישמר במכשיר שלך או ייפתח לשיתוף'
            : 'File will be saved to your device or opened for sharing'}
        </Text>
      </View>

      {/* Social Share Preview */}
      <SocialSharePreview
        title={movieTitle || (isRTL ? 'סיכום הסרט' : 'Movie Recap')}
        description={movieDescription || (isRTL ? 'סיכום AI מדהים' : 'Amazing AI-powered recap')}
        isRTL={isRTL}
        onShare={handleSharePlatform}
      />
    </View>
  );
}

function UploadButton({ icon, label, large, onPress, isSelected }: { 
  icon: any; 
  label: string; 
  large?: boolean;
  onPress?: () => void;
  isSelected?: boolean;
}) {
  return (
    <Pressable 
      style={({ pressed }) => [
        styles.uploadButton, 
        large && styles.uploadButtonLarge, 
        isSelected && styles.uploadButtonSelected,
        pressed && styles.buttonPressed
      ]}
      onPress={onPress}
    >
      <MaterialIcons 
        name={icon} 
        size={large ? 32 : 24} 
        color={isSelected ? '#FFF' : Colors.primary} 
      />
      <Text 
        style={[
          styles.uploadButtonText, 
          isSelected && styles.uploadButtonTextSelected
        ]} 
        numberOfLines={1}
      >
        {label}
      </Text>
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
  headerTitle: {
    fontSize: Typography.h3,
    fontWeight: Typography.bold,
    color: Colors.text,
    textAlign: 'center',
  },
  
  // Progress
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  progressStep: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 2,
    borderColor: Colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDotActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    ...Shadows.neon,
  },
  progressDotComplete: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  progressNumber: {
    fontSize: Typography.caption,
    fontWeight: Typography.bold,
    color: Colors.textMuted,
  },
  progressLine: {
    width: 24,
    height: 2,
    backgroundColor: Colors.textMuted,
    marginHorizontal: 4,
  },
  progressLineComplete: {
    backgroundColor: Colors.success,
  },
  
  stepTitle: {
    fontSize: Typography.h4,
    fontWeight: Typography.semibold,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  
  stepContent: {
    alignItems: 'center',
    gap: Spacing.lg,
  },

  // Step 6 Enhanced
  step6Wrapper: {
    width: '100%',
    gap: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  celebrationBanner: {
    width: '100%',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.success + '44',
    ...Shadows.md,
  },
  celebrationIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  celebrationTextBlock: {
    flex: 1,
    gap: Spacing.xs,
  },
  // AI Summary
  aiSummaryCard: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadows.md,
  },
  aiSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surfaceLight,
  },
  aiIconBadge: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiSummaryTitle: {
    flex: 1,
    fontSize: Typography.h4,
    fontWeight: Typography.bold,
    color: Colors.text,
  },
  aiBadge: {
    paddingVertical: 2,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(0,212,255,0.15)',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  aiBadgeText: {
    fontSize: Typography.caption,
    fontWeight: Typography.bold,
    color: Colors.primary,
  },
  aiSummaryBody: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  aiMetaRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  aiMetaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
    maxWidth: '60%',
  },
  aiMetaText: {
    fontSize: Typography.caption,
    color: Colors.textSecondary,
    flexShrink: 1,
  },
  aiStatsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  aiStat: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  aiStatValue: {
    fontSize: Typography.h4,
    fontWeight: Typography.bold,
    color: Colors.primary,
  },
  aiStatLabel: {
    fontSize: Typography.caption,
    color: Colors.textMuted,
    marginTop: 2,
  },
  aiSummaryText: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  // Video Player
  videoPlayerCard: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.lg,
  },
  videoPlayerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.surfaceLight,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  videoPlayerTitle: {
    fontSize: Typography.h4,
    fontWeight: Typography.semibold,
    color: Colors.text,
  },
  videoViewport: {
    width: '100%',
  },
  videoScreen: {
    width: '100%',
    aspectRatio: 16 / 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoOverlay: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  playPauseCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  playPauseCirclePlaying: {
    backgroundColor: 'rgba(0, 212, 255, 0.2)',
    borderColor: Colors.primary,
  },
  videoTapHint: {
    fontSize: Typography.caption,
    color: 'rgba(255,255,255,0.5)',
  },
  videoWatermark: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    fontSize: Typography.caption,
    color: 'rgba(255,255,255,0.3)',
    fontWeight: Typography.semibold,
    letterSpacing: 1,
  },
  videoControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  videoCtrlBtn: {
    padding: Spacing.xs,
  },
  videoTime: {
    fontSize: Typography.caption,
    color: 'rgba(255,255,255,0.7)',
    fontVariant: ['tabular-nums'] as any,
    minWidth: 34,
    textAlign: 'center',
  },
  seekBarTrack: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    position: 'relative',
    overflow: 'visible',
  },
  seekBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  seekBarThumb: {
    position: 'absolute',
    top: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
    marginLeft: -6,
  },
  stepDescription: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  stepHint: {
    fontSize: Typography.bodySmall,
    color: Colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  
  // Text Input
  textInput: {
    width: '100%',
    minHeight: 150,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.body,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    textAlignVertical: 'top',
  },
  
  // Upload
  uploadOptions: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  uploadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  uploadButtonLarge: {
    width: '100%',
    paddingVertical: Spacing.lg,
  },
  uploadButtonSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  uploadButtonText: {
    fontSize: Typography.body,
    fontWeight: Typography.semibold,
    color: Colors.primary,
    flexShrink: 1,
  },
  uploadButtonTextSelected: {
    color: '#FFF',
  },
  
  // Credits Badge
  creditsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  creditsText: {
    fontSize: Typography.body,
    fontWeight: Typography.semibold,
    color: Colors.primary,
  },
  warningText: {
    fontSize: Typography.bodySmall,
    color: Colors.warning,
    textAlign: 'center',
  },
  
  // Bottom Actions
  bottomActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  backButtonText: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
  },
  continueButton: {
    flex: 1,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    ...Shadows.md,
  },
  continueGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  continueButtonText: {
    fontSize: Typography.h4,
    fontWeight: Typography.bold,
    color: '#FFF',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  
  // Ad Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.md,
    maxWidth: 400,
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.lg,
  },
  modalTitle: {
    fontSize: Typography.h3,
    fontWeight: Typography.bold,
    color: Colors.text,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
    marginTop: Spacing.md,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: Typography.body,
    fontWeight: Typography.semibold,
    color: Colors.textSecondary,
  },
  modalWatchButton: {
    flex: 2,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  modalWatchGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  modalWatchText: {
    fontSize: Typography.body,
    fontWeight: Typography.bold,
    color: '#FFF',
  },
  
  // Advanced Settings Modal
  advancedModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    padding: Spacing.md,
  },
  advancedModalContent: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    maxHeight: '90%',
    padding: Spacing.lg,
  },
  advancedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  advancedTitle: {
    fontSize: Typography.h3,
    fontWeight: Typography.bold,
    color: Colors.text,
  },
  advancedCloseButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  advancedField: {
    marginBottom: Spacing.lg,
  },
  advancedLabel: {
    fontSize: Typography.body,
    fontWeight: Typography.semibold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  advancedInput: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    fontSize: Typography.body,
    color: Colors.text,
  },
  advancedTextArea: {
    minHeight: 100,
  },
  tipBox: {
    flexDirection: 'row',
    gap: Spacing.xs,
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.sm,
  },
  tipText: {
    flex: 1,
    fontSize: Typography.bodySmall,
    color: Colors.warning,
    lineHeight: 20,
  },
  genreScroll: {
    marginTop: Spacing.xs,
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
  },
  genreChipTextActive: {
    color: '#FFF',
    fontWeight: Typography.semibold,
  },
  timePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  timePickerGroup: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  timeInput: {
    width: 60,
    height: 50,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    textAlign: 'center',
    fontSize: Typography.h4,
    fontWeight: Typography.bold,
    color: Colors.text,
  },
  timeLabel: {
    fontSize: Typography.caption,
    color: Colors.textMuted,
  },
  timeSeparator: {
    fontSize: Typography.h3,
    fontWeight: Typography.bold,
    color: Colors.text,
    marginTop: -20,
  },
  cutHint: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    fontStyle: 'italic',
  },
  summaryBox: {
    backgroundColor: 'rgba(0, 212, 255, 0.05)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary,
    marginTop: Spacing.md,
  },
  summaryTitle: {
    fontSize: Typography.h4,
    fontWeight: Typography.bold,
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  summaryLabel: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: Typography.body,
    fontWeight: Typography.semibold,
    color: Colors.text,
  },
  advancedSaveButton: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginTop: Spacing.lg,
  },
  advancedSaveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  advancedSaveText: {
    fontSize: Typography.h4,
    fontWeight: Typography.bold,
    color: '#FFF',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  
  // Complete State
  completeBadge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  completeTitle: {
    fontSize: Typography.h2,
    fontWeight: Typography.bold,
    color: Colors.success,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  completeDescription: {
    fontSize: Typography.h4,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  
  // File Info Card
  fileInfoCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
    ...Shadows.md,
  },
  fileIcon: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileDetails: {
    flex: 1,
    gap: Spacing.xs,
  },
  fileName: {
    fontSize: Typography.h4,
    fontWeight: Typography.semibold,
    color: Colors.text,
  },
  fileSize: {
    fontSize: Typography.body,
    color: Colors.textMuted,
  },
  fileMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  fileMeta: {
    fontSize: Typography.bodySmall,
    color: Colors.success,
  },
  
  // Download Button
  downloadButton: {
    width: '100%',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    ...Shadows.lg,
  },
  downloadGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
  },
  downloadButtonText: {
    fontSize: Typography.h4,
    fontWeight: Typography.bold,
    color: '#FFF',
  },
  
  // Success Message
  successMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  successMessageText: {
    flex: 1,
    fontSize: Typography.bodySmall,
    color: Colors.primary,
    lineHeight: 20,
  },
  
  // File Info Box
  fileInfoBox: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.success,
  },
  fileInfoName: {
    fontSize: Typography.body,
    fontWeight: Typography.semibold,
    color: Colors.text,
  },
  fileInfoSize: {
    fontSize: Typography.bodySmall,
    color: Colors.textMuted,
    marginTop: 2,
  },
  
  // Upload Progress
  uploadProgressContainer: {
    width: '100%',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  uploadProgressBar: {
    width: '100%',
    height: 8,
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  uploadProgressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
  },
  uploadProgressText: {
    fontSize: Typography.body,
    fontWeight: Typography.semibold,
    color: Colors.primary,
  },
  
  // Large file note
  largeFileNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(255, 184, 0, 0.08)',
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.warning + '44',
    width: '100%',
  },
  largeFileNoteText: {
    flex: 1,
    fontSize: Typography.caption,
    color: Colors.warning,
    lineHeight: 16,
  },

  // Change Button
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  changeButtonText: {
    fontSize: Typography.body,
    fontWeight: Typography.semibold,
    color: Colors.primary,
  },

  // Buy Credits Link
  buyCreditsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  buyCreditsLinkText: {
    fontSize: Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
  },

  // Step 4 Header
  step4Header: {
    width: '100%',
    marginBottom: Spacing.md,
  },
  step4HeaderGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  step4Title: {
    fontSize: Typography.h4,
    fontWeight: Typography.bold,
    color: Colors.text,
  },
  step4Subtitle: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  // Toggle Row (AI Enhancements / BYOK)
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  toggleLabel: {
    flex: 1,
    fontSize: Typography.body,
    color: Colors.textSecondary,
  },
  toggleLabelActive: {
    color: Colors.text,
    fontWeight: Typography.semibold,
  },
  toggleSwitch: {
    width: 40,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleSwitchOn: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  toggleThumb: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.textMuted,
  },
  toggleThumbOn: {
    backgroundColor: '#FFF',
    alignSelf: 'flex-end',
  },

  // Pipeline Processing (Step 5)
  pipelineProcessingCard: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  pipelineProcessingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  pipelineProcessingTitle: {
    flex: 1,
    fontSize: Typography.h4,
    fontWeight: Typography.semibold,
    color: Colors.text,
  },
  pipelineProgressTrack: {
    width: '100%',
    height: 6,
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  pipelineProgressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
  },
  pipelineProgressLabel: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
  },
  pipelineEventsList: {
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  pipelineEventRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  pipelineEventStep: {
    fontSize: Typography.bodySmall,
    fontWeight: Typography.semibold,
    color: Colors.text,
  },
  pipelineFallbackBadge: {
    fontSize: Typography.caption,
    color: Colors.warning,
    fontWeight: Typography.medium,
  },
  pipelineEventMsg: {
    fontSize: Typography.caption,
    color: Colors.textMuted,
    marginTop: 1,
  },
  pipelineWaiting: {
    fontSize: Typography.bodySmall,
    color: Colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: Spacing.sm,
  },
  pipelineJobId: {
    fontSize: Typography.caption,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },

  // Step 5 Summary Card
  step5SummaryCard: {
    width: '100%',
    backgroundColor: 'rgba(0, 212, 255, 0.05)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  step5SummaryTitle: {
    fontSize: Typography.h4,
    fontWeight: Typography.semibold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  step5SummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flexWrap: 'wrap',
  },
  step5SummaryMeta: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
  },

  // AI Chapter Button
  aiChapterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.secondary + '40',
    marginTop: Spacing.sm,
  },
  aiChapterBtnText: {
    fontSize: Typography.bodySmall,
    color: Colors.secondary,
    fontWeight: Typography.semibold,
  },
  chaptersReadyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderWidth: 1,
    borderColor: Colors.success + '40',
    marginTop: Spacing.sm,
    alignSelf: 'flex-start',
  },
  chaptersReadyText: {
    fontSize: Typography.bodySmall,
    color: Colors.success,
    fontWeight: Typography.semibold,
  },
});
