/** School-wide default for every new teacher invite (visible in client bundle). */
export const SCHOOL_DEFAULT_PASSWORD = 'Bi123456';

export function usesTeacherDefaultPassword(): boolean {
  // Always on: teachers share the school default unless overridden via env.
  return true;
}

/** Password used on `signUp` when inviting a teacher. */
export function getTeacherInvitePassword(): string {
  const fromEnv = process.env.EXPO_PUBLIC_TEACHER_DEFAULT_PASSWORD?.trim();
  return fromEnv || SCHOOL_DEFAULT_PASSWORD;
}

/** Password applied when resetting existing teachers (matches invite default). */
export function getSchoolDefaultPassword(): string {
  return getTeacherInvitePassword();
}
