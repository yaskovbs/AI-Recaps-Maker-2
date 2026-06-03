const { withGradleProperties, withAndroidManifest, withProjectBuildGradle } = require('expo/config-plugins');

/**
 * Config plugin:
 * 1. Increases JVM heap for Gradle daemon (prevents OOM during build)
 * 2. Adds android:largeHeap="true" to AndroidManifest — allows app to use
 *    extended heap at runtime, enabling large file (2GB+) operations.
 */
module.exports = function withGradleJvmArgs(config) {
  // Step 1 — Gradle JVM args
  config = withGradleProperties(config, (cfg) => {
    const props = cfg.modResults;
    const filtered = props.filter(
      (item) => !(item.type === 'property' && item.key === 'org.gradle.jvmargs')
    );
    filtered.push({
      type: 'property',
      key: 'org.gradle.jvmargs',
      value: '-Xmx4096m -XX:MaxMetaspaceSize=2048m -XX:+HeapDumpOnOutOfMemoryError',
    });
    // Enable parallel builds and caching for faster CI
    const removeKeys = [
      'org.gradle.parallel', 'org.gradle.caching', 'org.gradle.daemon',
      'kotlin.jvm.target.validation.mode',
      'kapt.use.worker.api',
      'android.suppressUnsupportedCompileSdk',
      'kotlin.incremental',
    ];
    const cleaned = filtered.filter(
      (item) => !(item.type === 'property' && removeKeys.includes(item.key))
    );
    cleaned.push(
      { type: 'property', key: 'org.gradle.parallel', value: 'true' },
      { type: 'property', key: 'org.gradle.caching', value: 'true' },
      { type: 'property', key: 'org.gradle.daemon', value: 'true' },
      // Suppress JVM target mismatch errors from react-native-google-mobile-ads
      { type: 'property', key: 'kotlin.jvm.target.validation.mode', value: 'IGNORE' },
      // Disable Kotlin worker API to avoid compilation issues on EAS
      { type: 'property', key: 'kapt.use.worker.api', value: 'false' },
      // Allow compiling against newer SDK
      { type: 'property', key: 'android.suppressUnsupportedCompileSdk', value: '35' },
      // Disable incremental Kotlin compilation to avoid cache corruption
      { type: 'property', key: 'kotlin.incremental', value: 'false' },
    );
    cfg.modResults = cleaned;
    return cfg;
  });

  // Step 2 — AndroidManifest: largeHeap + file provider URI permissions
  config = withAndroidManifest(config, (cfg) => {
    const app = cfg.modResults.manifest.application?.[0];
    if (app) {
      // Enable large heap — critical for loading/uploading 2GB+ video files
      app.$['android:largeHeap'] = 'true';
      // Allow cleartext traffic for local dev (production uses HTTPS)
      app.$['android:usesCleartextTraffic'] = 'true';
    }
    return cfg;
  });

  // Step 3 — Patch allprojects Kotlin JVM target for react-native-google-mobile-ads
  config = withProjectBuildGradle(config, (cfg) => {
    const contents = cfg.modResults.contents;
    const patch = `
// Fix Kotlin JVM target mismatch for react-native-google-mobile-ads
subprojects {
    tasks.withType(org.jetbrains.kotlin.gradle.tasks.KotlinCompile).configureEach {
        kotlinOptions {
            jvmTarget = "17"
        }
    }
}
`;
    if (!contents.includes('Fix Kotlin JVM target mismatch')) {
      cfg.modResults.contents = contents + patch;
    }
    return cfg;
  });

  return config;
};
