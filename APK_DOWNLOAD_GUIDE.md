# 📱 מדריך הורדת והתקנת APK - AI Recaps Maker

## 🎯 מה זה APK?

APK (Android Package Kit) הוא קובץ ההתקנה של אפליקציות Android. בניגוד ל-AAB (שמיועד ל-Google Play Store), APK ניתן להתקנה ישירה על מכשירי Android.

---

## 🚀 שלב 1: בניית APK

### דרישות מוקדמות (פעם אחת)

```bash
# 1. התקן EAS CLI
npm install -g eas-cli

# 2. התחבר לחשבון Expo
eas login
```

### בניית APK לבדיקות (מומלץ)

```bash
eas build --platform android --profile preview
```

**או** בניית APK לפיתוח:

```bash
eas build --platform android --profile development
```

---

## 📥 שלב 2: הורדת ה-APK

### אחרי שהבנייה הושלמה, תקבל 3 דרכים להורדה:

#### דרך 1: Link ישיר (מומלץ)
- בטרמינל, תקבל link להורדה ישירה
- לחץ על ה-link או העתק אותו לדפדפן
- הקובץ יורד אוטומטית

**דוגמה:**
```
✅ Build complete!
📦 Download: https://expo.dev/artifacts/eas/abc123xyz.apk
```

#### דרך 2: QR Code
- סרוק את ה-QR Code עם המצלמה של הטלפון
- יפתח link להורדה במכשיר
- הורד ישירות למכשיר

#### דרך 3: Expo Dashboard
1. היכנס ל-https://expo.dev
2. לחץ על הפרויקט שלך
3. Builds → בחר את הבנייה האחרונה
4. לחץ "Download"

---

## 📲 שלב 3: התקנת ה-APK על Android

### אופציה 1: התקנה ישירה מהמכשיר

1. **הורד את ה-APK למכשיר Android**
   - פתח את ה-link בדפדפן במכשיר
   - לחץ "Download"

2. **אפשר התקנה ממקורות לא ידועים**
   - הגדרות → אבטחה → "התקן אפליקציות לא ידועות"
   - או: הגדרות → אפליקציות → גישה מיוחדת → התקן אפליקציות לא ידועות
   - אפשר ל-Chrome/Firefox/File Manager

3. **התקן את האפליקציה**
   - לחץ על הקובץ שהורדת
   - לחץ "התקן"
   - המתן לסיום ההתקנה

4. **פתח את האפליקציה**
   - לחץ "פתח" או מצא בתפריט האפליקציות

### אופציה 2: התקנה מהמחשב (ADB)

```bash
# 1. וודא ש-ADB מותקן
adb version

# 2. חבר את המכשיר למחשב
# הפעל USB Debugging במכשיר

# 3. התקן את ה-APK
adb install app-release.apk

# 4. בדוק שההתקנה הצליחה
adb shell pm list packages | grep airecapsmaker
```

---

## 🔗 שיתוף ה-APK עם אחרים

### דרך 1: שיתוף קישור Expo

```bash
# הצג את רשימת הבנייות
eas build:list

# העתק את ה-link של הבנייה
# שתף את ה-link עם אחרים
```

**יתרונות:**
- ✅ Link קל לשיתוף
- ✅ תמיד הגרסה העדכנית
- ✅ לא צריך להעלות קבצים

**חסרונות:**
- ❌ דורש חיבור לאינטרנט
- ❌ ה-link עשוי לפוג אחרי זמן

### דרך 2: שיתוף קובץ APK ישיר

1. **הורד את ה-APK למחשב**
2. **העלה לשירות אחסון ענן:**
   - Google Drive
   - Dropbox
   - OneDrive
   - WeTransfer

3. **שתף את הקישור**

**יתרונות:**
- ✅ עובד ללא חיבור לאינטרנט
- ✅ שליטה מלאה על הקובץ

**חסרונות:**
- ❌ קובץ גדול (~70-80 MB)
- ❌ צריך לעדכן ידנית

### דרך 3: TestFlight/Firebase App Distribution

לשיתוף מקצועי עם בודקים:

```bash
# Firebase App Distribution (חינמי)
npm install -g firebase-tools
firebase login
firebase appdistribution:distribute app-release.apk \
  --app YOUR_APP_ID \
  --groups testers
```

---

## 🛡️ אבטחה והרשאות

### הרשאות שהאפליקציה מבקשת:

