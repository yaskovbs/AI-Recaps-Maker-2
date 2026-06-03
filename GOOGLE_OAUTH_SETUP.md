# 🔐 Google OAuth Setup Guide

## סקירה

Google OAuth מאפשר למשתמשים להתחבר עם חשבון Google שלהם באופן מאובטח דרך OnSpace Cloud (Supabase).

---

## שלב 1: הגדרת Google Cloud Console

### 1.1 צור פרויקט חדש

1. לך ל-https://console.cloud.google.com/
2. לחץ על "Select a project" → "NEW PROJECT"
3. שם: **AI Recaps Maker**
4. לחץ "CREATE"

### 1.2 הפעל Google+ API

1. Navigation Menu → APIs & Services → Library
2. חפש "Google+ API"
3. לחץ "ENABLE"

### 1.3 צור OAuth 2.0 Credentials

1. Navigation Menu → APIs & Services → Credentials
2. לחץ "+ CREATE CREDENTIALS" → "OAuth 2.0 Client ID"
3. אם נדרש, הגדר OAuth consent screen:
   - User Type: **External**
   - App name: **AI Recaps Maker**
   - User support email: **your-email@example.com**
   - Developer contact: **your-email@example.com**
   - לחץ "SAVE AND CONTINUE"

4. יצירת Client ID:
   - Application type: **Web application**
   - Name: **AI Recaps Maker Web Client**
   
5. **Authorized redirect URIs** (חשוב מאוד!):
   ```
   https://YOUR_SUPABASE_PROJECT_ID.supabase.co/auth/v1/callback
   ```
   
   **איפה למצוא את PROJECT_ID?**
   - OnSpace Cloud Dashboard → Settings
   - או בURLshel Supabase: `https://[PROJECT_ID].supabase.co`
   
   **דוגמה:**
   ```
   https://qqvwidcyxjkscxcqqqvw.supabase.co/auth/v1/callback
   ```

6. לחץ "CREATE"

7. **שמור את הפרטים הבאים:**
   - Client ID: `1234567890-abc123xyz.apps.googleusercontent.com`
   - Client Secret: `GOCSPX-abc123xyz...`

---

## שלב 2: הגדרת OnSpace Cloud (Supabase)

### 2.1 פתח את Cloud Dashboard

1. OnSpace → Project → Right Panel → **Cloud** button (top)
2. Dashboard נפתח בחלון חדש

### 2.2 הגדר Google OAuth Provider

1. Dashboard → Authentication → Providers
2. מצא **Google** ברשימה
3. לחץ על Google כדי לפתוח הגדרות

4. **הגדר את הפרטים:**
   - **Enable Google provider**: ✅ ON
   - **Client ID**: הדבק את ה-Client ID מ-Google Console
   - **Client Secret**: הדבק את ה-Client Secret
   - **Authorized Client IDs**: (השאר ריק אלא אם כן צריך mobile)

5. לחץ **SAVE**

---

## שלב 3: בדיקה

### 3.1 בדוק ב-Live Preview

1. OnSpace → Right Panel → Preview Mode
2. לחץ על "Login" → "Continue with Google"
3. בחר חשבון Google
4. אשר הרשאות
5. אם הכול עבד - תועבר לאפליקציה! ✅

### 3.2 בעיות נפוצות

#### שגיאה: "redirect_uri_mismatch"

**סיבה:** ה-Redirect URI לא תואם

**פתרון:**
1. Google Cloud Console → Credentials
2. ערוך את ה-OAuth 2.0 Client ID
3. וודא ש-Authorized redirect URIs מכיל:
   ```
   https://YOUR_SUPABASE_PROJECT_ID.supabase.co/auth/v1/callback
   ```

#### שגיאה: "invalid_client"

**סיבה:** Client ID או Secret שגויים

**פתרון:**
1. בדוק שהעתקת נכון את Client ID ו-Secret
2. אין רווחים בהתחלה או בסוף
3. Client Secret חייב להתאים ל-Client ID

#### שגיאה: "access_denied"

**סיבה:** OAuth consent screen לא מאושר

**פתרון:**
1. Google Cloud Console → OAuth consent screen
2. וודא שהסטטוס הוא "Published" או "Testing"
3. אם Testing - הוסף את האימייל שלך ל-Test users

---

## שלב 4: הוסף Test Users (אם במצב Testing)

1. Google Cloud Console → OAuth consent screen
2. גלול ל-"Test users"
3. לחץ "+ ADD USERS"
4. הוסף את האימייל שלך
5. לחץ "SAVE"

---

## שלב 5: פרסם (לפרודקשן)

### 5.1 בזמן פיתוח

- OAuth consent screen: **Testing**
- מגבלה: 100 משתמשים
- יש להוסיף כל tester ידנית

### 5.2 לפרודקשן

1. Google Cloud Console → OAuth consent screen
2. לחץ "PUBLISH APP"
3. Google יסקור את האפליקציה (7-14 ימים)
4. אחרי אישור - כל משתמש יוכל להתחבר

---

## ✅ Checklist

- [ ] פרויקט נוצר ב-Google Cloud Console
- [ ] Google+ API הופעל
- [ ] OAuth 2.0 Client ID נוצר
- [ ] Redirect URI מוגדר נכון
- [ ] Client ID ו-Secret הועתקו
- [ ] Google Provider הופעל ב-OnSpace Cloud Dashboard
- [ ] Client ID ו-Secret הוזנו ב-Dashboard
- [ ] Settings נשמרו
- [ ] Login עם Google עובד ב-Live Preview

---

## 📖 קישורים שימושיים

- Google Cloud Console: https://console.cloud.google.com/
- Supabase Auth Docs: https://supabase.com/docs/guides/auth/social-login/auth-google
- OnSpace Cloud Dashboard: https://qqvwidcyxjkscxcqqqvw.supabase.co

---

## 💡 טיפים

### שמור Credentials בבטחה

```
Client ID: 1234567890-abc123xyz.apps.googleusercontent.com
Client Secret: GOCSPX-abc123xyz...
Redirect URI: https://qqvwidcyxjkscxcqqqvw.supabase.co/auth/v1/callback
```

### בדיקה מהירה

```typescript
// בקוד - הוסף console.log
const { signInWithGoogle } = useAuth();

const handleGoogleLogin = async () => {
  console.log('🚀 Starting Google OAuth...');
  const { error } = await signInWithGoogle();
  
  if (error) {
    console.error('❌ OAuth Error:', error);
  } else {
    console.log('✅ OAuth Success!');
  }
};
```

---

בהצלחה! 🎉
