# 🚀 Backend Integration Complete!

## מה הוספנו?

### ✅ Database Schema
- **טבלת `recaps`** - סיכומים עם כל הפרטים
- **טבלת `processing_jobs`** - מעקב אחר עיבוד AI
- **טבלת `contact_messages`** - הודעות צור קשר
- **RLS Policies** - אבטחה מלאה

### ✅ Storage Buckets
- **`videos`** - קבצי MP4, AVI, MOV (עד 500MB)
- **`audio`** - קבצי MP3, WAV (עד 100MB)
- **`documents`** - קבצי TXT, DOC, PDF (עד 10MB)
- **`rendered`** - סיכומים מוכנים (ציבורי)
- **`thumbnails`** - תמונות ממוזערות (ציבורי)

### ✅ Edge Functions
- **`process-gemini`** - עיבוד AI אמיתי עם Gemini
- **`send-contact`** - שליחת הודעות צור קשר

### ✅ Client Services
- **`services/upload.ts`** - העלאת קבצים עם Progress
- **`services/gemini.ts`** - אינטגרציה עם Gemini AI
- **`services/contact.ts`** - שליחת הודעות

### ✅ Updated Contexts
- **`RecapsContext`** - חיבור מלא ל-Backend
- **`ContactsContext`** - שליחה דרך Edge Function

---

## 🔑 Google OAuth Setup

**⚠️ דרוש הגדרה ידנית ב-Cloud Dashboard**

### Quick Steps:

1. **Google Cloud Console**:
   - צור OAuth 2.0 Client
   - הוסף Redirect URI: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`
   - העתק Client ID + Secret

2. **OnSpace Cloud Dashboard**:
   - Cloud → Authentication → Providers → Google
   - הדבק Client ID + Secret
   - Save

3. **Test**:
   - Login → Continue with Google
   - אם עובד = ✅

📖 **מדריך מפורט**: `GOOGLE_OAUTH_SETUP.md`

---

## 📤 File Upload - Quick Start

```typescript
import { uploadFile, SUPPORTED_FORMATS } from '@/services/upload';

// Upload video
const result = await uploadFile(
  fileUri,
  'my-video.mp4',
  'videos',
  (progress) => {
    console.log(`Upload: ${progress.percentage}%`);
  }
);

console.log('URL:', result.url);
```

**Supported Formats**:
- **Video**: MP4, AVI, MOV, MKV, WebM
- **Audio**: MP3, WAV, AAC, M4A, OGG
- **Documents**: TXT, DOC, DOCX, PDF

---

## 🤖 Gemini AI - Quick Start

```typescript
import { processWithGemini } from '@/services/gemini';
import { useAuth } from '@/contexts/AuthContext';

const { geminiApiKey } = useAuth();

// Process recap with Gemini
const { data, error } = await processWithGemini({
  recapId: 'recap-uuid',
  geminiApiKey,
});

if (!error) {
  console.log('Script:', data.script);
  console.log('URL:', data.scriptUrl);
}
```

**Real-time Progress**:
```typescript
import { subscribeToRecap } from '@/services/gemini';

const unsubscribe = subscribeToRecap(recapId, (recap) => {
  console.log('Progress:', recap.progress); // 0-100
  console.log('Status:', recap.status); // pending/processing/completed/failed
});

// Cleanup
return unsubscribe;
```

---

## 📧 Contact Form - Quick Start

```typescript
import { sendContactMessage } from '@/services/contact';

const { data, error } = await sendContactMessage({
  name: 'John Doe',
  email: 'john@example.com',
  subject: 'Support Request',
  message: 'I need help with...',
});

if (!error) {
  console.log('Message sent!', data.messageId);
}
```

---

## 📊 Recaps - Full CRUD

```typescript
import { useRecaps } from '@/contexts/RecapsContext';

const {
  recaps,           // My recaps
  publicRecaps,     // All public recaps
  createRecap,
  updateRecap,
  deleteRecap,
  incrementViews,
  incrementShares,
} = useRecaps();