```json
"permissions": [
  "READ_EXTERNAL_STORAGE",  // קריאת קבצים
  "WRITE_EXTERNAL_STORAGE", // שמירת קבצים
  "CAMERA",                 // גישה למצלמה
  "RECORD_AUDIO"            // הקלטת אודיו
]
```

### למה האפליקציה צריכה הרשאות אלו?
- **READ/WRITE_EXTERNAL_STORAGE**: ליבא ולשמור וידאו/אודיו
- **CAMERA**: לצלם וידאו לסיכום
- **RECORD_AUDIO**: להקליט אודיו לסיכום

---

## 📊 השוואה: APK vs AAB

| תכונה | APK | AAB |
|--------|-----|-----|
| גודל | 70-80 MB | 50-60 MB |
| התקנה ישירה | ✅ כן | ❌ לא |
| Google Play | ✅ אפשרי | ✅ מומלץ |
| עדכונים אוטומטיים | ❌ | ✅ |
| שיתוף מהיר | ✅ | ❌ |

**מתי להשתמש ב-APK:**
- ✅ בדיקות פנימיות
- ✅ שיתוף עם בודקים
- ✅ התקנה על מכשירים ללא Play Store
- ✅ גרסאות Beta/Alpha

**מתי להשתמש ב-AAB:**
- ✅ העלאה ל-Google Play Store
- ✅ הפצה רשמית
- ✅ אפליקציה סופית

---

## 🔧 פתרון בעיות נפוצות

### "App not installed" / "אפליקציה לא הותקנה"

**סיבות אפשריות:**
1. **גרסה ישנה כבר מותקנת**
   - פתרון: הסר את האפליקציה הקיימת לפני התקנה

2. **חתימה דיגיטלית לא תואמת**
   - פתרון: הסר גרסה קודמת ונסה שוב

3. **קובץ פגום**
   - פתרון: הורד את ה-APK מחדש

### "התקנה חסומה" / "Install blocked"

**פתרון:**
1. הגדרות → אבטחה
2. אפשר "מקורות לא ידועים"
3. או: אפשר התקנה מהדפדפן שבו הורדת

### APK לא מתקבל/לא עובד

**בדיקות:**
```bash
# 1. בדוק שהקובץ שלם
ls -lh app-release.apk

# 2. בדוק חתימה
jarsigner -verify -verbose -certs app-release.apk

# 3. בדוק פרטי APK
aapt dump badging app-release.apk | grep package
```

---

## 📱 טיפים מומלצים

### 1. שמירת גרסאות
```bash
# שמור APK עם מספר גרסה
mv app-release.apk "AI-Recaps-Maker-v1.0.0.apk"
```

### 2. בדיקת גודל APK
```bash
# בדוק גודל הקובץ
ls -lh *.apk

# אופטימיזציה (אם גדול מדי)
eas build --platform android --profile preview --clear-cache
```

### 3. בדיקת תאימות
- מינימום Android: 5.0 (API 21)
- מומלץ: Android 8.0+ (API 26+)
- תמיכה ב-64-bit: כן

---

## 📞 קבלת עזרה

### אם נתקעת:

1. **Expo Forums**: https://forums.expo.dev
2. **Expo Discord**: https://chat.expo.dev
3. **GitHub Issues**: https://github.com/expo/expo/issues

### לוגים שימושיים:

```bash
# בדוק logs של הבנייה
eas build:list
eas build:view [BUILD_ID]

# בדוק logs של האפליקציה (ADB)
adb logcat | grep "AI Recaps"
```

---

## ✅ Checklist להורדה והתקנה

- [ ] התקנת EAS CLI
- [ ] התחברות ל-Expo
- [ ] בניית APK (`eas build --platform android --profile preview`)
- [ ] המתן לסיום הבנייה (5-10 דקות)
- [ ] הורדת APK (דרך link/QR/Dashboard)
- [ ] הפעלת "מקורות לא ידועים" במכשיר
- [ ] התקנת APK
- [ ] בדיקת האפליקציה
- [ ] (אופציונלי) שיתוף עם אחרים

---

## 🎉 סיכום מהיר

```bash
# 1. בניה (פעם אחת להגדרה)
npm install -g eas-cli
eas login

# 2. בניית APK (כל גרסה)
eas build --platform android --profile preview

# 3. הורדה
# קבל link/QR והורד למכשיר

# 4. התקנה
# הפעל "מקורות לא ידועים" + התקן
```

**זמן תהליך כולל**: 10-15 דקות

**גודל הורדה**: ~70 MB

**תאימות**: Android 5.0+

בהצלחה! 🚀
