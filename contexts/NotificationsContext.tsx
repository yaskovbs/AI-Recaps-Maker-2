// Enhanced NotificationsContext with API Usage Alerts
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { useApiTracking } from '@/hooks/useApiTracking';

interface NotificationSettings {
  pushEnabled: boolean;
  emailEnabled: boolean;
  recapCompleteEnabled: boolean;
  newFeaturesEnabled: boolean;
  marketingEnabled: boolean;
  
  // ✨ NEW: API Usage Alerts
  apiUsageAlertsEnabled: boolean;
  dailyLimitThreshold: number; // Percentage (e.g., 80 = 80%)
  monthlyBudgetAlert: boolean;
  errorAlertsEnabled: boolean;
  errorThreshold: number; // Number of consecutive errors
}

interface Notification {
  id: string;
  type: 'recap_complete' | 'new_feature' | 'marketing' | 'system' | 'api_limit' | 'api_budget' | 'api_error';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  recapId?: string;
  priority?: 'low' | 'medium' | 'high';
  actionUrl?: string;
}

interface NotificationsContextType {
  settings: NotificationSettings;
  notifications: Notification[];
  unreadCount: number;
  updateSettings: (newSettings: Partial<NotificationSettings>) => Promise<void>;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  requestPushPermission: () => Promise<boolean>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

const SETTINGS_STORAGE_KEY = '@airm_notification_settings';
const NOTIFICATIONS_STORAGE_KEY = '@airm_notifications';

const DEFAULT_SETTINGS: NotificationSettings = {
  pushEnabled: false,
  emailEnabled: false,
  recapCompleteEnabled: true,
  newFeaturesEnabled: true,
  marketingEnabled: false,
  
  // API Usage Defaults
  apiUsageAlertsEnabled: true,
  dailyLimitThreshold: 80, // Alert at 80%
  monthlyBudgetAlert: true,
  errorAlertsEnabled: true,
  errorThreshold: 3, // Alert after 3 consecutive errors
};

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [lastErrorTime, setLastErrorTime] = useState(0);

  useEffect(() => {
    loadSettings();
    loadNotifications();
  }, []);

  useEffect(() => {
    const count = notifications.filter((n) => !n.read).length;
    setUnreadCount(count);
  }, [notifications]);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      const stored = await AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (stored) {
        setNotifications(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const saveSettings = async (newSettings: NotificationSettings) => {
    try {
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
      console.log('✅ Notification settings saved');
    } catch (error) {
      console.error('❌ Failed to save notification settings:', error);
    }
  };

  const saveNotifications = async (newNotifications: Notification[]) => {
    try {
      await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(newNotifications));
      setNotifications(newNotifications);
      console.log('✅ Notifications saved');
    } catch (error) {
      console.error('❌ Failed to save notifications:', error);
    }
  };

  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    const updated = { ...settings, ...newSettings };
    await saveSettings(updated);
  };

  const requestPushPermission = async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'web') {
        if ('Notification' in window) {
          const permission = await Notification.requestPermission();
          return permission === 'granted';
        }
        return false;
      } else {
        console.log('📱 Push notifications permission requested (mock)');
        return true;
      }
    } catch (error) {
      console.error('❌ Failed to request push permission:', error);
      return false;
    }
  };

  const addNotification = async (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    // Check if this type of notification is enabled
    if (notification.type === 'recap_complete' && !settings.recapCompleteEnabled) return;
    if (notification.type === 'new_feature' && !settings.newFeaturesEnabled) return;
    if (notification.type === 'marketing' && !settings.marketingEnabled) return;
    if ((notification.type === 'api_limit' || notification.type === 'api_budget' || notification.type === 'api_error') && !settings.apiUsageAlertsEnabled) return;

    const newNotification: Notification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      read: false,
    };

    const updated = [newNotification, ...notifications].slice(0, 100); // Keep max 100 notifications
    await saveNotifications(updated);

    // Show browser notification if enabled
    if (settings.pushEnabled && Platform.OS === 'web' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/icon.png',
        badge: '/badge.png',
      });
    }

    console.log('🔔 New notification added:', notification.title);
  };

  const markAsRead = async (id: string) => {
    const updated = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    await saveNotifications(updated);
  };

  const markAllAsRead = async () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    await saveNotifications(updated);
  };

  const deleteNotification = async (id: string) => {
    const updated = notifications.filter((n) => n.id !== id);
    await saveNotifications(updated);
  };

  const clearAllNotifications = async () => {
    await saveNotifications([]);
  };

  const value: NotificationsContextType = {
    settings,
    notifications,
    unreadCount,
    updateSettings,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    requestPushPermission,
  };

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationsProvider');
  }
  return context;
}

