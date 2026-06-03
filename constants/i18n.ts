// AI Recaps Maker - i18n

export type Language = 'he' | 'en' | 'ar' | 'es' | 'fr' | 'de' | 'ru' | 'ja' | 'zh' | 'pt' | 'hi' | 'ko' | 'it' | 'tr' | 'vi' | 'th' | 'pl' | 'nl' | 'sv' | 'ro' | 'cs' | 'el' | 'hu' | 'fi' | 'da' | 'no' | 'sk' | 'hr' | 'bg' | 'sr' | 'uk' | 'ca';

export const translations = {
  he: {
    // Navigation
    home: 'בית',
    recaps: 'הסיכומים שלי',
    myRecaps: 'הסיכומים שלי',
    create: 'יצירה',
    gallery: 'גלריה',
    analytics: 'ניתוח',
    contactUs: 'צור קשר',
    settings: 'הגדרות',
    
    // Home Screen
    appName: 'AI Recaps Maker',
    tagline: 'יוצר סיכומי וידאו חכם',
    subtitle: 'הפלטפורמה המתקדמת ביותר ליצירת סיכומים מבוססי AI עם Google Gemini',
    getStarted: 'התחל ליצור',
    learnMore: 'למד עוד',
    
    // Create Wizard
    createRecap: 'צור סיכום חכם',
    step: 'שלב',
    of: 'מתוך',
    continue: 'המשך',
    back: 'חזור',
    finish: 'סיים',
    
    // Step titles (5 steps)
    step1Title: 'קלט תסריט',
    step2Title: 'עיבוד אודיו',
    step3Title: 'העלאת וידאו',
    step4Title: 'הגדרות AI',
    step5Title: 'יצירת סיכום',
    
    // Common
    loading: 'טוען...',
    save: 'שמור',
    cancel: 'ביטול',
    delete: 'מחק',
    edit: 'ערוך',
    done: 'סיום',
    
    // Credits
    credits: 'קרדיטים',
    earnCredits: 'קבל קרדיט',
    watchAd: 'צפה במודעה',
    insufficientCredits: 'אין מספיק קרדיטים',
    
    // YouTube Learning
    youtubeChannels: 'ערוצי YouTube',
    addChannel: 'הוסף ערוץ',
    removeChannel: 'הסר ערוץ',
    syncChannels: 'סנכרן ערוצים',
    channelSlots: 'סלוטים זמינים',
    unlockSlots: 'פתח סלוטים',
    watch2AdsToUnlock: 'צפה ב-2 מודעות לפתיחה',
    unlimited: 'בלתי מוגבל',
    youtubeLearning: 'למידה מיוטיוב',
    legalInfo: 'מידע משפטי',
    termsOfService: 'תנאי שימוש',
    privacyPolicy: 'מדיניות פרטיות',
    adminTools: 'כלי מנהל',
    adMobAnalytics: 'ניתוח AdMob',
    
    // Auth
    signIn: 'התחברות',
    signUp: 'הרשמה',
    email: 'אימייל',
    password: 'סיסמה',
    forgotPassword: 'שכחת סיסמה?',
    continueWithGoogle: 'המשך עם Google',
    continueAsGuest: 'המשך כאורח',
    
    // Errors
    error: 'שגיאה',
    tryAgain: 'נסה שוב',
    somethingWentWrong: 'משהו השתבש',
    
    // Contact
    contactFormName: 'שם מלא',
    contactFormEmail: 'אימייל',
    contactFormSubject: 'נושא',
    contactFormMessage: 'הודעה',
    sendMessage: 'שלח הודעה',
    messageSent: 'ההודעה נשלחה בהצלחה',
    
    // Sharing
    shareOnWhatsApp: 'שתף ב-WhatsApp',
    shareOnFacebook: 'שתף ב-Facebook',
    shareOnTwitter: 'שתף ב-Twitter',
    shareRecap: 'שתף סיכום',
    copyLink: 'העתק קישור',
    
    // Notifications
    notifications: 'התראות',
    notificationSettings: 'הגדרות התראות',
    pushNotifications: 'התראות דחיפה',
    emailNotifications: 'התראות אימייל',
    recapCompleteNotif: 'התראה כשסיכום מוכן',
    newFeaturesNotif: 'התראות על תכונות חדשות',
    marketingNotif: 'עדכונים שיווקיים',
    markAllAsRead: 'סמן הכל כנקרא',
    clearAllNotifications: 'נקה הכל',
    noNotifications: 'אין התראות',
    
    // Video Player
    preview: 'תצוגה מקדימה',
    play: 'נגן',
    pause: 'השהה',
    
    // Public/Private
    public: 'ציבורי',
    private: 'פרטי',
    makePublic: 'הפוך לציבורי',
    makePrivate: 'הפוך לפרטי',
    publicRecapsOnly: 'רק סיכומים ציבוריים',
    noPublicRecaps: 'טרם נוספו סיכומים ציבוריים',
    recapsSharedByUsers: 'סיכומים שמשתמשים בוחרים לשתף יופיעו כאן',
    
    // Google OAuth
    googleClientId: 'Google Client ID',
    googleClientSecret: 'Google Client Secret',
    googleOAuthConfig: 'הגדרות Google OAuth',
    
    // Account Management
    account: 'חשבון',
    freezeAccount: 'הקפא חשבון',
    deleteAccount: 'מחק חשבון',
    freezeAccountConfirm: 'להקפיא את החשבון?',
    freezeAccountMessage: 'החשבון יוקפא ולא תוכל להתחבר עד הפעלה מחדש. להמשיך?',
    deleteAccountConfirm: 'למחוק את החשבון?',
    deleteAccountMessage: 'כל הנתונים, הסיכומים והקרדיטים שלך יימחקו לצמיתות. פעולה זו לא ניתנת לביטול!',
    freeze: 'הקפא',
    accountFrozen: 'החשבון הוקפא בהצלחה',
    accountDeleted: 'החשבון נמחק בהצלחה',
    accountFrozenMessage: 'החשבון שלך הוקפא. צור קשר עם התמיכה להפעלה מחדש.',
    accountDeletedMessage: 'החשבון שלך נמחק לצמיתות.',
  },
  
  
  en: {
    // Navigation
    home: 'Home',
    recaps: 'My Recaps',
    myRecaps: 'My Recaps',
    create: 'Create',
    gallery: 'Gallery',
    analytics: 'Analytics',
    contactUs: 'Contact Us',
    settings: 'Settings',
    
    // Home Screen
    appName: 'AI Recaps Maker',
    tagline: 'AI Video Recaps Maker',
    subtitle: 'The most advanced platform for creating AI-powered video recaps with Google Gemini',
    getStarted: 'Get Started',
    learnMore: 'Learn More',
    
    // Create Wizard
    createRecap: 'Create Smart Recap',
    step: 'Step',
    of: 'of',
    continue: 'Continue',
    back: 'Back',
    finish: 'Finish',
    
    // Step titles (5 steps)
    step1Title: 'Script Input',
    step2Title: 'Audio Processing',
    step3Title: 'Upload Video',
    step4Title: 'AI Settings',
    step5Title: 'Create Recap',
    
    // Common
    loading: 'Loading...',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    done: 'Done',
    
    // Credits
    credits: 'Credits',
    earnCredits: 'Earn Credit',
    watchAd: 'Watch Ad',
    insufficientCredits: 'Insufficient Credits',
    
    // YouTube Learning
    youtubeChannels: 'YouTube Channels',
    addChannel: 'Add Channel',
    removeChannel: 'Remove Channel',
    syncChannels: 'Sync Channels',
    channelSlots: 'Available Slots',
    unlockSlots: 'Unlock Slots',
    watch2AdsToUnlock: 'Watch 2 ads to unlock',
    unlimited: 'Unlimited',
    youtubeLearning: 'YouTube Learning',
    legalInfo: 'Legal Information',
    termsOfService: 'Terms of Service',
    privacyPolicy: 'Privacy Policy',
    adminTools: 'Admin Tools',
    adMobAnalytics: 'AdMob Analytics',
    
    // Auth
    signIn: 'Sign In',
    signUp: 'Sign Up',
    email: 'Email',
    password: 'Password',
    forgotPassword: 'Forgot Password?',
    continueWithGoogle: 'Continue with Google',
    continueAsGuest: 'Continue as Guest',
    
    // Errors
    error: 'Error',
    tryAgain: 'Try Again',
    somethingWentWrong: 'Something went wrong',
    
    // Contact
    contactFormName: 'Full Name',
    contactFormEmail: 'Email',
    contactFormSubject: 'Subject',
    contactFormMessage: 'Message',
    sendMessage: 'Send Message',
    messageSent: 'Message sent successfully',
    
    // Sharing
    shareOnWhatsApp: 'Share on WhatsApp',
    shareOnFacebook: 'Share on Facebook',
    shareOnTwitter: 'Share on Twitter',
    shareRecap: 'Share Recap',
    copyLink: 'Copy Link',
    
    // Notifications
    notifications: 'Notifications',
    notificationSettings: 'Notification Settings',
    pushNotifications: 'Push Notifications',
    emailNotifications: 'Email Notifications',
    recapCompleteNotif: 'Notify when recap is ready',
    newFeaturesNotif: 'New features notifications',
    marketingNotif: 'Marketing updates',
    markAllAsRead: 'Mark all as read',
    clearAllNotifications: 'Clear all',
    noNotifications: 'No notifications',
    
    // Video Player
    preview: 'Preview',
    play: 'Play',
    pause: 'Pause',
    
    // Public/Private
    public: 'Public',
    private: 'Private',
    makePublic: 'Make Public',
    makePrivate: 'Make Private',
    publicRecapsOnly: 'Public recaps only',
    noPublicRecaps: 'No public recaps yet',
    recapsSharedByUsers: 'Recaps that users choose to share will appear here',
    
    // Google OAuth
    googleClientId: 'Google Client ID',
    googleClientSecret: 'Google Client Secret',
    googleOAuthConfig: 'Google OAuth Configuration',
    
    // Account Management
    account: 'Account',
    freezeAccount: 'Freeze Account',
    deleteAccount: 'Delete Account',
    freezeAccountConfirm: 'Freeze Account?',
    freezeAccountMessage: 'Your account will be frozen and you won\'t be able to sign in until reactivation. Continue?',
    deleteAccountConfirm: 'Delete Account?',
    deleteAccountMessage: 'All your data, recaps, and credits will be permanently deleted. This action cannot be undone!',
    freeze: 'Freeze',
    accountFrozen: 'Account frozen successfully',
    accountDeleted: 'Account deleted successfully',
    accountFrozenMessage: 'Your account has been frozen. Contact support for reactivation.',
    accountDeletedMessage: 'Your account has been permanently deleted.',
  },
  
  ar: {
    // Navigation
    home: 'الرئيسية',
    create: 'إنشاء',
    analytics: 'التحليلات',
    settings: 'الإعدادات',
    
    // Home Screen
    appName: 'AI Recaps Maker',
    tagline: 'صانع ملخصات الفيديو الذكي',
    subtitle: 'المنصة الأكثر تقدماً لإنشاء ملخصات مدعومة بالذكاء الاصطناعي مع Google Gemini',
    getStarted: 'ابدأ الآن',
    learnMore: 'اعرف المزيد',
    
    // Create Wizard
    createRecap: 'إنشاء ملخص ذكي',
    step: 'خطوة',
    of: 'من',
    continue: 'متابعة',
    back: 'رجوع',
    finish: 'إنهاء',
    
    // Step titles
    step1Title: 'إدخال النص',
    step2Title: 'معالجة الصوت',
    step3Title: 'تحليل الفيديو',
    step4Title: 'المواءمة الذكية',
    step5Title: 'العرض النهائي',
    
    // Common
    loading: 'جاري التحميل...',
    save: 'حفظ',
    cancel: 'إلغاء',
    delete: 'حذف',
    edit: 'تعديل',
    done: 'تم',
    
    // Credits
    credits: 'الرصيد',
    earnCredits: 'احصل على رصيد',
    watchAd: 'شاهد إعلان',
    insufficientCredits: 'رصيد غير كافٍ',
    
    // Auth
    signIn: 'تسجيل الدخول',
    signUp: 'إنشاء حساب',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    forgotPassword: 'نسيت كلمة المرور؟',
    continueWithGoogle: 'متابعة مع Google',
    continueAsGuest: 'متابعة كضيف',
    
    // Errors
    error: 'خطأ',
    tryAgain: 'حاول مرة أخرى',
    somethingWentWrong: 'حدث خطأ ما',
  },
  
  es: {
    // Navigation
    home: 'Inicio',
    create: 'Crear',
    analytics: 'Análisis',
    settings: 'Ajustes',
    
    // Home Screen
    appName: 'AI Recaps Maker',
    tagline: 'Creador de Resúmenes de Video IA',
    subtitle: 'La plataforma más avanzada para crear resúmenes con IA usando Google Gemini',
    getStarted: 'Comenzar',
    learnMore: 'Aprende Más',
    
    // Create Wizard
    createRecap: 'Crear Resumen Inteligente',
    step: 'Paso',
    of: 'de',
    continue: 'Continuar',
    back: 'Atrás',
    finish: 'Finalizar',
    
    // Step titles
    step1Title: 'Entrada de Guión',
    step2Title: 'Procesamiento de Audio',
    step3Title: 'Análisis de Video',
    step4Title: 'Alineación Inteligente',
    step5Title: 'Renderizado Final',
    
    // Common
    loading: 'Cargando...',
    save: 'Guardar',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    edit: 'Editar',
    done: 'Hecho',
    
    // Credits
    credits: 'Créditos',
    earnCredits: 'Ganar Crédito',
    watchAd: 'Ver Anuncio',
    insufficientCredits: 'Créditos Insuficientes',
    
    // Auth
    signIn: 'Iniciar Sesión',
    signUp: 'Registrarse',
    email: 'Correo',
    password: 'Contraseña',
    forgotPassword: '¿Olvidaste tu Contraseña?',
    continueWithGoogle: 'Continuar con Google',
    continueAsGuest: 'Continuar como Invitado',
    
    // Errors
    error: 'Error',
    tryAgain: 'Intentar de Nuevo',
    somethingWentWrong: 'Algo salió mal',
  },
  
  fr: {
    // Navigation
    home: 'Accueil',
    create: 'Créer',
    analytics: 'Analyses',
    settings: 'Paramètres',
    
    // Home Screen
    appName: 'AI Recaps Maker',
    tagline: 'Créateur de Résumés Vidéo IA',
    subtitle: 'La plateforme la plus avancée pour créer des résumés IA avec Google Gemini',
    getStarted: 'Commencer',
    learnMore: 'En Savoir Plus',
    
    // Create Wizard
    createRecap: 'Créer un Résumé Intelligent',
    step: 'Étape',
    of: 'sur',
    continue: 'Continuer',
    back: 'Retour',
    finish: 'Terminer',
    
    // Step titles
    step1Title: 'Saisie du Script',
    step2Title: 'Traitement Audio',
    step3Title: 'Analyse Vidéo',
    step4Title: 'Alignement Intelligent',
    step5Title: 'Rendu Final',
    
    // Common
    loading: 'Chargement...',
    save: 'Enregistrer',
    cancel: 'Annuler',
    delete: 'Supprimer',
    edit: 'Modifier',
    done: 'Terminé',
    
    // Credits
    credits: 'Crédits',
    earnCredits: 'Gagner un Crédit',
    watchAd: 'Regarder une Pub',
    insufficientCredits: 'Crédits Insuffisants',
    
    // Auth
    signIn: 'Se Connecter',
    signUp: 'S\'inscrire',
    email: 'Email',
    password: 'Mot de Passe',
    forgotPassword: 'Mot de Passe Oublié?',
    continueWithGoogle: 'Continuer avec Google',
    continueAsGuest: 'Continuer comme Invité',
    
    // Errors
    error: 'Erreur',
    tryAgain: 'Réessayer',
    somethingWentWrong: 'Quelque chose s\'est mal passé',
  },
  
  de: {
    // Navigation
    home: 'Startseite',
    create: 'Erstellen',
    analytics: 'Analysen',
    settings: 'Einstellungen',
    
    // Home Screen
    appName: 'AI Recaps Maker',
    tagline: 'KI-Video-Zusammenfassungs-Ersteller',
    subtitle: 'Die fortschrittlichste Plattform zum Erstellen von KI-Zusammenfassungen mit Google Gemini',
    getStarted: 'Loslegen',
    learnMore: 'Mehr Erfahren',
    
    // Create Wizard
    createRecap: 'Intelligente Zusammenfassung Erstellen',
    step: 'Schritt',
    of: 'von',
    continue: 'Weiter',
    back: 'Zurück',
    finish: 'Fertig',
    
    // Step titles
    step1Title: 'Skripteingabe',
    step2Title: 'Audioverarbeitung',
    step3Title: 'Videoanalyse',
    step4Title: 'Intelligente Ausrichtung',
    step5Title: 'Endgültiges Rendering',
    
    // Common
    loading: 'Lädt...',
    save: 'Speichern',
    cancel: 'Abbrechen',
    delete: 'Löschen',
    edit: 'Bearbeiten',
    done: 'Fertig',
    
    // Credits
    credits: 'Guthaben',
    earnCredits: 'Guthaben Verdienen',
    watchAd: 'Werbung Ansehen',
    insufficientCredits: 'Unzureichendes Guthaben',
    
    // Auth
    signIn: 'Anmelden',
    signUp: 'Registrieren',
    email: 'E-Mail',
    password: 'Passwort',
    forgotPassword: 'Passwort Vergessen?',
    continueWithGoogle: 'Mit Google Fortfahren',
    continueAsGuest: 'Als Gast Fortfahren',
    
    // Errors
    error: 'Fehler',
    tryAgain: 'Erneut Versuchen',
    somethingWentWrong: 'Etwas ist schief gelaufen',
  },
  
  ru: {
    // Navigation
    home: 'Главная',
    create: 'Создать',
    analytics: 'Аналитика',
    settings: 'Настройки',
    
    // Home Screen
    appName: 'AI Recaps Maker',
    tagline: 'Умный Создатель Видео-Резюме',
    subtitle: 'Самая передовая платформа для создания резюме с помощью ИИ Google Gemini',
    getStarted: 'Начать',
    learnMore: 'Узнать Больше',
    
    // Create Wizard
    createRecap: 'Создать Умное Резюме',
    step: 'Шаг',
    of: 'из',
    continue: 'Продолжить',
    back: 'Назад',
    finish: 'Завершить',
    
    // Step titles
    step1Title: 'Ввод Сценария',
    step2Title: 'Обработка Аудио',
    step3Title: 'Анализ Видео',
    step4Title: 'Умное Выравнивание',
    step5Title: 'Финальный Рендеринг',
    
    // Common
    loading: 'Загрузка...',
    save: 'Сохранить',
    cancel: 'Отмена',
    delete: 'Удалить',
    edit: 'Редактировать',
    done: 'Готово',
    
    // Credits
    credits: 'Кредиты',
    earnCredits: 'Заработать Кредит',
    watchAd: 'Посмотреть Рекламу',
    insufficientCredits: 'Недостаточно Кредитов',
    
    // Auth
    signIn: 'Войти',
    signUp: 'Зарегистрироваться',
    email: 'Email',
    password: 'Пароль',
    forgotPassword: 'Забыли Пароль?',
    continueWithGoogle: 'Продолжить с Google',
    continueAsGuest: 'Продолжить как Гость',
    
    // Errors
    error: 'Ошибка',
    tryAgain: 'Попробовать Снова',
    somethingWentWrong: 'Что-то пошло не так',
  },
  
  ja: {
    // Navigation
    home: 'ホーム',
    create: '作成',
    analytics: '分析',
    settings: '設定',
    
    // Home Screen
    appName: 'AI Recaps Maker',
    tagline: 'AIビデオ要約メーカー',
    subtitle: 'Google Geminiを使用してAI要約を作成する最も高度なプラットフォーム',
    getStarted: '始める',
    learnMore: '詳細を見る',
    
    // Create Wizard
    createRecap: 'スマート要約を作成',
    step: 'ステップ',
    of: '/',
    continue: '続ける',
    back: '戻る',
    finish: '完了',
    
    // Step titles
    step1Title: 'スクリプト入力',
    step2Title: 'オーディオ処理',
    step3Title: 'ビデオ分析',
    step4Title: 'スマート調整',
    step5Title: '最終レンダリング',
    
    // Common
    loading: '読み込み中...',
    save: '保存',
    cancel: 'キャンセル',
    delete: '削除',
    edit: '編集',
    done: '完了',
    
    // Credits
    credits: 'クレジット',
    earnCredits: 'クレジットを獲得',
    watchAd: '広告を見る',
    insufficientCredits: 'クレジット不足',
    
    // Auth
    signIn: 'ログイン',
    signUp: '登録',
    email: 'メール',
    password: 'パスワード',
    forgotPassword: 'パスワードを忘れた？',
    continueWithGoogle: 'Googleで続ける',
    continueAsGuest: 'ゲストとして続ける',
    
    // Errors
    error: 'エラー',
    tryAgain: '再試行',
    somethingWentWrong: '問題が発生しました',
  },
  
  zh: {
    // Navigation
    home: '主页',
    create: '创建',
    analytics: '分析',
    settings: '设置',
    
    // Home Screen
    appName: 'AI Recaps Maker',
    tagline: '智能视频摘要制作器',
    subtitle: '使用 Google Gemini 创建 AI 摘要的最先进平台',
    getStarted: '开始',
    learnMore: '了解更多',
    
    // Create Wizard
    createRecap: '创建智能摘要',
    step: '步骤',
    of: '/',
    continue: '继续',
    back: '返回',
    finish: '完成',
    
    // Step titles
    step1Title: '脚本输入',
    step2Title: '音频处理',
    step3Title: '视频分析',
    step4Title: '智能对齐',
    step5Title: '最终渲染',
    
    // Common
    loading: '加载中...',
    save: '保存',
    cancel: '取消',
    delete: '删除',
    edit: '编辑',
    done: '完成',
    
    // Credits
    credits: '积分',
    earnCredits: '赚取积分',
    watchAd: '观看广告',
    insufficientCredits: '积分不足',
    
    // Auth
    signIn: '登录',
    signUp: '注册',
    email: '邮箱',
    password: '密码',
    forgotPassword: '忘记密码？',
    continueWithGoogle: '使用 Google 继续',
    continueAsGuest: '以访客身份继续',
    
    // Errors
    error: '错误',
    tryAgain: '重试',
    somethingWentWrong: '出了点问题',
  },
  
  pt: {
    // Navigation
    home: 'Início',
    create: 'Criar',
    analytics: 'Análises',
    settings: 'Configurações',
    
    // Home Screen
    appName: 'AI Recaps Maker',
    tagline: 'Criador de Resumos de Vídeo IA',
    subtitle: 'A plataforma mais avançada para criar resumos com IA usando Google Gemini',
    getStarted: 'Começar',
    learnMore: 'Saber Mais',
    
    // Create Wizard
    createRecap: 'Criar Resumo Inteligente',
    step: 'Passo',
    of: 'de',
    continue: 'Continuar',
    back: 'Voltar',
    finish: 'Finalizar',
    
    // Step titles
    step1Title: 'Entrada de Script',
    step2Title: 'Processamento de Áudio',
    step3Title: 'Análise de Vídeo',
    step4Title: 'Alinhamento Inteligente',
    step5Title: 'Renderização Final',
    
    // Common
    loading: 'Carregando...',
    save: 'Salvar',
    cancel: 'Cancelar',
    delete: 'Excluir',
    edit: 'Editar',
    done: 'Concluído',
    
    // Credits
    credits: 'Créditos',
    earnCredits: 'Ganhar Crédito',
    watchAd: 'Assistir Anúncio',
    insufficientCredits: 'Créditos Insuficientes',
    
    // Auth
    signIn: 'Entrar',
    signUp: 'Cadastrar',
    email: 'Email',
    password: 'Senha',
    forgotPassword: 'Esqueceu a Senha?',
    continueWithGoogle: 'Continuar com Google',
    continueAsGuest: 'Continuar como Convidado',
    
    // Errors
    error: 'Erro',
    tryAgain: 'Tentar Novamente',
    somethingWentWrong: 'Algo deu errado',
  },
  
  hi: {
    // Navigation
    home: 'होम',
    create: 'बनाएँ',
    analytics: 'विश्लेषण',
    settings: 'सेटिंग्स',
    
    // Home Screen
    appName: 'AI Recaps Maker',
    tagline: 'एआई वीडियो रीकैप मेकर',
    subtitle: 'Google Gemini के साथ एआई-संचालित रीकैप बनाने के लिए सबसे उन्नत प्लेटफॉर्म',
    getStarted: 'शुरू करें',
    learnMore: 'और जानें',
    
    // Create Wizard
    createRecap: 'स्मार्ट रीकैप बनाएँ',
    step: 'चरण',
    of: 'का',
    continue: 'जारी रखें',
    back: 'वापस',
    finish: 'समाप्त',
    
    // Step titles
    step1Title: 'स्क्रिप्ट इनपुट',
    step2Title: 'ऑडियो प्रोसेसिंग',
    step3Title: 'वीडियो विश्लेषण',
    step4Title: 'स्मार्ट संरेखण',
    step5Title: 'अंतिम रेंडरिंग',
    
    // Common
    loading: 'लोड हो रहा है...',
    save: 'सहेजें',
    cancel: 'रद्द करें',
    delete: 'हटाएँ',
    edit: 'संपादित करें',
    done: 'पूर्ण',
    
    // Credits
    credits: 'क्रेडिट',
    earnCredits: 'क्रेडिट कमाएँ',
    watchAd: 'विज्ञापन देखें',
    insufficientCredits: 'अपर्याप्त क्रेडिट',
    
    // Auth
    signIn: 'साइन इन करें',
    signUp: 'साइन अप करें',
    email: 'ईमेल',
    password: 'पासवर्ड',
    forgotPassword: 'पासवर्ड भूल गए?',
    continueWithGoogle: 'Google के साथ जारी रखें',
    continueAsGuest: 'अतिथि के रूप में जारी रखें',
    
    // Errors
    error: 'त्रुटि',
    tryAgain: 'पुनः प्रयास करें',
    somethingWentWrong: 'कुछ गलत हो गया',
  },
  
  // ===== 7 POPULAR LANGUAGES =====
  
  ko: {
    // Navigation
    home: '홈',
    create: '만들기',
    analytics: '분석',
    settings: '설정',
    
    // Home Screen
    appName: 'AI Recaps Maker',
    tagline: 'AI 비디오 요약 메이커',
    subtitle: 'Google Gemini로 AI 기반 요약을 만드는 가장 발전된 플랫폼',
    getStarted: '시작하기',
    learnMore: '자세히 보기',
    
    // Create Wizard
    createRecap: '스마트 요약 만들기',
    step: '단계',
    of: '/',
    continue: '계속',
    back: '뒤로',
    finish: '완료',
    
    // Step titles
    step1Title: '스크립트 입력',
    step2Title: '오디오 처리',
    step3Title: '비디오 분석',
    step4Title: '스마트 정렬',
    step5Title: '최종 렌더링',
    
    // Common
    loading: '로딩 중...',
    save: '저장',
    cancel: '취소',
    delete: '삭제',
    edit: '편집',
    done: '완료',
    
    // Credits
    credits: '크레딧',
    earnCredits: '크레딧 획득',
    watchAd: '광고 보기',
    insufficientCredits: '크레딧 부족',
    
    // Auth
    signIn: '로그인',
    signUp: '가입',
    email: '이메일',
    password: '비밀번호',
    forgotPassword: '비밀번호를 잊으셨나요?',
    continueWithGoogle: 'Google로 계속',
    continueAsGuest: '게스트로 계속',
    
    // Errors
    error: '오류',
    tryAgain: '다시 시도',
    somethingWentWrong: '문제가 발생했습니다',
  },
  
  it: {
    // Navigation
    home: 'Home',
    create: 'Crea',
    analytics: 'Analisi',
    settings: 'Impostazioni',
    
    // Home Screen
    appName: 'AI Recaps Maker',
    tagline: 'Creatore di Riepiloghi Video IA',
    subtitle: 'La piattaforma più avanzata per creare riepiloghi IA con Google Gemini',
    getStarted: 'Inizia',
    learnMore: 'Scopri di Più',
    
    // Create Wizard
    createRecap: 'Crea Riepilogo Intelligente',
    step: 'Passo',
    of: 'di',
    continue: 'Continua',
    back: 'Indietro',
    finish: 'Fine',
    
    // Step titles
    step1Title: 'Input Script',
    step2Title: 'Elaborazione Audio',
    step3Title: 'Analisi Video',
    step4Title: 'Allineamento Intelligente',
    step5Title: 'Rendering Finale',
    
    // Common
    loading: 'Caricamento...',
    save: 'Salva',
    cancel: 'Annulla',
    delete: 'Elimina',
    edit: 'Modifica',
    done: 'Fatto',
    
    // Credits
    credits: 'Crediti',
    earnCredits: 'Guadagna Credito',
    watchAd: 'Guarda Annuncio',
    insufficientCredits: 'Crediti Insufficienti',
    
    // Auth
    signIn: 'Accedi',
    signUp: 'Registrati',
    email: 'Email',
    password: 'Password',
    forgotPassword: 'Password Dimenticata?',
    continueWithGoogle: 'Continua con Google',
    continueAsGuest: 'Continua come Ospite',
    
    // Errors
    error: 'Errore',
    tryAgain: 'Riprova',
    somethingWentWrong: 'Qualcosa è andato storto',
  },
  
  tr: {
    // Navigation
    home: 'Ana Sayfa',
    create: 'Oluştur',
    analytics: 'Analiz',
    settings: 'Ayarlar',
    
    // Home Screen
    appName: 'AI Recaps Maker',
    tagline: 'Yapay Zeka Video Özeti Oluşturucu',
    subtitle: 'Google Gemini ile yapay zeka destekli özetler oluşturmak için en gelişmiş platform',
    getStarted: 'Başlayın',
    learnMore: 'Daha Fazla Bilgi',
    
    // Create Wizard
    createRecap: 'Akıllı Özet Oluştur',
    step: 'Adım',
    of: '/',
    continue: 'Devam',
    back: 'Geri',
    finish: 'Bitir',
    
    // Step titles
    step1Title: 'Senaryo Girişi',
    step2Title: 'Ses İşleme',
    step3Title: 'Video Analizi',
    step4Title: 'Akıllı Hizalama',
    step5Title: 'Son İşleme',
    
    // Common
    loading: 'Yükleniyor...',
    save: 'Kaydet',
    cancel: 'İptal',
    delete: 'Sil',
    edit: 'Düzenle',
    done: 'Bitti',
    
    // Credits
    credits: 'Kredi',
    earnCredits: 'Kredi Kazan',
    watchAd: 'Reklam İzle',
    insufficientCredits: 'Yetersiz Kredi',
    
    // Auth
    signIn: 'Giriş Yap',
    signUp: 'Kayıt Ol',
    email: 'E-posta',
    password: 'Şifre',
    forgotPassword: 'Şifremi Unuttum?',
    continueWithGoogle: 'Google ile Devam Et',
    continueAsGuest: 'Misafir Olarak Devam Et',
    
    // Errors
    error: 'Hata',
    tryAgain: 'Tekrar Dene',
    somethingWentWrong: 'Bir şeyler yanlış gitti',
  },
  
  vi: {
    // Navigation
    home: 'Trang chủ',
    create: 'Tạo',
    analytics: 'Phân tích',
    settings: 'Cài đặt',
    
    // Home Screen
    appName: 'AI Recaps Maker',
    tagline: 'Công cụ Tạo Video Tóm tắt AI',
    subtitle: 'Nền tảng tiên tiến nhất để tạo tóm tắt AI với Google Gemini',
    getStarted: 'Bắt đầu',
    learnMore: 'Tìm hiểu thêm',
    
    // Create Wizard
    createRecap: 'Tạo Tóm tắt Thông minh',
    step: 'Bước',
    of: '/',
    continue: 'Tiếp tục',
    back: 'Quay lại',
    finish: 'Hoàn thành',
    
    // Step titles
    step1Title: 'Nhập Script',
    step2Title: 'Xử lý Âm thanh',
    step3Title: 'Phân tích Video',
    step4Title: 'Căn chỉnh Thông minh',
    step5Title: 'Render Cuối cùng',
    
    // Common
    loading: 'Đang tải...',
    save: 'Lưu',
    cancel: 'Hủy',
    delete: 'Xóa',
    edit: 'Chỉnh sửa',
    done: 'Xong',
    
    // Credits
    credits: 'Tín dụng',
    earnCredits: 'Kiếm Tín dụng',
    watchAd: 'Xem Quảng cáo',
    insufficientCredits: 'Không đủ Tín dụng',
    
    // Auth
    signIn: 'Đăng nhập',
    signUp: 'Đăng ký',
    email: 'Email',
    password: 'Mật khẩu',
    forgotPassword: 'Quên Mật khẩu?',
    continueWithGoogle: 'Tiếp tục với Google',
    continueAsGuest: 'Tiếp tục với tư cách Khách',
    
    // Errors
    error: 'Lỗi',
    tryAgain: 'Thử lại',
    somethingWentWrong: 'Đã xảy ra lỗi',
  },
  
  th: {
    // Navigation
    home: 'หน้าแรก',
    create: 'สร้าง',
    analytics: 'การวิเคราะห์',
    settings: 'การตั้งค่า',
    
    // Home Screen
    appName: 'AI Recaps Maker',
    tagline: 'เครื่องมือสร้างวิดีโอสรุป AI',
    subtitle: 'แพลตฟอร์มที่ทันสมัยที่สุดในการสร้างสรุป AI ด้วย Google Gemini',
    getStarted: 'เริ่มต้น',
    learnMore: 'เรียนรู้เพิ่มเติม',
    
    // Create Wizard
    createRecap: 'สร้างสรุปอัจฉริยะ',
    step: 'ขั้นตอน',
    of: '/',
    continue: 'ดำเนินการต่อ',
    back: 'ย้อนกลับ',
    finish: 'เสร็จสิ้น',
    
    // Step titles
    step1Title: 'ป้อนสคริปต์',
    step2Title: 'ประมวลผลเสียง',
    step3Title: 'วิเคราะห์วิดีโอ',
    step4Title: 'จัดตำแหน่งอัจฉริยะ',
    step5Title: 'เรนเดอร์ขั้นสุดท้าย',
    
    // Common
    loading: 'กำลังโหลด...',
    save: 'บันทึก',
    cancel: 'ยกเลิก',
    delete: 'ลบ',
    edit: 'แก้ไข',
    done: 'เสร็จสิ้น',
    
    // Credits
    credits: 'เครดิต',
    earnCredits: 'รับเครดิต',
    watchAd: 'ดูโฆษณา',
    insufficientCredits: 'เครดิตไม่เพียงพอ',
    
    // Auth
    signIn: 'เข้าสู่ระบบ',
    signUp: 'ลงทะเบียน',
    email: 'อีเมล',
    password: 'รหัสผ่าน',
    forgotPassword: 'ลืมรหัสผ่าน?',
    continueWithGoogle: 'ดำเนินการต่อด้วย Google',
    continueAsGuest: 'ดำเนินการต่อในฐานะแขก',
    
    // Errors
    error: 'ข้อผิดพลาด',
    tryAgain: 'ลองอีกครั้ง',
    somethingWentWrong: 'มีบางอย่างผิดพลาด',
  },
  
  pl: {
    // Navigation
    home: 'Strona główna',
    create: 'Utwórz',
    analytics: 'Analityka',
    settings: 'Ustawienia',
    
    // Home Screen
    appName: 'AI Recaps Maker',
    tagline: 'Kreator Podsumowań Wideo AI',
    subtitle: 'Najbardziej zaawansowana platforma do tworzenia podsumowań AI z Google Gemini',
    getStarted: 'Rozpocznij',
    learnMore: 'Dowiedz się więcej',
    
    // Create Wizard
    createRecap: 'Utwórz Inteligentne Podsumowanie',
    step: 'Krok',
    of: 'z',
    continue: 'Kontynuuj',
    back: 'Wstecz',
    finish: 'Zakończ',
    
    // Step titles
    step1Title: 'Wprowadzenie Skryptu',
    step2Title: 'Przetwarzanie Audio',
    step3Title: 'Analiza Wideo',
    step4Title: 'Inteligentne Dopasowanie',
    step5Title: 'Ostateczne Renderowanie',
    
    // Common
    loading: 'Ładowanie...',
    save: 'Zapisz',
    cancel: 'Anuluj',
    delete: 'Usuń',
    edit: 'Edytuj',
    done: 'Gotowe',
    
    // Credits
    credits: 'Kredyty',
    earnCredits: 'Zdobądź Kredyt',
    watchAd: 'Obejrzyj Reklamę',
    insufficientCredits: 'Niewystarczające Kredyty',
    
    // Auth
    signIn: 'Zaloguj się',
    signUp: 'Zarejestruj się',
    email: 'Email',
    password: 'Hasło',
    forgotPassword: 'Zapomniałeś hasła?',
    continueWithGoogle: 'Kontynuuj z Google',
    continueAsGuest: 'Kontynuuj jako Gość',
    
    // Errors
    error: 'Błąd',
    tryAgain: 'Spróbuj ponownie',
    somethingWentWrong: 'Coś poszło nie tak',
  },
  
  nl: {
    // Navigation
    home: 'Home',
    create: 'Maken',
    analytics: 'Analyse',
    settings: 'Instellingen',
    
    // Home Screen
    appName: 'AI Recaps Maker',
    tagline: 'AI Video Samenvattingsmaker',
    subtitle: 'Het meest geavanceerde platform voor het maken van AI-samenvattingen met Google Gemini',
    getStarted: 'Beginnen',
    learnMore: 'Meer Informatie',
    
    // Create Wizard
    createRecap: 'Maak Slimme Samenvatting',
    step: 'Stap',
    of: 'van',
    continue: 'Doorgaan',
    back: 'Terug',
    finish: 'Voltooien',
    
    // Step titles
    step1Title: 'Script Invoer',
    step2Title: 'Audio Verwerking',
    step3Title: 'Video Analyse',
    step4Title: 'Slimme Uitlijning',
    step5Title: 'Definitieve Rendering',
    
    // Common
    loading: 'Laden...',
    save: 'Opslaan',
    cancel: 'Annuleren',
    delete: 'Verwijderen',
    edit: 'Bewerken',
    done: 'Klaar',
    
    // Credits
    credits: 'Credits',
    earnCredits: 'Credits Verdienen',
    watchAd: 'Bekijk Advertentie',
    insufficientCredits: 'Onvoldoende Credits',
    
    // Auth
    signIn: 'Inloggen',
    signUp: 'Registreren',
    email: 'Email',
    password: 'Wachtwoord',
    forgotPassword: 'Wachtwoord Vergeten?',
    continueWithGoogle: 'Doorgaan met Google',
    continueAsGuest: 'Doorgaan als Gast',
    
    // Errors
    error: 'Fout',
    tryAgain: 'Probeer Opnieuw',
    somethingWentWrong: 'Er ging iets mis',
  },
  
  // ===== 7 LESS POPULAR LANGUAGES =====
  
  sv: {
    // Navigation
    home: 'Hem',
    create: 'Skapa',
    analytics: 'Analys',
    settings: 'Inställningar',
    
    // Home Screen
    appName: 'AI Recaps Maker',
    tagline: 'AI-videoresuméskapare',
    subtitle: 'Den mest avancerade plattformen för att skapa AI-resuméer med Google Gemini',
    getStarted: 'Kom igång',
    learnMore: 'Läs mer',
    
    // Create Wizard
    createRecap: 'Skapa Smart Resumé',
    step: 'Steg',
    of: 'av',
    continue: 'Fortsätt',
    back: 'Tillbaka',
    finish: 'Slutför',
    
    // Step titles
    step1Title: 'Skriptinmatning',
    step2Title: 'Ljudbehandling',
    step3Title: 'Videoanalys',
    step4Title: 'Smart Justering',
    step5Title: 'Slutgiltig Rendering',
    
    // Common
    loading: 'Laddar...',
    save: 'Spara',
    cancel: 'Avbryt',
    delete: 'Ta bort',
    edit: 'Redigera',
    done: 'Klar',
    
    // Credits
    credits: 'Krediter',
    earnCredits: 'Tjäna Kredit',
    watchAd: 'Se Annons',
    insufficientCredits: 'Otillräckliga Krediter',
    
    // Auth
    signIn: 'Logga in',
    signUp: 'Registrera',
    email: 'E-post',
    password: 'Lösenord',
    forgotPassword: 'Glömt Lösenord?',
    continueWithGoogle: 'Fortsätt med Google',
    continueAsGuest: 'Fortsätt som Gäst',
    
    // Errors
    error: 'Fel',
    tryAgain: 'Försök igen',
    somethingWentWrong: 'Något gick fel',
  },
  
  ro: {
    // Navigation
    home: 'Acasă',
    create: 'Creează',
    analytics: 'Analiză',
    settings: 'Setări',
    
    // Home Screen
    appName: 'AI Recaps Maker',
    tagline: 'Creator de Rezumate Video AI',
    subtitle: 'Cea mai avansată platformă pentru crearea de rezumate AI cu Google Gemini',
    getStarted: 'Începe',
    learnMore: 'Află mai multe',
    
    // Create Wizard
    createRecap: 'Creează Rezumat Inteligent',
    step: 'Pasul',
    of: 'din',
    continue: 'Continuă',
    back: 'Înapoi',
    finish: 'Termină',
    
    // Step titles
    step1Title: 'Introducere Script',
    step2Title: 'Procesare Audio',
    step3Title: 'Analiză Video',
    step4Title: 'Aliniere Inteligentă',
    step5Title: 'Redare Finală',
    
    // Common
    loading: 'Se încarcă...',
    save: 'Salvează',
    cancel: 'Anulează',
    delete: 'Șterge',
    edit: 'Editează',
    done: 'Terminat',
    
    // Credits
    credits: 'Credite',
    earnCredits: 'Câștigă Credit',
    watchAd: 'Vizionează Reclamă',
    insufficientCredits: 'Credite Insuficiente',
    
    // Auth
    signIn: 'Autentificare',
    signUp: 'Înregistrare',
    email: 'Email',
    password: 'Parolă',
    forgotPassword: 'Ai uitat parola?',
    continueWithGoogle: 'Continuă cu Google',
    continueAsGuest: 'Continuă ca Invitat',
    
    // Errors
    error: 'Eroare',
    tryAgain: 'Încearcă din nou',
    somethingWentWrong: 'Ceva nu a mers bine',
  },
  
  cs: {
    // Navigation
    home: 'Domů',
    create: 'Vytvořit',
    analytics: 'Analytika',
    settings: 'Nastavení',
    
    // Home Screen
    appName: 'AI Recaps Maker',
    tagline: 'Tvůrce AI Video Shrnutí',
    subtitle: 'Nejpokročilejší platforma pro vytváření AI shrnutí s Google Gemini',
    getStarted: 'Začít',
    learnMore: 'Zjistit více',
    
    // Create Wizard
    createRecap: 'Vytvořit Inteligentní Shrnutí',
    step: 'Krok',
    of: 'z',
    continue: 'Pokračovat',
    back: 'Zpět',
    finish: 'Dokončit',
    
    // Step titles
    step1Title: 'Zadání Skriptu',
    step2Title: 'Zpracování Audia',
    step3Title: 'Analýza Videa',
    step4Title: 'Inteligentní Zarovnání',
    step5Title: 'Konečné Vykreslení',
    
    // Common
    loading: 'Načítání...',
    save: 'Uložit',
    cancel: 'Zrušit',
    delete: 'Smazat',
    edit: 'Upravit',
    done: 'Hotovo',
    
    // Credits
    credits: 'Kredity',
    earnCredits: 'Získat Kredit',
    watchAd: 'Sledovat Reklamu',
    insufficientCredits: 'Nedostatečné Kredity',
    
    // Auth
    signIn: 'Přihlásit se',
    signUp: 'Registrovat se',
    email: 'Email',
    password: 'Heslo',
    forgotPassword: 'Zapomenuté Heslo?',
    continueWithGoogle: 'Pokračovat s Google',
    continueAsGuest: 'Pokračovat jako Host',
    
    // Errors
    error: 'Chyba',
    tryAgain: 'Zkusit znovu',
    somethingWentWrong: 'Něco se pokazilo',
  },
  
  el: {
    // Navigation
    home: 'Αρχική',
    create: 'Δημιουργία',
    analytics: 'Ανάλυση',
    settings: 'Ρυθμίσεις',
    
    // Home Screen
    appName: 'AI Recaps Maker',
    tagline: 'Δημιουργός Περιλήψεων Βίντεο AI',
    subtitle: 'Η πιο προηγμένη πλατφόρμα για τη δημιουργία περιλήψεων AI με Google Gemini',
    getStarted: 'Ξεκινήστε',
    learnMore: 'Μάθετε Περισσότερα',
    
    // Create Wizard
    createRecap: 'Δημιουργία Έξυπνης Περίληψης',
    step: 'Βήμα',
    of: 'από',
    continue: 'Συνέχεια',
    back: 'Πίσω',
    finish: 'Τέλος',
    
    // Step titles
    step1Title: 'Εισαγωγή Σεναρίου',
    step2Title: 'Επεξεργασία Ήχου',
    step3Title: 'Ανάλυση Βίντεο',
    step4Title: 'Έξυπνη Ευθυγράμμιση',
    step5Title: 'Τελική Απόδοση',
    
    // Common
    loading: 'Φόρτωση...',
    save: 'Αποθήκευση',
    cancel: 'Ακύρωση',
    delete: 'Διαγραφή',
    edit: 'Επεξεργασία',
    done: 'Τέλος',
    
    // Credits
    credits: 'Πιστώσεις',
    earnCredits: 'Κερδίστε Πίστωση',
    watchAd: 'Παρακολουθήστε Διαφήμιση',
    insufficientCredits: 'Ανεπαρκείς Πιστώσεις',
    
    // Auth
    signIn: 'Σύνδεση',
    signUp: 'Εγγραφή',
    email: 'Email',
    password: 'Κωδικός',
    forgotPassword: 'Ξεχάσατε τον Κωδικό;',
    continueWithGoogle: 'Συνέχεια με Google',
    continueAsGuest: 'Συνέχεια ως Επισκέπτης',
    
    // Errors
    error: 'Σφάλμα',
    tryAgain: 'Προσπαθήστε ξανά',
    somethingWentWrong: 'Κάτι πήγε στραβά',
  },
  
  hu: {
    // Navigation
    home: 'Főoldal',
    create: 'Létrehozás',
    analytics: 'Elemzés',
    settings: 'Beállítások',
    
    // Home Screen
    appName: 'AI Recaps Maker',
    tagline: 'AI Videó Összefoglaló Készítő',
    subtitle: 'A legfejlettebb platform AI összefoglalók készítéséhez Google Gemini-vel',
    getStarted: 'Kezdés',
    learnMore: 'További Információ',
    
    // Create Wizard
    createRecap: 'Intelligens Összefoglaló Készítése',
    step: 'Lépés',
    of: '/',
    continue: 'Folytatás',
    back: 'Vissza',
    finish: 'Befejezés',
    
    // Step titles
    step1Title: 'Szkript Bevitel',
    step2Title: 'Hang Feldolgozás',
    step3Title: 'Videó Elemzés',
    step4Title: 'Intelligens Igazítás',
    step5Title: 'Végső Renderelés',
    
    // Common
    loading: 'Betöltés...',
    save: 'Mentés',
    cancel: 'Mégse',
    delete: 'Törlés',
    edit: 'Szerkesztés',
    done: 'Kész',
    
    // Credits
    credits: 'Kreditek',
    earnCredits: 'Kredit Szerzés',
    watchAd: 'Hirdetés Megtekintése',
    insufficientCredits: 'Elégtelen Kreditek',
    
    // Auth
    signIn: 'Bejelentkezés',
    signUp: 'Regisztráció',
    email: 'Email',
    password: 'Jelszó',
    forgotPassword: 'Elfelejtett Jelszó?',
    continueWithGoogle: 'Folytatás Google-lal',
    continueAsGuest: 'Folytatás Vendégként',
    
    // Errors
    error: 'Hiba',
    tryAgain: 'Próbálja újra',
    somethingWentWrong: 'Valami hiba történt',
  },
  
  fi: {
    // Navigation
    home: 'Koti',
    create: 'Luo',
    analytics: 'Analytiikka',
    settings: 'Asetukset',
    
    // Home Screen
    appName: 'AI Recaps Maker',
    tagline: 'AI-videoyhteenvedon Luoja',
    subtitle: 'Edistynein alusta AI-yhteenvetojen luomiseen Google Geminin avulla',
    getStarted: 'Aloita',
    learnMore: 'Lue Lisää',
    
    // Create Wizard
    createRecap: 'Luo Älykäs Yhteenveto',
    step: 'Vaihe',
    of: '/',
    continue: 'Jatka',
    back: 'Takaisin',
    finish: 'Valmis',
    
    // Step titles
    step1Title: 'Käsikirjoituksen Syöttö',
    step2Title: 'Äänen Käsittely',
    step3Title: 'Videon Analyysi',
    step4Title: 'Älykäs Kohdistus',
    step5Title: 'Lopullinen Renderöinti',
    
    // Common
    loading: 'Ladataan...',
    save: 'Tallenna',
    cancel: 'Peruuta',
    delete: 'Poista',
    edit: 'Muokkaa',
    done: 'Valmis',
    
    // Credits
    credits: 'Krediitit',
    earnCredits: 'Ansaitse Krediitti',
    watchAd: 'Katso Mainos',
    insufficientCredits: 'Riittämättömät Krediitit',
    
    // Auth
    signIn: 'Kirjaudu Sisään',
    signUp: 'Rekisteröidy',
    email: 'Sähköposti',
    password: 'Salasana',
    forgotPassword: 'Unohditko Salasanan?',
    continueWithGoogle: 'Jatka Googlella',
    continueAsGuest: 'Jatka Vieraana',
    
    // Errors
    error: 'Virhe',
    tryAgain: 'Yritä Uudelleen',
    somethingWentWrong: 'Jokin meni pieleen',
  },
  
  da: {
    // Navigation
    home: 'Hjem',
    create: 'Opret',
    analytics: 'Analyse',
    settings: 'Indstillinger',
    
    // Home Screen
    appName: 'AI Recaps Maker',
    tagline: 'AI-videoresumé Creator',
    subtitle: 'Den mest avancerede platform til at skabe AI-resuméer med Google Gemini',
    getStarted: 'Kom i gang',
    learnMore: 'Læs mere',
    
    // Create Wizard
    createRecap: 'Opret Smart Resumé',
    step: 'Trin',
    of: 'af',
    continue: 'Fortsæt',
    back: 'Tilbage',
    finish: 'Afslut',
    
    // Step titles
    step1Title: 'Scriptinput',
    step2Title: 'Lydbehandling',
    step3Title: 'Videoanalyse',
    step4Title: 'Smart Justering',
    step5Title: 'Endelig Rendering',
    
    // Common
    loading: 'Indlæser...',
    save: 'Gem',
    cancel: 'Annuller',
    delete: 'Slet',
    edit: 'Rediger',
    done: 'Færdig',
    
    // Credits
    credits: 'Kreditter',
    earnCredits: 'Tjen Kredit',
    watchAd: 'Se Annonce',
    insufficientCredits: 'Utilstrækkelige Kreditter',
    
    // Auth
    signIn: 'Log ind',
    signUp: 'Tilmeld',
    email: 'Email',
    password: 'Adgangskode',
    forgotPassword: 'Glemt Adgangskode?',
    continueWithGoogle: 'Fortsæt med Google',
    continueAsGuest: 'Fortsæt som Gæst',
    
    // Errors
    error: 'Fejl',
    tryAgain: 'Prøv igen',
    somethingWentWrong: 'Noget gik galt',
  },
  
  // ===== 7 RARE LANGUAGES =====
  
  no: {
    // Navigation
    home: 'Hjem',
    create: 'Opprett',
    analytics: 'Analyse',
    settings: 'Innstillinger',
    
    // Home Screen
    appName: 'AI Recaps Maker',
    tagline: 'AI-videoresymé Skaper',
    subtitle: 'Den mest avanserte plattformen for å lage AI-resyméer med Google Gemini',
    getStarted: 'Kom i gang',
    learnMore: 'Lær mer',
    
    // Create Wizard
    createRecap: 'Opprett Smart Resymé',
    step: 'Trinn',
    of: 'av',
    continue: 'Fortsett',
    back: 'Tilbake',
    finish: 'Fullfør',
    
    // Step titles
    step1Title: 'Scriptinngang',
    step2Title: 'Lydbehandling',
    step3Title: 'Videoanalyse',
    step4Title: 'Smart Justering',
    step5Title: 'Endelig Gjengivelse',
    
    // Common
    loading: 'Laster...',
    save: 'Lagre',
    cancel: 'Avbryt',
    delete: 'Slett',
    edit: 'Rediger',
    done: 'Ferdig',
    
    // Credits
    credits: 'Kreditter',
    earnCredits: 'Tjen Kreditt',
    watchAd: 'Se Annonse',
    insufficientCredits: 'Utilstrekkelige Kreditter',
    
    // Auth
    signIn: 'Logg inn',
    signUp: 'Registrer deg',
    email: 'E-post',
    password: 'Passord',
    forgotPassword: 'Glemt Passord?',
    continueWithGoogle: 'Fortsett med Google',
    continueAsGuest: 'Fortsett som Gjest',
    
    // Errors
    error: 'Feil',
    tryAgain: 'Prøv igjen',
    somethingWentWrong: 'Noe gikk galt',
  },
  
  sk: {
    // Navigation
    home: 'Domov',
    create: 'Vytvoriť',
    analytics: 'Analytika',
    settings: 'Nastavenia',
    
    // Home Screen
    appName: 'AI Recaps Maker',
    tagline: 'Tvorca AI Video Zhrnutí',
    subtitle: 'Najpokročilejšia platforma na vytváranie AI zhrnutí s Google Gemini',
    getStarted: 'Začať',
    learnMore: 'Zistiť viac',
    
    // Create Wizard
    createRecap: 'Vytvoriť Inteligentné Zhrnutie',
    step: 'Krok',
    of: 'z',
    continue: 'Pokračovať',
    back: 'Späť',
    finish: 'Dokončiť',
    
    // Step titles
    step1Title: 'Zadanie Skriptu',
    step2Title: 'Spracovanie Zvuku',
    step3Title: 'Analýza Videa',
    step4Title: 'Inteligentné Zarovnanie',
    step5Title: 'Konečné Vykreslenie',
    
    // Common
    loading: 'Načítavanie...',
    save: 'Uložiť',
    cancel: 'Zrušiť',
    delete: 'Vymazať',
    edit: 'Upraviť',
    done: 'Hotovo',
    
    // Credits
    credits: 'Kredity',
    earnCredits: 'Získať Kredit',
    watchAd: 'Pozrieť Reklamu',
    insufficientCredits: 'Nedostatočné Kredity',
    
    // Auth
    signIn: 'Prihlásiť sa',
    signUp: 'Registrovať sa',
    email: 'Email',
    password: 'Heslo',
    forgotPassword: 'Zabudnuté Heslo?',
    continueWithGoogle: 'Pokračovať s Google',
    continueAsGuest: 'Pokračovať ako Hosť',
    
    // Errors
    error: 'Chyba',
    tryAgain: 'Skúsiť znova',
    somethingWentWrong: 'Niečo sa pokazilo',
  },
  
  hr: {
    // Navigation
    home: 'Početna',
    create: 'Kreiraj',
    analytics: 'Analitika',
    settings: 'Postavke',
    
    // Home Screen
    appName: 'AI Recaps Maker',
    tagline: 'AI Kreator Video Sažetaka',
    subtitle: 'Najnaprednija platforma za stvaranje AI sažetaka s Google Gemini',
    getStarted: 'Započni',
    learnMore: 'Saznaj više',
    
    // Create Wizard
    createRecap: 'Kreiraj Pametni Sažetak',
    step: 'Korak',
    of: 'od',
    continue: 'Nastavi',
    back: 'Natrag',
    finish: 'Završi',
    
    // Step titles
    step1Title: 'Unos Skripte',
    step2Title: 'Obrada Zvuka',
    step3Title: 'Analiza Videa',
    step4Title: 'Pametno Poravnanje',
    step5Title: 'Konačno Renderiranje',
    
    // Common
    loading: 'Učitavanje...',
    save: 'Spremi',
    cancel: 'Otkaži',
    delete: 'Obriši',
    edit: 'Uredi',
    done: 'Gotovo',
    
    // Credits
    credits: 'Krediti',
    earnCredits: 'Zaradi Kredit',
    watchAd: 'Pogledaj Oglas',
    insufficientCredits: 'Nedovoljno Kredita',
    
    // Auth
    signIn: 'Prijavi se',
    signUp: 'Registriraj se',
    email: 'Email',
    password: 'Lozinka',
    forgotPassword: 'Zaboravljena Lozinka?',
    continueWithGoogle: 'Nastavi s Google',
    continueAsGuest: 'Nastavi kao Gost',
    
    // Errors
    error: 'Greška',
    tryAgain: 'Pokušaj ponovo',
    somethingWentWrong: 'Nešto je pošlo po krivu',
  },
  
  bg: {
    // Navigation
    home: 'Начало',
    create: 'Създай',
    analytics: 'Анализ',
    settings: 'Настройки',
    
    // Home Screen
    appName: 'AI Recaps Maker',
    tagline: 'AI Създател на Видео Резюмета',
    subtitle: 'Най-усъвършенстваната платформа за създаване на AI резюмета с Google Gemini',
    getStarted: 'Започнете',
    learnMore: 'Научете повече',
    
    // Create Wizard
    createRecap: 'Създай Интелигентно Резюме',
    step: 'Стъпка',
    of: 'от',
    continue: 'Продължи',
    back: 'Назад',
    finish: 'Завърши',
    
    // Step titles
    step1Title: 'Въвеждане на Скрипт',
    step2Title: 'Обработка на Звук',
    step3Title: 'Анализ на Видео',
    step4Title: 'Интелигентно Подравняване',
    step5Title: 'Окончателно Рендиране',
    
    // Common
    loading: 'Зареждане...',
    save: 'Запази',
    cancel: 'Отказ',
    delete: 'Изтрий',
    edit: 'Редактирай',
    done: 'Готово',
    
    // Credits
    credits: 'Кредити',
    earnCredits: 'Спечели Кредит',
    watchAd: 'Гледай Реклама',
    insufficientCredits: 'Недостатъчни Кредити',
    
    // Auth
    signIn: 'Влез',
    signUp: 'Регистрирай се',
    email: 'Имейл',
    password: 'Парола',
    forgotPassword: 'Забравена Парола?',
    continueWithGoogle: 'Продължи с Google',
    continueAsGuest: 'Продължи като Гост',
    
    // Errors
    error: 'Грешка',
    tryAgain: 'Опитай отново',
    somethingWentWrong: 'Нещо се обърка',
  },
  
  sr: {
    // Navigation
    home: 'Почетна',
    create: 'Креирај',
    analytics: 'Аналитика',
    settings: 'Подешавања',
    
    // Home Screen
    appName: 'AI Recaps Maker',
    tagline: 'AI Креатор Видео Сажетака',
    subtitle: 'Најнапреднија платформа за креирање AI сажетака са Google Gemini',
    getStarted: 'Почни',
    learnMore: 'Сазнај више',
    
    // Create Wizard
    createRecap: 'Креирај Паметни Сажетак',
    step: 'Корак',
    of: 'од',
    continue: 'Настави',
    back: 'Назад',
    finish: 'Заврши',
    
    // Step titles
    step1Title: 'Унос Скрипте',
    step2Title: 'Обрада Звука',
    step3Title: 'Анализа Видеа',
    step4Title: 'Паметно Поравњање',
    step5Title: 'Коначно Рендеровање',
    
    // Common
    loading: 'Учитавање...',
    save: 'Сачувај',
    cancel: 'Откажи',
    delete: 'Обриши',
    edit: 'Измени',
    done: 'Готово',
    
    // Credits
    credits: 'Кредити',
    earnCredits: 'Заради Кредит',
    watchAd: 'Погледај Оглас',
    insufficientCredits: 'Недовољно Кредита',
    
    // Auth
    signIn: 'Пријави се',
    signUp: 'Региструј се',
    email: 'Имејл',
    password: 'Лозинка',
    forgotPassword: 'Заборављена Лозинка?',
    continueWithGoogle: 'Настави са Google',
    continueAsGuest: 'Настави као Гост',
    
    // Errors
    error: 'Грешка',
    tryAgain: 'Покушај поново',
    somethingWentWrong: 'Нешто није у реду',
  },
  
  uk: {
    // Navigation
    home: 'Головна',
    create: 'Створити',
    analytics: 'Аналітика',
    settings: 'Налаштування',
    
    // Home Screen
    appName: 'AI Recaps Maker',
    tagline: 'AI Створювач Відео Резюме',
    subtitle: 'Найсучасніша платформа для створення AI резюме з Google Gemini',
    getStarted: 'Почати',
    learnMore: 'Дізнатися більше',
    
    // Create Wizard
    createRecap: 'Створити Розумне Резюме',
    step: 'Крок',
    of: 'з',
    continue: 'Продовжити',
    back: 'Назад',
    finish: 'Завершити',
    
    // Step titles
    step1Title: 'Введення Сценарію',
    step2Title: 'Обробка Аудіо',
    step3Title: 'Аналіз Відео',
    step4Title: 'Розумне Вирівнювання',
    step5Title: 'Остаточний Рендеринг',
    
    // Common
    loading: 'Завантаження...',
    save: 'Зберегти',
    cancel: 'Скасувати',
    delete: 'Видалити',
    edit: 'Редагувати',
    done: 'Готово',
    
    // Credits
    credits: 'Кредити',
    earnCredits: 'Заробити Кредит',
    watchAd: 'Подивитися Рекламу',
    insufficientCredits: 'Недостатньо Кредитів',
    
    // Auth
    signIn: 'Увійти',
    signUp: 'Зареєструватися',
    email: 'Електронна пошта',
    password: 'Пароль',
    forgotPassword: 'Забули Пароль?',
    continueWithGoogle: 'Продовжити з Google',
    continueAsGuest: 'Продовжити як Гість',
    
    // Errors
    error: 'Помилка',
    tryAgain: 'Спробувати знову',
    somethingWentWrong: 'Щось пішло не так',
  },
  
  ca: {
    // Navigation
    home: 'Inici',
    create: 'Crear',
    analytics: 'Anàlisi',
    settings: 'Configuració',
    
    // Home Screen
    appName: 'AI Recaps Maker',
    tagline: 'Creador de Resums de Vídeo IA',
    subtitle: 'La plataforma més avançada per crear resums IA amb Google Gemini',
    getStarted: 'Començar',
    learnMore: 'Més Informació',
    
    // Create Wizard
    createRecap: 'Crear Resum Intel·ligent',
    step: 'Pas',
    of: 'de',
    continue: 'Continuar',
    back: 'Enrere',
    finish: 'Finalitzar',
    
    // Step titles
    step1Title: 'Entrada de Guió',
    step2Title: 'Processament d\'Àudio',
    step3Title: 'Anàlisi de Vídeo',
    step4Title: 'Alineació Intel·ligent',
    step5Title: 'Renderització Final',
    
    // Common
    loading: 'Carregant...',
    save: 'Desar',
    cancel: 'Cancel·lar',
    delete: 'Eliminar',
    edit: 'Editar',
    done: 'Fet',
    
    // Credits
    credits: 'Crèdits',
    earnCredits: 'Guanyar Crèdit',
    watchAd: 'Veure Anunci',
    insufficientCredits: 'Crèdits Insuficients',
    
    // Auth
    signIn: 'Iniciar Sessió',
    signUp: 'Registrar-se',
    email: 'Correu',
    password: 'Contrasenya',
    forgotPassword: 'Has Oblidat la Contrasenya?',
    continueWithGoogle: 'Continuar amb Google',
    continueAsGuest: 'Continuar com a Convidat',
    
    // Errors
    error: 'Error',
    tryAgain: 'Torna a Provar',
    somethingWentWrong: 'Alguna cosa ha anat malament',
  },
};
