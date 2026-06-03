# AI Recaps Maker

## Project Overview

Expo React Native mobile app (iOS & Android) for creating AI-powered video/audio recaps using Google Gemini.

- **Framework:** Expo SDK 54 + Expo Router (file-based routing)
- **Language:** TypeScript
- **State:** 12 React Context providers (no Redux/Zustand in active use)
- **Backend:** Blink SDK (auth, storage, database)
- **i18n:** Hebrew (RTL) + English
- **Payments:** Stripe (credit-based system)
- **Ads:** AdMob via `react-native-google-mobile-ads`

## Development Commands

```bash
npm start              # Start Expo dev server
npm run android        # Start on Android
npm run ios            # Start on iOS
npm run web            # Start on web
npm run lint           # Run ESLint
npx eas build --profile development   # Build dev client (required for AdMob)
npx eas build --profile production    # Production build
```

## Key Architecture

### Folder Structure
- `app/` — Expo Router screens (tabs, auth, admin)
- `contexts/` — React Context providers (auth, credits, AdMob, language, etc.)
- `services/` — Business logic (upload, AdMob, Gemini, Stripe, API tracking)
- `constants/` — Config (AdMob IDs, i18n strings, theme, platform)
- `components/` — Reusable UI components
- `lib/` — Blink SDK client initialization

### File Upload (Android content:// fix)
- `services/upload.ts` handles all file uploads to Blink Storage
- **Android content:// URIs** are resolved to local `file://` paths via `FileSystem.copyAsync` before upload — `fetch()` and `readAsStringAsync()` do NOT support `content://` on Android
- Max video size: **5 GB** (requires temporary cache space on device)
- Credit-based upload tiers: 0 credits = blocked, 1-4 = 500MB, 5-9 = 1GB, 10-19 = 2.5GB, 20+ = 5GB

### AdMob
- Plugin configured in `app.json` with Android + iOS app IDs
- `contexts/AdMobContext.native.tsx` — real SDK integration (requires Dev Client, NOT Expo Go)
- `contexts/AdMobContext.web.tsx` — web fallback (no-op)
- `services/admob.ts` — frequency tracking, impression recording, continuous learning analytics
- `constants/admob.ts` — ad unit IDs, frequency caps, reward config
- Ad types: Rewarded, Interstitial, App Open, Rewarded Interstitial

### State Persistence
- User preferences (notifications, learning) → `AsyncStorage` with `@airm_pref_*` keys
- API keys → `AsyncStorage` with `@airm_*_api_key` keys
- Ad impressions → `AsyncStorage` with `@airm_admob_*` keys
- Auth state → Blink SDK with `AsyncStorage` adapter
- Credits → Blink DB (cloud) with local cache

## Known TODOs
- `contexts/YouTubeChannelsContext.tsx:181,190` — Real sync with YouTube Data API (currently mock)

## Test Recommendations

No tests exist yet. Highest-value areas to add tests:

| Area | File | What to Test |
|------|------|-------------|
| Upload validation | `services/upload.ts` | `validateFileSize`, `getUploadLimitForCredits`, `getMaxFileSize`, content:// URI normalization |
| AdMob frequency | `services/admob.ts` | `canShowAd` time-window logic, `recordImpression` cleanup, `recordAdInteraction` learning data |
| Credit limits | `services/upload-limits.ts` | Tier boundary values (0, 1, 5, 10, 20 credits) |
| Format validation | `services/upload.ts` | `validateFileFormat`, `getMimeType` edge cases |
| Settings persistence | `app/(tabs)/settings.tsx` | AsyncStorage round-trip for notifications/learning toggles |
| Notification system | `contexts/NotificationsContext.tsx` | API usage alerts, threshold calculations |

**Recommended setup:** Jest + `@testing-library/react-native` + `jest-expo` preset (compatible with Expo 54).
