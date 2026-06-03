import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLanguage } from '@/contexts/LanguageContext';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';

export default function PrivacyScreen() {
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
          {isRTL ? 'מדיניות פרטיות' : 'Privacy Policy'}
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
          title={isRTL ? '1. מידע שאנו אוספים' : '1. Information We Collect'}
          content={
            isRTL
              ? 'אנו אוספים מידע שאתה מספק לנו ישירות, כגון:\n• כתובת אימייל ושם (בעת הרשמה)\n• תוכן שאתה יוצר (סיכומים, תסריטים)\n• מפתחות API (נשמרים באופן מקומי על המכשיר שלך)\n• היסטוריית שימוש וקרדיטים'
              : 'We collect information that you provide directly to us, such as:\n• Email address and name (during registration)\n• Content you create (recaps, scripts)\n• API keys (stored locally on your device)\n• Usage history and credits'
          }
        />

        <Section
          title={isRTL ? '2. איך אנו משתמשים במידע' : '2. How We Use Information'}
          content={
            isRTL
              ? 'אנו משתמשים במידע שאנו אוספים כדי:\n• לספק ולשפר את השירות שלנו\n• ליצור ולנהל את חשבון המשתמש שלך\n• לשלוח לך עדכונים והודעות\n• לנתח דפוסי שימוש ולשפר את האפליקציה\n• להתאים אישית את חווית המשתמש שלך'
              : 'We use the information we collect to:\n• Provide and improve our service\n• Create and manage your user account\n• Send you updates and notifications\n• Analyze usage patterns and improve the App\n• Personalize your user experience'
          }
        />

        <Section
          title={isRTL ? '3. שיתוף מידע' : '3. Information Sharing'}
          content={
            isRTL
              ? 'אנו לא מוכרים או משכירים את המידע האישי שלך לצדדים שלישיים. אנו עשויים לשתף מידע עם:\n• Google AdMob (לצורך הצגת מודעות)\n• Google Gemini (לעיבוד AI - רק עם מפתח API שלך)\n• ספקי שירותים המסייעים בתפעול האפליקציה'
              : 'We do not sell or rent your personal information to third parties. We may share information with:\n• Google AdMob (for ad serving)\n• Google Gemini (for AI processing - only with your API key)\n• Service providers who help operate the App'
          }
        />

        <Section
          title={isRTL ? '4. אבטחת מידע' : '4. Data Security'}
          content={
            isRTL
              ? 'אנו נוקטים באמצעי אבטחה סבירים כדי להגן על המידע שלך:\n• מפתחות API נשמרים באופן מקומי על המכשיר שלך\n• שימוש בהצפנה לנתונים רגישים\n• גישה מוגבלת למידע אישי\n• ניטור קבוע של מערכות האבטחה שלנו'
              : 'We take reasonable security measures to protect your information:\n• API keys are stored locally on your device\n• Use of encryption for sensitive data\n• Limited access to personal information\n• Regular monitoring of our security systems'
          }
        />

        <Section
          title={isRTL ? '5. AdMob ומודעות' : '5. AdMob and Advertising'}
          content={
            isRTL
              ? 'האפליקציה משתמשת ב-Google AdMob להצגת מודעות. AdMob עשוי לאסוף:\n• מזהי מכשיר\n• נתוני מיקום משוערים\n• נתוני שימוש באפליקציה\n• מידע על אינטראקציות עם מודעות\n\nלמידע נוסף, עיין במדיניות הפרטיות של Google AdMob.'
              : 'The App uses Google AdMob to display advertisements. AdMob may collect:\n• Device identifiers\n• Approximate location data\n• App usage data\n• Information about ad interactions\n\nFor more information, see Google AdMob\'s privacy policy.'
          }
        />

        <Section
          title={isRTL ? '6. זכויותיך' : '6. Your Rights'}
          content={
            isRTL
              ? 'יש לך את הזכות:\n• לגשת למידע האישי שלך\n• לתקן מידע לא מדויק\n• למחוק את חשבונך ואת המידע שלך\n• להסתייג מקבלת הודעות שיווקיות\n• לייצא את הנתונים שלך\n\nלמימוש זכויותיך, צור איתנו קשר דרך האפליקציה או באימייל.'
              : 'You have the right to:\n• Access your personal information\n• Correct inaccurate information\n• Delete your account and information\n• Opt-out of marketing communications\n• Export your data\n\nTo exercise your rights, contact us through the App or via email.'
          }
        />

        <Section
          title={isRTL ? '7. שמירת מידע' : '7. Data Retention'}
          content={
            isRTL
              ? 'אנו שומרים את המידע שלך כל עוד חשבונך פעיל. לאחר מחיקת חשבון, נמחק את מרבית המידע האישי שלך תוך 30 יום, למעט מידע שעלינו לשמור על פי חוק.'
              : 'We retain your information as long as your account is active. After account deletion, we will delete most of your personal information within 30 days, except information we are required to retain by law.'
          }
        />

        <Section
          title={isRTL ? '8. קטינים' : '8. Children'}
          content={
            isRTL
              ? 'האפליקציה אינה מיועדת לילדים מתחת לגיל 13. איננו אוספים במודע מידע מילדים מתחת לגיל 13. אם אתה הורה וגילית שילדך סיפק לנו מידע אישי, אנא צור איתנו קשר.'
              : 'The App is not intended for children under 13. We do not knowingly collect information from children under 13. If you are a parent and discover that your child has provided us with personal information, please contact us.'
          }
        />

        <Section
          title={isRTL ? '9. שינויים במדיניות' : '9. Changes to Policy'}
          content={
            isRTL
              ? 'אנו עשויים לעדכן מדיניות פרטיות זו מעת לעת. נודיע לך על שינויים משמעותיים דרך האפליקציה או באימייל. המשך שימוש באפליקציה לאחר שינויים מהווה הסכמה למדיניות המעודכנת.'
              : 'We may update this Privacy Policy from time to time. We will notify you of significant changes through the App or via email. Continued use of the App after changes constitutes acceptance of the updated policy.'
          }
        />

        <Section
          title={isRTL ? '10. יצירת קשר' : '10. Contact'}
          content={
            isRTL
              ? 'לשאלות בנוגע למדיניות הפרטיות או לבקשות הנוגעות למידע האישי שלך:\n\nאימייל: contact-us@y-l-b-s-ai-studio-apps.com\nאתר: https://ai-recaps-maker.onspace.build'
              : 'For questions about this Privacy Policy or requests regarding your personal information:\n\nEmail: contact-us@y-l-b-s-ai-studio-apps.com\nWebsite: https://ai-recaps-maker.onspace.build'
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
