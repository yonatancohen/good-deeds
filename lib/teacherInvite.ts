import { supabase } from '@/lib/supabase';
import { getSetPasswordRedirectUrl } from '@/lib/authRedirect';

export type InviteTeacherResult =
  | {
      ok: true;
      emailSent: boolean;
      message: string;
      adminHint?: string;
    }
  | {
      ok: false;
      message: string;
      teacherCreated: boolean;
    };

function mapAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('rate limit') || m.includes('too many')) {
    return 'יותר מדי בקשות מייל — נסו שוב בעוד כמה דקות';
  }
  if (m.includes('redirect') || m.includes('url')) {
    return 'כתובת ההפניה לא מאושרת ב-Supabase (Redirect URLs)';
  }
  if (m.includes('smtp') || m.includes('email')) {
    return 'שליחת המייל נכשלה — בדקו הגדרות SMTP / תבניות מייל ב-Supabase';
  }
  return message;
}

/** Sends "set your password" recovery email (requires redirect URL in Supabase). */
export async function sendTeacherSetupEmail(
  email: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const redirectTo = getSetPasswordRedirectUrl();
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) return { ok: false, message: mapAuthError(error.message) };
  return { ok: true };
}

/**
 * Creates teacher auth + public.users row and triggers setup email when possible.
 */
export async function inviteTeacher(params: {
  email: string;
  displayName: string;
}): Promise<InviteTeacherResult> {
  const normalized = params.email.trim().toLowerCase();
  const displayName = params.displayName.trim();
  const redirectTo = getSetPasswordRedirectUrl();
  const randomPwd =
    Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: normalized,
    password: randomPwd,
    options: {
      data: { display_name: displayName },
      emailRedirectTo: redirectTo,
    },
  });

  if (authError) {
    const already =
      authError.message.toLowerCase().includes('already registered') ||
      authError.message.toLowerCase().includes('already been registered');

    if (already) {
      const emailResult = await sendTeacherSetupEmail(normalized);
      if (!emailResult.ok) {
        return {
          ok: false,
          teacherCreated: false,
          message: `האימייל כבר רשום במערכת, ולא ניתן לשלוח מייל:\n${emailResult.message}`,
        };
      }
      return {
        ok: true,
        emailSent: true,
        message: `האימייל ${normalized} כבר רשום.\n\nנשלח מייל עם קישור לקביעת סיסמה.`,
        adminHint:
          'אם המורה כבר קיים אך לא מופיע ברשימה, עדכנו אותו ידנית או פנו לתמיכה.',
      };
    }

    return { ok: false, teacherCreated: false, message: mapAuthError(authError.message) };
  }

  const newUserId = authData.user?.id;
  if (!newUserId) {
    return {
      ok: false,
      teacherCreated: false,
      message:
        'המשתמש לא נוצר (ייתכן שאימות אימייל מופעל ב-Supabase). בדקו את לוח הבקרה → Authentication → Providers → Email.',
    };
  }

  const { error: insertError } = await supabase.from('users').insert({
    id: newUserId,
    email: normalized,
    display_name: displayName,
    role: 'teacher',
  });

  if (insertError) {
    return {
      ok: false,
      teacherCreated: false,
      message: insertError.message.includes('duplicate')
        ? 'המורה כבר קיים במערכת'
        : insertError.message,
    };
  }

  const needsEmailConfirmation = !!authData.user && !authData.session;

  if (needsEmailConfirmation) {
    return {
      ok: true,
      emailSent: true,
      message:
        `המורה ${displayName} נוסף.\n\nנשלח מייל אימות ל-${normalized}. אחרי לחיצה על הקישור במייל, המורה יוכל להיכנס.\n\nאם לא מגיע מייל — בדקו ספאם והגדרות אימייל ב-Supabase.`,
      adminHint:
        'ב-Supabase מופעל "Confirm email". המורה מקבל מייל אימות (לא מייל סיסמה). לכיבוי: Authentication → Providers → Email → כבו Confirm email, ואז שלחו שוב הזמנה.',
    };
  }

  const emailResult = await sendTeacherSetupEmail(normalized);
  if (!emailResult.ok) {
    return {
      ok: true,
      emailSent: false,
      message:
        `המורה ${displayName} נוסף למערכת, אך מייל לקביעת סיסמה לא נשלח:\n${emailResult.message}`,
      adminHint:
        `ודאו ב-Supabase → Authentication → URL Configuration שהכתובת ${redirectTo} ברשימת Redirect URLs. המורה יכול גם ללחוץ "שכחתי סיסמה" במסך הכניסה.`,
    };
  }

  return {
    ok: true,
    emailSent: true,
    message:
      `המורה ${displayName} נוסף.\n\nנשלח מייל ל-${normalized} עם קישור לקביעת סיסמה.\n\nאם לא מגיע — בדקו תיקיית ספאם, והגדרות SMTP / מגבלות מייל ב-Supabase.`,
    adminHint:
      `קישור ההגדרה חייב להיות מאושר: ${redirectTo}`,
  };
}
