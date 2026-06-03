# 📦 הוראות בניית AAB ל-AI Recaps Maker

## ✅ דרישות מוקדמות

1. **התקנת EAS CLI**:
   ```bash
   npm install -g eas-cli
   ```

2. **התחברות ל-Expo**:
   ```bash
   eas login
   ```

## 🏗️ בניית AAB (Android App Bundle)

### שיטה 1: בנייה בסיסית (מומלץ למתחילים)

```bash
eas build --platform android --profile production
```

הפקודה הזו תבנה AAB אוטומטית בענן של Expo.

---

### שיטה 2: בנייה מהירה יותר (Local Build)

אם יש לך Android Studio מותקן:

```bash
eas build --platform android --local --profile production-aab
```

---

## 📋 שלבי התהליך

### 1. הכנת הפרויקט
```bash
# וודא שכל החבילות מעודכנות
npm install

# ניקוי cache
npx expo start --clear
```

### 2. הרצת Build
```bash
# בניית AAB בענן (מומלץ)
eas build --platform android --profile production-aab
```

### 3. מעקב אחרי הבנייה
- EAS Build ייצור link למעקב
- תוכל לראות logs בזמן אמת
- קבל התראה כשהבנייה מסתיימת

### 4. הורדת ה-AAB
לאחר השלמת הבנייה:
- **דרך הדפדפן**: היכנס ל-[Expo Dashboard](https://expo.dev/accounts/ylbs/projects/ai-recaps-maker-and-auto-post-android-app/builds)
- **דרך CLI**: 
  ```bash
  eas build:list
  ```

---

## 🔑 הגדרת Signing Key (פעם ראשונה בלבד)

אם זו הפעם הראשונה שאתה בונה:

```bash
eas credentials
```

בחר:
1. `Android` → `production`
2. `Set up a new Android Keystore`
3. Expo ייצור keystore אוטומטית ושומר אותו בענן

---

## 📤 העלאה ל-Google Play Store

### אפשרות 1: העלאה ידנית
1. היכנס ל-[Google Play Console](https://play.google.com/console)
2. בחר את האפליקציה
3. `Production` → `Create new release`
4. העלה את קובץ ה-AAB

### אפשרות 2: העלאה אוטומטית (דורש הגדרה)
```bash
eas submit --platform android --latest
```

**הערה**: דורש Service Account Key מ-Google Cloud Console

---

## 🛠️ פרופילי Build זמינים

| פרופיל | סוג קובץ | שימוש |
|--------|---------|-------|
| `development` | APK | פיתוח, testing מקומי |
| `preview` | APK | בדיקות, שיתוף מהיר |
| `production` | AAB | העלאה ל-Play Store |
| `production-aab` | AAB | בנייה מותאמת ל-AAB |

---

## ⚙️ פקודות שימושיות

```bash
# בדוק סטטוס בנייה
eas build:list

# בדוק credentials
eas credentials

# בנה APK לבדיקה מהירה
eas build --platform android --profile preview

# בנה iOS ו-Android ביחד
eas build --platform all --profile production

# בטל בנייה שרצה
eas build:cancel
```

---

## 🚨 פתרון בעיות נפוצות

### שגיאה: "No credentials found"
**פתרון**: הרץ `eas credentials` ויצור keystore חדש

### שגיאה: "Build failed"
**פתרון**: בדוק logs ב-Expo Dashboard, לרוב זה חוסר package או שגיאת native module

### שגיאה: "Gradle build failed"
**פתרון**: 
```bash
cd android
./gradlew clean
cd ..
eas build --platform android --clear-cache
```

### AAB גדול מדי (>150MB)
**פתרון**: הפעל App Bundle optimization ב-`eas.json`:
```json
"production": {
  "android": {
    "buildType": "app-bundle",
    "enableProguardInReleaseBuilds": true,
    "enableHermes": true
  }
}
```

---

## 📊 פרטי הפרויקט

- **שם**: AI Recaps Maker
- **Package**: `com.ylbs.airecapsmaker`
- **Version**: 1.0.0
- **EAS Project ID**: `0455a558-577b-4c2f-82ce-94a70b0134c1`

---

## 📞 עזרה נוספת

- **תיעוד EAS Build**: https://docs.expo.dev/build/introduction/
- **Google Play Console**: https://play.google.com/console
- **Expo Discord**: https://chat.expo.dev/

---

## 📱 בניית APK להורדה מהירה

### מתי להשתמש ב-APK?
- ✅ בדיקות פנימיות ושיתוף עם בודקים
- ✅ התקנה ישירה על מכשירים (ללא Play Store)
- ✅ גרסאות Beta/Alpha
- ✅ שיתוף מהיר עם משתמשים

### שלבי בניית APK:

```bash
# 1. התקנת EAS CLI (פעם אחת)
npm install -g eas-cli

# 2. התחברות (פעם אחת)
eas login

# 3. בניית APK לבדיקות (מומלץ)
eas build --platform android --profile preview

# או APK לפיתוח
eas build --platform android --profile development
```

### הורדת ה-APK:

אחרי שהבנייה מסתיימת, תקבל:

1. **Link ישיר להורדה** בטרמינל
   ```
   ✅ Build complete!
   📦 Download: https://expo.dev/artifacts/eas/abc123.apk
   ```

2. **QR Code** - סרוק עם המצלמה להורדה ישירה למכשיר

3. **Expo Dashboard** - https://expo.dev → Builds → Download

### התקנת APK על Android:

1. **הורד את ה-APK למכשיר**
   - לחץ על ה-link או סרוק QR
   - הקובץ יורד אוטומטית

2. **אפשר התקנה ממקורות לא ידועים**
   - הגדרות → אבטחה → "מקורות לא ידועים"
   - או: הגדרות → אפליקציות → התקן אפליקציות לא ידועות

3. **התקן**
   - לחץ על הקובץ שהורדת
   - לחץ "התקן"
   - פתח את האפליקציה

### שיתוף APK:

**דרך 1: שיתוף Link Expo (קל ומהיר)**
```bash
eas build:list  # קבל את ה-link האחרון
# שתף את ה-link עם אחרים
```

**דרך 2: העלאה לענן (Google Drive, Dropbox, etc.)**
- הורד את ה-APK למחשב
- העלה לשירות ענן
- שתף קישור הורדה

**מידע נוסף:** ראה `APK_DOWNLOAD_GUIDE.md` למדריך מפורט!

---

## ✨ סיכום מהיר

### בניית AAB (ל-Play Store)
```bash
# 1. התקנת EAS CLI (פעם אחת)
npm install -g eas-cli

# 2. התחברות (פעם אחת)
eas login

# 3. בניית AAB
eas build --platform android --profile production-aab
```

### בניית APK (להורדה ישירה)
```bash
# 1-2. כמו למעלה

# 3. בניית APK
eas build --platform android --profile preview
```

**זמן בנייה משוער**: 
- AAB: 10-15 דקות
- APK: 5-10 דקות

**גודל משוער**:
- AAB: 50-60 MB
- APK: 70-80 MB

בהצלחה! 🚀
