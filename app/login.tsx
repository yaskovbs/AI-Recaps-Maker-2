
import { View, Text, StyleSheet, Pressable, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, isRTL } = useLanguage();
  const { signIn, signInWithGoogle, continueAsGuest, setGeminiApiKey: saveGeminiApiKey } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [keySaved, setKeySaved] = useState(false);
  const [keySaveError, setKeySaveError] = useState('');
  const [showGeminiInput, setShowGeminiInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailLogin = async () => {
    setError('');
    setKeySaveError('');
    
    if (!email || !password) {
      setError(isRTL ? 'אנא מלא אימייל וסיסמה' : 'Please enter email and password');
      return;
    }
    
    setIsLoading(true);
    try {
      // Save Gemini API key if provided
      if (geminiApiKey && geminiApiKey.trim()) {
        const saved = await saveGeminiApiKey(geminiApiKey);
        if (!saved) {
          setKeySaveError(isRTL ? 'שמירת מפתח API נכשלה' : 'Failed to save API key');
          console.warn('⚠️ Gemini API key not saved');
        } else {
          setKeySaved(true);
          console.log('✅ Gemini API key saved before login');
        }
      }
      
      await signIn(email, password);
      router.replace('/(tabs)');
    } catch (error: any) {
      setError(error.message || (isRTL ? 'ההתחברות נכשלה' : 'Login failed'));
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    if (geminiApiKey && geminiApiKey.trim()) {
      const saved = await saveGeminiApiKey(geminiApiKey);
      if (saved) {
        setKeySaved(true);
        console.log('✅ Gemini API key saved for guest');
      } else {
        console.warn('⚠️ Gemini API key not saved for guest');
      }
    }
    await continueAsGuest();
    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.backgroundContainer}>
        <LinearGradient
          colors={['#0a0a14', '#1a1a2e', '#0a0a14']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.backgroundGradient}
        />
        <LinearGradient
          colors={['rgba(0, 212, 255, 0.1)', 'rgba(178, 75, 243, 0.1)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.glowOverlay}
        />
        <View style={styles.gradientOverlay}>
          <ScrollView
            contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 40 }]}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.welcomeTitle}>
                {isRTL ? 'ברוכים הבאים' : 'Welcome'}
              </Text>
              <Text style={styles.welcomeSubtitle}>
                {isRTL ? 'התחבר כדי להתחיל ליצור סיכומים' : 'Sign in to start creating recaps'}
              </Text>
            </View>

            {/* Login Form */}
            <View style={styles.formContainer}>
              {/* Email Input */}
              <View style={styles.inputContainer}>
                <MaterialIcons name="email" size={20} color={Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={isRTL ? 'אימייל' : 'Email'}
                  placeholderTextColor={Colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  textAlign={isRTL ? 'right' : 'left'}
                />
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <MaterialIcons name="lock" size={20} color={Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={isRTL ? 'סיסמה' : 'Password'}
                  placeholderTextColor={Colors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  textAlign={isRTL ? 'right' : 'left'}
                />
              </View>

              {/* Error Message */}
              {error ? (
                <View style={styles.errorContainer}>
                  <MaterialIcons name="error" size={16} color={Colors.error} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              {/* Key Save Error */}
              {keySaveError ? (
                <View style={[styles.errorContainer, { borderLeftColor: Colors.warning }]}>
                  <MaterialIcons name="warning" size={16} color={Colors.warning} />
                  <Text style={[styles.errorText, { color: Colors.warning }]}>{keySaveError}</Text>
                </View>
              ) : null}

              {/* Key Saved Success */}
              {keySaved && !keySaveError ? (
                <View style={styles.successContainer}>
                  <MaterialIcons name="check-circle" size={16} color={Colors.success} />
                  <Text style={styles.successText}>
                    {isRTL ? 'מפתח API נשמר בהצלחה!' : 'API key saved successfully!'}
                  </Text>
                </View>
              ) : null}

              {/* Email Login Button */}
              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={handleEmailLogin}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={[Colors.primary, Colors.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  <MaterialIcons name="login" size={20} color="#FFF" />
                  <Text style={styles.primaryButtonText}>
                    {isRTL ? 'התחבר' : 'Sign In'}
                  </Text>
                </LinearGradient>
              </Pressable>

              {/* Google Gemini API Key Section */}
              <Pressable
                style={({ pressed }) => [
                  styles.apiKeyToggle,
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => setShowGeminiInput(!showGeminiInput)}
              >
                <MaterialIcons 
                  name={showGeminiInput ? 'expand-less' : 'expand-more'} 
                  size={20} 
                  color={Colors.primary} 
                />
                <Text style={styles.apiKeyToggleText}>
                  {isRTL ? 'הוסף מפתח Google Gemini API (אופציונלי)' : 'Add Google Gemini API Key (Optional)'}
                </Text>
              </Pressable>

              {showGeminiInput && (
                <View style={styles.apiKeyContainer}>
                  <View style={styles.inputContainer}>
                    <MaterialIcons name="vpn-key" size={20} color={Colors.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder={isRTL ? 'AIzaSy...' : 'AIzaSy...'}
                      placeholderTextColor={Colors.textMuted}
                      value={geminiApiKey}
                      onChangeText={setGeminiApiKey}
                      autoCapitalize="none"
                      textAlign={isRTL ? 'right' : 'left'}
                    />
                  </View>
                  <View style={styles.apiKeyInfo}>
                    <MaterialIcons name="info" size={16} color={Colors.primary} />
                    <Text style={styles.apiKeyInfoText}>
                      {isRTL 
                        ? 'מה זה? מפתח API של Google Gemini מאפשר לך להשתמש ב-AI של גוגל ליצירת סיכומים. אם לא תזין מפתח, האפליקציה תשתמש במפתח משותף (עם הגבלות שימוש).'
                        : 'What is this? A Google Gemini API key allows you to use Google\'s AI to create recaps. If you don\'t provide one, the app will use a shared key (with usage limits).'}
                    </Text>
                  </View>
                  <Pressable
                    style={({ pressed }) => [
                      styles.learnMoreButton,
                      pressed && styles.buttonPressed,
                    ]}
                    onPress={() => {
                      const { Linking } = require('react-native');
                      Linking.openURL('https://aistudio.google.com');
                    }}
                  >
                    <MaterialIcons name="open-in-new" size={16} color={Colors.secondary} />
                    <Text style={styles.learnMoreText}>
                      {isRTL ? 'איך מקבלים מפתח בחינם?' : 'How to get a free key?'}
                    </Text>
                  </Pressable>
                </View>
              )}

              {/* Divider */}
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>
                  {isRTL ? 'או' : 'OR'}
                </Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Google Sign In */}
              <Pressable
                style={({ pressed }) => [
                  styles.googleButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={signInWithGoogle}
              >
                <MaterialIcons name="g-translate" size={24} color="#DB4437" />
                <Text style={styles.googleButtonText}>
                  {isRTL ? 'המשך עם Google' : 'Continue with Google'}
                </Text>
              </Pressable>

              {/* Guest Login */}
              <Pressable
                style={({ pressed }) => [
                  styles.guestButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={handleGuestLogin}
              >
                <MaterialIcons name="person-outline" size={20} color={Colors.textSecondary} />
                <Text style={styles.guestButtonText}>
                  {isRTL ? 'המשך כאורח' : 'Continue as Guest'}
                </Text>
              </Pressable>

              {/* Sign Up Link */}
              <View style={styles.signUpContainer}>
                <Text style={styles.signUpText}>
                  {isRTL ? 'עדיין אין לך חשבון?' : 'Don\'t have an account yet?'}
                </Text>
                <Pressable
                  onPress={() => router.push('/signup')}
                  style={({ pressed }) => pressed && styles.buttonPressed}
                >
                  <Text style={styles.signUpLink}>
                    {isRTL ? 'הירשם' : 'Sign Up'}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                {isRTL 
                  ? 'בהתחברות, אתה מסכים לתנאי השימוש ומדיניות הפרטיות'
                  : 'By signing in, you agree to our Terms of Service and Privacy Policy'}
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
} // Closing curly brace for LoginScreen component.

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundContainer: {
    flex: 1,
    position: 'relative',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  glowOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.6,
  },
  gradientOverlay: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  
  // Header
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  welcomeTitle: {
    fontSize: Typography.h1,
    fontWeight: Typography.bold,
    color: Colors.text,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  
  // Form
  formContainer: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: Spacing.md,
    fontSize: Typography.body,
    color: Colors.text,
  },
  
  // Primary Button
  primaryButton: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    ...Shadows.md,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  primaryButtonText: {
    fontSize: Typography.h4,
    fontWeight: Typography.bold,
    color: '#FFF',
  },
  
  // Error
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(255, 51, 102, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: Colors.error,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  errorText: {
    flex: 1,
    fontSize: Typography.bodySmall,
    color: Colors.error,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(46, 213, 115, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: Colors.success,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  successText: {
    flex: 1,
    fontSize: Typography.bodySmall,
    color: Colors.success,
  },
  
  // Divider
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.md,
    gap: Spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontSize: Typography.bodySmall,
    color: Colors.textMuted,
    fontWeight: Typography.semibold,
  },
  
  // Google Button
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  googleButtonText: {
    fontSize: Typography.body,
    fontWeight: Typography.semibold,
    color: Colors.text,
  },
  
  // Gemini API Key
  apiKeyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
  },
  apiKeyToggleText: {
    fontSize: Typography.bodySmall,
    color: Colors.primary,
    fontWeight: Typography.semibold,
  },
  apiKeyContainer: {
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: 'rgba(0, 212, 255, 0.05)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.2)',
  },
  apiKeyInfo: {
    flexDirection: 'row',
    gap: Spacing.xs,
    alignItems: 'flex-start',
  },
  apiKeyInfoText: {
    flex: 1,
    fontSize: Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  learnMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    alignSelf: 'flex-start',
    paddingVertical: Spacing.xs,
  },
  learnMoreText: {
    fontSize: Typography.bodySmall,
    color: Colors.secondary,
    fontWeight: Typography.semibold,
    textDecorationLine: 'underline',
  },
  
  // Guest Button
  guestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    marginTop: Spacing.lg,
  },
  guestButtonText: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    textDecorationLine: 'underline',
  },
  
  // Sign Up Link
  signUpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.md,
  },
  signUpText: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
  },
  signUpLink: {
    fontSize: Typography.body,
    color: Colors.primary,
    fontWeight: Typography.semibold,
    textDecorationLine: 'underline',
  },
  
  buttonPressed: {
    opacity: 0.8,
  },
  
  // Footer
  footer: {
    marginTop: 'auto',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
  },
  footerText: {
    fontSize: Typography.caption,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
