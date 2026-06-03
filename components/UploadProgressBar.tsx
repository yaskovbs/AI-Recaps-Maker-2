/**
 * Upload Progress Bar with Speed & ETA
 * Shows real-time upload progress, speed (MB/s), and estimated time remaining
 */
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';

export interface UploadProgressProps {
  /** 0–100 */
  percentage: number;
  /** bytes uploaded so far */
  loaded: number;
  /** total bytes */
  total: number;
  /** label shown above bar */
  fileName?: string;
  isRTL?: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function formatSeconds(sec: number): string {
  if (!isFinite(sec) || sec < 0) return '—';
  if (sec < 60) return `${Math.ceil(sec)}s`;
  const m = Math.floor(sec / 60);
  const s = Math.ceil(sec % 60);
  return `${m}m ${s}s`;
}

export default function UploadProgressBar({
  percentage,
  loaded,
  total,
  fileName,
  isRTL = false,
}: UploadProgressProps) {
  const animWidth = useRef(new Animated.Value(0)).current;

  // Speed tracking
  const [speedBps, setSpeedBps] = useState(0);
  const prevLoaded = useRef(0);
  const prevTime = useRef(Date.now());

  useEffect(() => {
    const now = Date.now();
    const elapsed = (now - prevTime.current) / 1000; // seconds
    if (elapsed > 0.3) {
      const delta = loaded - prevLoaded.current;
      if (delta > 0) {
        setSpeedBps(delta / elapsed);
      }
      prevLoaded.current = loaded;
      prevTime.current = now;
    }
  }, [loaded]);

  useEffect(() => {
    Animated.timing(animWidth, {
      toValue: percentage,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [percentage]);

  const remaining = total - loaded;
  const etaSec = speedBps > 0 ? remaining / speedBps : null;

  const pct = Math.min(Math.max(Math.round(percentage), 0), 100);
  const isDone = pct >= 100;

  // Gradient color based on progress
  const barColor = isDone ? Colors.success : pct < 30 ? Colors.primary : pct < 70 ? '#00c8ff' : '#00e5b0';

  return (
    <View style={styles.container}>
      {/* File name + status */}
      <View style={styles.topRow}>
        <View style={styles.fileInfo}>
          <MaterialIcons
            name={isDone ? 'check-circle' : 'cloud-upload'}
            size={16}
            color={isDone ? Colors.success : Colors.primary}
          />
          <Text style={styles.fileName} numberOfLines={1}>
            {fileName
              ? fileName.length > 28
                ? fileName.substring(0, 25) + '...'
                : fileName
              : (isRTL ? 'מעלה קובץ...' : 'Uploading file...')}
          </Text>
        </View>
        <Text style={[styles.pctLabel, { color: barColor }]}>
          {isDone ? (isRTL ? '✓ הושלם' : '✓ Done') : `${pct}%`}
        </Text>
      </View>

      {/* Progress bar */}
      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            {
              backgroundColor: barColor,
              width: animWidth.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
        {/* Animated shimmer overlay */}
        {!isDone && (
          <View style={[styles.shimmer, { left: `${Math.max(pct - 10, 0)}%` as any }]} />
        )}
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        {/* Transferred */}
        <View style={styles.statItem}>
          <MaterialIcons name="swap-vert" size={11} color={Colors.textMuted} />
          <Text style={styles.statText}>
            {formatBytes(loaded)} / {formatBytes(total)}
          </Text>
        </View>

        {/* Speed */}
        {speedBps > 0 && !isDone && (
          <View style={styles.statItem}>
            <MaterialIcons name="speed" size={11} color={Colors.textMuted} />
            <Text style={styles.statText}>{formatBytes(speedBps)}/s</Text>
          </View>
        )}

        {/* ETA */}
        {etaSec !== null && !isDone && (
          <View style={styles.statItem}>
            <MaterialIcons name="timer" size={11} color={Colors.primary} />
            <Text style={[styles.statText, { color: Colors.primary }]}>
              {isRTL ? `נותר: ${formatSeconds(etaSec)}` : `ETA: ${formatSeconds(etaSec)}`}
            </Text>
          </View>
        )}

        {isDone && (
          <View style={styles.statItem}>
            <MaterialIcons name="check" size={11} color={Colors.success} />
            <Text style={[styles.statText, { color: Colors.success }]}>
              {isRTL ? 'העלאה הושלמה' : 'Upload complete'}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fileInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  fileName: {
    flex: 1,
    fontSize: Typography.bodySmall,
    fontWeight: '600',
    color: Colors.text,
  },
  pctLabel: {
    fontSize: Typography.body,
    fontWeight: '800',
    minWidth: 50,
    textAlign: 'right',
  },
  track: {
    height: 8,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    width: 40,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statText: {
    fontSize: Typography.caption,
    color: Colors.textMuted,
    fontVariant: ['tabular-nums'],
  },
});
