# 🎬 AI Recaps Maker

אפליקציית מובייל חכמה ליצירת סיכומי וידאו אוטומטיים לסרטים וסדרות טלוויזיה, מבוססת על Google Gemini AI.

**פלטפורמות:** Android · iOS  
**טכנולוגיות:** React Native · Expo SDK 54 · TypeScript · OnSpace Cloud (Supabase)

---

## מה האפליקציה עושה?

משתמש מעלה וידאו (עד 5GB), קובץ TXT של תסריט ו/או MP3 של קריינות — האפליקציה מנתחת אותם בעזרת AI ומייצרת סיכום וידאו מקוצר ואיכותי בלחיצת כפתור.

---

## ✨ תכונות עיקריות

### 🧙 Wizard יצירה — 5 שלבים

| שלב | מה קורה |
|-----|---------|
| **1 — תסריט + אודיו** | העלאת קובץ TXT (ניתוח שפה, מבנה, מילים, זמן קריינות) → העלאת MP3 (ניתוח קצב דיבור WPM, אורך, ערוצים) |
| **2 — סקירה + פרקים** | סיכום תוצאות העיבוד, עריכת פרקי וידאו ידנית |
| **3 — וידאו** | העלאת וידאו (MP4/AVI/MOV/MKV/WebM) עם progress bar בזמן אמת ואת הדוחים לאחסון |
| **4 — הגדרות AI** | כותרת, ז'אנר (20 אפשרויות), תיאור, אורך סיכום, מרווח חיתוך, RAG customization, מפתחות API (BYOK) |
| **5 — עיבוד + הורדה** | מעקב live אחר pipeline, preview player מובנה, הורדת MP4, שיתוף רשתות חברתיות |

---

### 🤖 AI ועיבוד

- **Google Gemini AI** — ניתוח וידאו, זיהוי סצינות, יצירת תסריט סיכום  
- **BYOK (Bring Your Own Key)** — שמירה מאובטחת של מפתח Gemini / YouTube Data API / Google Search API  
- **RAG Customization** — שליטה על טון, קהל יעד, תחומי מיקוד, נושאים להדרה  
- **ניתוח TXT** — זיהוי שפה, מבנה (תסריט/פרוזה/רשימה), ספירת מילים, זמן קריינות משוער  
- **ניתוח MP3** — אורך משוער, קצב דיבור WPM, ערוצים, ביטרייט

---

### 📺 YouTube Learning

- ניהול עד 11 ערוצי YouTube
- חיבור עם YouTube Data API v3 לאחזור מידע ערוץ
- למידה מתוכן ערוצים לשיפור הסיכומים (בהסכמת המשתמש)

---

### 💰 מערכת קרדיטים ומודעות

- **AdMob** — Banner / Interstitial / Rewarded / App Open
- צפייה במודעה מתוגמלת → +1 קרדיט
- רכישת קרדיטים ב-Stripe (חיוב חד-פעמי)
- כל יצירת סיכום עולה קרדיט אחד

---

### 🔐 אימות משתמשים

- **כניסה עם Google** (OAuth 2.0)
- **כניסה עם אימייל + סיסמה**
- **OTP** — קוד 4 ספרות לדוא"ל
- הגנה על מסכים מאומתים עם `AuthRouter`

---

### 📊 לשוניות ומסכים

| לשונית | תיאור |
|--------|-------|
| **Home** | Hero, מאזן קרדיטים, סטטיסטיקות (סיכומים / משתמשים / זמינות / דירוג), דירוג כוכבים |
| **Recaps** | ספריית הסיכומים שנוצרו עם מצב, סינון ועריכה |
| **Create** | Wizard 5 שלבים ליצירת סיכום חדש |
| **Gallery** | גלריית סיכומים ציבוריים |
| **Analytics** | נתוני שימוש ב-API, עלויות, גרפים |
| **Contact** | טופס צור קשר עם שמירה ב-DB |
| **API Tracking** | מעקב שימוש ב-API Gemini לפי מפתח |
| **History** | היסטוריית כל הסיכומים שנוצרו |
| **Settings** | Gemini key, YouTube key, שפה (עברית/אנגלית), הגדרות מתקדמות |

---

## 🏗️ ארכיטקטורה

