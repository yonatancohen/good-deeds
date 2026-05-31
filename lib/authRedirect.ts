import { Platform } from 'react-native';

const DEFAULT_SITE_URL = 'https://good-omega-three.vercel.app';

/** Public web origin used in Supabase Auth redirect / email links. */
export function getSiteUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_SITE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/$/, '');
  }
  return DEFAULT_SITE_URL;
}

export function authRedirectUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${getSiteUrl()}${normalized}`;
}

/** Must be allowlisted in Supabase → Authentication → URL Configuration → Redirect URLs */
export function getSetPasswordRedirectUrl(): string {
  return authRedirectUrl('/auth/set-password');
}
