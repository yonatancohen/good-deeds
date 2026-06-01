/** Client-side rules aligned with typical Supabase Auth password settings. */
export const MIN_PASSWORD_LENGTH = 8;

export function validateNewPassword(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `הסיסמה חייבת להכיל לפחות ${MIN_PASSWORD_LENGTH} תווים`;
  }
  if (!/[a-zA-Zא-ת]/.test(password) || !/\d/.test(password)) {
    return 'הסיסמה חייבת לכלול אותיות ומספרים';
  }
  return null;
}

export function mapPasswordUpdateError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('same') && m.includes('password')) {
    return 'הסיסמה החדשה חייבת להיות שונה מהסיסמה הנוכחית';
  }
  if (m.includes('weak') || m.includes('pwned') || m.includes('easy to guess')) {
    return 'הסיסמה חלשה מדי — בחרו סיסמה ארוכה יותר עם אותיות ומספרים';
  }
  if (m.includes('at least') || m.includes('minimum')) {
    return `הסיסמה חייבת להכיל לפחות ${MIN_PASSWORD_LENGTH} תווים`;
  }
  if (m.includes('reauthentication') || m.includes('nonce')) {
    return 'נדרש אימות מחדש — פתחו שוב את הקישור מהמייל ונסו שוב';
  }
  if (m.includes('session') || m.includes('not authenticated')) {
    return 'הקישור פג תוקף — בקשו מייל חדש לקביעת סיסמה';
  }
  return message;
}