```
app/                    ← מסכים (Expo Router)
├── (tabs)/             ← 9 לשוניות
├── login.tsx           ← מסך כניסה (Google + Email + OTP)
├── signup.tsx          ← הרשמה
├── admin.tsx           ← לוח ניהול
└── admob-analytics.tsx ← AdMob דאשבורד

services/               ← שכבת נתונים
├── gemini.ts           ← קריאות ל-Edge Function של Gemini
├── pipeline.ts         ← ניהול תור עיבוד + simulation fallback
├── file-analysis.ts    ← ניתוח TXT ו-MP3 עם live events
├── upload.ts           ← העלאה ל-Supabase Storage עם progress
└── api-tracking.ts     ← מעקב ושמירת שימוש API

contexts/               ← State גלובלי
├── AuthContext         ← משתמש, BYOK keys
├── CreditsContext      ← מאזן קרדיטים
├── RecapsContext       ← ספריית סיכומים
├── AdMobContext        ← מודעות (native/web split)
├── YouTubeChannelsContext ← ניהול ערוצים
├── AdvancedSettingsContext ← הגדרות wizard
├── LanguageContext     ← עברית / אנגלית + RTL
└── ApiTrackingContext  ← צריכת API

supabase/functions/
├── process-gemini/     ← Edge Function — ניתוח Gemini AI
└── send-contact/       ← Edge Function — שליחת הודעת צור קשר

components/
├── CreditsPurchaseModal  ← רכישת קרדיטים עם Stripe
├── RecapCustomizationPanel ← RAG settings
├── VideoChaptersEditor   ← עריכת פרקים
├── UploadProgressBar     ← ETA + גודל
├── YouTubeChannelsModal  ← ניהול ערוצים
└── SocialSharePreview    ← שיתוף רשתות חברתיות
```

---

## 🗄️ Database (OnSpace Cloud)

| טבלה | תיאור |
|------|-------|
| `recaps` | סיכומי וידאו — status, progress, URLs, visibility |
| `user_profiles` | פרופיל משתמש מקושר ל-auth |
| `user_api_keys` | מפתחות API מוצפנים (hash) |
| `api_usage` | מעקב שימוש API לפי מפתח ותאריך |
| `contact_messages` | הודעות מטופס צור קשר |
| `genres` | 20+ ז'אנרים (עברית + אנגלית) |
| `processing_jobs` | תורי עיבוד AI |

**Storage Buckets:** `videos` (5GB) · `audio` (100MB) · `documents` (10MB) · `thumbnails` (5MB) · `rendered` (5GB)

---

## 🎨 Design System

- **ערכת צבעים:** Neon AI Dark — Cyan `#00D4FF` + Purple `#B24BF3` על רקע `#0a0a14`
- **טיפוגרפיה:** סקאלה 12–28px, משקל 400–700
- **RTL מלא:** תמיכה בעברית עם היפוך כיוון אוטומטי
- **שפות:** עברית / אנגלית (מיתוג בזמן אמת)

---

## 📱 AdMob IDs

| סוג | Unit ID |
|-----|---------|
| App ID | `ca-app-pub-9953179201685717~4175960790` |
| Banner | `ca-app-pub-9953179201685717/1363779404` |
| Interstitial | `ca-app-pub-9953179201685717/5210675011` |
| Rewarded Interstitial | `ca-app-pub-9953179201685717/8848066496` |
| Rewarded | `ca-app-pub-9953179201685717/6229927427` |

---

## 🚀 Build

```bash
# Development
npx expo start

# Android APK (preview)
eas build --platform android --profile preview

# iOS Simulator
eas build --platform ios --profile preview-simulator

# Production
eas build --platform all --profile production
```

**Bundle IDs:**  
- Android: `com.ylbs.airecapsmaker`  
- iOS: `com.ylbs.airecapsmaker`

---

## 🔑 משתני סביבה

```
EXPO_PUBLIC_SUPABASE_URL        ← מסופק אוטומטית ע"י OnSpace Cloud
EXPO_PUBLIC_SUPABASE_ANON_KEY   ← מסופק אוטומטית ע"י OnSpace Cloud
```

מפתחות Gemini / YouTube / Google Search נשמרים **בצד הלקוח בלבד** (AsyncStorage מוצפן) — לא נשמרים ב-DB.

---

## 📋 זרימת שימוש

```
כניסה (Google / Email)
        ↓
     דף הבית
  (קרדיטים + סטטיסטיקות)
        ↓
   Create Wizard
  שלב 1: TXT + MP3 ← ניתוח AI
  שלב 2: סקירה + פרקים
  שלב 3: העלאת וידאו
  שלב 4: הגדרות + BYOK
  שלב 5: עיבוד → הורדה → שיתוף
        ↓
  Recaps / Gallery / History
```
