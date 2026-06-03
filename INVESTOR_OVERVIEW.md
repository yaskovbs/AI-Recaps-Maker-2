# AI Recaps Maker — Investor Overview

> **AI-powered video & audio recap generation for mobile — iOS & Android**

---

## What We Built

**AI Recaps Maker** is a production-ready React Native mobile app that lets users upload a video, audio file, or script and receive an intelligent AI-generated recap — powered by Google Gemini.

### Core User Flow

```
Upload Video/Audio/Script
        ↓
Customize: Genre · Tone · Length · Audience
        ↓
AI Processing (Google Gemini)
        ↓
Recap: Summary · Chapters · Social Share
```

---

## Key Features

### 🎬 6-Step Recap Creation Wizard
| Step | What Happens |
|------|-------------|
| 1 | Title, genre selection (31 genres), description |
| 2 | Pipeline configuration |
| 3 | Upload video/audio/script (up to 5GB) |
| 4 | API key management (Gemini BYOK or app key) |
| 5 | Customize tone, detail level, target audience |
| 6 | Preview recap + social share |

**Resume-able drafts** — users never lose progress mid-wizard.

### 📺 YouTube Learning Integration
- Connect YouTube channels for richer AI context
- Consent-based channel learning model
- VidIQ-style analytics: SEO score, competitor analysis, trending topics

### 💰 Monetization System
| Channel | Details |
|---------|---------|
| **Stripe Credits** | 5-tier packages — Starter → Studio |
| **AdMob** | Rewarded ads to earn free credits |
| **BYOK** | Users bring their own Gemini API key (reduces our cost) |

**Credit-based upload limits:**
- 0 credits → blocked
- 1–4 credits → 500MB
- 5–9 credits → 1GB
- 10–19 credits → 2.5GB
- 20+ credits → 5GB

### 🌍 Multi-Language (Hebrew RTL + English)
Full right-to-left layout support for the Israeli market.

---

## Technical Highlights

### Stack
| Layer | Technology |
|-------|-----------|
| Framework | Expo SDK 54 + Expo Router |
| Language | TypeScript 6.0 |
| State | 12 React Context providers |
| Backend | Blink SDK (auth, DB, storage) |
| AI | Google Gemini API |
| Payments | Stripe |
| Ads | Google AdMob |
| Platform | iOS + Android + Web |

### Scale
- **115 TypeScript files** / ~33,000 lines of code
- **5GB upload support** with real-time progress + ETA
- **Android content:// URI fix** — resolves native file access limitation
- **OOM-safe MP4 handling** — streams large files without memory spikes

### Quality
- TypeScript 6.0 — **0 type errors**
- TypeScript Go (`tsgo`) — **10x faster** type checking in CI
- GitHub Actions CI — automated type checking on every push
- Structured logging via `utils/logger.ts`

---

## Codebase Structure

```
app/             Screens (Home, Create, Recaps, Analytics, Settings, Admin)
contexts/        State management (Auth, Credits, AdMob, YouTube, Notifications...)
services/        Business logic (Upload, Pipeline, Gemini, Stripe, AdMob)
components/      UI library (Wizard, Video Player, Share Preview, Credits Modal)
constants/       Theme, AdMob IDs, Storage keys
```

---

## What Was Delivered

### Task #2 — Core Wizard + Pipeline
- Complete 6-step recap creation wizard
- Real pipeline integration with SSE event streaming
- Credit validation, refund on failure, idempotency
- AdMob integration (4 ad types)

### Task #3 — YouTube Learning + BYOK
- YouTube channel management screen
- Bring-Your-Own-Key (BYOK) for Gemini, YouTube, Google Search APIs
- Keys stored securely (SecureStore on native, AsyncStorage on web)
- VidIQ-style YouTube analytics dashboard (5 tabs)

### TypeScript Migration
- Upgraded TypeScript 5.8 → **6.0** (bridge release to TypeScript 7)
- Added `@typescript/native-preview` (tsgo) for **x10 faster** type checking
- 0 type errors after migration

---

## Business Model

```
Free Tier          → Limited uploads, AdMob-supported
Credit Packages    → One-time Stripe purchase, no subscription required
BYOK               → Power users bring their own API keys (zero marginal cost)
```

**Revenue Streams:**
1. Credit sales (Stripe)
2. AdMob impressions (rewarded ads for credit earning)
3. Future: SaaS API for enterprise recap generation

---

## Roadmap

- [ ] Real YouTube Data API sync (currently mock data)
- [ ] Recap sharing marketplace / gallery
- [ ] Team accounts & enterprise tier
- [ ] Export to MP4 with rendered recap video

---

## Repository

**GitHub:** `yaskovbs/AI-Recaps-Maker-9bgbm7`

**Key files:**
- `app/(tabs)/create.tsx` — Main wizard
- `services/upload.ts` — Android upload + 5GB support
- `services/pipeline.ts` — AI processing pipeline
- `contexts/AuthContext.tsx` — Auth + BYOK key management
- `CLAUDE.md` — Full architecture documentation
- `MIGRATION_PLAN.md` — TypeScript 6.0 migration guide
