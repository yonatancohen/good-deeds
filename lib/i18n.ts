import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const he = {
  translation: {
    // App
    appName: 'תפסתי אותך בטוב',
    // Public
    noClasses: 'אין כיתות עדיין',
    noStudents: 'אין תלמידים עדיין',
    points: 'נקודות',
    waitingForGift: 'ממתין למתנה',
    goal: 'מטרה',
    // Auth
    login: 'כניסה',
    email: 'אימייל',
    password: 'סיסמה',
    sendMagicLink: 'שלח לי קישור כניסה',
    forgotPassword: 'שכחתי סיסמה',
    sendResetLink: 'שלח קישור לאיפוס',
    setPassword: 'הגדר סיסמה',
    resetPassword: 'אפס סיסמה',
    newPassword: 'סיסמה חדשה',
    save: 'שמור',
    // Teacher
    myClasses: 'הכיתות שלי',
    allClasses: 'כל הכיתות',
    waitingForClass: 'ממתין לשיוך כיתה על ידי המנהל',
    giveCredit: 'הוסף נקודה',
    selectDeed: 'בחר מעשה טוב',
    note: 'הערה',
    notePlaceholder: 'לדוגמה: עזרה לנועה במתמטיקה',
    confirm: 'אשר',
    cancel: 'ביטול',
    creditHistory: 'היסטוריית נקודות',
    givenBy: 'ניתן על ידי',
    deleteCredit: 'מחק נקודה',
    deleteCreditConfirm: 'האם אתה בטוח שברצונך למחוק נקודה זו?',
    uploadCsv: 'העלאת רשימת תלמידים',
    uploadCsvHint: 'קובץ CSV עם עמודות שם פרטי ושם משפחה',
    csvPreview: 'תצוגה מקדימה',
    csvNew: 'תלמידים חדשים',
    csvSkipped: 'ייעדר (כבר קיים)',
    csvImport: 'ייבא',
    // Admin
    admin: 'ניהול',
    teachers: 'מורים',
    classes: 'כיתות',
    students: 'תלמידים',
    gifts: 'פרסים',
    deeds: 'מעשים טובים',
    settings: 'הגדרות',
    redemptions: 'מתנות',
    inviteTeacher: 'הזמן מורה',
    schoolName: 'שם בית הספר',
    schoolNameHint: 'שם שיוצג בכל הדפים',
    currentYear: 'שנת לימודים נוכחית',
    currentYearHint: 'לדוגמה: תשפ״ה או 2025-2026',
    globalGoal: 'מטרת נקודות',
    globalGoalHint: 'מספר הנקודות שכיתה צריכה לצבור לפני קבלת מתנה',
    deedName: 'שם המעשה',
    deedNameHint: 'לדוגמה: עזרה לחבר',
    deedAmount: 'ערך (1-10)',
    deedAmountHint: 'כמה נקודות מקבלים על המעשה הזה',
    addDeed: 'הוסף מעשה טוב',
    addClass: 'הוסף כיתה',
    className: 'שם כיתה',
    classNameHint: 'לדוגמה: ו׳1',
    grade: 'שכבה',
    year: 'שנת לימודים',
    yearHint: 'לדוגמה: תשפ״ה',
    // Actions
    delete: 'מחק',
    edit: 'ערוך',
    add: 'הוסף',
    back: 'חזור',
    logout: 'התנתק',
    areYouSure: 'האם אתה בטוח?',
    // Errors
    required: 'שדה חובה',
    invalidEmail: 'כתובת אימייל לא תקינה',
    // Success
    saved: 'נשמר בהצלחה',
    deleted: 'נמחק בהצלחה',
    invited: 'הזמנה נשלחה',
    imported: 'יובא בהצלחה',
  },
};

i18n.use(initReactI18next).init({
  resources: { he: he },
  lng: 'he',
  fallbackLng: 'he',
  interpolation: { escapeValue: false },
});

export default i18n;