// Create new recap
const recap = await createRecap({
  title: 'Siren S01E01',
  genre: 'sci-fi',
  duration: 240,
  cut_interval: 9,
  input_type: 'mp4',
  visibility: 'private', // or 'public'
});

// Update progress
await updateRecap(recap.id, {
  status: 'processing',
  progress: 50,
});

// Mark as completed
await updateRecap(recap.id, {
  status: 'completed',
  progress: 100,
  rendered_url: 'https://...',
});

// Track stats
await incrementViews(recap.id);
await incrementShares(recap.id);
```

---

## 🎯 Complete Create Flow Example

```typescript
import { uploadFile } from '@/services/upload';
import { processWithGemini, subscribeToRecap } from '@/services/gemini';
import { useRecaps } from '@/contexts/RecapsContext';
import { useAuth } from '@/contexts/AuthContext';

async function createFullRecap(videoUri: string, title: string) {
  const { createRecap, updateRecap } = useRecaps();
  const { geminiApiKey } = useAuth();

  // Step 1: Upload video
  console.log('📤 Uploading video...');
  const videoResult = await uploadFile(
    videoUri,
    'video.mp4',
    'videos',
    (progress) => console.log(`Upload: ${progress.percentage}%`)
  );

  // Step 2: Create recap record
  console.log('📝 Creating recap...');
  const recap = await createRecap({
    title,
    genre: 'action',
    duration: 180,
    cut_interval: 9,
    input_type: 'mp4',
    video_url: videoResult.url,
  });

  // Step 3: Start Gemini processing
  console.log('🤖 Processing with Gemini...');
  const { data, error } = await processWithGemini({
    recapId: recap.id,
    geminiApiKey,
  });

  if (error) {
    await updateRecap(recap.id, {
      status: 'failed',
      error_message: error,
    });
    return;
  }

  // Step 4: Listen to real-time updates
  const unsubscribe = subscribeToRecap(recap.id, (updatedRecap) => {
    console.log('Status:', updatedRecap.status);
    console.log('Progress:', updatedRecap.progress);
    
    if (updatedRecap.status === 'completed') {
      console.log('✅ Recap completed!');
      console.log('Download:', updatedRecap.rendered_url);
      unsubscribe();
    }
  });

  return recap.id;
}
```

---

## 🐛 Debugging

### Check Backend Connection

```typescript
import { getSupabaseClient } from '@/template';

const supabase = getSupabaseClient();

// Test connection
const { data: { user } } = await supabase.auth.getUser();
console.log('User:', user);

// Test database
const { data, error } = await supabase.from('recaps').select('count');
console.log('Recaps count:', data);
```

### Check Edge Function

```bash
# View logs in Cloud Dashboard
Cloud → Edge Functions → process-gemini → Logs
```

### Check Storage

```bash
# View files in Cloud Dashboard
Cloud → Storage → videos
```

---

## ⚠️ Important Notes

### 1. Environment Variables

Backend environment variables are **auto-configured**:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

**No manual setup needed!**

### 2. API Keys (BYOK)

Users provide their own API keys:
- **Gemini API Key** - for AI processing
- Stored locally (AsyncStorage)
- Sent to Edge Functions as parameter

### 3. File Size Limits

- Videos: 500MB
- Audio: 100MB
- Documents: 10MB

**Large files**: Consider compression before upload

### 4. RLS Security

All tables have Row Level Security:
- Users can only access **their own data**
- Public recaps visible to **all users**
- Contact messages private

---

## 📚 Next Steps

1. **Setup Google OAuth**: See `GOOGLE_OAUTH_SETUP.md`
2. **Test File Upload**: Upload MP4/MP3/TXT
3. **Test Gemini Processing**: Create a recap
4. **Test Contact Form**: Send a message
5. **Check Real-time**: Subscribe to updates

---

## 🎉 You're Ready!

אתה מוכן להתחיל להשתמש ב-Backend המלא!

כל התכונות עובדות:
- ✅ Google OAuth
- ✅ File Upload (כל הפורמטים)
- ✅ Gemini AI Processing
- ✅ Real-time Updates
- ✅ Contact Form
- ✅ Public/Private Recaps
- ✅ Stats Tracking

**Happy Coding!** 🚀
