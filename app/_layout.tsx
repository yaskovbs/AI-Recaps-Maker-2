import { Stack } from 'expo-router';
import { ApiTrackingProvider } from '@/contexts/ApiTrackingContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { CreditsProvider } from '@/contexts/CreditsContext';
import { RatingProvider } from '@/contexts/RatingContext';
import { StatsProvider } from '@/contexts/StatsContext';
import { YouTubeChannelsProvider } from '@/contexts/YouTubeChannelsContext';
import { AdMobProvider } from '@/contexts/AdMobContext';
import { RecapsProvider } from '@/contexts/RecapsContext';
import { ContactsProvider } from '@/contexts/ContactsContext';
import { NotificationsProvider } from '@/contexts/NotificationsContext';
import { AdvancedSettingsProvider } from '@/contexts/AdvancedSettingsContext';
import { AlertProvider } from '@/template';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import StripeProviderWrapper from '@/components/StripeProviderWrapper';

export default function RootLayout() {
  useFrameworkReady();
  return (
    <StripeProviderWrapper>
      <AlertProvider>
        <SafeAreaProvider>
          <LanguageProvider>
            <AuthProvider>
              <ApiTrackingProvider>
                <CreditsProvider>
                  <RatingProvider>
                    <StatsProvider>
                      <AdMobProvider>
                        <RecapsProvider>
                          <YouTubeChannelsProvider>
                            <ContactsProvider>
                              <NotificationsProvider>
                                <AdvancedSettingsProvider>
                                  <StatusBar style="light" />
                                  <Stack
                                    screenOptions={{
                                      headerShown: false,
                                      contentStyle: { backgroundColor: '#0a0a14' },
                                      animation: 'fade',
                                    }}
                                  >
                                    <Stack.Screen name="login" options={{ animation: 'fade' }} />
                                    <Stack.Screen name="signup" options={{ animation: 'fade' }} />
                                    <Stack.Screen name="(tabs)" options={{ animation: 'slide_from_right' }} />
                                    <Stack.Screen name="admin" options={{ animation: 'slide_from_right' }} />
                                  </Stack>
                                </AdvancedSettingsProvider>
                              </NotificationsProvider>
                            </ContactsProvider>
                          </YouTubeChannelsProvider>
                        </RecapsProvider>
                      </AdMobProvider>
                    </StatsProvider>
                  </RatingProvider>
                </CreditsProvider>
              </ApiTrackingProvider>
            </AuthProvider>
          </LanguageProvider>
        </SafeAreaProvider>
      </AlertProvider>
    </StripeProviderWrapper>
  );
}