/**
 * Hook for API Usage Monitoring
 * Automatically sends notifications based on usage thresholds
 */
export function useApiUsageMonitoring() {
  const { apiKeys, stats, recentUsage } = useApiTracking();
  const { settings, addNotification } = useNotifications();
  const [lastDailyCheck, setLastDailyCheck] = useState(0);
  const [lastMonthlyCheck, setLastMonthlyCheck] = useState(0);
  const [consecutiveErrors, setConsecutiveErrors] = useState(0);

  useEffect(() => {
    if (!settings.apiUsageAlertsEnabled) return;

    // Check daily limits
    checkDailyLimits();

    // Check monthly budget
    checkMonthlyBudget();

    // Check error rate
    checkErrorRate();
  }, [apiKeys, stats, recentUsage, settings]);

  const checkDailyLimits = () => {
    const now = Date.now();
    const today = new Date().setHours(0, 0, 0, 0);

    // Only check once per hour
    if (now - lastDailyCheck < 60 * 60 * 1000) return;

    apiKeys.forEach((key) => {
      if (!key.daily_limit_tokens && !key.daily_limit_cost) return;

      // Get today's usage
      const todayUsage = recentUsage.filter((u) => 
        u.api_key_hash === key.api_key_hash && 
        new Date(u.created_at).getTime() >= today
      );

      const todayTokens = todayUsage.reduce((sum, u) => sum + u.tokens_total, 0);
      const todayCost = todayUsage.reduce((sum, u) => sum + u.cost_total, 0);

      // Check token limit
      if (key.daily_limit_tokens) {
        const tokenPercentage = (todayTokens / key.daily_limit_tokens) * 100;

        if (tokenPercentage >= settings.dailyLimitThreshold) {
          addNotification({
            type: 'api_limit',
            title: '⚠️ API Daily Limit Alert',
            message: `You've used ${tokenPercentage.toFixed(0)}% of your daily token limit (${todayTokens.toLocaleString()}/${key.daily_limit_tokens.toLocaleString()})`,
            priority: tokenPercentage >= 95 ? 'high' : 'medium',
          });
        }
      }

      // Check cost limit
      if (key.daily_limit_cost) {
        const costPercentage = (todayCost / key.daily_limit_cost) * 100;

        if (costPercentage >= settings.dailyLimitThreshold) {
          addNotification({
            type: 'api_limit',
            title: '💰 API Daily Cost Alert',
            message: `You've spent ${costPercentage.toFixed(0)}% of your daily budget ($${(todayCost / 100).toFixed(2)}/$${(key.daily_limit_cost / 100).toFixed(2)})`,
            priority: costPercentage >= 95 ? 'high' : 'medium',
          });
        }
      }
    });

    setLastDailyCheck(now);
  };

  const checkMonthlyBudget = () => {
    if (!settings.monthlyBudgetAlert) return;

    const now = Date.now();
    const thisMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();

    // Only check once per day
    if (now - lastMonthlyCheck < 24 * 60 * 60 * 1000) return;

    apiKeys.forEach((key) => {
      if (!key.monthly_limit_cost) return;

      const monthUsage = recentUsage.filter((u) => 
        u.api_key_hash === key.api_key_hash && 
        new Date(u.created_at).getTime() >= thisMonth
      );

      const monthCost = monthUsage.reduce((sum, u) => sum + u.cost_total, 0);
      const costPercentage = (monthCost / key.monthly_limit_cost) * 100;

      if (costPercentage >= 90) {
        addNotification({
          type: 'api_budget',
          title: '🚨 Monthly Budget Alert',
          message: `You've spent ${costPercentage.toFixed(0)}% of your monthly budget ($${(monthCost / 100).toFixed(2)}/$${(key.monthly_limit_cost / 100).toFixed(2)})`,
          priority: 'high',
        });
      }
    });

    setLastMonthlyCheck(now);
  };

  const checkErrorRate = () => {
    if (!settings.errorAlertsEnabled) return;

    const last10 = recentUsage.slice(0, 10);
    const errorCount = last10.filter((u) => u.status === 'failed').length;

    if (errorCount >= settings.errorThreshold) {
      const errorPercentage = (errorCount / last10.length) * 100;

      addNotification({
        type: 'api_error',
        title: '❌ High Error Rate Detected',
        message: `${errorCount} out of last ${last10.length} API calls failed (${errorPercentage.toFixed(0)}%). Please check your API key and quota.`,
        priority: 'high',
      });
    }
  };
}
