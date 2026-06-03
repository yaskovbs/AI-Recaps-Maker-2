# 🔐 מדריך הגדרת Google OAuth - מלא ומפורט

## ⚠️ סטטוס נוכחי

**הקוד עודכן להשתמש ב-Google OAuth אמיתי!**

אבל **Google OAuth אינו מוגדר** ב-OnSpace Cloud Backend:
- ❌ Google Client ID: לא מוגדר
- ❌ Google Client Secret: לא מוגדר

**תוצאה**: כפתור "התחבר עם Google" לא יעבוד עד שתשלים את ההגדרות למטה.

---

## 📋 מה צריך לעשות? (5 שלבים)

### שלב 1: צור Google Cloud Project

1. **עבור ל-Google Cloud Console**:
   ```
   https://console.cloud.google.com/
   ```

2. **צור פרויקט חדש**:
   - לחץ על "Select a project" בראש העמוד
   - לחץ "NEW PROJECT"
   - שם הפרויקט: `AI Recaps Maker`
   - לחץ "CREATE"

3. **המתן לסיום יצירת הפרויקט** (כמה שניות)

---

### שלב 2: הפעל Google+ API

1. **עבור ל-APIs & Services**:
   ```
   https://console.cloud.google.com/apis/dashboard
   ```

2. **הפעל API**:
   - לחץ "+ ENABLE APIS AND SERVICES"
   - חפש: `Google+ API`
   - בחר `Google+ API`
   - לחץ "ENABLE"

---

### שלב 3: צור OAuth Consent Screen

1. **עבור ל-OAuth consent screen**:
   ```
   https://console.cloud.google.com/apis/credentials/consent
   ```

2. **בחר User Type**:
   - סמן: **External** (אם אתה רוצה שכולם יוכלו להתחבר)
   - או: **Internal** (אם זה רק לארגון שלך)
   - לחץ "CREATE"

3. **מלא את הפרטים** (OAuth consent screen):
   
   **App information**:
   - App name: `AI Recaps Maker`
   - User support email: `contact-us@y-l-b-s-ai-studio-apps.com`
   - App logo: (אופציונלי - העלה לוגו 120x120)

   **App domain** (אופציונלי):
   - Application home page: `https://your-app-domain.com`
   - Application privacy policy: `https://your-app-domain.com/privacy`
   - Application terms of service: `https://your-app-domain.com/terms`

   **Authorized domains**:
   ```
   onspace.ai
   backend.onspace.ai
   ```

   **Developer contact information**:
   - Email addresses: `contact-us@y-l-b-s-ai-studio-apps.com`

4. **לחץ "SAVE AND CONTINUE"**

5. **Scopes** (שלב 2):
   - לחץ "ADD OR REMOVE SCOPES"
   - בחר:
     - `./auth/userinfo.email` ✅
     - `./auth/userinfo.profile` ✅
     - `openid` ✅
   - לחץ "UPDATE" → "SAVE AND CONTINUE"

6. **Test users** (שלב 3):
   - אם בחרת "External" - דלג (לחץ "SAVE AND CONTINUE")
   - אם בחרת "Internal" - הוסף אימיילים של משתמשי בדיקה

7. **סיכום** (שלב 4):
   - בדוק שהכל נכון
   - לחץ "BACK TO DASHBOARD"

---

### שלב 4: צור OAuth Client ID

1. **עבור ל-Credentials**:
   ```
   https://console.cloud.google.com/apis/credentials
   ```

2. **צור Credentials**:
   - לחץ "+ CREATE CREDENTIALS"
   - בחר: **OAuth client ID**

3. **בחר Application type**:
   - **Web application** (עבור Web + Mobile)

4. **מלא פרטים**:
   
   **Name**:
   ```
   AI Recaps Maker - Web & Mobile
   ```

   **Authorized JavaScript origins** (עבור Web):
   ```
   http://localhost:3000
   https://your-production-domain.com
   ```

   **Authorized redirect URIs** (חשוב מאוד!):
   ```
   https://qqvwidcyxjkscxcqqqvw.backend.onspace.ai/auth/v1/callback
   http://localhost:3000/auth/callback
   airecapsmaker://auth/callback
   ```

5. **לחץ "CREATE"**

6. **העתק את הפרטים**:
   - תראה חלון עם:
     - ✅ **Client ID** (משהו כמו `123456-abc.apps.googleusercontent.com`)
     - ✅ **Client Secret** (משהו כמו `GOCSPX-xyz123`)
   
   **⚠️ חשוב - העתק אותם לקובץ טקסט זמני!**

---

### שלב 5: הגדר ב-OnSpace Cloud Dashboard

1. **עבור ל-OnSpace Cloud Dashboard**:
   - פתח את הפרויקט שלך ב-OnSpace
   - לחץ על כפתור "Cloud" (פאנל ימני למעלה)

2. **עבור לכרטיסיית "Users"**:
   - תראה רשימת משתמשים

3. **לחץ על "Auth Settings"** (למעלה):
   - תראה הגדרות Authentication

4. **אפשר Google Provider**:
   - מצא את הסעיף "Google Provider"
   - סמן ✅ **Enable Google Sign-in**

5. **הדבק את הפרטים מ-Google**:
   - **Google Client ID**: הדבק את ה-Client ID ששמרת
   - **Google Client Secret**: הדבק את ה-Client Secret ששמרת

6. **לחץ "Save"**

---

## ✅ בדיקה שהכל עובד

### 1. **בדיקה ראשונית** (Backend):

```bash
# בדוק ב-OnSpace Cloud Dashboard → Users → Auth Settings
✅ Google Provider: Enabled
✅ Client ID: מוגדר (מתחיל ב-xxxxx.apps.googleusercontent.com)
✅ Client Secret: מוגדר (מתחיל ב-GOCSPX-)
```

