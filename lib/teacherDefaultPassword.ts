/** School-wide password for new teacher accounts (visible in client bundle). */
export function usesTeacherDefaultPassword(): boolean {
  return !!process.env.EXPO_PUBLIC_TEACHER_DEFAULT_PASSWORD?.trim();
}

function randomInvitePassword(): string {
  return (
    Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10)
  );
}

/** Password used on `signUp` when inviting a teacher. */
export function getTeacherInvitePassword(): string {
  const fromEnv = process.env.EXPO_PUBLIC_TEACHER_DEFAULT_PASSWORD?.trim();
  return fromEnv || randomInvitePassword();
}
