import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/** Bump suffix when promo copy changes so users see the new banner. */
export const PROMO_IDS = {
  adminGifts: 'admin_gifts_info_v1',
  adminDeeds: 'admin_deeds_info_v1',
  adminRedemptions: 'admin_redemptions_info_v1',
} as const;

export type PromoId = (typeof PROMO_IDS)[keyof typeof PROMO_IDS];

const DISMISS_TTL_MS = 14 * 24 * 60 * 60 * 1000;
const STORAGE_PREFIX = 'promo_dismiss:';
const COOKIE_PREFIX = 'gd_promo_';

function storageKey(promoId: string): string {
  return `${STORAGE_PREFIX}${promoId}`;
}

function cookieName(promoId: string): string {
  return `${COOKIE_PREFIX}${encodeURIComponent(promoId)}`;
}

function isDismissedViaCookie(promoId: string): boolean {
  if (typeof document === 'undefined') return false;
  const needle = `${cookieName(promoId)}=`;
  return document.cookie.split(';').some((part) => part.trim().startsWith(needle));
}

function setDismissCookie(promoId: string): void {
  if (typeof document === 'undefined') return;
  const maxAgeSec = Math.floor(DISMISS_TTL_MS / 1000);
  document.cookie = `${cookieName(promoId)}=1; max-age=${maxAgeSec}; path=/; SameSite=Lax`;
}

export async function isPromoDismissed(promoId: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    return isDismissedViaCookie(promoId);
  }

  const raw = await AsyncStorage.getItem(storageKey(promoId));
  if (!raw) return false;
  const dismissedAt = Number(raw);
  if (Number.isNaN(dismissedAt)) {
    await AsyncStorage.removeItem(storageKey(promoId));
    return false;
  }
  if (Date.now() - dismissedAt >= DISMISS_TTL_MS) {
    await AsyncStorage.removeItem(storageKey(promoId));
    return false;
  }
  return true;
}

export async function dismissPromo(promoId: string): Promise<void> {
  if (Platform.OS === 'web') {
    setDismissCookie(promoId);
    return;
  }
  await AsyncStorage.setItem(storageKey(promoId), String(Date.now()));
}
