import {
  View, Text, StyleSheet, ScrollView, Pressable, TextInput,
  Alert, Linking, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { blink } from '@/lib/blink';

const CONTACT_FUNCTION_URL = 'https://f7p6yyt8--send-contact.functions.blink.new';

export default function ContactScreen() {
  const insets = useSafeAreaInsets();
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();

  const [name, setName] = useState((user as any)?.name || (user as any)?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      Alert.alert(isRTL ? 'שגיאה' : 'Error', isRTL ? 'אנא מלא את כל השדות' : 'Please fill all fields');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert(isRTL ? 'שגיאה' : 'Error', isRTL ? 'אנא הזן אימייל תקין' : 'Please enter a valid email');
      return;
    }

    setIsSending(true);
    try {
      // Try blink.functions.invoke first (auto-attaches JWT for logged-in users)
      let success = false;
      try {
        const result = await blink.functions.invoke('send-contact', {
          body: {
            name: name.trim(),
            email: email.trim(),
            subject: subject.trim(),
            message: message.trim(),
            userId: user?.id || null,
          },
        });
        if ((result as any)?.success) success = true;
      } catch (invokeErr: any) {
        // Fallback: direct fetch (for users who may not have SDK JWT)
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 20_000);
        const token = await blink.auth.getValidToken().catch(() => null);
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(CONTACT_FUNCTION_URL, {
          method: 'POST',
          headers,
          signal: controller.signal,
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            subject: subject.trim(),
            message: message.trim(),
            userId: user?.id || null,
          }),
        });
        clearTimeout(timeout);

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error((errData as any).error || `HTTP ${res.status}`);
        }
        success = true;
      }

      if (success) {
        setSent(true);
        setSubject('');
        setMessage('');
        Alert.alert(
          isRTL ? '✅ נשלח בהצלחה!' : '✅ Sent Successfully!',
          isRTL
            ? 'הודעתך נשלחה לצוות שלנו. נחזור אליך בהקדם האפשרי.'
            : "Your message was sent to our team. We'll get back to you as soon as possible.",
          [{ text: 'OK', onPress: () => setSent(false) }]
        );
      }
    } catch (error: any) {
      console.error('Contact submit error:', error);
      if (error?.name === 'AbortError') {
        Alert.alert(isRTL ? 'שגיאה' : 'Error', isRTL ? 'השרת לא הגיב. נסה שוב.' : 'Server did not respond. Please try again.');
      } else {
        Alert.alert(isRTL ? 'שגיאה' : 'Error', isRTL ? 'שגיאה בשליחה. נסה שוב.' : `Send failed: ${error?.message || 'Unknown error'}`);
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <LinearGradient
          colors={[Colors.primary, Colors.secondary]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.headerIconWrap}
        >
          <MaterialIcons name="mail" size={28} color="#FFF" />
        </LinearGradient>
        <Text style={styles.headerTitle}>
          {isRTL ? 'צור קשר' : 'Contact Us'}
        </Text>
        <Text style={styles.headerSubtitle}>
          {isRTL
            ? 'נשמח לשמוע ממך! שלח לנו הודעה ונחזור אליך בהקדם'
            : "We'd love to hear from you! Send us a message and we'll reply soon"}
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + Spacing.xl }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Contact Methods */}
        <View style={styles.methodsRow}>
          <ContactMethod
            icon="email"
            label={isRTL ? 'אימייל' : 'Email'}
            value="contact-us@y-l-b-s-ai-studio-apps.com"
            onPress={() => Linking.openURL('mailto:contact-us@y-l-b-s-ai-studio-apps.com')}
          />
          <ContactMethod
            icon="support"
            label={isRTL ? 'תגובה' : 'Response'}
            value={isRTL ? '24-48 שעות' : '24-48 hours'}
            onPress={() => {}}
          />
        </View>

        {/* Form */}
        <View style={styles.formCard}>
          <View style={styles.formTitleRow}>
            <MaterialIcons name="edit" size={20} color={Colors.primary} />
            <Text style={styles.formTitle}>
              {isRTL ? 'שלח הודעה' : 'Send a Message'}
            </Text>
          </View>

          <Field
            icon="person"
            label={isRTL ? 'שם מלא' : 'Full Name'}
            placeholder={isRTL ? 'הזן שמך' : 'Your name'}
            value={name}
            onChangeText={setName}
            isRTL={isRTL}
          />
          <Field
            icon="email"
            label={isRTL ? 'אימייל' : 'Email'}
            placeholder={isRTL ? 'הזן אימייל' : 'your@email.com'}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            isRTL={isRTL}
          />
          <Field
            icon="subject"
            label={isRTL ? 'נושא' : 'Subject'}
            placeholder={isRTL ? 'במה נוכל לעזור?' : 'How can we help?'}
            value={subject}
            onChangeText={setSubject}
            isRTL={isRTL}
          />

          {/* Message */}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>{isRTL ? 'הודעה' : 'Message'}</Text>
            <TextInput
              style={[styles.messageInput, isRTL && { textAlign: 'right' }]}
              placeholder={isRTL ? 'כתוב את הודעתך כאן...' : 'Write your message here...'}
              placeholderTextColor={Colors.textMuted}
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{message.length} {isRTL ? 'תווים' : 'chars'}</Text>
          </View>

          {/* Submit */}
          <Pressable
            style={({ pressed }) => [
              styles.submitBtn,
              (isSending || sent) && { opacity: 0.8 },
              pressed && { opacity: 0.85 },
            ]}
            onPress={handleSubmit}
            disabled={isSending}
          >
            <LinearGradient
              colors={sent ? [Colors.success, '#00a86b'] : [Colors.primary, Colors.secondary]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.submitGradient}
            >
              {isSending ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <MaterialIcons name={sent ? 'check-circle' : 'send'} size={20} color="#FFF" />
              )}
              <Text style={styles.submitText}>
                {isSending
                  ? (isRTL ? 'שולח...' : 'Sending...')
                  : sent
                    ? (isRTL ? 'נשלח!' : 'Sent!')
                    : (isRTL ? 'שלח הודעה' : 'Send Message')}
              </Text>
            </LinearGradient>
          </Pressable>

          <Text style={styles.privacyNote}>
            {isRTL
              ? '🔒 ההודעה נשלחת ישירות לצוות שלנו ב-contact-us@y-l-b-s-ai-studio-apps.com'
              : '🔒 Your message is sent directly to contact-us@y-l-b-s-ai-studio-apps.com'}
          </Text>
        </View>

        {/* FAQ */}
        <View style={styles.faqSection}>
          <Text style={styles.sectionTitle}>
            {isRTL ? 'שאלות נפוצות' : 'Frequently Asked Questions'}
          </Text>
          <FAQItem
            q={isRTL ? 'מה זמן התגובה הממוצע?' : 'What is the average response time?'}
            a={isRTL ? 'אנו עונים לרוב הפניות תוך 24-48 שעות בימי עסקים.' : 'We respond to most inquiries within 24-48 hours on business days.'}
          />
          <FAQItem
            q={isRTL ? 'איך אוכל לדווח על באג?' : 'How can I report a bug?'}
            a={isRTL ? 'אנא כלול תיאור מפורט, צילומי מסך ופרטי המכשיר שלך.' : 'Please include a detailed description, screenshots, and your device details.'}
          />
          <FAQItem
            q={isRTL ? 'יש לכם תמיכה בעברית?' : 'Do you have Hebrew support?'}
            a={isRTL ? 'כן! אנחנו תומכים בעברית מלאה כולל תמיכת RTL.' : 'Yes! We fully support Hebrew including RTL layout.'}
          />
          <FAQItem
            q={isRTL ? 'איך מרוויחים קרדיטים?' : 'How do I earn credits?'}
            a={isRTL ? 'ניתן להרוויח קרדיטים על ידי צפייה במודעות מתגמלות, או לרכוש קרדיטים דרך Stripe.' : 'Earn credits by watching rewarded ads, or purchase credit packs via Stripe.'}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Field ───────────────────────────────────────────────────────────────────