### 2. **בדיקה באפליקציה** (Web):

1. הרץ את האפליקציה ב-Live Preview
2. עבור למסך Login
3. לחץ "Continue with Google"
4. **תוצאה צפויה**:
   - ✅ נפתח חלון Google OAuth
   - ✅ תראה את שם האפליקציה שלך
   - ✅ תראה בקשת הרשאות (email, profile)
   - ✅ אחרי אישור - תחזור לאפליקציה מחובר

### 3. **בדיקה ב-Mobile** (Android/iOS):

**⚠️ הערה חשובה לנייד:**

OAuth במובייל דורש **Deep Link** configuration:

#### Android - הוסף ל-`app.json`:
```json
{
  "expo": {
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "autoVerify": true,
          "data": [
            {
              "scheme": "airecapsmaker",
              "host": "auth",
              "pathPrefix": "/callback"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
```

#### iOS - הוסף ל-`app.json`:
```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.ylbsaistudioapps.airecapsmaker",
      "associatedDomains": ["applinks:airecapsmaker.app"]
    },
    "scheme": "airecapsmaker"
  }
}
```

---

## 🐛 פתרון בעיות נפוצות

### שגיאה: "Google OAuth is not configured"

**פתרון**:
1. בדוק שהגדרת Client ID/Secret ב-Dashboard
2. בדוק ש-Google Provider מופעל (Enable Google Sign-in ✅)
3. נסה לרענן את הדף

---

### שגיאה: "redirect_uri_mismatch"

**סיבה**: ה-redirect URI לא מתאים למה שהגדרת ב-Google Console.

**פתרון**:
1. עבור ל-Google Cloud Console → Credentials
2. ערוך את ה-OAuth Client ID שלך
3. ודא שהרשימה כוללת:
   ```
   https://qqvwidcyxjkscxcqqqvw.backend.onspace.ai/auth/v1/callback
   ```

---

### שגיאה: "access_denied"

**סיבה**: המשתמש ביטל את ההרשאה או Google חסם את הבקשה.

**פתרון**:
1. בדוק שהמשתמש נמצא ב-Test users (אם OAuth consent screen הוא "Testing")
2. בדוק ש-OAuth consent screen אושר (או מצב "Production")

---

### החיבור לא עובד במובייל

**פתרון**:
1. ודא שהגדרת Deep Links ב-`app.json`
2. בנה מחדש את האפליקציה (Deep Links דורשים native build)
3. בדוק שה-redirect URI כולל:
   ```
   airecapsmaker://auth/callback
   ```

---

## 📊 איך זה עובד? (Technical Flow)

### Web Flow:
```
1. User לוחץ "Continue with Google"
   ↓
2. supabase.auth.signInWithOAuth() קורא ל-Google OAuth
   ↓
3. Google פותח חלון OAuth (popup)
   ↓
4. User מאשר הרשאות
   ↓
5. Google מחזיר authorization code
   ↓
6. Supabase מחליף ל-access token
   ↓
7. Supabase יוצר session עם user info
   ↓
8. onAuthStateChange מזהה SIGNED_IN
   ↓
9. AuthContext שומר user ב-AsyncStorage
   ↓
10. AuthRouter מפנה ל-/(tabs)
```

### Mobile Flow:
```
1. User לוחץ "Continue with Google"
   ↓
2. supabase.auth.signInWithOAuth() מחזיר OAuth URL
   ↓
3. Linking.openURL() פותח דפדפן מערכת
   ↓
4. User מאשר הרשאות בדפדפן
   ↓
5. Google מחזיר ל-Deep Link: airecapsmaker://auth/callback?code=...
   ↓
6. App מתעורר עם Deep Link
   ↓
7. Supabase מחליף code ל-session
   ↓
8. onAuthStateChange מזהה SIGNED_IN
   ↓
9. AuthContext שומר user
   ↓
10. AuthRouter מפנה ל-/(tabs)
```

---

## 🔒 אבטחה - Best Practices

### ✅ מה בטוח:
- ✅ Client ID ציבורי (אפשר לשתף)
- ✅ Redirect URIs נבדקים על ידי Google
- ✅ Supabase מטפל ב-token exchange
- ✅ Sessions מאובטחים ב-AsyncStorage

### ❌ מה לא לעשות:
- ❌ אל תשתף את ה-Client Secret בקוד
- ❌ אל תשמור tokens ב-localStorage (Web)
- ❌ אל תבטל את הבדיקה של redirect URIs

---

## 📝 Checklist סופי

לפני שאתה אומר "זה עובד!" - וודא:

- [ ] ✅ Google Cloud Project נוצר
- [ ] ✅ Google+ API הופעל
- [ ] ✅ OAuth Consent Screen מוגדר
- [ ] ✅ OAuth Client ID נוצר
- [ ] ✅ Redirect URIs מכילים את ה-Backend URL של OnSpace
- [ ] ✅ Client ID/Secret הודבקו ב-OnSpace Cloud Dashboard
- [ ] ✅ Google Provider מופעל ב-Dashboard
- [ ] ✅ בדיקה ב-Web עברה בהצלחה
- [ ] ✅ (אופציונלי) Deep Links הוגדרו למובייל

---

## 🎉 סיכום

**עכשיו הקוד משתמש ב-Google OAuth אמיתי!**

כל מה שנשאר הוא:
1. להגדיר Google Cloud Console (שלבים 1-4)
2. להדביק את Client ID/Secret ב-Dashboard (שלב 5)
3. לבדוק שזה עובד!

**אם אתה תקוע** - שלח screenshot של השגיאה ב-צור קשר! 📧
