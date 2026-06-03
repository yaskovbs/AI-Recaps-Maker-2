const { withGradleProperties, withAndroidManifest, withProjectBuildGradle } = require('@expo/config-plugins');

/**
 * Config plugin:
 * 1. Sets a memory-safe JVM heap for the Gradle daemon (prevents OOM/"Daemon
 *    disappeared / Killed" on EAS default Android workers, which have ~4GB RAM).
 * 2. Adds android:largeHeap="true" to AndroidManifest — allows app to use
 *    extended heap at runtime, enabling large file (2GB+) operations.
 * 3. Pins Kotlin JVM target to 17 for native modules (e.g. google-mobile-ads).
 */
module.exports = function withGradleJvmArgs(config) {
  // Step 1 — Gradle JVM args + memory-constrained CI tuning
  config = withGradleProperties(config, (cfg) => {
    const props = cfg.modResults;
    const filtered = props.filter(
      (item) => !(item.type === 'property' && item.key === 'org.gradle.jvmargs')
    );
    filtered.push({
      type: 'property',
      // Right-sized for EAS default Android workers (~4GB RAM total).
      // A 4GB heap + 2GB metaspace + parallel workers OOM-kills the daemon.
      key: 'org.gradle.jvmargs',
      value: '-Xmx3072m -XX:MaxMetaspaceSize=512m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8',
    });
    // Tune Gradle for memory-constrained CI workers
    const removeKeys = [
      'org.gradle.parallel', 'org.gradle.caching', 'org.gradle.daemon',
      'org.gradle.workers.max',
      'org.gradle.configureondemand',
      'kotlin.jvm.target.validation.mode',
      'kotlin.daemon.jvmargs',
      'kapt.use.worker.api',
      'android.suppressUnsupportedCompileSdk',
      'kotlin.incremental',
    ];
    const cleaned = filtered.filter(
      (item) => !(item.type === 'property' && removeKeys.includes(item.key))
    );
    cleaned.push(
      // Disable parallel: parallel spawns multiple JVM workers that each
      // consume memory and cause OOM ("Daemon disappeared / Killed") on EAS.
      { type: 'property', key: 'org.gradle.parallel', value: 'false' },
      { type: 'property', key: 'org.gradle.caching', value: 'true' },
      { type: 'property', key: 'org.gradle.daemon', value: 'false' },
      // Cap concurrent worker processes to keep memory usage bounded
      { type: 'property', key: 'org.gradle.workers.max', value: '2' },
      // Constrain the Kotlin compile daemon's heap too (it's a separate JVM)
      { type: 'property', key: 'kotlin.daemon.jvmargs', value: '-Xmx1536m -XX:MaxMetaspaceSize=512m' },
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

  // Step 2 — AndroidManifest: largeHeap + cleartext for dev
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

  // Step 3 — Patch subprojects Kotlin JVM target for react-native-google-mobile-ads
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
