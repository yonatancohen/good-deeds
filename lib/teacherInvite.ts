import { supabase } from '@/lib/supabase';
import { getSetPasswordRedirectUrl } from '@/lib/authRedirect';
import {
  getTeacherInvitePassword,
  usesTeacherDefaultPassword,
} from '@/lib/teacherDefaultPassword';

export type InviteTeacherResult =
  | {
      ok: true;
      emailSent: boolean;
      message: string;
      adminHint?: string;
      rateLimited?: boolean;
    }
  | {
      ok: false;
      message: string;
      teacherCreated: boolean;
      adminHint?: string;
      rateLimited?: boolean;
    };

type AuthErrorLike = { message: string; status?: number; code?: string };

/** Hebrew message when Supabase Auth returns HTTP 429 (email send rate limit). */
export const AUTH_EMAIL_RATE_LIMIT_MESSAGE =
  'נשלחו יותר מדי מיילים בזמן קצר (מגבלת Supabase). המתינו כמה דקות ונסו שוב.';

export function isAuthEmailRateLimited(error: AuthErrorLike): boolean {
  if (error.status === 429) return true;
  const code = error.code?.toLowerCase();
  if (code === 'over_email_send_rate_limit') return true;
  const m = error.message.toLowerCase();
  return m.includes('rate limit') || m.includes('too many');
}

function mapAuthError(error: AuthErrorLike): { message: string; rateLimited: boolean } {
  if (isAuthEmailRateLimited(error)) {
    return { message: AUTH_EMAIL_RATE_LIMIT_MESSAGE, rateLimited: true };
  }
  const m = error.message.toLowerCase();
  if (m.includes('redirect') || m.includes('url')) {
    return { message: 'כתובת ההפניה לא מאושרת ב-Supabase (Redirect URLs)', rateLimited: false };
  }
  if (m.includes('smtp') || m.includes('email')) {
    return {
      message: 'שליחת המייל נכשלה — בדקו הגדרות SMTP / תבניות מייל ב-Supabase',
      rateLimited: false,
    };
  }
  return { message: error.message, rateLimited: false };
}

function isDuplicateKeyError(error: { code?: string; message?: string }): boolean {
  return error.code === '23505' || !!error.message?.toLowerCase().includes('duplicate');
}

function isAuthUserFkError(error: { code?: string; message?: string }): boolean {
  return (
    error.code === '23503' ||
    !!error.message?.toLowerCase().includes('foreign key') ||
    !!error.message?.includes('users_id_fkey')
  );
}

/** Sends "set your password" recovery email (requires redirect URL in Supabase). */
export async function sendTeacherSetupEmail(
  email: string,
): Promise<{ ok: true } | { ok: false; message: string; rateLimited?: boolean }> {
  const redirectTo = getSetPasswordRedirectUrl();
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) {
    const mapped = mapAuthError(error);
    return { ok: false, message: mapped.message, rateLimited: mapped.rateLimited };
  }
  return { ok: true };
}

/** Links auth.users → public.users when invite hit a duplicate / fake signUp id. */
async function linkExistingAuthTeacher(
  email: string,
  displayName: string,
): Promise<{ linked: boolean }> {
  const { data, error } = await supabase.rpc('admin_ensure_teacher', {
    p_email: email,
    p_display_name: displayName,
  });
  if (error) return { linked: false };
  return { linked: data != null };
}

