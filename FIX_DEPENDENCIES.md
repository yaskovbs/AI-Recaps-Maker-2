# 🔧 Dependency Compatibility Guide — Expo SDK 54 + React Native Google Mobile Ads

## ✅ Current Build Config (app.json)

| Setting | Value | Notes |
|---------|-------|-------|
| `compileSdkVersion` | 35 | Required for AdMob v14+ |
| `targetSdkVersion` | 35 | Google Play requirement 2025 |
| `minSdkVersion` | 23 | react-native-google-mobile-ads minimum |
| `buildToolsVersion` | 35.0.0 | Latest stable |
| `kotlinVersion` | **1.9.25** | ✅ Compatible with AdMob Kotlin compiler |
| Expo SDK | 54 | RN 0.76 |

---

## 📦 react-native-google-mobile-ads — Version Matrix

| Library Version | Kotlin | RN | Expo SDK | Status |
|----------------|--------|----|----------|--------|
| `v13.x` | 1.8–1.9.x | 0.71–0.73 | 49–50 | Old |
| `v14.x` | 1.9.x | 0.74–0.76 | 51–54 | ✅ **Use this** |
| `v15.x` | 2.0+ | 0.77+ | 55+ | Too new |

### Install command (run manually):
```bash
npm install react-native-google-mobile-ads@^14.0.0 --legacy-peer-deps
```
**Or use Expo's version resolver:**
```bash
npx expo install react-native-google-mobile-ads
```

---

## 🔎 Full Native Dependency Audit — Expo SDK 54

### Core Expo packages (auto-managed by `npx expo install --fix`):
```bash
npx expo install --fix
```

### Key packages and their compatible versions for Expo SDK 54:

| Package | Recommended Version |
|---------|-------------------|
| `expo` | `~54.0.0` |
| `react-native` | `0.76.x` |
| `react` | `18.3.x` |
| `expo-router` | `~4.0.0` |
| `expo-document-picker` | `~12.0.0` |
| `expo-file-system` | `~18.0.0` |
| `expo-background-fetch` | `~13.0.0` |
| `expo-task-manager` | `~12.0.0` |
| `expo-notifications` | `~0.29.0` |
| `expo-build-properties` | `~0.13.0` |
| `react-native-google-mobile-ads` | `^14.0.0` |
| `@react-native-community/netinfo` | `^11.4.1` |
| `@stripe/stripe-react-native` | `^0.40.0` |
| `react-native-reanimated` | `~3.17.5` |
| `react-native-safe-area-context` | `~4.12.0` |

---

## 🚑 Fix Kotlin compilation error for react-native-google-mobile-ads

The `compileDebugKotlin` error is caused by Kotlin version mismatch.

**Already fixed in `app.json`:** `kotlinVersion: "1.9.25"`

If you still see the error after updating the package version, also try:

```bash
# Clear EAS build cache
eas build --platform android --profile production-apk --clear-cache
```

---

## 🏗️ Recommended Build Flow

```bash
# Step 1: Fix all Expo SDK versions automatically
npx expo install --fix

# Step 2: Update react-native-google-mobile-ads to v14
npm install react-native-google-mobile-ads@^14.0.0 --legacy-peer-deps

# Step 3: Verify doctor
npx expo-doctor

# Step 4: Build
eas build --platform android --profile production-apk
```

---

## ⚡ packagingOptions — Why These Matter

In `app.json` we added:
```json
"pickFirst": [
  "**/libc++_shared.so",
  "**/libfbjni.so",
  "**/libgoogle-play-services-measurement*.so"
],
"exclude": [
  "META-INF/AL2.0",
  "META-INF/LGPL2.1"
]
```

This prevents **duplicate `.so` file conflicts** between Google Play Services (used by AdMob) and React Native's own native libraries — a common cause of APK build failures.

---

## 🛟 If Build Still Fails

| Error | Fix |
|-------|-----|
| `compileDebugKotlin` | Ensure `kotlinVersion: "1.9.25"` in app.json |
| `Duplicate class kotlin.*` | Add `exclude META-INF` to packagingOptions (done ✅) |
| `minSdkVersion too low` | Set `minSdkVersion: 23` (done ✅) |
| `Google Play Services conflict` | Add `pickFirst` for `.so` files (done ✅) |
| `Cannot find symbol: MaxAdContentRating` | Update to `react-native-google-mobile-ads@^14` |
