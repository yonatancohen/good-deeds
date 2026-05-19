import type { Router } from 'expo-router';

/**
 * Safe back navigation: if there's no history (e.g. hard-refresh directly to an
 * inner screen on web), navigate to `fallback` instead of crashing with
 * "GO_BACK was not handled by any navigator".
 *
 * Belt-and-suspenders: checks canGoBack() first AND wraps in try/catch because
 * canGoBack() can return true on web even when the React Navigation stack is
 * empty (browser history vs. in-app history mismatch).
 */
export function safeBack(router: Router, fallback: string) {
  if (router.canGoBack()) {
    try {
      router.back();
    } catch {
      router.replace(fallback as any);
    }
  } else {
    router.replace(fallback as any);
  }
}
