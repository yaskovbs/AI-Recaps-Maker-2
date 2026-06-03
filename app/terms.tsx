import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLanguage } from '@/contexts/LanguageContext';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';

export default function TermsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isRTL } = useLanguage();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name={isRTL ? 'chevron-right' : 'chevron-left'} size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>
          {isRTL ? 'תנאי שימוש' : 'Terms of Service'}
        </Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + Spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.lastUpdated}>
          {isRTL ? 'עדכון אחרון: 22 מרץ 2026' : 'Last Updated: March 22, 2026'}
        </Text>

        <Section
          title={isRTL ? '1. קבלת התנאים' : '1. Acceptance of Terms'}
          content={
            isRTL
              ? 'על ידי שימוש ב-AI Recaps Maker ("האפליקציה"), אתה מסכים לתנאי שימוש אלה. אם אינך מסכים לתנאים אלה, אנא הימנע משימוש באפליקציה.'
              : 'By using AI Recaps Maker ("the App"), you agree to these Terms of Service. If you do not agree to these terms, please do not use the App.'
          }
        />

        <Section
          title={isRTL ? '2. שימוש באפליקציה' : '2. Use of the App'}
          content={
            isRTL
              ? 'האפליקציה מאפשרת לך ליצור סיכומי וידאו באמצעות בינה מלאכותית של Google Gemini. אתה מסכים להשתמש באפליקציה למטרות חוקיות בלבד ובהתאם לכל החוקים והתקנות הרלוונטיים.'
              : 'The App allows you to create video recaps using Google Gemini AI. You agree to use the App only for lawful purposes and in accordance with all applicable laws and regulations.'
          }
        />

        <Section
          title={isRTL ? '3. חשבון משתמש' : '3. User Account'}
          content={
            isRTL
              ? 'אתה אחראי לשמירה על סודיות פרטי החשבון שלך ולכל הפעילויות המתרחשות תחת חשבונך. עליך להודיע לנו מיד על כל שימוש לא מורשה בחשבונך.'
              : 'You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account.'
          }
        />

        <Section
          title={isRTL ? '4. מפתחות API (BYOK)' : '4. API Keys (BYOK)'}
          content={
            isRTL
              ? 'האפליקציה תומכת ב-BYOK (Bring Your Own Key). מפתחות ה-API שלך נשמרים באופן מקומי על המכשיר שלך ואינם מועברים לשרתים שלנו. אתה אחראי לניהול ואבטחת מפתחות ה-API שלך.'
              : 'The App supports BYOK (Bring Your Own Key). Your API keys are stored locally on your device and are not transmitted to our servers. You are responsible for managing and securing your API keys.'
          }
        />

        <Section
          title={isRTL ? '5. מודעות (AdMob)' : '5. Advertising (AdMob)'}
          content={
            isRTL
              ? 'האפליקציה משתמשת ב-Google AdMob להצגת מודעות. על ידי שימוש באפליקציה, אתה מסכים לכך שנציג מודעות ונאסוף נתונים לצורך התאמה אישית של מודעות בהתאם למדיניות הפרטיות של Google.'
              : 'The App uses Google AdMob to display advertisements. By using the App, you agree that we may display ads and collect data for ad personalization in accordance with Google\'s privacy policies.'
          }
        />

        <Section
          title={isRTL ? '6. מערכת קרדיטים' : '6. Credits System'}
          content={
            isRTL
              ? 'האפליקציה משתמשת במערכת קרדיטים. ניתן להרוויח קרדיטים על ידי צפייה במודעות מתגמלות. קרדיט אחד נדרש ליצירת סיכום אחד. הקרדיטים אינם ניתנים להעברה ואינם ניתנים להחזר.'
              : 'The App uses a credits system. Credits can be earned by watching rewarded ads. One credit is required to create one recap. Credits are non-transferable and non-refundable.'
          }
        />

        <Section
          title={isRTL ? '7. תוכן משתמש' : '7. User Content'}
          content={
            isRTL
              ? 'אתה שומר על כל הזכויות בתוכן שאתה יוצר באמצעות האפליקציה. עם זאת, אתה מעניק לנו רישיון לא בלעדי לאחסן ולעבד את התוכן שלך לצורך מתן השירות.'
              : 'You retain all rights to content you create using the App. However, you grant us a non-exclusive license to store and process your content for the purpose of providing the service.'
          }
        />

        <Section
          title={isRTL ? '8. הגבלת אחריות' : '8. Limitation of Liability'}
          content={
            isRTL
              ? 'האפליקציה מסופקת "כמות שהיא" ללא אחריות מכל סוג. איננו אחראים לכל נזק ישיר, עקיף, מקרי או תוצאתי הנובע משימוש באפליקציה.'
              : 'The App is provided "as is" without any warranties of any kind. We are not liable for any direct, indirect, incidental, or consequential damages arising from the use of the App.'
          }
        />

        <Section
          title={isRTL ? '9. שינויים בתנאים' : '9. Changes to Terms'}
          content={
            isRTL
              ? 'אנו שומרים לעצמנו את הזכות לשנות תנאים אלה בכל עת. נודיע לך על שינויים משמעותיים דרך האפליקציה או באימייל. המשך שימוש באפליקציה לאחר שינויים מהווה הסכמה לתנאים המעודכנים.'
              : 'We reserve the right to modify these terms at any time. We will notify you of significant changes through the App or via email. Continued use of the App after changes constitutes acceptance of the updated terms.'
          }
        />

        <Section
          title={isRTL ? '10. סיום' : '10. Termination'}
          content={
            isRTL
              ? 'אנו רשאים להשעות או לסיים את גישתך לאפליקציה בכל עת, ללא הודעה מוקדמת, בגין הפרה של תנאים אלה או מכל סיבה אחרת.'
              : 'We may suspend or terminate your access to the App at any time, without prior notice, for violation of these terms or for any other reason.'
          }
        />

        <Section
          title={isRTL ? '11. יצירת קשר' : '11. Contact'}
          content={
            isRTL
              ? 'לשאלות בנוגע לתנאי השימוש, אנא צור קשר: contact-us@y-l-b-s-ai-studio-apps.com'
              : 'For questions about these Terms, please contact: contact-us@y-l-b-s-ai-studio-apps.com'
          }
        />
      </ScrollView>
    </View>
  );
}

function Section({ title, content }: { title: string; content: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionContent}>{content}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: Typography.h3,
    fontWeight: Typography.bold,
    color: Colors.text,
  },
  spacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  lastUpdated: {
    fontSize: Typography.bodySmall,
    color: Colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  section: {
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.h4,
    fontWeight: Typography.bold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  sectionContent: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
});