function Field({
  icon, label, placeholder, value, onChangeText, keyboardType, autoCapitalize, isRTL,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string; placeholder: string; value: string;
  onChangeText: (v: string) => void;
  keyboardType?: any; autoCapitalize?: any; isRTL?: boolean;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.fieldRow}>
        <MaterialIcons name={icon} size={18} color={Colors.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          style={[styles.fieldInput, isRTL && { textAlign: 'right' }]}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
        />
      </View>
    </View>
  );
}

// ─── ContactMethod ────────────────────────────────────────────────────────────

function ContactMethod({ icon, label, value, onPress }: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string; value: string; onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.methodCard, pressed && { opacity: 0.8 }]}
      onPress={onPress}
    >
      <View style={styles.methodIcon}>
        <MaterialIcons name={icon} size={22} color={Colors.primary} />
      </View>
      <View style={styles.methodInfo}>
        <Text style={styles.methodLabel}>{label}</Text>
        <Text style={styles.methodValue} numberOfLines={1}>{value}</Text>
      </View>
    </Pressable>
  );
}

// ─── FAQItem ──────────────────────────────────────────────────────────────────

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Pressable style={styles.faqItem} onPress={() => setOpen(!open)}>
      <View style={styles.faqHeader}>
        <MaterialIcons name={open ? 'expand-less' : 'expand-more'} size={22} color={Colors.primary} />
        <Text style={styles.faqQ}>{q}</Text>
      </View>
      {open && <Text style={styles.faqA}>{a}</Text>}
    </Pressable>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    alignItems: 'center',
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  headerIconWrap: {
    width: 56, height: 56, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    fontSize: Typography.h2, fontWeight: Typography.bold,
    color: Colors.text, textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: Typography.bodySmall, color: Colors.textSecondary,
    textAlign: 'center', lineHeight: 20, maxWidth: 320,
  },

  scrollView: { flex: 1 },
  scrollContent: { padding: Spacing.md, gap: Spacing.lg },

  methodsRow: { flexDirection: 'row', gap: Spacing.sm },
  methodCard: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    padding: Spacing.md, gap: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border, ...Shadows.sm,
  },
  methodIcon: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: `${Colors.primary}18`,
    alignItems: 'center', justifyContent: 'center',
  },
  methodInfo: { flex: 1 },
  methodLabel: { fontSize: 10, color: Colors.textMuted, fontWeight: '600', textTransform: 'uppercase' },
  methodValue: { fontSize: Typography.caption, color: Colors.text, fontWeight: '600', marginTop: 2 },

  formCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border,
    gap: Spacing.md, ...Shadows.md,
  },
  formTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  formTitle: { fontSize: Typography.h3, fontWeight: Typography.bold, color: Colors.text },

  fieldWrap: { gap: 6 },
  fieldLabel: { fontSize: Typography.caption, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  fieldRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.background, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },
  fieldInput: { flex: 1, fontSize: Typography.body, color: Colors.text, paddingVertical: 4 },

  messageInput: {
    backgroundColor: Colors.background, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, fontSize: Typography.body, color: Colors.text,
    minHeight: 130,
  },
  charCount: { fontSize: 11, color: Colors.textMuted, textAlign: 'right' },

  submitBtn: { borderRadius: BorderRadius.md, overflow: 'hidden', ...Shadows.md },
  submitGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, paddingVertical: Spacing.md,
  },
  submitText: { fontSize: Typography.body, fontWeight: Typography.bold, color: '#FFF' },

  privacyNote: {
    fontSize: 11, color: Colors.textMuted, textAlign: 'center', lineHeight: 16,
  },

  faqSection: { gap: Spacing.sm },
  sectionTitle: {
    fontSize: Typography.h3, fontWeight: Typography.bold, color: Colors.text, marginBottom: Spacing.xs,
  },
  faqItem: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, gap: Spacing.sm,
  },
  faqHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  faqQ: { flex: 1, fontSize: Typography.bodySmall, fontWeight: '600', color: Colors.text },
  faqA: { fontSize: Typography.caption, color: Colors.textSecondary, lineHeight: 18, paddingLeft: 30 },
});