async function recoverExistingTeacherInvite(params: {
  email: string;
  displayName: string;
  linked: boolean;
}): Promise<InviteTeacherResult> {
  const { email, displayName, linked } = params;
  const emailResult = await sendTeacherSetupEmail(email);

  if (!emailResult.ok) {
    if (linked) {
      return {
        ok: true,
        emailSent: false,
        rateLimited: emailResult.rateLimited,
        message:
          `המורה ${displayName} נוסף מחדש, אך מייל לקביעת סיסמה לא נשלח:\n${emailResult.message}`,
      };
    }
    return {
      ok: false,
      teacherCreated: false,
      rateLimited: emailResult.rateLimited,
      message: `לא ניתן לשלוח מייל:\n${emailResult.message}`,
    };
  }

  if (linked) {
    return {
      ok: true,
      emailSent: true,
      message: `המורה ${displayName} קושר למערכת.\n\nנשלח מייל ל-${email} עם קישור לקביעת סיסמה.`,
    };
  }

  return {
    ok: true,
    emailSent: true,
    message: `האימייל ${email} כבר רשום ב-Auth.\n\nנשלח מייל עם קישור לקביעת סיסמה.`,
    adminHint:
      'אם המורה עדיין לא מופיע ברשימה, הריצו מיגרציה admin_ensure_teacher ב-Supabase או פנו לתמיכה.',
  };
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
  const invitePassword = getTeacherInvitePassword();

  // Re-invite: auth user already exists — restore without signUp (faster, no extra auth emails).
  const { data: existingAuthId, error: ensureError } = await supabase.rpc('admin_ensure_teacher', {
    p_email: normalized,
    p_display_name: displayName,
  });
  if (ensureError) {
    return { ok: false, teacherCreated: false, message: ensureError.message };
  }
  if (existingAuthId) {
    return recoverExistingTeacherInvite({ email: normalized, displayName, linked: true });
  }

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: normalized,
    password: invitePassword,
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
      const { linked } = await linkExistingAuthTeacher(normalized, displayName);
      return recoverExistingTeacherInvite({ email: normalized, displayName, linked });
    }

    const mapped = mapAuthError(authError);
    return {
      ok: false,
      teacherCreated: false,
      message: mapped.message,
      rateLimited: mapped.rateLimited,
    };
  }

  const newUserId = authData.user?.id;
  if (!newUserId) {
    const { linked } = await linkExistingAuthTeacher(normalized, displayName);
    if (linked) {
      return recoverExistingTeacherInvite({ email: normalized, displayName, linked });
    }
    return {
      ok: false,
      teacherCreated: false,
      message:
        'המשתמש לא נוצר (ייתכן שאימות אימייל מופעל ב-Supabase). בדקו את לוח הבקרה → Authentication → Providers → Email.',
      adminHint:
        'אם Confirm email פעיל והאימייל כבר רשום, Supabase לא יוצר משתמש חדש — נסו שוב לאחר אימות או כבו Confirm email.',
    };
  }

  const { error: insertError } = await supabase.from('users').insert({
    id: newUserId,
    email: normalized,
    display_name: displayName,
    role: 'teacher',
  });

  if (insertError) {
    if (isDuplicateKeyError(insertError)) {
      const { linked } = await linkExistingAuthTeacher(normalized, displayName);
      return recoverExistingTeacherInvite({ email: normalized, displayName, linked });
    }

    if (isAuthUserFkError(insertError)) {
      const { linked } = await linkExistingAuthTeacher(normalized, displayName);
      return recoverExistingTeacherInvite({ email: normalized, displayName, linked });
    }

    return {
      ok: false,
      teacherCreated: false,
      message: insertError.message,
    };
  }

  const needsEmailConfirmation = !!authData.user && !authData.session;

  if (needsEmailConfirmation) {
    const pwdHint = usesTeacherDefaultPassword()
      ? '\n\nאחרי האימות: כניסה עם סיסמת בית הספר הקבועה.'
      : '';
    return {
      ok: true,
      emailSent: true,
      message:
        `המורה ${displayName} נוסף.\n\nנשלח מייל אימות ל-${normalized}. אחרי לחיצה על הקישור במייל, המורה יוכל להיכנס.${pwdHint}\n\nאם לא מגיע מייל — בדקו ספאם והגדרות אימייל ב-Supabase.`,
      adminHint:
        'ב-Supabase מופעל "Confirm email". המורה מקבל מייל אימות (לא מייל סיסמה). לכיבוי: Authentication → Providers → Email → כבו Confirm email, ואז שלחו שוב הזמנה.',
    };
  }

  if (usesTeacherDefaultPassword()) {
    return {
      ok: true,
      emailSent: false,
      message:
        `המורה ${displayName} נוסף.\n\nהמורה יכול להיכנס עם האימייל וסיסמת בית הספר הקבועה.`,
      adminHint:
        'העבירו למורה את סיסמת בית הספר. מומלץ לכבות "Confirm email" ב-Supabase (Authentication → Providers → Email).',
    };
  }

  const emailResult = await sendTeacherSetupEmail(normalized);
  if (!emailResult.ok) {
    return {
      ok: true,
      emailSent: false,
      rateLimited: emailResult.rateLimited,
      message:
        `המורה ${displayName} נוסף למערכת, אך מייל לקביעת סיסמה לא נשלח:\n${emailResult.message}`,
      adminHint: emailResult.rateLimited
        ? 'מגבלת המיילים של Supabase (בדרך כלל ~3 מיילים לשעה עם SMTP מובנה). המתינו או הגדירו SMTP מותאם ב-Authentication.'
        : `ודאו ב-Supabase → Authentication → URL Configuration שהכתובת ${redirectTo} ברשימת Redirect URLs. המורה יכול גם ללחוץ "שכחתי סיסמה" במסך הכניסה.`,
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
