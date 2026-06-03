# AI Recaps Maker

A cross-platform mobile application built with React Native and Expo that uses Google Gemini AI to automatically generate video recaps.

## Project Overview

- **App Name**: AI Recaps Maker
- **Framework**: React Native + Expo (SDK 54)
- **Routing**: Expo Router (file-based)
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Backend**: Supabase (Auth, Database, Edge Functions)
- **AI**: Google Gemini API via Supabase Edge Functions

## Running the App

The app runs in web mode via Expo Metro bundler:

```
npx expo start --web --port 5000 --no-dev
```

**Note**: The `--no-dev` flag is required to avoid an HMR client crash caused by a `pretty-format` version mismatch in `@expo/metro-runtime@5.0.4`.

## Project Structure

- `app/` - Expo Router routes (login, signup, onboarding, tabs)
- `app/(tabs)/` - Main tab screens (home, create, gallery, settings)
- `components/` - Reusable UI components
- `contexts/` - React Context providers (Auth, AdMob, Language, Credits, etc.)
- `constants/` - Colors, themes, i18n translations (32 languages)
- `services/` - Business logic (Gemini AI, Stripe, AdMob, uploads)
- `hooks/` - Custom React hooks
- `lib/` - Shared utilities (Blink SDK client)
- `template/` - Auth and UI template abstractions
- `supabase/` - Edge Functions and backend logic

## Environment Variables

Set in `.env` and `.env.local`:
- `EXPO_PUBLIC_SUPABASE_URL` - Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `EXPO_PUBLIC_BLINK_PROJECT_ID` - Blink SDK project ID
- `EXPO_PUBLIC_BLINK_PUBLISHABLE_KEY` - Blink SDK publishable key

## New Files (Task #2)

- `contexts/AdvancedSettingsContext.tsx` - Shared recap settings state (title, genre, duration, RAG, etc.) with AsyncStorage persistence; syncs bidirectionally between Create wizard and Settings screen
- `services/pipeline.ts` - Pipeline API client (POST /recaps/jobs, GET /recaps/jobs/:id/events) with mock simulation fallback when backend URL not configured (EXPO_PUBLIC_PIPELINE_URL)

## Wizard Architecture (5-step)

The Create wizard (`app/(tabs)/create.tsx`) uses a 5-step flow:
1. **Script Input** — paste text, upload TXT, or upload MP3
2. **Audio Processing** — live pipeline event display with animated status
3. **Upload Video** — pick video file with progress and credit check
4. **AI Settings** — inline advanced settings card (title, genre, description, duration, cut interval, RAG customization), synced via AdvancedSettingsContext
5. **Create Recap** — final confirmation, job creation, video player, download, social sharing

Draft persistence: wizard state auto-saves to AsyncStorage (`@airm_wizard_draft_v2`) and restores on next app open; if a processing job is found it re-subscribes to pipeline events; clears on completion.

## Task #3: YouTube Learning + BYOK Channel Management

### New Screen
- `app/(tabs)/youtube-channels.tsx` — Dedicated "Channels + API" screen accessible from Home BYOK card and tab bar
  - **YouTube Data API v3 key management**: Add/replace/delete key with visual status indicator; Key Vault gates full key display behind 6-digit PIN + biometric (expo-local-authentication)
  - **Channel slots**: Visual progress bar, slot count display (used/total); unlock via 2 rewarded ads OR 2 credits for 7-day slot
  - **Add channels**: URL, @handle, or Channel ID (UC...) input with validation
  - **Channel list**: Toggle active/inactive, individual sync, remove with confirmation
  - **Auto-refresh interval**: User-selectable (1h/6h/12h/24h/48h/1week) with persistence
  - **Learning consent**: Personal learning toggle; Global anonymous learning with explicit modal consent + monthly re-confirmation expiry check; anonymization rules displayed in consent modal

### Updated Files
- `app/(tabs)/index.tsx` — BYOK card now navigates to `/youtube-channels` (was `/settings`); updated icon and labels
- `app/(tabs)/_layout.tsx` — Added `youtube-channels` tab

### New Backend Stubs (Supabase Edge Functions)
- `supabase/functions/youtube-learning/index.ts` — Channels CRUD + sync + status endpoints with privacy/anonymization rules documented
- `supabase/functions/youtube-keys/index.ts` — Key save (with AES-GCM encryption + YouTube API validation) and daily re-validation endpoints

## Dependencies Fixed During Setup

1. Installed `ajv@^8.8.2` (root) - fixes `ajv/dist/compile/codegen` not found error caused by `ajv-keywords@5.1.0` requiring ajv v8
2. Installed `@blinkdotnew/sdk` - required by `lib/blink.ts`
3. Installed `@lottiefiles/dotlottie-react` - required by `lottie-react-native` web support
4. Added `--no-dev` flag to Expo start command - fixes HMR client crash

## Language

The app defaults to Hebrew (RTL) but supports 32 languages.
